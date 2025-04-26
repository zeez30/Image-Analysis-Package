const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sharp = require('sharp');

const JWT_SECRET = 'thisIsSuchASecretKey'; // Ensure this matches your auth middleware

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

async function processImage(imageDataURL, processingFunction) {
    try {
        const base64Data = imageDataURL.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const processedBuffer = await processingFunction(sharp(buffer));
        return processedBuffer.toBuffer();
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

// Apply Greyscale
router.post('/greyscale', verifyToken, async (req, res) => {
    try {
        const { greyscale, imageData } = req.body;
        if (imageData) {
            const processedBuffer = await processImage(imageData, (image) => {
                return greyscale ? image.grayscale() : image;
            });

            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(processedBuffer);
        } else {
            return res.status(400).json({ error: 'Image data required.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error applying greyscale', details: error.message });
    }
});

// Apply Sharpness
router.post('/sharpen', verifyToken, async (req, res) => {
    try {
        const { sharpness, imageData } = req.body;
        if (imageData) {
            const processedBuffer = await processImage(imageData, (image) => {
                // Adjust the sigma value based on your slider range (0.1 to 10)
                // You might want to experiment with these values
                const sigma = sharpness * 0.5; // Example scaling
                return image.sharpen({ sigma: sigma });
            });

            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(processedBuffer);
        } else {
            return res.status(400).json({ error: 'Image data required.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error applying sharpness', details: error.message });
    }
});

// Apply Smoothing (using blur as a form of smoothing)
router.post('/smooth', verifyToken, async (req, res) => {
    try {
        const { smoothing, imageData } = req.body;
        if (imageData) {
            const processedBuffer = await processImage(imageData, (image) => {
                // Adjust the sigma value based on your slider range (0 to 20)
                // Higher values mean more blur (smoothing)
                const sigma = smoothing / 5; // Example scaling
                return image.blur(sigma);
            });

            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(processedBuffer);
        } else {
            return res.status(400).json({ error: 'Image data required.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error applying smoothing', details: error.message });
    }
});

module.exports = router;