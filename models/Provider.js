const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  // Información del prestador
  user: {
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
  
  // Categorías de servicios (basado en lo que mencionaste)
  categories: [{
    type: String,
    enum: [
      'Jardinería', 
      'Trabajo en casa', 
      'Limpieza de automóviles', 
      'Cocina/Chef', 
      'Muebles/Carpintería',
      'Plomería',
      'Electricidad',
      'Limpieza del hogar'
    ],
    required: true
  }],
  
  // Información de contacto
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  website: {
    type: String
  },
  
  // Ubicación y cobertura
  neighborhoodsCovered: [{
    type: String,
    enum: ['La Taona', 'Pocitos', 'Malvín', 'Todo Montevideo'],
    required: true
  }],
  address: {
    type: String,
    required: true
  },
  
  // Galería de fotos
  photos: [{
    url: String,
    description: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  
  // Servicios específicos con precios
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
    priceType: {
      type: String,
      enum: ['hora', 'día', 'proyecto', 'unidad'],
      default: 'hora'
    },
    duration: Number // en minutos
  }],
  
  // Calificación y reputación
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
  
  // Disponibilidad
  availability: {
    days: [{
      type: Number, // 0=Domingo, 1=Lunes, etc.
      min: 0,
      max: 6
    }],
    startTime: {
      type: String, // formato "HH:MM"
      default: '08:00'
    },
    endTime: {
      type: String,
      default: '18:00'
    }
  },
  
  // Estado y verificación
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar updatedAt antes de guardar
providerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Provider', providerSchema);