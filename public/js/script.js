// Import functions and elements from other modules
import { setupCalibrationCanvas, calibrateImage, resetPoints, resetPointsButton, calibrateButton } from './calibration.js';
import { registerButton, loginButton, logoutButton, register, login, logout, updateUI } from './auth.js';
import { loadImage } from './imageSaveLoad.js';
import {downloadCSV, exportDataButton, fetchExportedData} from './dataExport.js';
//NOTE: fetchExportedData is not functional yet as there is no API route file or backend file to connect it to

// Import button event listeners
import './buttonHandlers.js';

// Import drawing tools functionality
import './drawingTools.js';

// Event Listeners
if (calibrateButton) {
    calibrateButton.addEventListener('click', calibrateImage);
}

if (resetPointsButton) {
    resetPointsButton.addEventListener('click', resetPoints);
}

if (registerButton) {
    registerButton.addEventListener('click', register);
}

if (loginButton) {
    loginButton.addEventListener('click', login);
}

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

if (exportDataButton) {
    exportDataButton.addEventListener('click', downloadCSV);
}
// Initial UI Update
updateUI();

// Load saved image when page loads
loadImage();

// Initial setup for the calibration canvas
setupCalibrationCanvas();