// src/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const router = express.Router();

// Ruta de REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).send('Email y contraseña son requeridos');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('El email ya está en uso');
        }
        
        // El rol es opcional, si se provee se usa, si no, el modelo usa 'user' por defecto
        const user = new User({ 
            email, 
            password,
            role: role === 'admin' ? 'admin' : 'user' // Asignación simple de rol
        });
        
        await user.save(); // El pre-hook hasheará la contraseña
        
        res.status(201).send('Usuario registrado con éxito');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar usuario: ' + error.message);
    }
});

// Ruta de LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Credenciales inválidas (Email)');
        }

        // Usamos el método que creamos en el modelo
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send('Credenciales inválidas (Contraseña)');
        }

        // Si las credenciales son correctas, creamos el Token JWT
        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            config.JWT_SECRET,
            { expiresIn: '2h' } // El token durará 2 horas
        );

        // Enviamos el token al cliente
        res.json({ 
            message: "Login exitoso",
            token: token,
            user: payload // Enviamos también los datos del usuario
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor durante el login');
    }
});

module.exports = router;