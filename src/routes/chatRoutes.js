// src/routes/chatRoutes.js
const express = require('express');
const path = require('path');
const { authenticateJWT } = require('../middleware/authenticateJWT');

const router = express.Router();

// Esta ruta no es una API, es una ruta web.
// Usamos el middleware 'authenticateJWT' para protegerla.
// ¡Pero OJO! El middleware espera el token en headers 'Authorization'.
// Un navegador normal no envía eso al pedir un HTML.
// Lo manejaremos en el lado del cliente (client.js) que redirigirá
// si no hay token. Esta ruta es más un placeholder.

// Lo que haremos es que el cliente (client.js) verifique el token
// antes de intentar ir a 'chat.html'.

// Por ahora, esta ruta solo sirve el archivo estático, 
// la verdadera protección la haremos en el cliente y en el socket.
router.get('/', (req, res) => {
    // Sirve el archivo chat.html
    res.sendFile(path.join(__dirname, '../public/chat.html'));
});

module.exports = router;