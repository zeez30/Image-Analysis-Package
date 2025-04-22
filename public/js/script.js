// Import functions and elements from other modules
import { setupCalibrationCanvas, calibrateImage, resetPoints, resetPointsButton, calibrateButton } from './calibration.js';
import { registerButton, loginButton, logoutButton, register, login, logout, updateUI } from './auth.js';
import { loadImage } from './imageSaveLoad.js';
// Import button event listeners
import './buttonHandlers.js';

// Export Data Elements
const exportDataButton = document.getElementById('exportDataButton');
const exportedDataDisplay = document.getElementById('exportedDataDisplay');

// Function to fetch and display exported data
async function fetchExportedData() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/export/data', { // Replace with your actual backend endpoint
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Format the data for display (you might need to adjust this based on your data structure)
                const formattedData = formatDataForDisplay(data);
                exportedDataDisplay.textContent = formattedData;
                exportDataButton.style.display = 'block'; // Show the download button
                // Store the data for download later
                exportedDataDisplay.dataset.exportedData = JSON.stringify(data);
            } else {
                const errorData = await response.json();
                exportedDataDisplay.textContent = `Error fetching data: ${errorData.message || response.statusText}`;
                exportDataButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching export data:', error);
            exportedDataDisplay.textContent = 'An error occurred while fetching the data.';
            exportDataButton.style.display = 'none';
        }
    } else {
        exportedDataDisplay.textContent = 'Please log in to export data.';
        exportDataButton.style.display = 'none';
    }
}

// Helper function to format data for display (adjust as needed)
function formatDataForDisplay(data) {
    if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join('\t') + '\n';
        const rows = data.map(item => Object.values(item).join('\t')).join('\n');
        return headers + rows;
    } else if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2); // Pretty print JSON
    } else {
        return String(data);
    }
}

// Function to trigger CSV download
function downloadCSV() {
    const data = exportedDataDisplay.dataset.exportedData;
    if (data) {
        const jsonData = JSON.parse(data);
        const csvString = convertJsonToCsv(jsonData);
        downloadFile(csvString, 'exported_data.csv', 'text/csv;charset=utf-8;');
    } else {
        alert('No data to download.');
    }
}

// Helper function to convert JSON to CSV
function convertJsonToCsv(jsonData) {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return "";
    }

    const headers = Object.keys(jsonData[0]).join(',');
    const rows = jsonData.map(item => Object.values(item).join(',')).join('\n');

    return headers + '\n' + rows;
}

// Helper function to trigger file download
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
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

exportDataButton.addEventListener('click', downloadCSV);
// Initial UI Update
updateUI();

// Load saved image when page loads
loadImage();

// Initial setup for the calibration canvas
setupCalibrationCanvas();