export class HttpError extends Error {
  constructor(status, message) {
    super(String(message || 'Erro interno.').trim() || 'Erro interno.')
    this.name = 'HttpError'
    this.status = Number(status) || 500
  }
}

export function isHttpError(error) {
  return error instanceof HttpError
}
