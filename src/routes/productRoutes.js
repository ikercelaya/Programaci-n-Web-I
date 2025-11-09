// src/routes/productRoutes.js
const express = require('express');
const Product = require('../models/Product');
const { authenticateJWT, checkAdmin } = require('../middleware/authenticateJWT');
const multer = require('multer'); // *¡NUEVO!* Importar multer
const path = require('path');     // *¡NUEVO!* Para trabajar con rutas de archivos
const fs = require('fs');         // *¡NUEVO!* Para manejar archivos (ej: borrar)

const router = express.Router();

// --- Configuración de Multer para la subida de imágenes ---
// *¡NUEVO CÓDIGO!*
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads');
        // Asegurarse de que el directorio existe
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generar un nombre de archivo único para evitar colisiones
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Límite de 5MB
});
// --- FIN Configuración de Multer ---


// OBTENER TODOS LOS PRODUCTOS
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).send('Error al obtener productos');
    }
});

// CREAR UN PRODUCTO (Solo Admins)
// *¡MODIFICADO!* Ahora usamos 'upload.single('productImage')' para manejar la subida
router.post('/', [authenticateJWT, checkAdmin, upload.single('productImage')], async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        
        // La URL de la imagen se obtiene de req.file
        // Si no se sube ninguna imagen, imageUrl será null o undefined
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; 

        const product = new Product({ name, description, price, stock, imageUrl });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        // Si Multer generó un error (ej: no es imagen, archivo muy grande)
        if (error instanceof multer.MulterError) {
            return res.status(400).send(`Error de subida de archivo: ${error.message}`);
        }
        res.status(400).send('Error al crear el producto: ' + error.message);
    }
});

// EDITAR UN PRODUCTO (Solo Admins)
// *¡MODIFICADO!* También usamos 'upload.single' para la edición, para permitir cambiar la imagen
router.put('/:id', [authenticateJWT, checkAdmin, upload.single('productImage')], async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let updateData = { name, description, price, stock };

        // Si se sube una nueva imagen
        if (req.file) {
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.imageUrl) {
                // Borrar la imagen antigua si existe
                const oldImagePath = path.join(__dirname, '../public', oldProduct.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.clearImage === 'true') { // *NUEVO*: Opción para eliminar la imagen
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.imageUrl) {
                const oldImagePath = path.join(__dirname, '../public', oldProduct.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = null; // Eliminar referencia a la imagen
        }


        const product = await Product.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true } 
        );
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }
        res.json(product);
    } catch (error) {
        if (error instanceof multer.MulterError) {
            return res.status(400).send(`Error de subida de archivo: ${error.message}`);
        }
        res.status(400).send('Error al actualizar el producto: ' + error.message);
    }
});

// ELIMINAR UN PRODUCTO (Solo Admins)
// *¡MODIFICADO!* Eliminar también la imagen asociada al producto
router.delete('/:id', [authenticateJWT, checkAdmin], async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        // Si el producto tenía una imagen, la borramos del disco
        if (product.imageUrl) {
            const imagePath = path.join(__dirname, '../public', product.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.send('Producto eliminado con éxito');
    } catch (error) {
        res.status(500).send('Error al eliminar el producto');
    }
});

module.exports = router;