require('dotenv').config();
const mongoose = require('mongoose');

console.log('='.repeat(60));
console.log('🔐 TEST DE CONEXIÓN MONGODB ATLAS');
console.log('='.repeat(60));

// Verificar que la URI está configurada
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ ERROR: MONGODB_URI no está en .env');
    process.exit(1);
}

// Mostrar información (ocultando contraseña)
const username = uri.split('://')[1].split(':')[0];
const database = uri.split('/').pop().split('?')[0];
const safeUri = uri.replace(/:[^:@]+@/, ':****@');

console.log('📋 INFORMACIÓN DE CONEXIÓN:');
console.log(`   👤 Usuario: ${username}`);
console.log(`   📊 Base de datos: ${database}`);
console.log(`   📡 URI: ${safeUri}`);
console.log('='.repeat(60));
console.log('🔄 Intentando conectar...\n');

// Configuración de conexión
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 segundos
    socketTimeoutMS: 45000, // 45 segundos
};

// Intentar conexión
mongoose.connect(uri, options)
    .then(async () => {
        console.log('✅ ¡CONEXIÓN EXITOSA A MONGODB ATLAS!');
        console.log('='.repeat(60));
        console.log('📊 INFORMACIÓN DE LA CONEXIÓN:');
        console.log(`   🏷️  Host: ${mongoose.connection.host}`);
        console.log(`   🗃️  Base de datos: ${mongoose.connection.name}`);
        console.log(`   🔌 Puerto: ${mongoose.connection.port}`);
        console.log(`   📡 Estado: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
        
        // Verificar colecciones existentes
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('\n📁 COLECCIONES EN LA BASE DE DATOS:');
            
            if (collections.length === 0) {
                console.log('   ℹ️  No hay colecciones. Base de datos nueva.');
                console.log('   💡 Se crearán automáticamente al usar los modelos.');
            } else {
                console.log(`   📚 Total: ${collections.length} colecciones`);
                collections.forEach((col, index) => {
                    console.log(`      ${index + 1}. ${col.name}`);
                });
            }
        } catch (error) {
            console.log('   ⚠️  No se pudieron listar las colecciones (normal en BD nueva)');
        }
        
        console.log('='.repeat(60));
        console.log('🎉 ¡BASE DE DATOS CONFIGURADA CORRECTAMENTE!');
        console.log('='.repeat(60));
        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('   1. Actualizar el server.js para usar la BD real');
        console.log('   2. Crear modelos con Mongoose');
        console.log('   3. Implementar autenticación JWT');
        
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error(`   Tipo: ${error.name}`);
        console.error(`   Mensaje: ${error.message}`);
        console.error('='.repeat(60));
        
        // Diagnóstico específico
        if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
            console.error('🔑 PROBLEMA DE AUTENTICACIÓN:');
            console.error('   1. Verificá que el usuario "market_user" exista en MongoDB Atlas');
            console.error('   2. La contraseña debe ser EXACTAMENTE "market123"');
            console.error('   3. El usuario necesita permisos "Atlas admin"');
            console.error('\n💡 SOLUCIÓN:');
            console.error('   - Creá un usuario nuevo en Atlas Database Access');
            console.error('   - Usá contraseña SIN caracteres especiales');
            console.error('   - Asigná rol "Atlas admin"');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('🌐 PROBLEMA DE RED/DNS:');
            console.error('   1. Verificá tu conexión a internet');
            console.error('   2. El cluster podría estar pausado en Atlas');
            console.error('   3. Verificá Network Access en Atlas (agregá tu IP)');
        } else if (error.message.includes('timed out')) {
            console.error('⏰ TIMEOUT DE CONEXIÓN:');
            console.error('   1. El servidor de Atlas está lento');
            console.error('   2. Tu conexión a internet puede ser inestable');
            console.error('   3. Intentá de nuevo en 1 minuto');
        }
        
        console.error('='.repeat(60));
        process.exit(1);
    });