const express = require('express');
const Product = require('../models/Product');
const { authenticateJWT, checkAdmin } = require('../middleware/authenticateJWT');
const multer = require('multer'); 
const { v2: cloudinary } = require('cloudinary'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary'); 
const config = require('../config');

const router = express.Router();

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portal-productos', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
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
        
        const imageUrl = req.file ? req.file.path : null; 
        const imageId = req.file ? req.file.filename : null; 

        const product = new Product({ name, description, price, stock, imageUrl, imageId });
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

        const oldProduct = await Product.findById(req.params.id);

        if (req.file) {
            if (oldProduct && oldProduct.imageId) {
                await cloudinary.uploader.destroy(oldProduct.imageId);
            }
            updateData.imageUrl = req.file.path;
            updateData.imageId = req.file.filename;

        } else if (req.body.clearImage === 'true') { 
            if (oldProduct && oldProduct.imageId) {
                await cloudinary.uploader.destroy(oldProduct.imageId);
            }
            updateData.imageUrl = null;
            updateData.imageId = null;
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

        if (product.imageId) {
            await cloudinary.uploader.destroy(product.imageId);
        }

        res.send('Producto eliminado con éxito');
    } catch (error) {
        res.status(500).send('Error al eliminar el producto');
    }
});

module.exports = router;