#!/bin/bash
# destroy.sh — Eliminar todos los stacks del ambiente DEV
set -euo pipefail
ENV="dev"; REGION="us-east-1"
echo "ADVERTENCIA: Elimina toda la infra de $ENV."
read -p "Escribir si para confirmar: " C
[ "$C" = "si" ] || { echo "Cancelado."; exit 0; }
for S in rds-s3 ec2-alb vpc-sg; do
  echo "Eliminando jardin-${ENV}-${S}..."
  aws cloudformation delete-stack --stack-name "jardin-${ENV}-${S}" --region "$REGION"
  aws cloudformation wait stack-delete-complete --stack-name "jardin-${ENV}-${S}" --region "$REGION"
done
echo "Stacks eliminados."
