import { constants, createDecipheriv, generateKeyPairSync, privateDecrypt } from 'crypto'

const KEY_PAIR_SYMBOL = Symbol.for('benpin.loginTransportKeyPair')
const AUTH_TAG_LENGTH = 16

function normalizePem(value) {
  return String(value || '').replace(/\\n/g, '\n').trim()
}

function getConfiguredKeyPair() {
  const publicKey = normalizePem(process.env.LOGIN_PUBLIC_KEY_PEM)
  const privateKey = normalizePem(process.env.LOGIN_PRIVATE_KEY_PEM)

  if (publicKey && privateKey) {
    return { publicKey, privateKey }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('LOGIN_PUBLIC_KEY_PEM e LOGIN_PRIVATE_KEY_PEM sao obrigatorias em producao.')
  }

  if (!globalThis[KEY_PAIR_SYMBOL]) {
    globalThis[KEY_PAIR_SYMBOL] = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
  }

  return globalThis[KEY_PAIR_SYMBOL]
}

export function getLoginTransportPublicKey() {
  return getConfiguredKeyPair().publicKey
}

export function decryptProtectedPayload(protectedPayload) {
  try {
    const { privateKey } = getConfiguredKeyPair()
    const encryptedKey = Buffer.from(String(protectedPayload?.encryptedKey || ''), 'base64')
    const iv = Buffer.from(String(protectedPayload?.iv || ''), 'base64')
    const encryptedContent = Buffer.from(String(protectedPayload?.ciphertext || ''), 'base64')

    if (!encryptedKey.length || iv.length !== 12 || encryptedContent.length <= AUTH_TAG_LENGTH) {
      throw new Error('invalid payload')
    }

    const contentKey = privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKey,
    )
    const authenticationTag = encryptedContent.subarray(encryptedContent.length - AUTH_TAG_LENGTH)
    const ciphertext = encryptedContent.subarray(0, encryptedContent.length - AUTH_TAG_LENGTH)
    const decipher = createDecipheriv('aes-256-gcm', contentKey, iv)
    decipher.setAuthTag(authenticationTag)

    const cleartext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    return JSON.parse(cleartext)
  } catch (error) {
    throw new Error('Pedido protegido invalido.')
  }
}

export async function readProtectedRequestJson(request) {
  const body = await request.json()

  if (!body?.protectedPayload) {
    throw new Error('Pedido sensivel sem protecao.')
  }

  return decryptProtectedPayload(body.protectedPayload)
}
