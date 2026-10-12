import type { ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const unavailable = (response: ServerResponse, reason: string) => {
  response.statusCode = 503
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify({ error: reason }))
}

function previewReadProxy(env: Record<string, string>): Plugin {
  return {
    name: 'floes-preview-read-proxy',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        const isApi = pathname.startsWith('/api/')
        const isAsset = pathname.startsWith('/__preview-assets/')

        if (!isApi && !isAsset) return next()

        if (request.method !== 'GET') {
          response.statusCode = 405
          response.setHeader('Allow', 'GET')
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Las operaciones API de escritura están deshabilitadas en desarrollo local.' }))
          return
        }

        const isCatalog = pathname === '/api/catalog'
        const isStoreConfig = pathname === '/api/store-config'
        const isPreviewAsset = isAsset && pathname.startsWith('/__preview-assets/images/products/floes/')
        if (!isCatalog && !isStoreConfig && !isPreviewAsset) {
          response.statusCode = 404
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Ruta no habilitada en el proxy local de solo lectura.' }))
          return
        }

        const assetPath = isPreviewAsset
          ? pathname.replace(/^\/__preview-assets/, '')
          : ''
        if (assetPath.split('/').some((part) => part === '..')) {
          response.statusCode = 400
          response.end('Bad request')
          return
        }

        const target = isPreviewAsset
          ? env.CHOPIFY_PREVIEW_BASE_URL
          : env.FLOES_PREVIEW_BASE_URL
        const bypass = isPreviewAsset
          ? env.CHOPIFY_PREVIEW_BYPASS_SECRET
          : env.FLOES_PREVIEW_BYPASS_SECRET

        const targetUrl = target ? safePreviewUrl(target) : null
        if (!targetUrl || !bypass) {
          unavailable(response, 'Configura la URL Preview y su bypass local correspondiente para habilitar lecturas reales.')
          return
        }

        try {
          const upstreamUrl = new URL(
            isPreviewAsset ? assetPath : `${pathname}${new URL(request.url ?? '/', 'http://localhost').search}`,
            targetUrl,
          )
          const upstream = await fetch(upstreamUrl, {
            method: 'GET',
            headers: {
              Accept: isPreviewAsset ? '*/*' : 'application/json',
              'x-vercel-protection-bypass': bypass,
            },
            signal: AbortSignal.timeout(12_000),
          })

          response.statusCode = upstream.status
          const contentType = upstream.headers.get('content-type')
          if (contentType) response.setHeader('Content-Type', contentType)
          response.setHeader('Cache-Control', 'no-store')

          if (isAsset) {
            response.end(Buffer.from(await upstream.arrayBuffer()))
            return
          }

          if (!upstream.ok) {
            response.end(JSON.stringify({ error: `Preview respondió HTTP ${upstream.status}.` }))
            return
          }

          const payload: unknown = await upstream.json()
          const rewriteAssetUrls = (value: unknown): unknown => {
            if (Array.isArray(value)) return value.map(rewriteAssetUrls)
            if (!value || typeof value !== 'object') return value
            return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
              if ((key === 'url' || key === 'imageUrl') && typeof entry === 'string') {
                try {
                  const parsed = new URL(entry, targetUrl)
                  // Preview catalog records can still contain the Production FLOES host.
                  // Serve the matching repository asset locally so dev validation never
                  // silently requests a Production image.
                  if (parsed.hostname === 'floes-commerce.vercel.app' && parsed.pathname.startsWith('/catalogo/floes/')) {
                    return [key, `${parsed.pathname}${parsed.search}`]
                  }
                  if (parsed.pathname.startsWith('/images/products/floes/')) {
                    return [key, `/__preview-assets${parsed.pathname}${parsed.search}`]
                  }
                } catch {
                  // Preserve malformed or non-product URLs exactly as supplied by Preview.
                }
              }
              return [key, rewriteAssetUrls(entry)]
            }))
          }

          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(rewriteAssetUrls(payload)))
        } catch {
          unavailable(response, 'No fue posible leer el Preview configurado. Revisa URL, bypass y disponibilidad del deployment.')
        }
      })
    },
  }
}

function safePreviewUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')) return null
    if (url.hostname === 'chopify-ten.vercel.app' || url.hostname === 'floes-commerce.vercel.app') return null
    return url
  } catch {
    return null
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), previewReadProxy(env)],
  }
})
