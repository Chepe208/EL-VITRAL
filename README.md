# Bienvenio a EL VITRAL

EL VITRAL es una plataforma web para digitalizar la operación comercial de una empresa de vidrios, espejos, aluminio y herrajes. El sistema centraliza procesos que antes se hacían en papel o por llamadas: catálogo, cotizaciones, gestión de pedidos, inventario y administración de usuarios.

Este repositorio se reorganizó en tres carpetas: `frontend/`, `backend/` y `docs/`.

Resumen
- `frontend/` — aplicación Next.js con framework de Tailwind, con lenguajes de TypeScript y Javascript.
- `backend/` — API, Node.js y scripts de base de datos.
- `docs/` — documentación y PDFs consolidados.

Instalación (rápida)
1. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

2. Instalar dependencias del backend

```bash
cd backend
npm install
```

## Variables de entorno

- Frontend: Crea un archivo `.env.local` en `/frontend` del proyecto.

1. Copia los siguientes valores y pégalos en el archivo:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### reCAPTCHA
2. Genera tus claves en Google reCAPTCHA:
   - Ve a https://www.google.com/recaptcha/admin
   - Registra tu sitio con reCAPTCHA v2 (Checkbox) o reCAPTCHA v3
   - Copia `SITE KEY` y `SECRET KEY`
3. Pega las claves en `.env.local`

### Google Maps
4. Obtén una API Key de Google Maps:
   - Ve a https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Maps JavaScript
   - Crea una API Key con restricciones apropiadas
5. Pega la API Key en `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env.local`

- Backend: crea `backend/.env` (o exporta en tu entorno):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=el_vitral_db
JWT_SECRET=your_jwt_secret_here
```

## Base de datos

Luego de haber creado las variables de entorno se crea la base de datos, entra a `/backend/database` y abre el archivo de `schema.sql`, copia todo el codigo del archivo y pegalo en la sección de `sql` de `phpMyAdmin` (si desea usar la seeder para tener con los productos puede copiar el codigo del archivo `seeder.sql` el cual se encuentra en la carpeta de database, luego entras en la base de datos en `phpMyAdmin` y entras en `sql` y pegas el codigo del archivo)


## Arrancar la aplicación

- Frontend (desarrollo):

```bash
cd frontend
npm run dev
# abre http://localhost:3000
```

- Backend: actualmente `backend/` contiene las rutas y helpers; no hay servidor HTTP generado automáticamente. Opciones:

1) Montar un servidor Node que importe los handlers en `backend/api/**` y escuche en un puerto (ej. 4000). Entonces:

```bash
cd backend
npm run start
```
