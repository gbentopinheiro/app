function pemToArrayBuffer(pem) {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')
  const binary = atob(base64)
  return Uint8Array.from(binary, character => character.charCodeAt(0)).buffer
}

function bytesToBase64(bytes) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

async function getTransportKey() {
  const response = await fetch('/api/auth/payload-key', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.publicKey) {
    throw new Error(data.error || 'Nao foi possivel proteger os dados sensiveis.')
  }

  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(data.publicKey),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
}

export async function createProtectedPayload(payload) {
  const transportKey = await getTransportKey()
  const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const rawContentKey = await crypto.subtle.exportKey('raw', contentKey)
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, transportKey, rawContentKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    new TextEncoder().encode(JSON.stringify(payload)),
  )

  return {
    encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}
