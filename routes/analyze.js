// routes/analyze.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sharp = require('sharp');

const JWT_SECRET = 'thisIsSuchASecretKey';

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

// Helper function to calculate pixel distance
function calculatePixelDistance(point1, point2) {
    if (point1 && point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    return 0;
}

// Helper function to calculate ellipse area
function calculateEllipseArea(radiusX, radiusY) {
    return Math.PI * radiusX * radiusY;
}

// Helper function to calculate ellipse perimeter (Ramanujan approximation)
function calculateEllipsePerimeter(radiusX, radiusY) {
    const h = Math.pow((radiusX - radiusY), 2) / Math.pow((radiusX + radiusY), 2);
    return Math.PI * (radiusX + radiusY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

async function preprocessImage(imageDataURL) {
    try {
        const base64Data = imageDataURL.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const preprocessedBuffer = await sharp(buffer)
            .sharpen({ sigma: 1.0 })
            .grayscale()
            .blur(1) // Adjust blur radius as needed
            .toBuffer();

        return preprocessedBuffer.toString('base64');
    } catch (error) {
        console.error('Error preprocessing image:', error);
        throw error;
    }
}

// Analyze Grain Size
router.post('/grainsize', verifyToken, async (req, res) => {
    try {
        const { imageData, shapes, scale, units } = req.body;

        if (!imageData || !shapes) {
            return res.status(400).json({ error: 'Image data and shapes are required.' });
        }

        const preprocessedImageData = await preprocessImage(imageData);
        const preprocessedBuffer = Buffer.from(preprocessedImageData, 'base64');

        const analysisResults = [];

        for (const shape of shapes) {
            if (shape.type === 'line') {
                const pixelLength = calculatePixelDistance({ x: shape.startX, y: shape.startY }, { x: shape.endX, y: shape.endY });
                const realWorldLength = scale ? pixelLength * scale : pixelLength;
                analysisResults.push({
                    id: shape.id,
                    type: shape.type,
                    pixelLength: pixelLength.toFixed(2),
                    realWorldLength: realWorldLength.toFixed(3),
                    unit: units || 'pixels'
                });
            // } else if (shape.type === 'ellipse') {
            //     const radiusX = Math.abs(shape.endX - shape.startX) / 2;
            //     const radiusY = Math.abs(shape.endY - shape.startY) / 2;
            //     const pixelArea = calculateEllipseArea(radiusX, radiusY);
            //     const realWorldArea = scale ? pixelArea * scale * scale : pixelArea;
            //     const perimeter = calculateEllipsePerimeter(radiusX, radiusY);
            //     const realWorldPerimeter = scale ? perimeter * scale : perimeter;
            } else if (shape.type === 'ellipse') {
                const radiusX = Math.abs(shape.endX - shape.startX) / 2;
                const radiusY = Math.abs(shape.endY - shape.startY) / 2;
                const pixelArea = calculateEllipseArea(radiusX, radiusY);
                // Ensure scale is a number, default to 1 if not
                const currentScale = typeof scale === 'number' ? scale : 1;
                const realWorldArea = currentScale ? pixelArea * currentScale * currentScale : pixelArea;
                const perimeter = calculateEllipsePerimeter(radiusX, radiusY);
                const realWorldPerimeter = currentScale ? perimeter * currentScale : perimeter;

                // Simple grain counting based on intensity variation (can be improved)
                let averageGrainArea = null;
                const grainUnit = units ? units + '²' : 'pixels²';

                if (preprocessedBuffer && radiusX > 0 && radiusY > 0) {
                    const centerX = (shape.startX + shape.endX) / 2;
                    const centerY = (shape.startY + shape.endY) / 2;

                    const extract = await sharp(preprocessedBuffer)
                        .extract({
                            left: Math.round(Math.max(0, centerX - radiusX)),
                            top: Math.round(Math.max(0, centerY - radiusY)),
                            width: Math.round(2 * radiusX),
                            height: Math.round(2 * radiusY)
                        })
                        .raw()
                        .toBuffer({ resolveWithObject: true });

                    if (extract.data && extract.info.width > 0 && extract.info.height > 0) {
                        const pixelData = extract.data;
                        const pixelCount = extract.info.width * extract.info.height;
                        let grainPixels = 0;

                        for (let i = 0; i < pixelData.length; i += 1) {
                            // Simple thresholding - adjust as needed
                            if (pixelData[i] > 100) {
                                grainPixels++;
                            }
                        }

                        if (grainPixels > 0) {
                            const grainAreaInPixels = (pixelArea * (grainPixels / pixelCount));
                            averageGrainArea = scale ? grainAreaInPixels * scale * scale : grainAreaInPixels;
                        }
                    }
                }

                analysisResults.push({
                    id: shape.id,
                    type: shape.type,
                    pixelArea: pixelArea.toFixed(2),
                    realWorldArea: realWorldArea.toFixed(3),
                    perimeter: perimeter.toFixed(2),
                    realWorldPerimeter: realWorldPerimeter.toFixed(3),
                    unit: units ? units + '²' : 'pixels²',
                    averageGrainArea: averageGrainArea ? averageGrainArea.toFixed(3) : null,
                    grainUnit: grainUnit
                });
            }
        }

        res.json(analysisResults);
    } catch (error) {
        console.error('Error during grain size analysis:', error);
        res.status(500).json({ error: 'Error during grain size analysis', details: error.message });
    }
});

module.exports = router;