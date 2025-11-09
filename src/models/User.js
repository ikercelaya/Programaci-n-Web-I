// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

// Middleware (pre-hook) que se ejecuta ANTES de guardar un usuario
// Usamos una función normal para que 'this' se refiera al documento
userSchema.pre('save', async function(next) {
    // Si la contraseña no ha sido modificada, sigue adelante
    if (!this.isModified('password')) {
        return next();
    }
    
    // "Hashea" la contraseña
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar la contraseña ingresada con la hasheada
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);