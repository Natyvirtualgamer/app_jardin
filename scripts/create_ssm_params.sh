#!/bin/bash
# create_ssm_params.sh — ejecutar UNA SOLA VEZ desde local con credenciales admin
#
# Uso:
#   ENVIRONMENT=dev  DB_PASSWORD=xxx RDS_ENDPOINT=xxx.rds.amazonaws.com \
#   S3_BUCKET_NAME=jardin-dev-files-123456789 GHCR_OWNER=mi-usuario-github \
#   ./create_ssm_params.sh
#
#   ENVIRONMENT=prod DB_PASSWORD=xxx RDS_ENDPOINT=xxx.rds.amazonaws.com \
#   S3_BUCKET_NAME=jardin-prod-files-123456789 GHCR_OWNER=mi-usuario-github \
#   ./create_ssm_params.sh
set -euo pipefail

ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
SSM_PATH="/jardin/${ENVIRONMENT}"

DB_USER="${DB_USER:-jardin_user}"
DB_NAME="${DB_NAME:-jardin_db}"
DB_PASSWORD="${DB_PASSWORD:?ERROR: definir DB_PASSWORD}"
RDS_ENDPOINT="${RDS_ENDPOINT:?ERROR: definir RDS_ENDPOINT (output de jardin-${ENVIRONMENT}-rds-s3)}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:?ERROR: definir S3_BUCKET_NAME (output de jardin-${ENVIRONMENT}-rds-s3)}"
ACCESS_TOKEN_EXPIRE_MINUTES="${ACCESS_TOKEN_EXPIRE_MINUTES:-30}"
GHCR_OWNER="${GHCR_OWNER:?ERROR: definir GHCR_OWNER (tu usuario u org de GitHub, en minusculas)}"

echo "Creando parametros SSM en ${SSM_PATH} (region ${AWS_REGION})"

aws ssm put-parameter --name "${SSM_PATH}/DATABASE_URL" \
  --value "postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}" \
  --type SecureString --region "$AWS_REGION" --overwrite

aws ssm put-parameter --name "${SSM_PATH}/SECRET_KEY" \
  --value "$(openssl rand -hex 32)" \
  --type SecureString --region "$AWS_REGION" --overwrite

aws ssm put-parameter --name "${SSM_PATH}/S3_BUCKET_NAME" \
  --value "$S3_BUCKET_NAME" \
  --type String --region "$AWS_REGION" --overwrite

aws ssm put-parameter --name "${SSM_PATH}/AWS_REGION" \
  --value "$AWS_REGION" \
  --type String --region "$AWS_REGION" --overwrite

aws ssm put-parameter --name "${SSM_PATH}/ACCESS_TOKEN_EXPIRE_MINUTES" \
  --value "$ACCESS_TOKEN_EXPIRE_MINUTES" \
  --type String --region "$AWS_REGION" --overwrite

aws ssm put-parameter --name "${SSM_PATH}/GHCR_OWNER" \
  --value "$GHCR_OWNER" \
  --type String --region "$AWS_REGION" --overwrite

# Opcional — solo si decides login a GHCR desde la EC2 con token persistido en SSM
# (alternativa: dejar los packages de GHCR publicos y omitir este parametro)
# aws ssm put-parameter --name "${SSM_PATH}/GHCR_READ_TOKEN" \
#   --value "$GHCR_READ_TOKEN" \
#   --type SecureString --region "$AWS_REGION" --overwrite

echo "Parametros SSM creados en ${SSM_PATH}"
