// src/middleware/authenticateJWT.js
const jwt = require('jsonwebtoken');
const config = require('../config');

// 1. Middleware para verificar autenticación
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        // El token viene como "Bearer [token]"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).send('Acceso denegado. No se proporcionó token.');
        }

        jwt.verify(token, config.JWT_SECRET, (err, userPayload) => {
            if (err) {
                // Token inválido o expirado
                return res.status(403).send('Token inválido.'); 
            }
            
            // Si el token es válido, adjuntamos el payload a la request
            // para que las siguientes funciones (rutas) sepan quién es el usuario
            req.user = userPayload; 
            next(); // Pasa al siguiente middleware o a la ruta
        });
    } else {
        // No hay cabecera 'Authorization'
        res.status(401).send('Acceso denegado. Se requiere cabecera de autorización.');
    }
};

// 2. Middleware para verificar Rol de Administrador
const checkAdmin = (req, res, next) => {
    // Este middleware DEBE usarse DESPUÉS de authenticateJWT
    if (req.user && req.user.role === 'admin') {
        next(); // Es admin, puede continuar
    } else {
        // No es admin
        res.status(403).send('Acceso denegado. Se requiere rol de administrador.');
    }
};

module.exports = { authenticateJWT, checkAdmin };