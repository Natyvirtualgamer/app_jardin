# 🌻 Sistema de Gestión Jardín Infantil

Plataforma web multinube para gestión de jardines infantiles, salas cuna y centros preescolares.

## Stack tecnológico

| Capa        | Tecnología                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite + Nginx           |
| Backend     | FastAPI + Python 3.11             |
| Base datos  | PostgreSQL 15 (RDS en producción) |
| Contenedores| Docker + Docker Compose           |
| CI/CD       | GitHub Actions                    |
| SAST        | SonarQube                         |
| CVE Scan    | Aqua Trivy                        |
| Registro    | GitHub Container Registry (GHCR)  |
| IaC         | AWS CloudFormation                |
| Config Mgmt | Ansible 2.15+                     |
| Nube primaria | AWS (sa-east-1)                 |
| Nube secundaria | Azure (Brazil South)          |

## Flujo oficial de despliegue (evaluación / producción)

```
GitHub → GitHub Actions → GHCR → CloudFormation → SSM Parameter Store
       → Ansible → EC2-A / EC2-B → ALB → RDS PostgreSQL + S3 → Azure Blob
```

Sin Docker Desktop local, despliegue directo a AWS. Ver la guía completa
paso a paso en [`docs/guia_instalacion.md`](docs/guia_instalacion.md).

## Inicio rápido (desarrollo local — opcional, solo para programar/probar)

> Esta sección es **solo para desarrollo local**. La ruta oficial de
> despliegue/evaluación es la de arriba (CloudFormation + GHCR + Ansible).
> `docker-compose.yml` (este, con Postgres incluido) es exclusivo de dev;
> producción usa `docker-compose.prod.yml` (sin BD, contra RDS).

```bash
# 1. Clonar el repositorio
git clone https://github.com/ORG/app-jardin.git
cd app-jardin

# 2. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar con Docker Compose
docker compose up --build

# 4. Crear el usuario administrador inicial (una sola vez)
#    ADMIN_PASSWORD es obligatoria, no hay default debil
docker compose exec \
  -e ADMIN_EMAIL=admin@appjardin.cl \
  -e ADMIN_PASSWORD='UnaClaveSegura2026!' \
  backend python -m backend.scripts.create_admin

# 5. Acceder
# Frontend: http://localhost
# Backend API: http://localhost/api/v1
# Docs API: http://localhost:8000/docs
```

## Estructura del proyecto

```
app-jardin/
├── frontend/          # React 18 + Vite
├── backend/           # FastAPI + Python 3.11
├── nginx/             # Configuración Nginx reverse proxy
├── docker-compose.yml       # Desarrollo local (incluye Postgres)
├── docker-compose.prod.yml  # Producción EC2 (sin BD — usa RDS)
├── infra/
│   ├── cloudformation/ # IaC AWS (VPC, EC2+ALB, RDS+S3) — dev/prod
│   └── ansible/        # Gestión configuración EC2
├── docs/
│   └── diagrams/      # Diagramas PlantUML (.puml)
└── .github/workflows/ # CI/CD GitHub Actions
```

## Arquitectura multinube

- **AWS** (principal): VPC + 2 EC2 + ALB + RDS PostgreSQL + S3
- **Azure** (secundaria): Blob Storage (respaldo de los objetos de S3, vía sync programado en CI/CD)
