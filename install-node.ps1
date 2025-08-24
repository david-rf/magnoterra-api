# Script de instalación de Node.js para Windows
Write-Host "Instalando Node.js para Magno Terra API..." -ForegroundColor Green

# Descargar Node.js 20.x
$nodeVersion = "20.11.0"
$downloadUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
$installerPath = "$env:TEMP\node-installer.msi"

Write-Host "Descargando Node.js $nodeVersion..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    Write-Host "Descarga completada" -ForegroundColor Green
} catch {
    Write-Host "Error al descargar Node.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Instalar Node.js
Write-Host "Instalando Node.js..." -ForegroundColor Yellow
try {
    Start-Process msiexec.exe -ArgumentList '/i', $installerPath, '/quiet', '/norestart' -Wait
    Write-Host "Instalacion completada" -ForegroundColor Green
} catch {
    Write-Host "Error al instalar Node.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Limpiar archivo temporal
Remove-Item $installerPath -Force

# Actualizar PATH
Write-Host "Actualizando variables de entorno..." -ForegroundColor Yellow
$env:PATH += ";C:\Program Files\nodejs"

# Verificar instalación
Write-Host "Verificando instalacion..." -ForegroundColor Yellow
try {
    $nodeVersion = & "C:\Program Files\nodejs\node.exe" --version
    $npmVersion = & "C:\Program Files\nodejs\npm.cmd" --version
    
    Write-Host "Node.js instalado: $nodeVersion" -ForegroundColor Green
    Write-Host "npm instalado: $npmVersion" -ForegroundColor Green
    
    # Instalar dependencias del proyecto
    Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Yellow
    & "C:\Program Files\nodejs\npm.cmd" install
    
    Write-Host "Instalacion completada!" -ForegroundColor Green
    Write-Host "Para ejecutar el proyecto: npm run dev" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error al verificar la instalacion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Intenta reiniciar PowerShell y ejecutar: npm install" -ForegroundColor Yellow
}

Write-Host "Para mas informacion, consulta el README.md" -ForegroundColor Cyan
