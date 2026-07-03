# 🚀 Quick Start - Magno Terra API

## ⚡ Inicio Rápido (5 minutos)

### 1. Instalar Node.js
```powershell
# Ejecutar como administrador
.\install-node.ps1
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables
```bash
cp env.example .env
# Editar .env con tus credenciales
```

### 4. Ejecutar
```bash
npm run dev
```

### 5. Verificar
```bash
curl http://localhost:3000/health
```

## 🔧 Comandos Útiles

```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm test         # Ejecutar tests
npm run lint     # Verificar código
npm run format   # Formatear código
```

## 🌐 Endpoints Disponibles

- `GET /health` - Estado del servidor
- `GET /db-check` - Verificación de BD
- `GET /api` - Información de la API
- `POST /api/webhooks/youtube-upload-batch` - Markdown para videos de YouTube

## 🐳 Docker (Opcional)

```bash
docker-compose up -d
```

## 📚 Documentación Completa

- **README.md** - Documentación completa
- **AUDIT_REPORT.md** - Reporte de auditoría
- **install-node.ps1** - Script de instalación

---

**¡Listo para desarrollar!** 🚀
