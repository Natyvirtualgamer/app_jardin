#!/bin/bash
# deploy.sh — Desplegar stacks CloudFormation en ambiente DEV
set -euo pipefail
ENV="dev"
REGION="us-east-1"
ADMIN_IP=$(curl -s ifconfig.me)/32
KEY_PAIR="jardin-key-dev"
echo "Desplegando $ENV en $REGION — IP admin: $ADMIN_IP"

echo "[1/3] VPC y Security Groups..."
aws cloudformation deploy \
  --template-file ../../templates/vpc-sg.yaml \
  --stack-name "jardin-${ENV}-vpc-sg" \
  --parameter-overrides Environment="$ENV" AdminIP="$ADMIN_IP" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION" --no-fail-on-empty-changeset

echo "[2/3] EC2 y ALB..."
aws cloudformation deploy \
  --template-file ../../templates/ec2-alb.yaml \
  --stack-name "jardin-${ENV}-ec2-alb" \
  --parameter-overrides Environment="$ENV" InstanceType="t3.micro" KeyPairName="$KEY_PAIR" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION" --no-fail-on-empty-changeset

echo "[3/3] RDS (PITR habilitado) y S3..."
read -s -p "RDS Password (min 8 chars): " DB_PASS && echo ""
aws cloudformation deploy \
  --template-file ../../templates/rds-s3.yaml \
  --stack-name "jardin-${ENV}-rds-s3" \
  --parameter-overrides Environment="$ENV" DBPassword="$DB_PASS" BackupRetentionDays="7" MultiAZ="false" \
  --region "$REGION" --no-fail-on-empty-changeset

echo "=== OUTPUTS ==="
for S in ec2-alb rds-s3; do
  aws cloudformation describe-stacks --stack-name "jardin-${ENV}-$S" \
    --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" --output table --region "$REGION"
done
echo "Listo. Guarda las IPs de EC2, el RDS Endpoint y el nombre del bucket S3."
