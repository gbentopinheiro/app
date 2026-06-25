#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
BACKUP_FILE="${2:-}"

case "$ENVIRONMENT" in
  test|acceptance|production)
    ;;
  *)
    echo "Uso: ./infra/scripts/restore-db.sh {test|acceptance|production} /caminho/backup.sql" >&2
    exit 1
    ;;
esac

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Indica o ficheiro de backup a restaurar." >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Ficheiro de backup nao encontrado: $BACKUP_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_DIR="$REPO_ROOT/infra/environments/$ENVIRONMENT"

if [[ ! -f "$ENV_DIR/.env" ]]; then
  echo "Ficheiro .env nao encontrado em $ENV_DIR" >&2
  exit 1
fi

echo "Restore manual preparado para o ambiente: $ENVIRONMENT"
echo "ATENCAO: confirmar sempre que o target esta correto antes de restaurar."
echo "Exemplo de comando a executar no VPS:"
echo "  cd \"$ENV_DIR\""
echo "  docker compose exec -T db mariadb -u\"\$DB_USER\" -p\"\$DB_PASSWORD\" \"\$DB_NAME\" < \"$BACKUP_FILE\""
echo
echo "Nenhum restore foi executado automaticamente."
