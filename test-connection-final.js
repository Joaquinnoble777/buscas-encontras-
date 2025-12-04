require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔐 TEST DE CONEXIÓN DEFINITIVO');
console.log('='.repeat(50));

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ ERROR: No hay MONGODB_URI en .env');
    process.exit(1);
}

// Mostrar URI segura (sin contraseña)
const safeUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log(`📡 URI: ${safeUri}`);
console.log(`👤 Usuario: ${uri.split('://')[1].split(':')[0]}`);
console.log('Intentando conectar...\n');

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000
})
.then(async () => {
    console.log('✅ ¡CONEXIÓN EXITOSA A MONGODB ATLAS!');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
    console.log(`🏷️  Host: ${mongoose.connection.host}`);
    
    // Crear algunas colecciones iniciales
    const db = mongoose.connection.db;
    
    // Listar colecciones existentes
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Colecciones existentes (${collections.length}):`);
    
    if (collections.length === 0) {
        console.log('   (Base de datos vacía - creando estructura...)');
        
        // Crear colecciones básicas
        await db.createCollection('users');
        await db.createCollection('providers');
        await db.createCollection('services');
        await db.createCollection('bookings');
        
        console.log('   ✅ Colecciones creadas: users, providers, services, bookings');
    } else {
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
    }
    
    console.log('\n🎉 ¡Base de datos lista para usar!');
    process.exit(0);
})
.catch(error => {
    console.error('❌ ERROR CRÍTICO:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
        console.error('\n🔑 SOLUCIÓN RÁPIDA:');
        console.error('   1. Creá un usuario NUEVO en MongoDB Atlas');
        console.error('   2. Usá contraseña SIN caracteres especiales');
        console.error('   3. Ejemplo: Usuario: test_user, Contraseña: test123');
    }
    
    if (error.message.includes('ENOTFOUND')) {
        console.error('\n🌐 Verificá:');
        console.error('   1. Tu conexión a internet');
        console.error('   2. Que el cluster no esté pausado en Atlas');
    }
    
    process.exit(1);
});