const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).send('Acceso denegado. No se proporcionó token.');
        }

        jwt.verify(token, config.JWT_SECRET, (err, userPayload) => {
            if (err) {
                return res.status(403).send('Token inválido.'); 
            }
            
            req.user = userPayload; 
            next();
        });
    } else {
        res.status(401).send('Acceso denegado. Se requiere cabecera de autorización.');
    }
};

const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Acceso denegado. Se requiere rol de administrador.');
    }
};

module.exports = { authenticateJWT, checkAdmin };