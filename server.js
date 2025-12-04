const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================
app.use(express.json());

// CORS completo
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como desde Postman o curl)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://127.0.0.1:5500',     // Live Server común
            'http://localhost:5500',      // Live Server alternativo
            'http://127.0.0.1:8080',      // Python server
            'http://localhost:8080',      // Otro puerto
            'http://localhost:3000',      // React dev server
            'http://127.0.0.1:3000'       // React dev server alternativo
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
            callback(null, true);
        } else {
            console.log('⚠️  CORS bloqueado para origen:', origin);
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400 // 24 horas
}));

console.log('='.repeat(60));
console.log('🏠 MARKETPLACE BARRIOS PRIVADOS - LA TAONA');
console.log('='.repeat(60));

// ============================================
// VERIFICAR VARIABLES DE ENTORNO CRÍTICAS
// ============================================
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('tu_secreto')) {
    console.error('❌ ERROR: JWT_SECRET no configurado correctamente en .env');
    console.error('   Por favor, edita el archivo .env y agrega:');
    console.error('   JWT_SECRET=un_secreto_muy_largo_y_seguro_123456');
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI no configurada en .env');
    process.exit(1);
}

// ============================================
// CONEXIÓN A MONGODB ATLAS
// ============================================
let dbConnection = null;
let User, Provider, Booking;

const connectToDatabase = async () => {
    try {
        console.log('🔄 Conectando a MongoDB Atlas...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000
        });
        
        console.log('✅ Conectado a MongoDB Atlas');
        console.log(`📊 Base de datos: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        
        return mongoose.connection;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:');
        console.error(`   ${error.message}`);
        console.log('💡 Usando datos simulados para desarrollo');
        return null;
    }
};

// ============================================
// CONFIGURAR MODELOS DE DATOS
// ============================================
function setupDatabaseModels() {
    console.log('📦 Configurando modelos de base de datos...');
    
    // Esquema de Usuario
    const userSchema = new mongoose.Schema({
        name: { 
            type: String, 
            required: [true, 'El nombre es requerido'],
            trim: true
        },
        email: { 
            type: String, 
            required: [true, 'El email es requerido'],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: { 
            type: String, 
            required: [true, 'La contraseña es requerida'],
            minlength: 6
        },
        phone: { 
            type: String, 
            required: [true, 'El teléfono es requerido']
        },
        neighborhood: {
            type: String,
            required: [true, 'El barrio es requerido'],
            enum: ['La Taona', 'Pocitos', 'Malvín', 'Otro']
        },
        address: {
            type: String,
            required: [true, 'La dirección es requerida']
        },
        unitNumber: {
            type: String,
            required: [true, 'El número de unidad es requerido']
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ['user', 'provider', 'admin'],
            default: 'user'
        },
        profileImage: {
            type: String,
            default: ''
        },
        favorites: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Provider'
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    // Esquema de Proveedor
    const providerSchema = new mongoose.Schema({
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        businessName: { 
            type: String, 
            required: [true, 'El nombre del negocio es requerido'],
            trim: true
        },
        description: { 
            type: String, 
            required: [true, 'La descripción es requerida'],
            maxlength: 500
        },
        categories: [{
            type: String,
            enum: [
                'Jardinería', 
                'Limpieza del hogar', 
                'Lavado de autos', 
                'Chef a domicilio', 
                'Carpintería',
                'Plomería',
                'Electricidad',
                'Niñera'
            ]
        }],
        neighborhoodsCovered: [{
            type: String,
            enum: ['La Taona', 'Pocitos', 'Malvín', 'Todo Montevideo'],
            required: true
        }],
        services: [{
            name: {
                type: String,
                required: true
            },
            description: String,
            price: {
                type: Number,
                required: true
            },
            duration: String,
            category: String
        }],
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        isPremium: {
            type: Boolean,
            default: false
        },
        contact: {
            phone: String,
            email: String,
            responseTime: String
        },
        photos: [String],
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    // Esquema de Reserva
    const bookingSchema = new mongoose.Schema({
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        providerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Provider', 
            required: true 
        },
        serviceName: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
            default: 'pendiente'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    });

    // Crear modelos
    User = mongoose.model('User', userSchema);
    Provider = mongoose.model('Provider', providerSchema);
    Booking = mongoose.model('Booking', bookingSchema);
    
    console.log('✅ Modelos configurados correctamente');
}

function setupMockData() {
    console.log('💾 Configurando datos simulados...');
}

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth Header recibido:', authHeader);
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'Acceso denegado. Token requerido.'
        });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token no proporcionado.'
        });
    }
    
    try {
        console.log('🔐 Verificando token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('🔐 Usuario autenticado:', decoded.email);
        next();
    } catch (error) {
        console.error('🔐 Error verificando token:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado.'
        });
    }
};

// REGISTRO DE USUARIO
app.post('/api/auth/register', async (req, res) => {
    console.log('📝 POST /api/auth/register');
    console.log('📝 Datos recibidos:', { ...req.body, password: '***' });
    
    try {
        const { name, email, password, phone, neighborhood, address, unitNumber } = req.body;
        
        // Validaciones básicas
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y contraseña son requeridos'
            });
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Crear usuario
        const user = new User({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || '099123456',
            neighborhood: neighborhood || 'La Taona',
            address: address || 'Dirección no especificada',
            unitNumber: unitNumber || 'N/A',
            isVerified: true,
            role: 'user'
        });
        
        await user.save();
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role,
                neighborhood: user.neighborhood 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Usuario registrado exitosamente:', user.email);
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                neighborhood: user.neighborhood,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// LOGIN DE USUARIO
app.post('/api/auth/login', async (req, res) => {
    console.log('🔑 POST /api/auth/login');
    console.log('🔑 Datos recibidos:', { ...req.body, password: '***' });
    
    try {
        const { email, password } = req.body;
        
        // Validaciones
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }
        
        // Buscar usuario (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                role: user.role,
                neighborhood: user.neighborhood 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Login exitoso para:', user.email);
        
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                neighborhood: user.neighborhood,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PERFIL DEL USUARIO (PROTEGIDO)
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    console.log('👤 GET /api/auth/profile - Usuario:', req.user.email);
    
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('❌ Error en perfil:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// RUTAS GENERALES
// ============================================

// Home
app.get('/', (req, res) => {
    res.json({
        success: true,
        app: 'Marketplace Barrios Privados',
        version: '1.0.0',
        database: dbConnection ? 'MongoDB Atlas' : 'Modo desarrollo (simulado)',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile'
            },
            providers: 'GET /api/providers',
            services: 'GET /api/services',
            bookings: 'POST /api/bookings',
            status: 'GET /api/status'
        }
    });
});

// Estado del sistema
app.get('/api/status', (req, res) => {
    const dbState = dbConnection ? dbConnection.readyState : 0;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        success: true,
        app: 'Marketplace Barrios Privados',
        database: {
            connected: !!dbConnection,
            state: states[dbState] || 'unknown',
            type: dbConnection ? 'MongoDB Atlas' : 'simulated'
        },
        timestamp: new Date().toISOString()
    });
});

// Ruta para obtener proveedores (usa BD si está disponible)
app.get('/api/providers', async (req, res) => {
    try {
        if (dbConnection && Provider) {
            // Usar base de datos real
            const providers = await Provider.find({});
            res.json({
                success: true,
                source: 'database',
                count: providers.length,
                data: providers
            });
        } else {
            // Usar datos simulados
            const mockProviders = [
                {
                    id: 1,
                    businessName: "Jardinería Elegante",
                    description: "Servicio premium de jardinería para barrios privados",
                    rating: 4.8,
                    categories: ["Jardinería"],
                    neighborhoodsCovered: ["La Taona", "Pocitos"],
                    services: [
                        {
                            name: "Mantenimiento mensual",
                            price: 3500,
                            duration: "4 horas"
                        }
                    ]
                },
                {
                    id: 2,
                    businessName: "Chef a Domicilio",
                    description: "Cenas gourmet en tu hogar",
                    rating: 4.9,
                    categories: ["Chef a domicilio"],
                    neighborhoodsCovered: ["La Taona"],
                    services: [
                        {
                            name: "Cena para 4 personas",
                            price: 4500,
                            duration: "3 horas"
                        }
                    ]
                }
            ];
            
            res.json({
                success: true,
                source: 'mock',
                count: mockProviders.length,
                data: mockProviders
            });
        }
    } catch (error) {
        console.error('❌ Error obteniendo proveedores:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para crear un proveedor
app.post('/api/providers', authMiddleware, async (req, res) => {
    try {
        if (!dbConnection || !Provider) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        const providerData = {
            ...req.body,
            userId: req.user.userId
        };
        
        const provider = new Provider(providerData);
        await provider.save();
        
        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            data: provider
        });
    } catch (error) {
        console.error('❌ Error creando proveedor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para crear datos demo
app.post('/api/seed', async (req, res) => {
    try {
        if (!dbConnection || !User || !Provider) {
            return res.status(503).json({
                success: false,
                error: 'Base de datos no disponible'
            });
        }
        
        // Crear usuario demo
        const demoUser = new User({
            name: "Usuario Demo",
            email: "demo@lataona.com",
            password: "$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6gYq7/.cG6zB4K.wbJq3J1bVK5pW6", // "demo123"
            phone: "099123456",
            neighborhood: "La Taona",
            address: "Calle Principal 123",
            unitNumber: "Casa 8",
            isVerified: true
        });
        await demoUser.save();
        
        // Crear proveedor demo
        const demoProvider = new Provider({
            userId: demoUser._id,
            businessName: "Servicio Demo",
            description: "Este es un proveedor de demostración",
            categories: ["Jardinería"],
            neighborhoodsCovered: ["La Taona"],
            services: [
                {
                    name: "Servicio de demostración",
                    description: "Descripción del servicio demo",
                    price: 1000,
                    duration: "1 hora",
                    category: "Demo"
                }
            ]
        });
        await demoProvider.save();
        
        res.json({
            success: true,
            message: 'Datos demo creados exitosamente',
            user: {
                id: demoUser._id,
                email: demoUser.email
            },
            provider: {
                id: demoProvider._id,
                name: demoProvider.businessName
            }
        });
    } catch (error) {
        console.error('❌ Error creando datos demo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;
const SERVER_HOST = 'localhost';

// Función para inicializar la aplicación
const initializeApp = async () => {
    try {
        // Conectar a la base de datos
        dbConnection = await connectToDatabase();
        
        if (dbConnection) {
            setupDatabaseModels();
        } else {
            setupMockData();
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, SERVER_HOST, () => {
            console.log(`✅ Servidor ejecutándose en: http://${SERVER_HOST}:${PORT}`);
            console.log(`📊 Base de datos: ${dbConnection ? 'Conectada (Atlas)' : 'Simulada'}`);
            console.log('='.repeat(60));
            console.log('🔍 Endpoints disponibles:');
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/`);
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/api/status`);
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/api/auth/register (POST)`);
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/api/auth/login (POST)`);
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/api/providers`);
            console.log(`   👉 http://${SERVER_HOST}:${PORT}/api/seed (POST)`);
            console.log('='.repeat(60));
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`⚠️  El puerto ${PORT} está en uso, intentando con el puerto ${PORT + 1}...`);
                app.listen(PORT + 1, SERVER_HOST, () => {
                    console.log(`✅ Servidor ejecutándose en: http://${SERVER_HOST}:${PORT + 1}`);
                });
            } else {
                console.error('❌ Error del servidor:', error);
            }
        });
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        process.exit(1);
    }
};

// Iniciar la aplicación
initializeApp();