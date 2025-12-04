const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica
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
  
  // Información de residencia (específico para barrios privados)
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
  
  // Verificación y estado
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin'],
    default: 'user'
  },
  
  // Metadata
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

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);