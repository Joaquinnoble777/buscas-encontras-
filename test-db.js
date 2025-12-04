require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 TEST DE CONEXIÓN A MONGODB ATLAS');
console.log('='.repeat(50));

// Verificar si la URI está configurada
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está en .env');
  process.exit(1);
}

// Mostrar URI (ocultando contraseña)
const maskedURI = process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
console.log(`URI configurada: ${maskedURI}`);
console.log('Intentando conectar...\n');

// Intentar conexión
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(async () => {
  console.log('✅ ¡CONEXIÓN EXITOSA!');
  console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  console.log(`🏷️  Host: ${mongoose.connection.host}`);
  
  // Listar colecciones (si las hay)
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`📁 Colecciones (${collections.length}):`);
  
  if (collections.length === 0) {
    console.log('   (Base de datos vacía - lista para usar)');
  } else {
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
  }
  
  process.exit(0);
})
.catch(error => {
  console.error('❌ ERROR DE CONEXIÓN:');
  console.error(`   Tipo: ${error.name}`);
  console.error(`   Mensaje: ${error.message}`);
  
  if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
    console.error('\n🔑 PROBLEMA DE AUTENTICACIÓN');
    console.error('   1. Verificá la contraseña en el archivo .env');
    console.error('   2. La contraseña podría necesitar URL encoding:');
    console.error('      @ → %40, # → %23, $ → %24');
    console.error('   3. Ejemplo: Pass@123 → Pass%40123');
  }
  
  if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
    console.error('\n🌐 PROBLEMA DE RED/DNS');
    console.error('   1. Verificá tu conexión a internet');
    console.error('   2. El nombre del cluster podría estar mal');
  }
  
  process.exit(1);
});