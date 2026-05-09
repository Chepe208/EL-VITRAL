# Bienvenio a EL VITRAL
EL VITRAL es una plataforma web para digitalizar la operación comercial de una empresa de vidrios, espejos, aluminio y herrajes. El sistema centraliza procesos que antes se hacían en papel o por llamadas: catálogo, cotizaciones, gestión de pedidos, inventario y administración de usuarios.


## Empezar proyecto

Primero, haz correr el servidor con:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) con tu navegador.

## Configuración del entorno

1. Crea un archivo `.env.local` en la raíz del proyecto.
2. Copia los siguientes valores y pégalos en el archivo:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### reCAPTCHA
3. Genera tus claves en Google reCAPTCHA:
   - Ve a https://www.google.com/recaptcha/admin
   - Registra tu sitio con reCAPTCHA v2 (Checkbox) o reCAPTCHA v3
   - Copia `SITE KEY` y `SECRET KEY`
4. Pega las claves en `.env.local`

### Google Maps
5. Obtén una API Key de Google Maps:
   - Ve a https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Maps JavaScript
   - Crea una API Key con restricciones apropiadas
6. Pega la API Key en `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env.local`
