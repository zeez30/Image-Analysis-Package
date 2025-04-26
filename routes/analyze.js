// routes/analyze.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sharp = require('sharp');

//debugging
const fs = require('fs').promises; // Import the promises API for fs
const path = require('path'); // Import the path module

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

// Image preprocessing for image grain analysis
// async function preprocessImage(imageDataURL) {
//     try {
//         const base64Data = imageDataURL.split(',')[1];
//         const buffer = Buffer.from(base64Data, 'base64');
//
//         const preprocessedBuffer = await sharp(buffer)
//             // .sharpen({ sigma: 0.5 })
//             .grayscale()
//             .blur(3)
//             .toBuffer();
//
//         return preprocessedBuffer.toString('base64');
//     } catch (error) {
//         console.error('Error preprocessing image:', error);
//         throw error;
//     }
// }

async function preprocessImage(imageDataURL, saveDebugImage = false) {
    try {
        const base64Data = imageDataURL.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const preprocessedBuffer = await sharp(buffer)
            .sharpen({ sigma: 0.5 })
            .grayscale()
            .blur(0.3)
            .toBuffer();

        if (saveDebugImage) {
            const tempDir = path.join(__dirname, 'temp');
            try {
                await fs.mkdir(tempDir, { recursive: true }); // Create the directory if it doesn't exist
                const timestamp = Date.now();
                const imagePath = path.join(tempDir, `preprocessed_${timestamp}.png`);
                await fs.writeFile(imagePath, preprocessedBuffer);
                console.log(`Saved preprocessed image to: ${imagePath}`);
            } catch (error) {
                console.error('Error saving debug image:', error);
            }
        }

        return preprocessedBuffer.toString('base64');
    } catch (error) {
        console.error('Error preprocessing image:', error);
        throw error;
    }
}

// Helper function to get pixel intensity at a given coordinate
async function getPixelIntensity(imageBuffer, x, y) {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        if (x >= 0 && x < metadata.width && y >= 0 && y < metadata.height) {
            const pixelData = await sharp(imageBuffer)
                .extract({ left: Math.round(x), top: Math.round(y), width: 1, height: 1 })
                .raw()
                .toBuffer();
            return (pixelData[0] + pixelData[1] + pixelData[2]) / 3; // Average RGB
        }
        return NaN;
    } catch (error) {
        console.error('Error getting pixel intensity:', error);
        return NaN;
    }
}

// Helper function to sample pixel intensities along a line
async function sampleLineIntensities(imageBuffer, startX, startY, endX, endY, numSamples = 50) {
    const intensities = [];
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    for (let i = 0; i < numSamples; i++) {
        const t = i / (numSamples - 1);
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;

        if (x >= 0 && x < width && y >= 0 && y < height) {
            const intensity = await getPixelIntensity(imageBuffer, Math.round(x), Math.round(y));
            if (!isNaN(intensity)) {
                intensities.push(intensity);
            }
        }
    }
    return intensities;
}

// Helper function to count intercepts based on intensity changes
function countIntercepts(intensities, threshold = 10) {
    let intercepts = 0;
    if (intensities.length < 2) {
        return 0;
    }
    for (let i = 0; i < intensities.length - 1; i++) {
        if (Math.abs(intensities[i] - intensities[i + 1]) > threshold) {
            intercepts++;
        }
    }
    return intercepts;
}

//---new stuff
// Helper function to generate a random point within an ellipse
function getRandomPointInEllipse(centerX, centerY, radiusX, radiusY) {
    const r = Math.random();
    const theta = 2 * Math.PI * Math.random();
    const x = centerX + Math.sqrt(r) * radiusX * Math.cos(theta);
    const y = centerY + Math.sqrt(r) * radiusY * Math.sin(theta);
    return { x: Math.round(x), y: Math.round(y) };
}
//---

const userAnalysisResults = {};

// // Analyze Grain Size
// router.post('/grainsize', verifyToken, async (req, res) => {
//     try {
//         const { imageData, shapes, scale, units } = req.body;
//
//         if (!imageData || !shapes) {
//             return res.status(400).json({ error: 'Image data and shapes are required.' });
//         }
//
//         const preprocessedImageData = await preprocessImage(imageData);
//         const preprocessedBuffer = Buffer.from(preprocessedImageData, 'base64');
//
//         const analysisResults = [];
//
//         for (const shape of shapes) {
//             if (shape.type === 'line') {
//                 // Robust Line Intercept Method
//                 const pixelLength = calculatePixelDistance({ x: shape.startX, y: shape.startY }, { x: shape.endX, y: shape.endY });
//                 const realWorldLength = scale ? pixelLength * scale : pixelLength;
//
//                 const intensities = await sampleLineIntensities(preprocessedBuffer, shape.startX, shape.startY, shape.endX, shape.endY);
//                 const numberOfIntercepts = countIntercepts(intensities);
//
//                 let averageGrainSize = null;
//                 const grainUnit = units ? units : 'pixels';
//                 if (numberOfIntercepts > 0 && realWorldLength > 0) {
//                     averageGrainSize = realWorldLength / numberOfIntercepts;
//                 }
//
//                 analysisResults.push({
//                     id: shape.id,
//                     type: shape.type,
//                     pixelLength: pixelLength.toFixed(2),
//                     realWorldLength: realWorldLength.toFixed(3),
//                     unit: units || 'pixels',
//                     numberOfIntercepts: numberOfIntercepts,
//                     averageGrainSize: averageGrainSize ? averageGrainSize.toFixed(3) : null,
//                     grainUnit: grainUnit
//                 });
//             } else if (shape.type === 'ellipse') {
//                 // Circular Intercept Method (your existing implementation)
//                 const centerX = (shape.startX + shape.endX) / 2;
//                 const centerY = (shape.startY + shape.endY) / 2;
//                 const radiusX = Math.abs(shape.endX - shape.startX) / 2;
//                 const radiusY = Math.abs(shape.endY - shape.startY) / 2;
//                 const pixelArea = calculateEllipseArea(radiusX, radiusY);
//                 const realWorldArea = scale ? pixelArea * scale * scale : pixelArea;
//                 const perimeter = calculateEllipsePerimeter(radiusX, radiusY);
//                 const realWorldPerimeter = scale ? perimeter * scale : perimeter;
//
//                 let intercepts = 0;
//                 const numSamplesEllipse = 36; // Number of points to sample on the ellipse
//                 const rayLength = Math.max(radiusX, radiusY) * 0.2; // Length of the rays
//                 const numRays = 4; // Number of rays per sample point
//                 const intensityThresholdEllipse = 20; // Threshold for intensity change
//
//                 for (let i = 0; i < numSamplesEllipse; i++) {
//                     const angle = (2 * Math.PI * i) / numSamplesEllipse;
//                     const sampleX = centerX + radiusX * Math.cos(angle);
//                     const sampleY = centerY + radiusY * Math.sin(angle);
//
//                     for (let j = 0; j < numRays; j++) {
//                         const rayAngle = angle + (2 * Math.PI * j) / numRays;
//                         const endX = sampleX + rayLength * Math.cos(rayAngle);
//                         const endY = sampleY + rayLength * Math.sin(rayAngle);
//
//                         const startIntensity = await getPixelIntensity(preprocessedBuffer, Math.round(sampleX), Math.round(sampleY));
//                         const endIntensity = await getPixelIntensity(preprocessedBuffer, Math.round(endX), Math.round(endY));
//
//                         if (!isNaN(startIntensity) && !isNaN(endIntensity) && Math.abs(startIntensity - endIntensity) > intensityThresholdEllipse) {
//                             intercepts++;
//                         }
//                     }
//                 }
//
//                 let averageGrainSizeEllipse = null;
//                 const grainUnitEllipse = units ? units : 'pixels';
//                 if (intercepts > 0 && perimeter > 0) {
//                     const averageInterceptDistance = perimeter / intercepts;
//                     averageGrainSizeEllipse = scale ? averageInterceptDistance * scale : averageInterceptDistance;
//                 }
//
//                 analysisResults.push({
//                     id: shape.id,
//                     type: shape.type,
//                     pixelArea: pixelArea.toFixed(2),
//                     realWorldArea: realWorldArea.toFixed(3),
//                     perimeter: perimeter.toFixed(2),
//                     realWorldPerimeter: realWorldPerimeter.toFixed(3),
//                     unit: units ? units + '²' : 'pixels²',
//                     averageGrainSize: averageGrainSizeEllipse ? averageGrainSizeEllipse.toFixed(3) : null,
//                     grainUnit: grainUnitEllipse
//                 });
//             }
//         }
//
//         // Store the results for the current user
//         userAnalysisResults[req.userId] = analysisResults;
//
//         res.json(analysisResults);
//     } catch (error) {
//         console.error('Error during grain size analysis:', error);
//         res.status(500).json({ error: 'Error during grain size analysis', details: error.message });
//     }
// });

// Analyze Grain Size
router.post('/grainsize', verifyToken, async (req, res) => {
    try {
        const { imageData, shapes, scale, units } = req.body;

        console.log('Received scale value:', scale); // debug lines
        console.log('Received units value:', units);

        if (!imageData || !shapes) {
            return res.status(400).json({ error: 'Image data and shapes are required.' });
        }

        const preprocessedImageData = await preprocessImage(imageData, true);
        const preprocessedBuffer = Buffer.from(preprocessedImageData, 'base64');
        const metadata = await sharp(preprocessedBuffer).metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;

        const analysisResults = [];

        for (const shape of shapes) {
            if (shape.type === 'line') {
                // Robust Line Intercept Method
                const pixelLength = calculatePixelDistance({ x: shape.startX, y: shape.startY }, { x: shape.endX, y: shape.endY });
                const realWorldLength = scale ? pixelLength * scale : pixelLength;

                const intensities = await sampleLineIntensities(preprocessedBuffer, shape.startX, shape.startY, shape.endX, shape.endY);
                const numberOfIntercepts = countIntercepts(intensities);

                let averageGrainSize = null;
                const grainUnit = units ? units : 'pixels';
                if (numberOfIntercepts > 0 && realWorldLength > 0) {
                    averageGrainSize = realWorldLength / numberOfIntercepts;
                }

                analysisResults.push({
                    id: shape.id,
                    type: shape.type,
                    pixelLength: pixelLength.toFixed(2),
                    realWorldLength: realWorldLength.toFixed(3),
                    unit: units || 'pixels',
                    numberOfIntercepts: numberOfIntercepts,
                    averageGrainSize: averageGrainSize ? averageGrainSize.toFixed(3) : null,
                    grainUnit: grainUnit
                });
            } else if (shape.type === 'ellipse') {
                // Heyn's Intercept Method (Area-Based)
                const centerX = (shape.startX + shape.endX) / 2;
                const centerY = (shape.startY + shape.endY) / 2;
                const radiusX = Math.abs(shape.endX - shape.startX) / 2;
                const radiusY = Math.abs(shape.endY - shape.startY) / 2;
                const pixelArea = calculateEllipseArea(radiusX, radiusY);
                const realWorldArea = scale ? pixelArea * scale * scale : pixelArea;

                console.log(`Ellipse ${shape.id} - Pixel Area:`, pixelArea);
                console.log(`Ellipse ${shape.id} - Real World Area:`, realWorldArea);

                const numRandomLines = 100; // Number of random lines to cast within the ellipse
                let totalIntercepts = 0;
                let totalLineLength = 0;
                const intensityThresholdHeyn = 45; //30 seems about good?

                for (let i = 0; i < numRandomLines; i++) {
                    // Generate two random points within the ellipse
                    const point1 = getRandomPointInEllipse(centerX, centerY, radiusX, radiusY);
                    const point2 = getRandomPointInEllipse(centerX, centerY, radiusX, radiusY);

                    // Ensure the points are within the image boundaries (important!)
                    if (
                        point1.x >= 0 && point1.x < imageWidth && point1.y >= 0 && point1.y < imageHeight &&
                        point2.x >= 0 && point2.x < imageWidth && point2.y >= 0 && point2.y < imageHeight
                    ) {
                        const lineLength = calculatePixelDistance(point1, point2);
                        const intensities = await sampleLineIntensities(preprocessedBuffer, point1.x, point1.y, point2.x, point2.y);
                        const numberOfInterceptsOnLine = countIntercepts(intensities, intensityThresholdHeyn);

                        totalIntercepts += numberOfInterceptsOnLine;
                        totalLineLength += lineLength;
                    }
                }

                let meanInterceptLength = null;
                let averageGrainSizeHeyn = null;
                const grainUnitHeyn = units ? units : 'pixels';

                if (totalIntercepts > 0 && totalLineLength > 0) {
                    meanInterceptLength = totalLineLength / totalIntercepts;
                    const meanInterceptLengthScaled = scale ? meanInterceptLength * scale : meanInterceptLength;
                    averageGrainSizeHeyn = 1.5 * meanInterceptLengthScaled;
                }

                console.log(`Ellipse ${shape.id} - Total Line Length (pixels):`, totalLineLength);
                console.log(`Ellipse ${shape.id} - Mean Intercept Length (pixels):`, meanInterceptLength);
                console.log(`Ellipse ${shape.id} - Scale:`, scale);
                console.log(`Ellipse ${shape.id} - Average Grain Size (microns):`, averageGrainSizeHeyn);

                analysisResults.push({
                    id: shape.id,
                    type: shape.type,
                    pixelArea: pixelArea.toFixed(2),
                    realWorldArea: realWorldArea.toFixed(3),
                    unit: units ? units + '²' : 'pixels²',
                    totalIntercepts: totalIntercepts,
                    totalLineLength: totalLineLength.toFixed(2),
                    meanInterceptLength: meanInterceptLength ? meanInterceptLength.toFixed(3) : null,
                    averageGrainSize: averageGrainSizeHeyn ? averageGrainSizeHeyn.toFixed(3) : null,
                    grainUnit: grainUnitHeyn
                });
            }
        }

        // Store the results for the current user
        userAnalysisResults[req.userId] = analysisResults;

        res.json(analysisResults);
    } catch (error) {
        console.error('Error during grain size analysis (Heyn\'s):', error);
        res.status(500).json({ error: 'Error during grain size analysis', details: error.message });
    }
});

// Export Data Route
router.get('/export/data', verifyToken, async (req, res) => {
    const userId = req.userId;
    const results = userAnalysisResults[userId];

    if (results) {
        res.json(results);
    } else {
        res.status(404).json({ message: 'No analysis data found for this user.' });
    }
});

module.exports = router;