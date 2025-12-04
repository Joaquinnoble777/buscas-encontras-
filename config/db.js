const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    
    // Ocultar la contraseña en los logs por seguridad
    const maskedURI = process.env.MONGODB_URI 
      ? process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')
      : 'No configurada';
    
    console.log(`📡 URI: ${maskedURI}`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout después de 5 segundos
      socketTimeoutMS: 45000, // Cierra sockets después de 45s de inactividad
    });
    
    console.log(`✅ MongoDB Atlas CONECTADO!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Base de datos: ${conn.connection.name}`);
    console.log(`   Puerto: ${conn.connection.port}`);
    
    return conn;
    
  } catch (error) {
    console.error('❌ ERROR de conexión a MongoDB:');
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.message.includes('authentication')) {
      console.error('   ⚠️ Problema de autenticación:');
      console.error('     1. Verificá usuario/contraseña');
      console.error('     2. Asegurate que el usuario tenga permisos');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('   ⚠️ No se encuentra el servidor:');
      console.error('     1. Verificá tu conexión a internet');
      console.error('     2. El nombre del cluster podría estar mal');
    }
    
    console.error('\n🔧 Soluciones posibles:');
    console.error('   1. Verificá tu .env (MONGODB_URI)');
    console.error('   2. Agregá tu IP en MongoDB Atlas → Network Access');
    console.error('   3. Revisá Database Access en Atlas');
    
    process.exit(1);
  }
};

module.exports = connectDB;