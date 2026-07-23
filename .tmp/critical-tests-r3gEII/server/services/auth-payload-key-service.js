import { getLoginTransportPublicKey } from '../../lib/login-transport.js'

export function getAuthPayloadKeyService() {
  return {
    publicKey: getLoginTransportPublicKey(),
  }
}
