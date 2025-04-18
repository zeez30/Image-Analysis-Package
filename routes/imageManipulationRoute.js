const express = require('express');
const router = express.Router();
const { imageCrop } = require('../backend/src/imagemanipulation');
const fs = require('fs').promises;
const path = require('path');

router.post('/cropImage', async (req, res) => {

    try {
        const { x, y, height, width, imageData } = req.body;

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

        // Create temporary file paths
        const tempDir = path.join(__dirname, 'temp'); // Create a 'temp' directory in the same directory as this route file
        await fs.mkdir(tempDir, { recursive: true }); // Ensure the directory exists
        const tempImagePath = path.join(tempDir, `temp_image_crop_${Date.now()}.png`);
        const tempOutputPath = path.join(tempDir, `cropped_output_${Date.now()}.png`);

        // Save the buffer to a temporary file
        await fs.writeFile(tempImagePath, buffer);

        // Call the imageCrop function
        try {
            await imageCrop(parsedX, parsedY, parsedHeight, parsedWidth, tempImagePath, tempOutputPath);
        } catch (cropError) {
            console.error('Error in imageCrop:', cropError);
            return res.status(500).json({ error: 'Image cropping failed on the server.' });
        }

        // After cropping, read the temporary output file and send it back
        let croppedBuffer;
        try {
            croppedBuffer = await fs.readFile(tempOutputPath);
        } catch (readError) {
            console.error('Error reading cropped file:', readError);
            return res.status(500).json({ error: 'Error reading the cropped image.' });
        }

        res.writeHead(200, {
            'Content-Type': 'image/png', // Assuming PNG output from imageCrop
            'Content-Length': croppedBuffer.length
        });
        res.end(croppedBuffer);

        // Clean up temporary files
        try {
            await fs.unlink(tempImagePath);
            await fs.unlink(tempOutputPath);
        } catch (unlinkError) {
            console.error('Error deleting temporary files:', unlinkError);
        }

    } catch (error) {
        console.error('Error processing crop request:', error);
        res.status(500).json({ error: 'Failed to process image crop request.' });
    }
});

module.exports = router;