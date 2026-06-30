# Magno Terra API 🚀

API de e-commerce para Magno Terra construida con Node.js, Express y MySQL.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express
- **Base de Datos**: MySQL (Railway)
- **Despliegue**: Railway (región us-west2)
- **Pagos**: Mercado Pago (integración futura)
- **Testing**: Vitest + Supertest
- **Logging**: Pino
- **Validación**: Zod

## 📋 Requisitos

- Node.js >= 20.x
- MySQL 8.0+
- npm o yarn

## 🚀 Instalación Local

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd magnoterra-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp env.example .env
```

Editar `.env` con tus credenciales:

```env
PORT=3000
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB
MP_PUBLIC_KEY=pk_xxx
MP_ACCESS_TOKEN=APP_USR-xxx
NODE_ENV=development
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Verificar instalación

```bash
curl http://localhost:3000/health
```

## 🛠️ Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo con nodemon
- `npm run lint` - Ejecutar ESLint
- `npm run format` - Formatear código con Prettier
- `npm test` - Ejecutar tests
- `npm run typecheck` - Verificar tipos (skip para JS)

## 🌐 Endpoints

### Health Check

- `GET /health` - Estado del servidor

### Database Check

- `GET /db-check` - Verificación de conexión a BD

### API Routes

- `GET /api` - Información de la API
- `GET /api/health` - Health check de la API
- `GET /api/db-check` - Verificación de BD de la API
- `POST /api/webhooks` - Webhook `youtube_upload_batch` que responde markdown para LinkedIn e Instagram

## 🐳 Docker

### Desarrollo local

```bash
docker-compose up -d
```

### Construir imagen

```bash
docker build -t magnoterra-api .
```

### Ejecutar contenedor

```bash
docker run -p 3000:3000 magnoterra-api
```

## 🚀 Despliegue en Railway

### 1. Conectar repositorio

- Conectar tu repositorio de GitHub a Railway
- Configurar región: `us-west2`

### 2. Variables de entorno

Configurar en Railway:

```env
DATABASE_URL=${{ MySQL.MYSQL_URL }}
PORT=3000
NODE_ENV=production
MP_PUBLIC_KEY=pk_xxx
MP_ACCESS_TOKEN=APP_USR-xxx
```

### 3. Health Check

Configurar en Railway Deploy settings:

- **Healthcheck Path**: `/health`
- **Healthcheck Timeout**: 30s

### 4. Base de datos

- Crear servicio MySQL en Railway
- La variable `MYSQL_URL` se mapea automáticamente a `DATABASE_URL`

## 🔒 Seguridad

- **Helmet**: Headers de seguridad
- **CORS**: Configurado para desarrollo (temporalmente `*`)
- **Rate Limiting**: 100 requests por IP cada 15 minutos
- **Input Validation**: Zod para validación de datos

## 📊 Logging

- **Desarrollo**: Pino con formato pretty
- **Producción**: Pino JSON para agregación
- **Niveles**: error, warn, info, debug

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test -- health.test.js
npm test -- db-check.test.js
```

## 🔧 Configuración de Desarrollo

### ESLint

- Configuración moderna con `@eslint/js`
- Reglas personalizadas para Node.js

### Prettier

- Formato consistente del código
- Integración con ESLint

### EditorConfig

- Configuración consistente entre editores

## 📁 Estructura del Proyecto

```
magnoterra-api/
├── index.js                 # Punto de entrada principal
├── package.json            # Dependencias y scripts
├── .nvmrc                  # Versión de Node.js
├── .env.example            # Variables de entorno de ejemplo
├── .gitignore              # Archivos ignorados por Git
├── eslint.config.js        # Configuración de ESLint
├── .prettierrc             # Configuración de Prettier
├── .editorconfig           # Configuración del editor
├── Dockerfile              # Imagen de Docker
├── docker-compose.yml      # Orquestación local
├── README.md               # Este archivo
├── src/
│   ├── config/
│   │   └── env.js         # Configuración de variables de entorno
│   ├── db/
│   │   └── pool.js        # Pool de conexiones MySQL
│   ├── middlewares/
│   │   ├── error.js       # Manejo de errores
│   │   ├── notFound.js    # 404 handler
│   │   └── index.js       # Exportaciones
│   ├── lib/
│   │   └── logger.js      # Sistema de logging
│   ├── payments/
│   │   └── mercadopago.js # Integración MP (placeholder)
│   └── routes/
│       └── index.js       # Rutas de la API
├── tests/
│   ├── health.test.js     # Tests del health check
│   └── db-check.test.js   # Tests de verificación de BD
├── public/                 # Archivos estáticos
└── .github/
    └── workflows/
        └── ci.yml         # Pipeline de CI/CD
```

## 🔮 Mercado Pago (Futuro)

### Endpoints planificados

- `POST /api/payments/create-preference` - Crear preferencia de pago
- `POST /api/webhooks/mp` - Webhook de notificaciones

### Checklist de implementación

- [ ] Instalar SDK de Mercado Pago
- [ ] Configurar credenciales de producción
- [ ] Implementar validación de firmas de webhook
- [ ] Crear sistema de notificaciones
- [ ] Implementar manejo de estados de pago

## 🚨 Troubleshooting

### Error de conexión a BD

```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Probar conexión manual
mysql -h HOST -u USER -p DB_NAME
```

### Puerto ocupado

```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
npx kill-port 3000
```

### Dependencias corruptas

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Soporte

- **Issues**: Crear issue en GitHub
- **Documentación**: [Railway Docs](https://docs.railway.app/)
- **Mercado Pago**: [MP Developers](https://www.mercadopago.com.ar/developers)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

**Magno Terra Team** 🚀
