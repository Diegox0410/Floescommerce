import { randomBytes } from 'node:crypto'
import { requireFloesOwner } from '../api/_lib/firebaseAuth.ts'

const projectId = process.env.FIREBASE_PROJECT_ID
const host = process.env.FIREBASE_AUTH_EMULATOR_HOST
if (projectId !== 'demo-floes-sandbox' || host !== '127.0.0.1:9099') {
  throw new Error('Owner authentication verification is restricted to the local demo Auth Emulator')
}
const email = `owner-${randomBytes(8).toString('hex')}@sandbox.floes.invalid`
const password = `${randomBytes(24).toString('base64url')}A1!`
const origin = `http://${host}/identitytoolkit.googleapis.com/v1`
const signUp = await fetch(`${origin}/accounts:signUp?key=fake-api-key`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
})
if (!signUp.ok) throw new Error(`Auth Emulator signup failed (${signUp.status})`)
const created = await signUp.json()
if (!created.localId) throw new Error('Auth Emulator did not issue a test identity')
const login = await fetch(`${origin}/accounts:signInWithPassword?key=fake-api-key`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
})
if (!login.ok) throw new Error(`Auth Emulator login failed (${login.status})`)
const session = await login.json()
process.env.FLOES_OWNER_UID = created.localId
const verifiedUid = await requireFloesOwner({ headers: { authorization: `Bearer ${session.idToken}` } })
if (verifiedUid !== created.localId) throw new Error('Owner identity did not pass tenant owner UID validation')
process.env.FLOES_OWNER_UID = 'not-the-owner'
await requireFloesOwner({ headers: { authorization: `Bearer ${session.idToken}` } }).then(
  () => { throw new Error('A non-owner identity unexpectedly passed the owner gate') },
  () => undefined,
)
console.log('OWNER_AUTH_EMULATOR_SIGNUP_LOGIN_OWNER_GATE=PASS')
console.log('OWNER_EMAIL_PASSWORD_AND_ID_TOKEN=OMITTED')
