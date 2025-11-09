const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const config = require('./config'); 
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose.connect(config.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(config.UPLOADS_DIR)); 

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/chat.html'));
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Autenticación requerida'));
    }
    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Token inválido'));
        }
        socket.user = decoded; 
        next();
    });
});

const ChatMessage = require('./models/ChatMessage');

io.on('connection', async (socket) => {
    console.log('Usuario conectado al chat:', socket.user.email);

    try {
        const messages = await ChatMessage.find().sort({ timestamp: 1 }).limit(50); 
        socket.emit('chat history', messages);
    } catch (error) {
        console.error('Error al cargar historial de chat:', error);
    }

    io.emit('chat message', { user: 'Sistema', message: `${socket.user.email} se ha unido al chat.` });

    socket.on('chat message', async (msg) => {
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


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});