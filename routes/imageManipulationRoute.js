const express = require('express');
const router = express.Router();
const { imageCrop, imageRotate, imageBrightness } = require('../backend/src/imagemanipulation');
const fs = require('fs').promises;
const path = require('path');

router.post('/cropImage', async (req, res) => {
    console.log('Hit the /cropImage route! Body:', req.body);

    try {
        const { x, y, height, width, imageData } = req.body;

        console.log('Received crop request:', { x, y, height, width, imageDataLength: imageData ? imageData.length : 0 });

        if (!imageData || x === undefined || y === undefined || height === undefined || width === undefined) {
            console.error('Missing required parameters in req.body:', req.body);
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const parsedX = parseInt(x);
        const parsedY = parseInt(y);
        const parsedWidth = parseInt(width);
        const parsedHeight = parseInt(height);

        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Create temporary file path for reading
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const tempImagePath = path.join(tempDir, `temp_image_crop_${Date.now()}.png`);
        await fs.writeFile(tempImagePath, buffer);

        let croppedBuffer;
        try {
            croppedBuffer = await imageCrop(parsedX, parsedY, parsedHeight, parsedWidth, tempImagePath);
        } catch (cropError) {
            console.error('Error in imageCrop:', cropError);
            return res.status(500).json({ error: 'Image cropping failed on the server.' });
        }

        res.writeHead(200, {
            'Content-Type': 'image/png', // Send back as PNG
            'Content-Length': croppedBuffer.length
        });
        res.end(croppedBuffer);

        // Clean up temporary file
        try {
            await fs.unlink(tempImagePath);
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

    } catch (error) {
        console.error('Error processing crop request:', error);
        res.status(500).json({ error: 'Failed to process image crop request.' });
    }
});

router.post('/rotateImage', async (req, res) => {
    // console.log('Hit the /rotateImage route! Body:', req.body);

    try {
        const { degrees, imageData } = req.body;
        const parsedDegrees = parseInt(degrees);

        if (isNaN(parsedDegrees) || !imageData) {
            return res.status(400).json({ error: 'Missing or invalid parameters for rotation.' });
        }

        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const tempImagePath = path.join(tempDir, `temp_image_rotate_${Date.now()}.png`);
        await fs.writeFile(tempImagePath, buffer);

        let rotatedBuffer;
        try {
            rotatedBuffer = await imageRotate(parsedDegrees, tempImagePath);
        } catch (rotateError) {
            console.error('Error in imageRotate:', rotateError);
            return res.status(500).json({ error: 'Image rotation failed on the server.' });
        }

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': rotatedBuffer.length
        });
        res.end(rotatedBuffer);

        try {
            await fs.unlink(tempImagePath);
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }

    } catch (error) {
        console.error('Error processing rotation request:', error);
        res.status(500).json({ error: 'Failed to process image rotation request.' });
    }
});

module.exports = router;