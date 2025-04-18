
// Calibration Elements
export const knownDistanceInput = document.getElementById('knownDistance');
export const unitsInput = document.getElementById('units');
export const resetPointsButton = document.getElementById('resetPointsButton');
export const calibrateButton = document.getElementById('calibrateButton');
export const calibrationInfo = document.getElementById('calibrationInfo');
export const calibrationCanvas = document.getElementById('calibrationCanvas');
const ctx = calibrationCanvas.getContext('2d');

export let point1 = null;
export let point2 = null;
export let pixelDistance = null;
export let calibrationFactor = null;

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
    }
}

export function calibrateImage() {
    if (point1 && point2) {
        const knownDistance = parseFloat(knownDistanceInput.value);
        const units = unitsInput.value.trim();

        if (isNaN(knownDistance) || knownDistance <= 0 || !units) {
            alert("Please enter a valid known distance and units.");
            return;
        }

        const pixelDistance = calculatePixelDistance();

        if (pixelDistance) {
            calibrationFactor = knownDistance / pixelDistance; // Units per pixel
            calibrationInfo.textContent = `Calibration Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`;
            alert(`Calibration successful! Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`);
            localStorage.setItem('calibrationFactor', calibrationFactor);
            localStorage.setItem('calibrationUnits', units);
        } else {
            alert("Please select two points on the image first.");
        }
    } else {
        alert("Please select two points on the image first.");
    }
}

export function resetPoints() {
    point1 = null;
    point2 = null;
    pixelDistance = null;
    calibrationFactor = null;
    calibrationInfo.textContent = '';
    redrawCanvas();
}

function calculatePixelDistance() {
    if (point1 && point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        pixelDistance = Math.sqrt(dx * dx + dy * dy);
        return pixelDistance;
    }
    return null;
}

export function setupCalibrationCanvas() {
    redrawCanvas(); // Call redrawCanvas to handle initial setup or image change
    calibrationCanvas.addEventListener('click', handleCanvasClick);
}