const express = require('express');
const { imageCrop, imageRotate, imageBrightness } = require('../backend/src/imagemanipulation.js');
// const path = require('path');

const router = express.Router();

//cropImage
router.post('/cropImage', async (req, res) => {
    try {
        const { x, y, height, width, imagePath, outputPath } = req.body;

        if (!x || !y || !height || !width || !imagePath || !outputPath) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        await imageCrop(parseInt(x), parseInt(y), parseInt(height), parseInt(width), imagePath, outputPath);
        res.json({ message: `Image cropped and saved to ${outputPath}` });
    } catch (error) {
        console.error('Error processing image crop request:', error);
        res.status(500).json({ error: 'Failed to crop image.' });
    }
});

// Rotation function route
router.post('/rotateImage', async (req, res) => {
    try {
        const { degrees, imagePath, outputPath } = req.body;

        if (!degrees || !imagePath || !outputPath) {
            return res.status(400).json({ error: 'Missing required parameters for rotation.' });
        }

        await imageRotate(parseInt(degrees), imagePath, outputPath);
        res.json({ message: `Image rotated by ${degrees} degrees and saved to ${outputPath}` });
    } catch (error) {
        console.error('Error processing image rotation request:', error);
        res.status(500).json({ error: 'Failed to rotate image.' });
    }
});

// Image Brightness function route
router.post('/adjustBrightness', async (req, res) => {
    try {
        const { brightness, imagePath, outputPath } = req.body;

        if (brightness === undefined || !imagePath || !outputPath) {
            return res.status(400).json({ error: 'Missing required parameters for brightness adjustment.' });
        }

        await imageBrightness(parseFloat(brightness), imagePath, outputPath);
        res.json({ message: `Image brightness adjusted by ${brightness} and saved to ${outputPath}` });
    } catch (error) {
        console.error('Error processing image brightness request:', error);
        res.status(500).json({ error: 'Failed to adjust image brightness.' });
    }
});

module.exports = router;