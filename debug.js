// Debug script para identificar problemas de Railway
console.log('=== DEBUG INFO ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('- MP_PUBLIC_KEY:', process.env.MP_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('- MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'SET' : 'NOT SET');

// Listar archivos del directorio
const fs = require('fs');
try {
  const files = fs.readdirSync('.');
  console.log('Files in current directory:', files);
} catch (error) {
  console.log('Error reading directory:', error.message);
}

// Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Package.json scripts:', Object.keys(packageJson.scripts));
} catch (error) {
  console.log('Error reading package.json:', error.message);
}

console.log('=== END DEBUG ===');
