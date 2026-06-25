#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"

case "$ENVIRONMENT" in
  test|acceptance|production)
    ;;
  *)
    echo "Uso: ./infra/scripts/backup-db.sh {test|acceptance|production}" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_DIR="$REPO_ROOT/infra/environments/$ENVIRONMENT"

if [[ ! -f "$ENV_DIR/.env" ]]; then
  echo "Ficheiro .env nao encontrado em $ENV_DIR" >&2
  exit 1
fi

echo "Backup manual preparado para o ambiente: $ENVIRONMENT"
echo "Exemplo de comando a executar no VPS:"
echo "  cd \"$ENV_DIR\""
echo "  docker compose exec db mariadb-dump -u\"\$DB_USER\" -p\"\$DB_PASSWORD\" \"\$DB_NAME\" > bentix-${ENVIRONMENT}-\$(date +%F-%H%M%S).sql"
echo
echo "Nenhum backup foi executado automaticamente."
