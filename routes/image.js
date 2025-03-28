const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Image = require('../models/Image');

const JWT_SECRET = 'thisIsSuchASecretKey'

// Middleware to verify token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.userId = user.id;
        next();
    });
}

// Save Image
router.post('/', verifyToken, async (req, res) => {
    try {
        const {imageData, mimeType, filename, size} = req.body;
        const image = new Image({
            userId: req.userId,
            imageData,
            mimeType,
            originalFileName: filename,
            size,
        });
        await image.save();
        res.status(201).json({ message: 'Image saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving image', error: error.message });
    }
});

// Get Image
router.get('/', verifyToken, async (req, res) => {
    try {
        const image = await Image.findOne({ userId: req.userId});
        if (image) {
            res.json(image);
        } else {
            res.status(404).json({ message: 'Image not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching image', error: error.message });
    }
});

module.exports = router;