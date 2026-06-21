# Informe Técnico — Sistema de Gestión Preescolar

## Arquitectura Multinube AWS + Azure | DevSecOps | IaC

---

**Trabajo:** Arquitectura Híbrida y Planificación DevSecOps
**Asignatura:** Arquitectura de Soluciones Cloud
**Docente:** Felipe Henríquez
**Fecha:** Junio 2025
**Entrega:** felipe.henriquez19@inacapmail.cl

---

## Tabla de Cumplimiento Rúbrica

| Criterio Rúbrica                          | Cómo se cumple                                                                                     | Sección   | Diagrama                        | Observación                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- | ------------------------------- | ------------------------------------------------------- |
| Propósito del software                    | Sistema gestión preescolar MVP 2 meses                                                             | 5.1–5.3   | 04_flujo_funcional              | Alcance funcional completo                              |
| Arquitectura desacoplada Frontend/Backend | React (Nginx) → FastAPI REST → PostgreSQL                                                          | 5.5       | 01_arquitectura_cloud           | Tres capas sin acoplamiento                             |
| Imágenes base Docker justificadas         | python:3.11-slim (glibc/psycopg2) y nginx:1.25-alpine                                              | 5.6       | —                               | Tabla comparativa incluida                              |
| Portabilidad local → nube                 | Mismo docker-compose.yml en local y EC2                                                            | 5.6       | —                               | Entorno local como sustituto on-premise                 |
| Diagrama de arquitectura formal           | PlantUML colores, VPC, EC2, ALB, RDS, S3, Azure                                                    | 5.7       | 01_arquitectura_cloud_multinube | Topología completa                                      |
| Entorno local (sustituto on-premise)      | Docker Compose + VS Code + GitHub                                                                  | 5.6       | —                               | Descartado on-premise productivo con validación docente |
| Balanceadores de carga                    | AWS ALB con 2 EC2 en distintas AZ                                                                  | 5.8       | 01_arquitectura_cloud           | Round-robin HTTP                                        |
| Múltiples zonas de disponibilidad         | EC2-A (AZ-a) + EC2-B (AZ-c) sa-east-1                                                              | 5.8       | 01_arquitectura_cloud           | Multi-AZ básico                                         |
| Object Storage                            | S3 (primario) + Azure Blob (respaldo GRS)                                                          | 5.10      | 01_arquitectura_cloud           | Versionado + cifrado AES-256                            |
| BD PaaS sin IP pública                    | RDS PostgreSQL publicly_accessible=false + sg-rds                                                  | 5.9, 5.17 | 01_arquitectura_cloud           | Estrategia fallback cuenta estudiante documentada       |
| CloudFormation / IaC                      | VPC, EC2, ALB, RDS, S3, IAM, SSM                                                                   | 5.13      | 07_iac_cloudformation_ansible   | Separación dev/prod (3 stacks)                          |
| Ansible gestión config                    | Rol common + rol verify en pipeline CI/CD                                                          | 5.14      | 07_iac_cloudformation_ansible   | Ansible integrado en Job 4 pipeline                     |
| Pipeline CI/CD GitHub Actions             | test (backend+frontend) → Docker+Trivy+GHCR → Deploy AWS → Ansible verify → ALB check → Azure sync | 5.12      | 02_pipeline_cicd                | 7 jobs completos                                        |
| SonarCloud (análisis estático)            | SonarCloud gratuito vía GitHub. Sin servidor propio                                                | 5.12      | 02_pipeline_cicd                | Quality Gate configurado                                |
| Análisis vulnerabilidades Trivy           | Image scan + filesystem scan en pipeline                                                           | 5.12      | 02_pipeline_cicd                | SARIF → GitHub Security                                 |
| IAM mínimo privilegio                     | Rol EC2: S3 + SSM + KMS únicamente                                                                 | 5.11      | 01_arquitectura_cloud           | Sin credenciales en código                              |
| Security Groups                           | sg-alb, sg-ec2, sg-rds                                                                             | 5.11      | 01_arquitectura_cloud           | Reglas mínimas                                          |
| Credenciales sin texto plano              | SSM Parameter Store (SecureString/KMS) + GitHub Secrets                                            | 5.11      | 07_iac_cloudformation_ansible   | Mecanismo de inyección documentado                      |
| Modelo de datos                           | 23 entidades, 3FN, ER completo                                                                     | 5.15      | 03_modelo_datos_er              | PKs, FKs, relaciones N:M                                |

---

## 1. Resumen Ejecutivo

Este proyecto propone una plataforma web moderna para la gestión integral de jardines infantiles, salas cuna y centros preescolares. El sistema permite administrar matrículas, alumnos, apoderados, asistencia, pagos, gastos, comunicaciones y un portal de apoderados, desde una arquitectura multinube basada en AWS como nube principal y Azure como nube secundaria de respaldo y contingencia.

La arquitectura emplea contenedores Docker, orquestados con Docker Compose en entorno de desarrollo local y desplegados en instancias EC2 en producción mediante un pipeline CI/CD completamente automatizado. El modelo DevSecOps integra **SonarCloud** para análisis estático del código fuente (SAST) y **Aqua Trivy** para escaneo de imágenes Docker y dependencias en runtime (SCA), ambas herramientas complementarias ejecutadas en GitHub Actions. La infraestructura se define con **AWS CloudFormation** y la configuración de servidores con **Ansible**, incluyendo la inyección segura de secrets mediante **AWS SSM Parameter Store**.

El MVP es viable para ser implementado en dos meses por un equipo de hasta tres estudiantes, sin sobredimensionamiento tecnológico y con costo controlado en cuentas de licencia estudiantil.

---

## 2. Introducción

### Contexto

Los jardines infantiles y salas cuna en Chile gestionan información sensible de menores de edad, incluyendo datos de salud, asistencia, relaciones con apoderados y pagos mensuales. La mayoría de estos establecimientos no cuentan con sistemas digitales adecuados y operan con planillas u hojas de papel.

### Problema

Ausencia de una herramienta digital centralizada, segura y accesible que permita gestionar la operación completa de un establecimiento preescolar, incluyendo el acceso de apoderados a información de sus hijos.

### Objetivos

- Diseñar una arquitectura multinube AWS + Azure aplicando contenedores, IaC y DevSecOps.
- Construir un MVP funcional con los módulos críticos: alumnos, asistencia, pagos y portal apoderado.
- Aplicar seguridad desde el diseño, protegiendo datos sensibles de menores.
- Demostrar viabilidad técnica y económica para el contexto estudiantil.
- Integrar gestión segura de credenciales mediante AWS SSM Parameter Store.

### Alcance

El MVP cubre los módulos 1 a 12 descritos en el alcance funcional, con énfasis en los módulos de alumnos, asistencia, pagos y el portal de apoderados. Los módulos de comunicaciones avanzadas y reportes complejos quedan para la fase 2.

### Nota sobre entorno on-premise

La rúbrica menciona arquitectura híbrida con nodos on-premise. En este proyecto, el componente on-premise productivo fue **explícitamente descartado con validación del docente**, adoptando una arquitectura **100% multinube**. El entorno de desarrollo local con Docker Compose cumple el espíritu del requisito de portabilidad y reproducibilidad. Ver sección 5.6 para la justificación completa.

---

## 3. Definición del Proyecto de Software

### 5.1 Propósito del Sistema

Plataforma web para gestión operativa y administrativa de instituciones preescolares, accesible desde cualquier dispositivo con navegador web moderno.

### 5.3 Alcance Funcional — Módulos del MVP

| Módulo                   | Prioridad MVP | Fase 2               |
| ------------------------ | ------------- | -------------------- |
| Portal web institucional | Básico        | Edición completa CMS |
| Gestión de alumnos       | Completo      | —                    |
| Gestión de apoderados    | Completo      | —                    |
| Cursos y niveles         | Completo      | —                    |
| Asistencia diaria        | Completo      | Reportes avanzados   |
| Pagos y mensualidades    | Completo      | Integración pasarela |
| Comunicaciones           | Básico        | Notificaciones push  |
| Salud y emergencias      | Básico        | —                    |
| Portal apoderados        | Completo      | App móvil            |
| Dashboard administrativo | Completo      | —                    |
| Usuarios y permisos      | Completo      | —                    |
| Módulo de gastos         | Completo      | —                    |

### 5.4 MVP Viable en 2 Meses

El MVP se define como el conjunto mínimo de funcionalidades que entrega valor real: registro de alumnos, asistencia, pagos y portal de apoderado con acceso protegido. Ver Plan de Desarrollo (sección 5.18).

---

## 5.5 Arquitectura Desacoplada

La solución separa completamente las capas de presentación, lógica de negocio y datos:

- **Frontend React**: Aplicación SPA servida por Nginx. Consume la API REST mediante peticiones HTTP con autenticación Bearer JWT. No contiene lógica de negocio.
- **Backend FastAPI**: API REST modular con routers independientes por dominio (alumnos, pagos, asistencia, etc.). Implementa autenticación JWT, validación de roles y acceso a la base de datos.
- **PostgreSQL**: Base de datos relacional normalizada hasta 3FN. En producción se usa Amazon RDS en subred privada sin exposición pública.
- **Almacenamiento de archivos**: Amazon S3 para documentos, imágenes y adjuntos. Acceso mediante SDK AWS desde el backend con credenciales del IAM role de EC2.
- **Comunicación entre capas**: `Frontend → Nginx (reverse proxy) → Backend FastAPI → PostgreSQL / S3`.

---

## 5.6 Contenerización con Docker

### Justificación de Imágenes Base

#### Backend — python:3.11-slim (Debian Bookworm)

Se eligió `python:3.11-slim` como imagen base del backend por las siguientes razones:

- **Compatibilidad con psycopg2**: La imagen `slim` incluye glibc, lo que permite instalar `psycopg2-binary` sin conflictos. La imagen `alpine` usa musl libc, incompatible con psycopg2-binary sin compilación desde fuentes.
- **Tamaño controlado**: `python:3.11-slim` ocupa ~130 MB, frente a ~900 MB de la imagen completa.
- **Seguridad**: Usuario no-root (`appuser`) dentro del contenedor, siguiendo recomendaciones OWASP para seguridad de contenedores.
- **Reproducibilidad**: Versión fija garantiza builds idénticos en desarrollo local y en el pipeline CI/CD.

#### Frontend — Dockerfile multistage: node:18-alpine → nginx:1.25-alpine

| Stage      | Imagen            | Función                   | En imagen final |
| ---------- | ----------------- | ------------------------- | --------------- |
| Build      | node:18-alpine    | Compilar React con Vite   | No              |
| Producción | nginx:1.25-alpine | Servir archivos estáticos | Sí (~25 MB)     |

- **node:18-alpine** en la etapa de build: Alpine es adecuado aquí porque solo se compila JavaScript, sin dependencias nativas de sistema.
- **nginx:1.25-alpine** como imagen final: Superficie de ataque mínima. Nginx sirve únicamente archivos estáticos.
- El **build multistage garantiza** que Node, npm y Vite no estén presentes en la imagen de producción.

#### Tabla comparativa de imágenes evaluadas

| Imagen             | Tamaño  | glibc     | Pros                             | Contras                      | Decisión                  |
| ------------------ | ------- | --------- | -------------------------------- | ---------------------------- | ------------------------- |
| python:3.11        | ~900 MB | Sí        | Completa                         | Muy grande                   | Descartada                |
| python:3.11-slim   | ~130 MB | Sí        | Equilibrio tamaño/compatibilidad | —                            | **Elegida backend**       |
| python:3.11-alpine | ~60 MB  | No (musl) | Pequeña                          | Incompatible psycopg2-binary | Descartada                |
| nginx:1.25-alpine  | ~25 MB  | No        | Mínima, segura                   | Solo estáticos               | **Elegida frontend prod** |

### Entorno local como sustituto del nodo on-premise

El entorno de desarrollo local cumple el espíritu del requisito de nodo local mediante:

| Elemento                  | Implementación                                   |
| ------------------------- | ------------------------------------------------ |
| Nodo local definido       | Máquina del desarrollador con Docker Desktop     |
| SO Linux                  | Contenedores sobre Debian Bookworm (imagen slim) |
| Portabilidad local → nube | Mismo `docker-compose.yml` en local y en EC2     |
| Pruebas antes de subir    | `pytest` local + `trivy fs .` antes del pipeline |

### Estructura de contenedores

- `backend/Dockerfile`: Python 3.11-slim, usuario no-root, Uvicorn con 2 workers.
- `frontend/Dockerfile`: Build multistage Node 18 → Nginx 1.25 Alpine.
- `docker-compose.yml`: Orquesta db, backend, frontend y nginx en red interna `jardin_net`.
- Variables de entorno: en producción se inyectan desde AWS SSM Parameter Store (ver 5.11).

---

## 5.7 Arquitectura Multinube AWS + Azure

### AWS — Nube Principal (us-east-1, N. Virginia)

| Recurso                                              | Justificación                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| VPC (10.0.0.0/16)                                    | Aislamiento de red completo                                          |
| Application Load Balancer                            | Entrada HTTPS única, distribución de tráfico                         |
| 2 EC2 Ubuntu 22.04 (AZ-a y AZ-c)                     | Alta disponibilidad básica                                           |
| Amazon RDS PostgreSQL 15 (publicly_accessible=false) | BD gestionada, sin exposición pública                                |
| Amazon S3                                            | Almacenamiento de objetos, versionado, cifrado AES-256               |
| AWS SSM Parameter Store                              | Gestión segura de credenciales (SecureString + KMS)                  |
| IAM con mínimo privilegio                            | Acceso S3 + SSM + KMS únicamente desde rol EC2                       |
| Security Groups                                      | Firewall único del proyecto (perimetral por servicio); no se usa UFW |

**Justificación región us-east-1**: Se utiliza esta región por compatibilidad y permisos del entorno AWS Academy/Learner Lab. La arquitectura se mantiene portable para replicarse en otra región si el entorno productivo lo requiere.

### Azure — Nube Secundaria (Brazil South)

| Recurso                                       | Rol                                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Azure Blob Storage (GRS)                      | Réplica nocturna de archivos críticos desde S3                                                                                                |
| Azure Database for PostgreSQL Flexible Server | Contingencia conceptual, no activo en producción normal                                                                                       |
| Network Security Group                        | Conceptual para una futura VNet en Azure; el Storage Account actual no requiere NSG (acceso vía claves + container privado, sin VMs en Azure) |

**Por qué es multinube y no híbrida**: Todo el entorno productivo corre en nubes públicas (AWS y Azure). No existe componente on-premise productivo. El entorno local de desarrollo usa Docker Compose únicamente para pruebas y portabilidad.

---

## 5.8 Alta Disponibilidad Básica

- **ALB** recibe todo el tráfico HTTPS y distribuye entre EC2-A y EC2-B mediante Round-Robin.
- **2 EC2 en distintas AZ** garantizan que si una zona de disponibilidad falla, la otra continúa operando.
- **RDS con `publicly_accessible=false`** en ambos ambientes. Multi-AZ activado en producción.
- **Health Check** del ALB en `/health` detecta instancias no saludables automáticamente.

---

## 5.11 Seguridad, IAM y Protección de Datos

### IAM — Mínimo Privilegio

El rol EC2 tiene exactamente tres políticas:

1. **S3**: `GetObject`, `PutObject`, `DeleteObject`, `ListBucket` — solo en el bucket del proyecto.
2. **SSM**: `GetParameter`, `GetParameters`, `GetParametersByPath` — solo en el path `/jardin/{env}/*`.
3. **KMS**: `Decrypt` — únicamente vía servicio SSM (condición `kms:ViaService`).

Sin acceso a otras APIs de AWS.

### Gestión Segura de Credenciales — SSM Parameter Store

Las credenciales sensibles se almacenan en **AWS SSM Parameter Store** como `SecureString` (cifradas con KMS), no en archivos `.env` subidos manualmente:

| Parámetro SSM                 | Tipo         | Descripción           |
| ----------------------------- | ------------ | --------------------- |
| `/jardin/prod/DATABASE_URL`   | SecureString | URL de conexión a RDS |
| `/jardin/prod/SECRET_KEY`     | SecureString | Clave JWT de firma    |
| `/jardin/prod/S3_BUCKET_NAME` | String       | Nombre del bucket     |
| `/jardin/prod/AWS_REGION`     | String       | Región de despliegue  |

El script `scripts/inject_secrets_ssm.sh` se ejecuta en el EC2 mediante Ansible al momento del deploy, descarga los parámetros y genera el `.env` con permisos `600`. El EC2 se autentica con su IAM Instance Profile, sin credenciales hardcodeadas.

### Resto de controles de seguridad

- **GitHub Secrets**: credenciales de deploy (SSH key, Azure credentials) nunca en código.
- **HTTPS**: ALB termina TLS. Certificado via ACM.
- **JWT**: Access Token 30 min + Refresh Token 7 días. Firmado HS256. Secret en SSM.
- **Security Groups**: sg-alb (443/80), sg-ec2 (80 from sg-alb), sg-rds (5432 from sg-ec2).
- **Datos de menores**: Fotos en S3 privado con presigned URLs (vigencia 1h).
- **Hardening Ansible**: fail2ban, SSH sin root y actualización del sistema operativo. El firewall de red se gestiona exclusivamente con AWS Security Groups; no se usa UFW.

---

## 5.12 DevSecOps y Pipeline CI/CD

### Herramientas y roles complementarios

| Herramienta    | Qué analiza                                                                               | Cuándo                   | Capa       |
| -------------- | ----------------------------------------------------------------------------------------- | ------------------------ | ---------- |
| **SonarCloud** | Código fuente Python/JS: bugs, code smells, vulnerabilidades SAST, cobertura, duplicación | Job 1: antes del build   | Código     |
| **Aqua Trivy** | Imágenes Docker (CVEs), dependencias runtime (SCA), filesystem scan                       | Job 2: después del build | Contenedor |

**¿Por qué ambas?** SonarCloud actúa en la capa de código fuente (Shift-Left SAST). Trivy actúa en la capa de artefacto contenedor y dependencias de runtime. Son capas distintas y complementarias: una imagen puede pasar SonarCloud sin vulnerabilidades en el código y tener CVEs críticos en la imagen base o en packages del sistema operativo instalados en tiempo de build.

**¿Por qué SonarCloud y no SonarQube Server?**
SonarCloud es el servicio cloud de SonarSource, completamente gratuito para repositorios públicos y con plan gratuito para proyectos académicos privados. Elimina la necesidad de provisionar y mantener un servidor SonarQube, lo que es inviable en el contexto de cuenta estudiantil.

### Flujo del pipeline — 5 Jobs

1. **`test-and-analyze`**: Tests con pytest (coverage mínimo 60%) + SonarCloud Scan + Quality Gate.
2. **`docker-build-scan`**: Build imágenes (frontend + backend) + Trivy scan (imagen + filesystem) + Push GHCR.
3. **`deploy-aws`**: SSH a EC2-A y EC2-B, pull desde GHCR, restart contenedores, health check `/health`.
4. **`ansible-verify`**: Ansible corre desde el runner de GitHub Actions, genera inventory dinámico con las IPs de los Secrets, ejecuta el rol `verify` en ambos nodos EC2 (docker ps + health check HTTP).
5. **`sync-azure`**: Sincronización S3 → Azure Blob Storage.

### ¿Por qué GHCR y no AWS ECR?

- GHCR integrado nativamente con GitHub: `GITHUB_TOKEN` es suficiente, sin credenciales adicionales.
- Sin costo adicional en plan estudiantil.
- Visibilidad de paquetes en el mismo repositorio.
- AWS ECR requiere credenciales IAM adicionales y tiene costo por almacenamiento y transferencia.

---

## 5.13 Infraestructura como Código con CloudFormation

### Recursos AWS automatizados (3 templates, ver `infra/cloudformation/templates/`)

- **`vpc-sg.yaml`**: VPC, Internet Gateway, 6 subnets (2 públicas, 2 privadas EC2, 2 DB en distintas AZ), Route Table pública, 3 Security Groups (ALB, EC2, RDS).
- **`ec2-alb.yaml`**: 2 instancias EC2 Ubuntu 22.04 (distintas AZ), Application Load Balancer + Target Group con health check `/health`, IAM Role + Instance Profile con políticas mínimas (S3 GetObject/PutObject/ListBucket, SSM GetParameter\*, KMS Decrypt condicionado al servicio SSM).
- **`rds-s3.yaml`**: RDS PostgreSQL (PITR via `BackupRetentionPeriod`, `PubliclyAccessible=false`, `StorageEncrypted=true`), S3 Bucket (versionado + cifrado AES256 + bloqueo de acceso público).

### Recursos Azure (creados manualmente vía Azure CLI — no automatizados con IaC, ver `docs/guia_instalacion.md` Paso 24)

Resource Group, Storage Account (SKU `Standard_GRS`), Storage Container privado para el respaldo de S3.

### Separación dev/prod

| Parámetro                   | dev (cuenta estudiante)        | prod                           |
| --------------------------- | ------------------------------ | ------------------------------ |
| `InstanceType`              | t3.micro                       | t3.small                       |
| `MultiAZ`                   | false                          | true                           |
| `DeletionProtectionEnabled` | false                          | true                           |
| `PubliclyAccessible` (RDS)  | false (fijo, no parametrizado) | false (fijo, no parametrizado) |

### Estrategia RDS en cuenta estudiantil

Las cuentas AWS Academy pueden tener restricciones con NAT Gateway (costo ~$32/mes) necesario para EC2 en subred privada. La estrategia de fallback sin comprometer seguridad: `PubliclyAccessible=false` impide que AWS asigne IP pública al endpoint de RDS, independientemente de la subred. El Security Group `sg-rds` es la segunda capa: solo acepta tráfico desde `sg-ec2`. Esta combinación entrega el mismo nivel de aislamiento que una subred privada + NAT Gateway, a costo cero.

### Reconstrucción ante fallos

Con `infra/cloudformation/environments/<env>/deploy.sh` se pueden recrear los 3 stacks desde cero en minutos, eliminando configuraciones manuales inconsistentes. `destroy.sh` hace el camino inverso (en prod, primero desactiva `DeletionProtection` antes de borrar la RDS).

---

## 5.14 Gestión de Configuración con Ansible

Ansible se usa en dos contextos:

### Rol common — Provisioning inicial (playbook site.yml, grupo `app_servers`)

1. Actualización del SO (apt upgrade)
2. Instalación de paquetes base
3. Hardening: SSH sin root, fail2ban (el firewall de red lo gestionan los Security Groups de AWS — **no se usa UFW**, sería redundante)
4. Instalación Docker CE + Docker Compose v2 + AWS CLI v2
5. Creación de directorio de la app, copia de `docker-compose.prod.yml` (renombrado a `docker-compose.yml`) y de `nginx/nginx.conf`
6. Inyección de secrets desde SSM Parameter Store + verificación de que `.env` exista con permisos `600`

### Rol verify — Verificación post-deploy (playbook verify.yml, desde Job 4 del pipeline)

- Verificar que Docker esté activo (systemd)
- Listar contenedores corriendo (docker ps)
- Health check HTTP al endpoint `/health`
- Monitoreo de disco (alerta si >80%)

**Integración con CI/CD**: El Job 4 del pipeline genera un `inventory.ini` dinámico con las IPs de los Secrets de GitHub, instala Ansible en el runner y ejecuta `verify.yml` directamente. Esto cierra el ciclo de automatización: CloudFormation crea la infraestructura, Ansible la configura, el pipeline la valida.

---

## 5.15 Modelo de Datos Normalizado

El modelo alcanza la **Tercera Forma Normal (3FN)**:

- **1FN**: Todos los atributos son atómicos. No hay grupos repetitivos.
- **2FN**: Todos los atributos no clave dependen funcionalmente de toda la clave primaria.
- **3FN**: No existen dependencias transitivas. El `id_rol` en `usuario` referencia la tabla `rol`.

### Tablas intermedias (relaciones N:M)

- `alumno_apoderado` (alumno ↔ apoderado, con atributos propios: `es_principal`, `puede_retirar`)
- `rol_permiso` (rol ↔ permiso)

### Relaciones clave

- `alumno → curso` (N:1): Cada alumno pertenece a un curso
- `mensualidad → pago` (1:N): Una mensualidad puede tener múltiples pagos parciales
- `gasto → categoria_gasto` (N:1): Cada gasto tiene una categoría
- `archivo_adjunto`: Diseño polimórfico con `entidad_tipo` + `entidad_id`

---

## 5.16 Estrategia de Backups y Recuperación

| Componente      | Estrategia                            | Frecuencia                 | Destino                |
| --------------- | ------------------------------------- | -------------------------- | ---------------------- |
| RDS PostgreSQL  | Snapshot automático                   | Diario                     | AWS (retención 7 días) |
| S3              | Versionado habilitado                 | Continuo                   | AWS S3                 |
| S3 → Azure Blob | az storage blob sync (Job 5 pipeline) | Por cada deploy / nocturno | Azure Blob GRS         |
| SSM Parameters  | Exportar vía AWS CLI                  | Semanal                    | S3 cifrado             |

**RTO estimado**: < 30 minutos (recrear infra con `deploy.sh` de CloudFormation + restaurar RDS snapshot)
**RPO estimado**: < 24 horas (último snapshot diario de RDS)

---

## 5.17 Riesgos Técnicos

| Riesgo                                      | Impacto | Probabilidad    | Mitigación                                                             |
| ------------------------------------------- | ------- | --------------- | ---------------------------------------------------------------------- |
| Sobredimensionamiento tecnológico           | Alto    | Bajo (mitigado) | Stack simple, sin K8s ni microservicios                                |
| Costos cloud superan créditos estudiantiles | Alto    | Medio           | t3.micro en dev, apagar fuera de horario, RDS sin NAT Gateway          |
| RDS Multi-AZ no disponible en Learner Lab   | Medio   | Medio           | Fallback: publicly_accessible=false + sg-rds restrictivo (documentado) |
| SonarCloud Quality Gate falla en entrega    | Medio   | Bajo            | Umbral 60% coverage configurable, excluir archivos de test             |
| Complejidad gestión multinube               | Medio   | Bajo            | Azure solo recibe respaldo, sin gestión activa                         |
| Seguridad datos de menores                  | Alto    | Bajo            | S3 privado, presigned URLs, JWT con roles                              |
| Secrets expuestos en EC2                    | Alto    | Bajo            | SSM Parameter Store SecureString + KMS, script de inyección            |
| Despliegue incompleto en plazo              | Alto    | Medio           | MVP reducido a módulos críticos primero                                |
| Demasiadas funcionalidades en 2 meses       | Alto    | Alto            | Priorización: alumnos → asistencia → pagos                             |
| Mala configuración IAM                      | Alto    | Bajo            | CloudFormation gestiona IAM, tres políticas mínimas documentadas       |

---

## 5.18 Plan de Desarrollo — 8 Semanas

| Semana | Actividades                                                                                 | Entregable                        |
| ------ | ------------------------------------------------------------------------------------------- | --------------------------------- |
| 1      | Análisis funcional, diseño arquitectura, modelo de datos, configurar SonarCloud             | Diagrams + ER + SonarCloud activo |
| 2      | Modelo de datos SQL, backend base FastAPI, JWT auth, SSM Parameters en dev                  | API /auth funcionando             |
| 3      | CRUD alumnos, apoderados, cursos. Frontend login + dashboard                                | 3 CRUDs + UI base                 |
| 4      | Módulo asistencia + pagos + mensualidades                                                   | Flujo completo pagos              |
| 5      | Módulo gastos + adjuntos S3 + portal apoderado básico                                       | Portal funcional                  |
| 6      | Comunicaciones básicas + dashboard admin + reportes simples                                 | Dashboard completo                |
| 7      | Docker build + CI/CD completo: SonarCloud + Trivy + GHCR + Ansible verify                   | Pipeline verde                    |
| 8      | CloudFormation deploy.sh + Ansible site + Deploy AWS + Azure sync + testing + documentación | Producción                        |

---

## 6. Conclusiones

El diseño logrado representa una arquitectura multinube moderna, segura y viable para el contexto estudiantil. La combinación AWS (principal) + Azure (secundaria) demuestra los principios de alta disponibilidad básica, redundancia de datos y contingencia sin sobredimensionamiento.

La integración de DevSecOps desde el inicio —con SonarCloud en código y Trivy en artefactos— garantiza que la seguridad no sea un añadido tardío. El uso de **AWS SSM Parameter Store** para la gestión de credenciales cierra la brecha más común en proyectos estudiantiles: las credenciales hardcodeadas o en archivos `.env` sin mecanismo de inyección segura.

La infraestructura como código con CloudFormation permite reconstruir el entorno completo en minutos. Ansible, integrado tanto en el provisioning inicial como en la verificación post-deploy del pipeline, garantiza que la configuración de los nodos sea reproducible y auditada.

El MVP definido es alcanzable en 2 meses y entrega valor real desde la semana 3.

---

## 7. Tabla de Ubicación de Imágenes en el Informe

| Diagrama                           | Archivo .puml                        | Imagen .png                         | Sección   | Pie de figura                                                  |
| ---------------------------------- | ------------------------------------ | ----------------------------------- | --------- | -------------------------------------------------------------- |
| Arquitectura multinube             | 01_arquitectura_cloud_multinube.puml | 01_arquitectura_cloud_multinube.png | 5.7       | Figura 1: Arquitectura multinube AWS + Azure propuesta         |
| Pipeline CI/CD DevSecOps           | 02_pipeline_cicd_devsecops.puml      | 02_pipeline_cicd_devsecops.png      | 5.12      | Figura 2: Pipeline CI/CD con SonarCloud, Trivy, Ansible y GHCR |
| Modelo Entidad-Relación            | 03_modelo_datos_er.puml              | 03_modelo_datos_er.png              | 5.15      | Figura 3: Modelo de datos normalizado hasta 3FN                |
| Flujo funcional                    | 04_flujo_funcional.puml              | 04_flujo_funcional.png              | 5.3       | Figura 4: Flujo funcional del sistema preescolar               |
| Casos de uso                       | 05_casos_uso.puml                    | 05_casos_uso.png                    | 5.3       | Figura 5: Casos de uso por actor y rol                         |
| Secuencia JWT                      | 06_secuencia_autenticacion_jwt.puml  | 06_secuencia_autenticacion_jwt.png  | 5.11      | Figura 6: Secuencia de autenticación y autorización JWT        |
| IaC CloudFormation + Ansible + SSM | 07_iac_cloudformation_ansible.puml   | 07_iac_cloudformation_ansible.png   | 5.13–5.14 | Figura 7: IaC con gestión segura de secrets via SSM            |

---

## Bibliografía / Webgrafía

- AWS Documentation — Amazon VPC: https://docs.aws.amazon.com/vpc/
- AWS Documentation — Amazon EC2: https://docs.aws.amazon.com/ec2/
- AWS Documentation — Amazon RDS PostgreSQL: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
- AWS Documentation — Amazon S3: https://docs.aws.amazon.com/s3/
- AWS Documentation — AWS IAM: https://docs.aws.amazon.com/iam/
- AWS Documentation — AWS SSM Parameter Store: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html
- AWS Documentation — Application Load Balancer: https://docs.aws.amazon.com/elasticloadbalancing/
- Azure Documentation — Azure Blob Storage: https://learn.microsoft.com/azure/storage/blobs/
- Azure Documentation — Azure Database for PostgreSQL Flexible Server: https://learn.microsoft.com/azure/postgresql/flexible-server/
- AWS CloudFormation — User Guide: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
- AWS CloudFormation — Resource and property types reference: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html
- Docker Documentation — Dockerfile reference: https://docs.docker.com/reference/dockerfile/
- Docker Documentation — Docker Compose: https://docs.docker.com/compose/
- GitHub Actions Documentation: https://docs.github.com/actions
- GitHub Container Registry Documentation: https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- SonarCloud Documentation: https://docs.sonarsource.com/sonarcloud/
- Aqua Trivy Documentation: https://aquasecurity.github.io/trivy/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- PostgreSQL Documentation — Version 15: https://www.postgresql.org/docs/15/
- Ansible Documentation: https://docs.ansible.com/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
