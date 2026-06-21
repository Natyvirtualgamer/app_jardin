#!/bin/bash
# inject_secrets_ssm.sh
# Descarga params desde SSM Parameter Store y genera .env en EC2.
# IAM role EC2 necesita: ssm:GetParametersByPath en /jardin/<env>/*
#
# Variables de entorno esperadas (las inyecta Ansible, ver roles/common/tasks/main.yml):
#   ENVIRONMENT (default: dev)
#   AWS_REGION  (default: us-east-1)

set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SSM_PATH="/jardin/${ENVIRONMENT}"

APP_DIR="/home/ubuntu/app-jardin"
ENV_FILE="${APP_DIR}/.env"

echo "Obteniendo secrets desde SSM (${SSM_PATH}, region ${AWS_REGION})..."

mkdir -p "$APP_DIR"

aws ssm get-parameters-by-path \
  --path "$SSM_PATH" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameters[*].[Name,Value]" \
  --output text | while IFS=$'\t' read -r name value; do
    key="${name##*/}"
    echo "${key}=${value}"
  done > "$ENV_FILE"

chmod 600 "$ENV_FILE"
echo ".env generado en $ENV_FILE desde SSM (permisos 600)"
