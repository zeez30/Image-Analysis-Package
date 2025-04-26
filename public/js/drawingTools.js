// Import necessary elements from other modules if needed
import { calibrationCanvas, calibrationFactor, units as calibrationUnits } from './calibration.js';

// Get references to the toolbar buttons
const lineToolButton = document.getElementById('lineToolButton');
const ellipseToolButton = document.getElementById('ellipseToolButton');

// Get references to the canvases
const drawingCanvas = document.getElementById('drawingCanvas');
const drawingCtx = drawingCanvas.getContext('2d');

// State variables for drawing
let currentTool = null; // Keep track of the active tool
let drawing = false;
let startX, startY;
let endX, endY;
let drawnShapes = [];
let shapeCounter = 0;

const analyzeGrainSizeButton = document.getElementById('analyzeGrainSizeButton');

if (analyzeGrainSizeButton) {
    analyzeGrainSizeButton.addEventListener('click', async () => {
        console.log('Analyze Grain Size button clicked');
        await initiateGrainSizeAnalysis();
    });
}

async function initiateGrainSizeAnalysis() {
    if (!drawnShapes.length) {
        alert('Please draw some lines or ellipses before analysis.');
        return;
    }

    const canvas = document.getElementById('calibrationCanvas');
    if (!canvas) {
        alert('Calibration canvas not found.');
        return;
    }
    const imageDataURL = canvas.toDataURL('image/png'); // Or however your image is best represented

    const analysisData = {
        imageData: imageDataURL,
        shapes: drawnShapes,
        scale: calibrationFactor,
        units: calibrationUnits
    };

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to perform analysis.');
        return;
    }

    try {
        const response = await fetch('/api/analyze/grainsize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(analysisData)
        });

        if (response.ok) {
            const results = await response.json();
            console.log('Grain size analysis results:', results);
            displayAnalysisResults(results);
        } else {
            const errorData = await response.json();
            console.error('Grain size analysis failed:', errorData.error || 'Unknown error');
            alert(`Grain size analysis failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending analysis request:', error);
        alert('Error sending analysis request.');
    }
}

// function displayAnalysisResults(results) {
//     const exportedDataDisplay = document.getElementById('exportedDataDisplay');
//     if (!exportedDataDisplay) {
//         console.error('exportedDataDisplay element not found.');
//         return;
//     }
//     exportedDataDisplay.innerHTML = ''; // Clear previous results
//
//     if (results && results.length > 0) {
//         let outputHTML = '<h3>Analysis Results:</h3><ul>';
//         results.forEach(result => {
//             if (result.type === 'line') {
//                 outputHTML += `<li>Line ${result.id}: Length = ${result.realWorldLength ? Number(result.realWorldLength).toFixed(3) + ' ' + result.unit : 'N/A'}</li>`;
//             } else if (result.type === 'ellipse') {
//                 const realWorldArea = Number(result.realWorldArea);
//                 const realWorldPerimeter = Number(result.realWorldPerimeter);
//                 const averageGrainSize = result.averageGrainSize ? Number(result.averageGrainSize) : null;
//
//                 outputHTML += `<li>Ellipse ${result.id}: Area = ${isNaN(realWorldArea) ? 'N/A' : realWorldArea.toFixed(3) + ' ' + result.unit}`;
//                 outputHTML += `, Perimeter = ${isNaN(realWorldPerimeter) ? 'N/A' : realWorldPerimeter.toFixed(3)} ${result.unit.slice(0, -1)}`; // Assuming unit for perimeter is the base unit
//                 if (averageGrainSize !== null) {
//                     outputHTML += `, Avg. Grain Size = ${averageGrainSize.toFixed(3) + ' ' + result.grainUnit}`;
//                 }
//                 outputHTML += `</li>`;
//             }
//         });
//         outputHTML += '</ul>';
//         exportedDataDisplay.innerHTML = outputHTML;
//     } else {
//         exportedDataDisplay.textContent = 'No analysis results received.';
//     }
// }

function displayAnalysisResults(results) {
    const exportedDataDisplay = document.getElementById('exportedDataDisplay');
    if (!exportedDataDisplay) {
        console.error('exportedDataDisplay element not found.');
        return;
    }
    exportedDataDisplay.innerHTML = ''; // Clear previous results

    if (results && results.length > 0) {
        let outputHTML = '<h3>Analysis Results:</h3><ul>';
        results.forEach(result => {
            if (result.type === 'line') {
                const grainSize = result.averageGrainSize ? Number(result.averageGrainSize) : null;
                outputHTML += `<li>Line ${result.id}: Length = ${result.realWorldLength ? Number(result.realWorldLength).toFixed(3) + ' ' + result.unit : 'N/A'}`;
                if (grainSize !== null) {
                    outputHTML += `, Avg. Grain Size = ${grainSize.toFixed(3) + ' ' + result.grainUnit}`;
                }
                outputHTML += `</li>`;
            } else if (result.type === 'ellipse') {
                const realWorldArea = Number(result.realWorldArea);
                const realWorldPerimeter = Number(result.realWorldPerimeter);
                const averageGrainSize = result.averageGrainSize ? Number(result.averageGrainSize) : null;

                outputHTML += `<li>Ellipse ${result.id}: Area = ${isNaN(realWorldArea) ? 'N/A' : realWorldArea.toFixed(3) + ' ' + result.unit}`;
                outputHTML += `, Perimeter = ${isNaN(realWorldPerimeter) ? 'N/A' : realWorldPerimeter.toFixed(3)} ${result.unit.slice(0, -1)}`; // Assuming unit for perimeter is the base unit
                if (averageGrainSize !== null) {
                    outputHTML += `, Avg. Grain Size = ${averageGrainSize.toFixed(3) + ' ' + result.grainUnit}`;
                }
                outputHTML += `</li>`;
            }
        });
        outputHTML += '</ul>';
        exportedDataDisplay.innerHTML = outputHTML;
    } else {
        exportedDataDisplay.textContent = 'No analysis results received.';
    }
}

// Function to update button appearance
function updateButtonAppearance(activeButton) {
    if (lineToolButton) {
        lineToolButton.classList.remove('active');
    }
    if (ellipseToolButton) {
        ellipseToolButton.classList.remove('active');
    }
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Function to resize the drawing canvas
function resizeDrawingCanvas() {
    if (calibrationCanvas) {
        drawingCanvas.width = calibrationCanvas.width;
        drawingCanvas.height = calibrationCanvas.height;
        redrawDrawingCanvas(); // Redraw shapes after resizing
    } else {
        drawingCanvas.width = 0;
        drawingCanvas.height = 0;
    }
}

// Call resizeDrawingCanvas initially
resizeDrawingCanvas();

// Listen for changes in the calibration canvas dimensions (e.g., when a new image is loaded)
const calibrationCanvasObserver = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'width' || mutation.attributeName === 'height')) {
            resizeDrawingCanvas();
        }
    }
});

if (calibrationCanvas) {
    calibrationCanvasObserver.observe(calibrationCanvas, { attributes: true });
}

// Event listeners for tool selection
if (lineToolButton) {
    lineToolButton.addEventListener('click', () => {
        if (currentTool === 'line') {
            currentTool = null;
            updateButtonAppearance(null);
            drawingCanvas.style.pointerEvents = 'none'; // Disable drawing interaction
            console.log('Line tool turned off');
        } else {
            currentTool = 'line';
            updateButtonAppearance(lineToolButton);
            drawingCanvas.style.pointerEvents = 'auto'; // Enable drawing interaction
            console.log('Line tool selected');
        }
    });
}

if (ellipseToolButton) {
    ellipseToolButton.addEventListener('click', () => {
        if (currentTool === 'ellipse') {
            currentTool = null;
            updateButtonAppearance(null);
            drawingCanvas.style.pointerEvents = 'none'; // Disable drawing interaction
            console.log('Ellipse tool turned off');
        } else {
            currentTool = 'ellipse';
            updateButtonAppearance(ellipseToolButton);
            drawingCanvas.style.pointerEvents = 'auto'; // Enable drawing interaction
            console.log('Ellipse tool selected');
        }
    });
}

// Event listeners for drawing on the canvas
if (drawingCanvas) {
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', trackDrawing);
    drawingCanvas.addEventListener('mouseup', endDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    if (!currentTool) return;
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
}

function trackDrawing(e) {
    if (!drawing || !currentTool) return;
    endX = e.offsetX;
    endY = e.offsetY;
    redrawDrawingCanvas();
    if (currentTool === 'line') {
        drawLine(startX, startY, endX, endY);
    } else if (currentTool === 'ellipse') {
        drawEllipse(startX, startY, endX, endY);
    }
}

function endDrawing() {
    if (!drawing || !currentTool) return;
    drawing = false;

    if (currentTool === 'line') {
        const newLine = { id: ++shapeCounter, type: 'line', startX, startY, endX, endY };
        drawnShapes.push(newLine);
    } else if (currentTool === 'ellipse') {
        const newEllipse = { id: ++shapeCounter, type: 'ellipse', startX, startY, endX, endY };
        drawnShapes.push(newEllipse);
    }
    redrawDrawingCanvas();
}

function stopDrawing() {
    drawing = false;
}

function drawLine(x1, y1, x2, y2) {
    drawingCtx.beginPath();
    drawingCtx.moveTo(x1, y1);
    drawingCtx.lineTo(x2, y2);
    drawingCtx.strokeStyle = 'black';
    drawingCtx.lineWidth = 2;
    drawingCtx.stroke();
}

function drawEllipse(x1, y1, x2, y2) {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs(x2 - x1) / 2;
    const radiusY = Math.abs(y2 - y1) / 2;
    drawingCtx.beginPath();
    drawingCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    drawingCtx.strokeStyle = 'black';
    drawingCtx.lineWidth = 2;
    drawingCtx.stroke();
}

// Resets drawing tools canvas
function redrawDrawingCanvas() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawnShapes.forEach(shape => {
        if (shape.type === 'line') {
            drawLine(shape.startX, shape.startY, shape.endX, shape.endY);
        } else if (shape.type === 'ellipse') {
            drawEllipse(shape.startX, shape.startY, shape.endX, shape.endY);
        }
    });
}

// Export the redrawDrawingCanvas function in case other modules need to trigger a redraw
export { redrawDrawingCanvas };