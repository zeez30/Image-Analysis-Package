
// Calibration Elements
export const knownDistanceInput = document.getElementById('knownDistance');
export const unitsInput = document.getElementById('units');
export const resetPointsButton = document.getElementById('resetPointsButton');
export const calibrateButton = document.getElementById('calibrateButton');
export const calibrationInfo = document.getElementById('calibrationInfo');
export const calibrationCanvas = document.getElementById('calibrationCanvas');
const ctx = calibrationCanvas.getContext('2d');
const drawCalibrationPointsButton = document.getElementById('drawCalibrationPointsButton');

export let point1 = null;
export let point2 = null;
export let pixelDistance = null;
let calibrationFactor = null; //tweaked to not export it initially
let isDrawingCalibrationPoints = false;
let exportedUnits = ''; // Variable to hold the units for export
export let calibrationUnits = 'µm'; // Declare and initialize calibrationUnits

import { redrawCanvas } from './imageUtils.js';

export function drawPoint(point, color) {
    if (point && ctx) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

function handleCanvasClick(event) {
    if (isDrawingCalibrationPoints) {
        const rect = calibrationCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const scaleX = calibrationCanvas.width / rect.width;
        const scaleY = calibrationCanvas.height / rect.height;

        const adjustedX = x * scaleX;
        const adjustedY = y * scaleY;

        if (!point1) {
            point1 = { x: adjustedX, y: adjustedY };
            drawPoint(point1, 'red');
        } else if (!point2) {
            point2 = { x: adjustedX, y: adjustedY };
            drawPoint(point2, 'blue');
            // Turn off drawing mode and reset button after drawing the second point
            isDrawingCalibrationPoints = false;
            drawCalibrationPointsButton.textContent = 'Draw Points';
            calibrationCanvas.style.cursor = 'default';
        }
    }
}

// export function calibrateImage() {
//     if (point1 && point2) {
//         const knownDistance = parseFloat(knownDistanceInput.value);
//         const units = unitsInput.value.trim();
//
//         if (isNaN(knownDistance) || knownDistance <= 0 || !units) {
//             alert("Please enter a valid known distance and units.");
//             return;
//         }
//
//         const pixelDistance = calculatePixelDistance();
//
//         if (pixelDistance) {
//             calibrationFactor = knownDistance / pixelDistance; // Units per pixel
//             calibrationInfo.textContent = `Calibration Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`;
//             alert(`Calibration successful! Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`);
//             localStorage.setItem('calibrationFactor', calibrationFactor);
//             localStorage.setItem('calibrationUnits', units);
//             exportedUnits = units; // Capture the units for export
//         } else {
//             alert("Please select two points on the image first.");
//         }
//     } else {
//         alert("Please select two points on the image first.");
//     }
// }

function calculatePixelDistance(p1, p2) {
    if (p1 && p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    return 0;
}

export function calibrateImage() {
    if (!point1 || !point2 || !calibrationCanvas) {
        alert('Please select two points on the image.');
        return;
    }

    const knownDistanceInput = document.getElementById('knownDistance');
    const unitsDropdown = document.getElementById('unitsDropdown');
    const calibrationInfo = document.getElementById('calibrationInfo');

    if (!knownDistanceInput || !unitsDropdown || !calibrationInfo) {
        console.error('Calibration input elements not found.');
        return;
    }

    const knownDistance = parseFloat(knownDistanceInput.value);
    const selectedUnit = unitsDropdown.value; // Get the selected value from the dropdown

    if (isNaN(knownDistance) || knownDistance <= 0) {
        alert('Please enter a valid positive known distance.');
        return;
    }

    pixelDistance = calculatePixelDistance(point1, point2); // Use the local calculatePixelDistance function

    if (pixelDistance === 0) {
        alert('The two calibration points cannot be the same.');
        return;
    }

    calibrationFactor = knownDistance / pixelDistance;

    let unitDisplay;
    if (selectedUnit === 'microns') {
        unitDisplay = '\u03BC';
        calibrationUnits = 'µm';
    } else {
        unitDisplay = selectedUnit;
        calibrationUnits = selectedUnit;
    }

    calibrationInfo.innerHTML = `Scaling Factor: 1 pixel = ${(calibrationFactor).toFixed(5)} ${unitDisplay} per pixel`; // More accurate display

    // Store calibration data in localStorage
    localStorage.setItem('calibrationFactor', calibrationFactor);
    localStorage.setItem('calibrationUnits', calibrationUnits);

    alert(`Calibration applied. 1 pixel = ${(calibrationFactor).toFixed(5)} ${unitDisplay} per pixel`);

    resetPoints();
}

export function resetPoints() {
    isDrawingCalibrationPoints = false; // Disable calibration point drawing on reset
    drawCalibrationPointsButton.textContent = 'Draw Points'; // Ensure button text is correct
    calibrationCanvas.style.cursor = 'default'; // Reset cursor
    point1 = null;
    point2 = null;
    pixelDistance = null;
    calibrationFactor = null;
    calibrationInfo.textContent = '';
    exportedUnits = ''; // Reset exported units
    redrawCanvas();
}

// function calculatePixelDistance() {
//     if (point1 && point2) {
//         const dx = point2.x - point1.x;
//         const dy = point2.y - point1.y;
//         pixelDistance = Math.sqrt(dx * dx + dy * dy);
//         return pixelDistance;
//     }
//     return null;
// }

// export function setupCalibrationCanvas() {
//     redrawCanvas(); // Call redrawCanvas to handle initial setup or image change
//     calibrationCanvas.addEventListener('click', handleCanvasClick);
// }

export function setupCalibrationCanvas() {
    redrawCanvas(); // Call redrawCanvas to handle initial setup or image change
    calibrationCanvas.addEventListener('click', handleCanvasClick);
    calibrationCanvas.style.cursor = 'default';
    drawCalibrationPointsButton.addEventListener('click', () => {
        isDrawingCalibrationPoints = !isDrawingCalibrationPoints; // Toggle the state
        drawCalibrationPointsButton.textContent = isDrawingCalibrationPoints ? 'Stop Drawing Points' : 'Draw Points'; // Update button text
        calibrationCanvas.style.cursor = isDrawingCalibrationPoints ? 'crosshair' : 'default';
    });
}

export { calibrationFactor, exportedUnits as units }; //NOTE: unused export will cause js to not work