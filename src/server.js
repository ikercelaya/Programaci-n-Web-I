// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const config = require('./config'); // Asegúrate de que config.js está bien configurado

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conexión a MongoDB
mongoose.connect(config.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Middleware
app.use(express.json()); // Para parsear JSON en el body
app.use(express.static('src/public')); // Servir archivos estáticos del frontend

// *¡NUEVO!* Servir imágenes subidas desde la carpeta 'uploads'
app.use('/uploads', express.static('src/public/uploads')); 

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta para el chat.html
app.get('/chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

// --- Socket.IO para el Chat ---
// Middleware de autenticación para Socket.IO
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Autenticación requerida'));
    }
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Token inválido'));
        }
        socket.user = decoded; // Guardar información del usuario en el socket
        next();
    });
});

// *¡NUEVO!* Importar el modelo de ChatMessage y configurar el chat
const ChatMessage = require('./models/ChatMessage');

io.on('connection', async (socket) => {
    console.log('Usuario conectado al chat:', socket.user.email);

    // *¡NUEVO!* Emitir historial de chat al nuevo usuario
    try {
        const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(50); // Últimos 50 mensajes
        socket.emit('chat history', messages);
    } catch (error) {
        console.error('Error al cargar historial de chat:', error);
    }

    // Notificar a todos que un usuario se ha unido
    io.emit('chat message', { user: 'Sistema', message: `${socket.user.email} se ha unido al chat.` });

    socket.on('chat message', async (msg) => {
        // *¡NUEVO!* Guardar mensaje en la base de datos
        try {
            const chatMessage = new ChatMessage({
                user: socket.user.email,
                message: msg,
                timestamp: new Date()
            });
            await chatMessage.save();
            io.emit('chat message', { user: socket.user.email, message: msg });
        } catch (error) {
            console.error('Error al guardar mensaje en la base de datos:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado del chat:', socket.user.email);
        io.emit('chat message', { user: 'Sistema', message: `${socket.user.email} ha abandonado el chat.` });
    });
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});