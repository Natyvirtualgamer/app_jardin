#!/bin/bash
# destroy.sh — Eliminar todos los stacks del ambiente PROD
set -euo pipefail
ENV="prod"; REGION="${AWS_REGION:-us-east-1}"
echo "ADVERTENCIA: Elimina toda la infra de PRODUCCION ($ENV)."
read -p "Escribir si para confirmar: " C
[ "$C" = "si" ] || { echo "Cancelado."; exit 0; }

# La RDS de prod se crea con DeletionProtection=true (ver deploy.sh).
# Hay que desactivarla antes de poder borrar el stack rds-s3.
if aws cloudformation describe-stacks --stack-name "jardin-${ENV}-rds-s3" --region "$REGION" >/dev/null 2>&1; then
  echo "Desactivando DeletionProtection en la RDS antes de borrar..."
  read -s -p "RDS Password (requerido por el template, no se modifica): " DB_PASS && echo ""
  aws cloudformation deploy \
    --template-file ../../templates/rds-s3.yaml \
    --stack-name "jardin-${ENV}-rds-s3" \
    --parameter-overrides Environment="$ENV" DBPassword="$DB_PASS" \
      BackupRetentionDays="7" MultiAZ="true" DeletionProtectionEnabled="false" \
    --region "$REGION" --no-fail-on-empty-changeset
fi

for S in rds-s3 ec2-alb vpc-sg; do
  echo "Eliminando jardin-${ENV}-${S}..."
  aws cloudformation delete-stack --stack-name "jardin-${ENV}-${S}" --region "$REGION"
  aws cloudformation wait stack-delete-complete --stack-name "jardin-${ENV}-${S}" --region "$REGION"
done
echo "Stacks eliminados."
