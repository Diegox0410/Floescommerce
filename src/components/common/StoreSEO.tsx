import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStoreConfigStore } from "../../store/storeConfigStore";
import type { Product, ProductVariant } from "../../types/product";
import { catalogPrice, hasKnownPrice } from "../../services/chopify/catalog";
import { editorialImagesForProduct } from "../../data/editorialProductImages";

export function StoreSEO({ product, variant }: { product?: Product; variant?: ProductVariant }) {
  const config = useStoreConfigStore((state) => state.config);
  const { pathname } = useLocation();
  useEffect(() => {
    const title = product ? `${product.name} | FLOES` : pathname === "/catalogo" ? "La colección | FLOES" : config.seo.siteTitle;
    const description = product?.shortDescription || product?.description || config.seo.siteDescription;
    const configured = import.meta.env.VITE_SITE_URL as string | undefined;
    let origin = window.location.origin;
    try { if (configured && new URL(configured).protocol === "https:") origin = new URL(configured).origin; } catch { /* Use the current store origin. */ }
    const url = new URL(product ? `/producto/${product.slug || product.id}` : pathname, origin).href;
    const productEditorialImages = product ? editorialImagesForProduct(product.slug, variant?.color) : [];
    const image = product ? productEditorialImages[0] : config.home.hero.image;
    document.title = title;
    const meta = (key: string, value: string, property = false) => {
      const attribute = property ? "property" : "name";
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.append(element); }
      element.content = value;
    };
    meta("description", description); meta("og:title", title, true); meta("og:description", description, true);
    meta("og:url", url, true); meta("og:type", product ? "product" : "website", true); meta("og:site_name", "FLOES", true);
    meta("og:image", image ? new URL(image, origin).href : "", true); meta("twitter:card", "summary_large_image");
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
    canonical.href = url;
    document.getElementById("floes-product-schema")?.remove();
    if (product) {
      const script = document.createElement("script"); script.id = "floes-product-schema"; script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "Product", name: product.name, description,
        sku: variant?.sku || product.sku, brand: { "@type": "Brand", name: "FLOES" },
        ...(productEditorialImages.length ? { image: productEditorialImages.map((entry) => new URL(entry, origin).href) } : {}),
        ...(hasKnownPrice(product, variant) ? { offers: { "@type": "Offer", url, price: catalogPrice(product, variant), priceCurrency: product.currency || "USD", availability: (variant ? variant.available : product.inStock) === true ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } } : {}),
      });
      document.head.append(script);
    }
    return () => { document.getElementById("floes-product-schema")?.remove(); };
  }, [config, pathname, product, variant]);
  return null;
}
