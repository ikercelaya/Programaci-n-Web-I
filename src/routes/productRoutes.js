const express = require('express');
const Product = require('../models/Product');
const { authenticateJWT, checkAdmin } = require('../middleware/authenticateJWT');
const multer = require('multer'); 
const path = require('path');     
const fs = require('fs');         
const config = require('../config'); 

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = config.UPLOADS_DIR; 
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

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
    limits: { fileSize: 1024 * 1024 * 5 } 
});


router.get('/', authenticateJWT, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).send('Error al obtener productos');
    }
});

router.post('/', [authenticateJWT, checkAdmin, upload.single('productImage')], async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; 

        const product = new Product({ name, description, price, stock, imageUrl });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        if (error instanceof multer.MulterError) {
            return res.status(400).send(`Error de subida de archivo: ${error.message}`);
        }
        res.status(400).send('Error al crear el producto: ' + error.message);
    }
});

router.put('/:id', [authenticateJWT, checkAdmin, upload.single('productImage')], async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        let updateData = { name, description, price, stock };

        if (req.file) {
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.imageUrl) {
                const oldImagePath = path.join(config.UPLOADS_DIR, path.basename(oldProduct.imageUrl));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.clearImage === 'true') { 
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.imageUrl) {
                const oldImagePath = path.join(config.UPLOADS_DIR, path.basename(oldProduct.imageUrl));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = null; 
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

router.delete('/:id', [authenticateJWT, checkAdmin], async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        if (product.imageUrl) {
            const imagePath = path.join(config.UPLOADS_DIR, path.basename(product.imageUrl));
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