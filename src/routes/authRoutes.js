const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const router = express.Router();

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
        
        const user = new User({ 
            email, 
            password,
            role: role === 'admin' ? 'admin' : 'user'
        });
        
        await user.save();
        
        res.status(201).send('Usuario registrado con éxito');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar usuario: ' + error.message);
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('Credenciales inválidas (Email)');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send('Credenciales inválidas (Contraseña)');
        }

        const payload = {
            userId: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            config.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ 
            message: "Login exitoso",
            token: token,
            user: payload
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor durante el login');
    }
});

module.exports = router;