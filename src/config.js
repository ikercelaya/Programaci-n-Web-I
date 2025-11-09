// src/config.js
module.exports = {
    // ¡IMPORTANTE! Cambia esto por una clave secreta larga y aleatoria
    JWT_SECRET: 'tu_clave_secreta_muy_segura_aqui_12345',
    
    // Configuración de la Base de Datos
    // Asegúrate de que MongoDB esté corriendo localmente en el puerto 27017
    // o reemplaza esto con tu URL de conexión de MongoDB Atlas.
    MONGO_URI: 'mongodb://localhost:27017/portalProductos'
};