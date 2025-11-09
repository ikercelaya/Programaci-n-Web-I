require('dotenv').config();

module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    UPLOADS_DIR: process.env.UPLOADS_DIR || 'src/public/uploads'
};