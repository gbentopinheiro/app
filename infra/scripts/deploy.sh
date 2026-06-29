#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"

case "$ENVIRONMENT" in
  dev|production)
    ;;
  *)
    echo "Uso: ./infra/scripts/deploy.sh {dev|production}" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_DIR="$REPO_ROOT/infra/environments/$ENVIRONMENT"

if [[ ! -d "$ENV_DIR" ]]; then
  echo "Ambiente nao encontrado: $ENV_DIR" >&2
  exit 1
fi

echo "Deploy manual preparado para o ambiente: $ENVIRONMENT"
echo "Rever o ficheiro $ENV_DIR/.env antes de continuar."
echo "Comandos sugeridos:"
echo "  cd \"$ENV_DIR\""
echo "  docker compose pull || true"
echo "  docker compose up -d --build"
echo "  docker compose ps"
echo
echo "Nenhuma acao foi executada automaticamente."
