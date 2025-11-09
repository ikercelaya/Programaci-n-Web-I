// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    // *¡MODIFICADO!* imageUrl ya no tiene default ni es requerido aquí,
    // será manejado por el middleware de Multer.
    imageUrl: { 
        type: String
    }
});

module.exports = mongoose.model('Product', productSchema);