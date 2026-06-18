# Guía de Instalación — Paso a Paso (Nivel Principiante)
## Sistema Gestión Jardín Infantil — v2.0 (con SonarCloud + SSM)

> **Ruta oficial de despliegue/evaluación**: directo a AWS, sin Docker
> Desktop local — `GitHub → GitHub Actions → GHCR → CloudFormation → SSM
> → Ansible → EC2-A/EC2-B → ALB → RDS/S3 → Azure Blob` (Partes 5 a 9).
> La **Parte 1** (Docker Compose local) es **opcional**, solo para
> programar/probar antes de desplegar — no es la ruta evaluada.

---

## Requisitos previos

| Herramienta | Versión | Enlace | Uso |
|---|---|---|---|
| Git | Cualquiera | https://git-scm.com/ | Obligatorio |
| Docker Desktop | 4.x+ | https://www.docker.com/products/docker-desktop/ | **Opcional** — solo si programas/pruebas en local (Parte 1) |
| Visual Studio Code | Cualquiera | https://code.visualstudio.com/ | Obligatorio |
| Cuenta GitHub | — | https://github.com/ | Obligatorio |
| Cuenta AWS (estudiante) | Academy / Learner Lab | https://aws.amazon.com/education/ | Obligatorio |
| Cuenta Azure (estudiante) | Azure for Students | https://portal.azure.com/ | Obligatorio |
| Cuenta SonarCloud | Gratuita con GitHub | https://sonarcloud.io/ | Obligatorio |

---

## Parte 1 — Configuración local del proyecto (opcional, solo desarrollo)

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/TU_ORG/app-jardin.git
cd app-jardin
```

### Paso 2: Abrir en VS Code

```bash
code .
```

### Paso 3: Crear archivo de variables de entorno local

```bash
cp .env.example .env
```

Editar `.env` con tus valores para desarrollo local:

```env
DB_NAME=jardin_db
DB_USER=jardin_user
DB_PASSWORD=MiPasswordSeguro123!
# Generar SECRET_KEY con: openssl rand -hex 32
SECRET_KEY=pega-aqui-el-resultado
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> **IMPORTANTE**: El archivo `.env` está en `.gitignore`. Nunca lo subas al repositorio.

### Paso 4: Levantar con Docker Compose

```bash
docker compose up --build
```

Espera que todos los servicios aparezcan como "healthy" (aprox. 2–3 minutos la primera vez).

### Paso 5: Verificar funcionamiento

```bash
# Health check backend
curl http://localhost/health
# Respuesta: {"status":"ok","service":"jardin-backend"}

# Frontend en navegador
open http://localhost         # macOS
# Windows/Linux: abrir http://localhost manualmente
```

### Paso 6: Ver documentación de la API

```
http://localhost:8000/docs    → Swagger UI interactivo
http://localhost:8000/redoc   → ReDoc
```

---

## Parte 2 — Configurar SonarCloud (opcional — mejora de calidad, no bloquea el pipeline)

> SonarCloud **no es obligatorio**. Tests, build, Trivy y deploy sí lo son.
> Si no configuras `SONAR_TOKEN` como GitHub Secret, el step de SonarCloud
> se omite automáticamente (`if: env.SONAR_TOKEN != ''`) y el resto del
> pipeline sigue normal — no falla por su ausencia.

### Paso 7: Crear cuenta y proyecto en SonarCloud

1. Ir a https://sonarcloud.io/ → **Log in with GitHub**
2. Crear organización (usa tu usuario u organización de GitHub)
3. Click en **Analyze new project** → importar `app-jardin`
4. Copiar el **SONAR_TOKEN** generado → guardarlo para el Paso 22

### Paso 8: Actualizar sonar-project.properties

Editar `sonar-project.properties` en la raíz del proyecto:

```properties
sonar.projectKey=TU_ORG_jardin-infantil
sonar.organization=TU_ORG_EN_SONARCLOUD
```

Reemplazar `TU_ORG` con los valores reales de SonarCloud (org y projectKey
creados en el Paso 7). Si decides **no usar SonarCloud**, puedes saltarte
este paso y el Paso 7 completos — simplemente no crees el secret
`SONAR_TOKEN` en GitHub y continúa con la Parte 3.

---

## Parte 3 — Ejecutar tests y análisis local

### Paso 9: Tests del backend

```bash
# Dentro del contenedor
docker compose exec backend pytest tests/ -v --cov=. --cov-report=term

# O localmente con Python 3.11
cd backend
pip install -r requirements.txt pytest pytest-cov
pytest tests/ -v --cov=. --cov-report=term
```

### Paso 10: Trivy local

```bash
# Instalar Trivy (macOS)
brew install aquasecurity/trivy/trivy

# Instalar Trivy (Linux)
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
  | sh -s -- -b /usr/local/bin

# Escanear imágenes
docker compose build
trivy image jardin-backend:latest
trivy image jardin-frontend:latest

# Escanear filesystem (dependencias + IaC)
trivy fs .
```

---

## Parte 4 — Construir y publicar imágenes Docker

### Paso 11: Login en GHCR

```bash
# Necesitas un Personal Access Token con permiso write:packages
echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO --password-stdin
```

### Paso 12: Build y push

```bash
# Frontend
docker build -t ghcr.io/TU_ORG/jardin-frontend:latest ./frontend
docker push ghcr.io/TU_ORG/jardin-frontend:latest

# Backend — IMPORTANTE: contexto raiz "." + -f backend/Dockerfile
# (el Dockerfile copia el codigo como paquete /app/backend, ver imports
# absolutos "from backend.xxx import yyy" usados en todo el proyecto)
docker build -t ghcr.io/TU_ORG/jardin-backend:latest -f backend/Dockerfile .
docker push ghcr.io/TU_ORG/jardin-backend:latest
```

---

## Parte 5 — Infraestructura AWS con CloudFormation

### Paso 13: Configurar credenciales AWS

```bash
aws configure
# AWS Access Key ID:     (desde consola AWS → IAM → Security credentials)
# AWS Secret Access Key: ...
# Default region name:   sa-east-1
# Default output format: json
```

### Paso 14: Crear key pair SSH para EC2

```bash
aws ec2 create-key-pair \
  --key-name jardin-key-dev \
  --query 'KeyMaterial' \
  --output text \
  --region sa-east-1 > ~/.ssh/jardin-key-dev.pem

chmod 400 ~/.ssh/jardin-key-dev.pem
```

### Paso 15: Desplegar los stacks de CloudFormation (ambiente dev)

```bash
cd infra/cloudformation/environments/dev
./deploy.sh
# Pide la password de RDS de forma interactiva (read -s, no queda en el historial)
# Detecta tu IP publica automaticamente para el SG de SSH (AdminIP)
```

`deploy.sh` aplica los 3 templates en orden (`vpc-sg.yaml` → `ec2-alb.yaml` → `rds-s3.yaml`)
y al final imprime los Outputs (IPs de EC2, DNS del ALB, endpoint de RDS, bucket S3).
Guarda esos valores — los necesitas en el paso siguiente.

> **Tip cuenta estudiante**: Si RDS Multi-AZ no está disponible en Learner Lab, dejar
> `MultiAZ=false` (default del template). La seguridad no se compromete porque
> `PubliclyAccessible=false` + `sg-rds` restrictivo mantienen el aislamiento.

### Paso 16: Crear parámetros SSM (una sola vez, ya con los outputs reales)

```bash
ENVIRONMENT=dev \
DB_PASSWORD="la-misma-que-usaste-en-deploy.sh" \
RDS_ENDPOINT="<output RDSEndpoint del paso anterior>" \
S3_BUCKET_NAME="<output S3BucketName del paso anterior>" \
GHCR_OWNER="matiasvargasaliaga" \
bash scripts/create_ssm_params.sh
```

> **`GHCR_OWNER` debe ser EXACTAMENTE el owner real del repositorio en
> GitHub** (usuario u organización), en minúsculas — es el mismo valor
> que usa el pipeline al publicar imágenes
> (`ghcr.io/${{ github.repository_owner }}/...`). Si no coinciden, EC2
> intentará descargar imágenes de un owner donde nunca se publicaron.
> Ejemplo: si tu repo es `github.com/matiasvargasaliaga/app-jardin`,
> entonces `GHCR_OWNER=matiasvargasaliaga`.

El script crea los siguientes parámetros en `/jardin/dev/` (o `/jardin/prod/` si `ENVIRONMENT=prod`):
- `DATABASE_URL` — URL de conexión a RDS (SecureString, cifrado KMS)
- `SECRET_KEY` — Clave JWT generada con openssl (SecureString)
- `S3_BUCKET_NAME` — Nombre del bucket S3 (String)
- `AWS_REGION` — Región de despliegue (String)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — Expiración del JWT (String)
- `GHCR_OWNER` — Owner de GitHub para las imágenes GHCR (String)

---

## Parte 6 — Configurar EC2 con Ansible

### Paso 17: Instalar Ansible

```bash
pip install ansible
```

### Paso 18: Actualizar inventory con IPs de EC2

```bash
# Obtener IPs desde los outputs de CloudFormation
aws cloudformation describe-stacks --stack-name jardin-dev-ec2-alb \
  --query "Stacks[0].Outputs" --region sa-east-1

# Editar infra/ansible/inventory.ini con esas IPs (grupo [app_servers])
nano infra/ansible/inventory.ini
```

### Paso 19: Ejecutar playbook de provisioning

```bash
cd infra/ansible

# Provisioning completo (Docker, hardening, Nginx, SSM secrets)
ansible-playbook -i inventory.ini playbooks/site.yml

# Solo verificar estado post-deploy
ansible-playbook -i inventory.ini playbooks/verify.yml
```

El playbook `site.yml` ejecuta automáticamente el script `inject_secrets_ssm.sh` en cada EC2, que descarga los secrets desde SSM Parameter Store y genera el `.env` con permisos `600`.

---

## Parte 7 — Desplegar en EC2

### Paso 20: Conectarse a EC2 desde VS Code

Instalar extensión **Remote - SSH**:
1. `Cmd+Shift+P` → `Remote-SSH: Add New SSH Host`
2. Ingresar: `ssh -i ~/.ssh/jardin-key-dev.pem ubuntu@IP_EC2_A`
3. Conectar

### Paso 21: Verificar que el .env fue generado por SSM

```bash
# En EC2 (el .env fue creado por Ansible + inject_secrets_ssm.sh)
ls -la ~/app-jardin/.env
# Debe mostrar: -rw------- (permisos 600, solo ubuntu)

# Validar que GHCR_OWNER resuelve al owner correcto ANTES de pullear
# (docker compose lee el .env del mismo directorio para expandir ${GHCR_OWNER})
cd ~/app-jardin
docker compose config | grep ghcr.io
# Debe mostrar: image: ghcr.io/matiasvargasaliaga/jardin-backend:latest
#               image: ghcr.io/matiasvargasaliaga/jardin-frontend:latest
# Si aparece "ghcr.io//jardin-backend:latest" (owner vacio), GHCR_OWNER
# no llego al .env — revisar create_ssm_params.sh e inject_secrets_ssm.sh.

# Pull y deploy
cd ~/app-jardin
echo "GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO --password-stdin
docker compose pull
docker compose up -d

# Verificar
docker compose ps
curl http://localhost/health
```

### Paso 21b: Crear el usuario administrador inicial (`create_admin.py`)

Ejecutar **una sola vez** (en EC2-A o EC2-B, da igual cuál — ambas comparten la misma RDS):

```bash
# ADMIN_PASSWORD es OBLIGATORIA (sin default debil) — invocar SIEMPRE
# como modulo (-m), no como script suelto: es la forma robusta, no
# depende del directorio de trabajo.
docker compose exec \
  -e ADMIN_EMAIL=admin@appjardin.cl \
  -e ADMIN_PASSWORD='UnaClaveSegura2026!' \
  backend python -m backend.scripts.create_admin
```

> Si corres el comando sin `-e ADMIN_PASSWORD=...`, el script termina con
> `ERROR: la variable de entorno ADMIN_PASSWORD es obligatoria` y te
> muestra el comando correcto — no falla a medias ni crea un admin con
> password adivinable.

El script es idempotente (se puede correr de nuevo sin duplicar datos), crea
la institución por defecto, los 6 roles del sistema y el usuario admin, y
**nunca imprime la contraseña completa** en el log. Si falla con
`relation "institucion" does not exist` o similar, es señal de que el
backend desplegado es una imagen vieja sin el fix de modelos — volver a
publicar la imagen (`docker compose pull && docker compose up -d`) antes
de reintentar.

```bash
# Probar el login con las credenciales creadas
curl -X POST http://localhost/api/v1/auth/login \
  -d "username=admin@appjardin.cl&password=UnaClaveSegura2026!"
# Debe responder 200 con un access_token
```

---

## Parte 8 — Configurar GitHub Actions

### Paso 22: Agregar GitHub Secrets

Repositorio GitHub → **Settings → Secrets and variables → Actions**:

| Secret | Valor | Origen |
|---|---|---|
| `SONAR_TOKEN` | Token de SonarCloud | Paso 7 |
| `EC2_A_HOST` | IP pública EC2-A | Output CloudFormation (stack ec2-alb) |
| `EC2_B_HOST` | IP pública EC2-B | Output CloudFormation (stack ec2-alb) |
| `EC2_SSH_KEY` | Contenido completo del archivo `.pem` | Paso 14 |
| `ALB_DNS` | DNS del Application Load Balancer | Output CloudFormation (stack ec2-alb) |
| `AWS_ACCESS_KEY_ID` | Credencial AWS | Consola AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS | Consola AWS |
| `AWS_SESSION_TOKEN` | Solo si usas AWS Academy/Learner Lab | Consola AWS |
| `AZURE_CREDENTIALS` | JSON de credenciales Azure | Paso 23 |
| `AZURE_STORAGE_ACCOUNT` | Nombre cuenta almacenamiento Azure | Paso 23 |
| `S3_BUCKET_NAME` | Nombre del bucket S3 | Output CloudFormation (stack rds-s3) |

### Paso 23: Activar el pipeline

```bash
git add .
git commit -m "feat: configuración inicial con SonarCloud y SSM"
git push origin main
```

El pipeline se activa automáticamente. Verificar en:
`https://github.com/TU_ORG/app-jardin/actions`

---

## Parte 9 — Configurar respaldo Azure

### Paso 24: Crear recursos Azure

```bash
# Login Azure CLI
az login

az group create --name rg-jardin-prod --location brazilsouth

az storage account create \
  --name jardinbackupprod \
  --resource-group rg-jardin-prod \
  --location brazilsouth \
  --sku Standard_GRS

az storage container create \
  --name backups-jardin \
  --account-name jardinbackupprod

# Obtener credenciales para GitHub Secret AZURE_CREDENTIALS
az ad sp create-for-rbac \
  --name "jardin-github-actions" \
  --role contributor \
  --scopes /subscriptions/TU_SUBSCRIPTION_ID \
  --sdk-auth
# Copiar el JSON completo como GitHub Secret AZURE_CREDENTIALS
```

---

## Parte 10 — Pruebas de Alta Disponibilidad

Estas dos pruebas son evidencia obligatoria de la rúbrica. Ejecutar **después**
de que el pipeline haya desplegado en EC2-A y EC2-B y el ALB esté healthy.

### Prueba A — Caída de un contenedor

```bash
# 1. En EC2-A: detener el contenedor backend
ssh -i ~/.ssh/jardin-key-dev.pem ubuntu@IP_EC2_A \
  "cd ~/app-jardin && docker compose stop backend"

# 2. Desde tu máquina local: el ALB sigue respondiendo (vía EC2-B)
curl http://TU_ALB_DNS/health
# Esperado: {"status":"ok","service":"jardin-backend"} — sin interrupción

# 3. Restaurar
ssh -i ~/.ssh/jardin-key-dev.pem ubuntu@IP_EC2_A \
  "cd ~/app-jardin && docker compose start backend"
```

### Prueba B — Caída de una instancia completa

```bash
# 1. Detener EC2-A (reemplazar INSTANCE_ID_EC2_A por el real)
aws ec2 stop-instances --instance-ids INSTANCE_ID_EC2_A --region sa-east-1

# 2. Confirmar que el Target Group marca EC2-A como unhealthy (toma ~30-60s)
TG_ARN=$(aws cloudformation describe-stacks --stack-name jardin-dev-ec2-alb \
  --query "Stacks[0].Outputs[?OutputKey=='TargetGroupArn'].OutputValue" \
  --output text --region sa-east-1)
aws elbv2 describe-target-health --target-group-arn "$TG_ARN" --region sa-east-1

# 3. Confirmar que el ALB sigue respondiendo (ahora 100% vía EC2-B)
curl http://TU_ALB_DNS/health

# 4. Encender de nuevo EC2-A y confirmar que vuelve a healthy
aws ec2 start-instances --instance-ids INSTANCE_ID_EC2_A --region sa-east-1
# Esperar 1-2 min, luego repetir el paso 2 — EC2-A debe volver a "healthy"
```

---

## Verificación final del sistema completo

```bash
# 1. Pipeline verde en GitHub Actions
open https://github.com/TU_ORG/app-jardin/actions

# 2. Health check via ALB
curl http://TU_ALB_DNS/health

# 3. SonarCloud — Quality Gate
open https://sonarcloud.io/project/overview?id=TU_ORG_jardin-infantil

# 4. Imágenes en GHCR
open https://github.com/TU_ORG/app-jardin/packages

# 5. Verificar .env generado desde SSM (no manual)
ssh -i ~/.ssh/jardin-key-dev.pem ubuntu@IP_EC2_A \
  "stat ~/app-jardin/.env && echo 'OK: .env existe con permisos seguros'"

# 6. Verificar que RDS no tiene IP pública
aws rds describe-db-instances \
  --query "DBInstances[*].[DBInstanceIdentifier,PubliclyAccessible]" \
  --output table --region sa-east-1

# 7. Verificar Azure Blob
az storage blob list \
  --account-name jardinbackupprod \
  --container-name backups-jardin \
  --output table
```

---

## Resumen de mejoras v2.0

| Componente | v1.0 | v2.0 |
|---|---|---|
| Análisis estático | SonarQube Server (requiere VM) | **SonarCloud** (gratuito, sin servidor) |
| Gestión de secrets en EC2 | .env manual por SSH | **SSM Parameter Store** (SecureString + KMS) |
| IAM EC2 | Solo S3 | **S3 + SSM + KMS** (mínimo privilegio completo) |
| Ansible en pipeline | Solo provisioning manual | **Job 4 verify** en CI/CD |
| Imágenes Docker | Elegidas sin justificación | **Tabla comparativa** python:3.11-slim vs alpine |
| Estrategia RDS estudiante | No documentada | **Fallback** publicly_accessible=false + sg-rds |

