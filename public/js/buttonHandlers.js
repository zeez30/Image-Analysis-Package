import { saveImage } from './imageSaveLoad.js';
import { fileInput } from './imageUpload.js';
import { calibrationCanvas } from './calibration.js';
import { originalImageDataURL } from './imageUtils.js';
import { fetchExportedData, downloadCSV, exportDataButton } from './dataExport.js';
//NOTE: Need to implement API route and file to connect with backend once functional

// Button Elements
const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');
const cropButton = document.getElementById('cropButton');
const cropDropdownContainer = document.getElementById('cropDropdownContainer');
const cropDropdownContent = document.getElementById('cropDropdownContent');
const performCropButton = document.getElementById('performCrop');
const currentImageWidthDisplay = document.getElementById('currentImageWidth');
const currentImageHeightDisplay = document.getElementById('currentImageHeight');
const rotateButton = document.getElementById('rotateButton');
const rotateDropdownContainer = document.getElementById('rotateDropdownContainer');
const rotateDropdownContent = document.getElementById('rotateDropdownContent');
const rotateLeftButton = document.getElementById('rotateLeft');
const rotateRightButton = document.getElementById('rotateRight');
const brightnessButton = document.getElementById('brightnessButton');
const brightnessDropdownContainer = document.getElementById('brightnessDropdownContainer');
const brightnessDropdownContent = document.getElementById('brightnessDropdownContent');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValueDisplay = document.getElementById('brightnessValue');
// let originalImageDataURL = null;

// Button Functionality
loadButton.addEventListener('click', (e) => {
    fileInput.click();
});

saveButton.addEventListener('click', saveImage);

// Toggle Crop Dropdown
cropButton.addEventListener('click', (e) => {
    e.stopPropagation();
    cropDropdownContent.style.display = cropDropdownContent.style.display === 'block' ? 'none' : 'block';
    if (calibrationCanvas) {
        currentImageWidthDisplay.textContent = `Width: ${calibrationCanvas.width}px`;
        currentImageHeightDisplay.textContent = `Height: ${calibrationCanvas.height}px`;
    } else {
        currentImageWidthDisplay.textContent = `Width: -`;
    }
});

// Toggle Rotate Dropdown
rotateButton.addEventListener('click', (e) => {
    e.stopPropagation();
    rotateDropdownContent.style.display = rotateDropdownContent.style.display === 'block' ? 'none' : 'block';
});

// Toggle Brightness Dropdown
brightnessButton.addEventListener('click', (e) => {
    e.stopPropagation();
    brightnessDropdownContent.style.display = brightnessDropdownContent.style.display === 'block' ? 'none' : 'block';
});

// Close dropdowns if clicked outside
window.addEventListener('click', (e) => {
    if (cropDropdownContent.style.display === 'block' && !cropDropdownContainer.contains(e.target)) {
        cropDropdownContent.style.display = 'none';
    }
    if (rotateDropdownContent.style.display === 'block' && !rotateDropdownContainer.contains(e.target)) {
        rotateDropdownContent.style.display = 'none';
    }
    if (brightnessDropdownContent.style.display === 'block' && !brightnessDropdownContainer.contains(e.target)) {
        brightnessDropdownContent.style.display = 'none';
    }
});

// Perform Crop Action
performCropButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const xValue = parseInt(document.getElementById('cropX').value);
    const yValue = parseInt(document.getElementById('cropY').value);
    const heightValue = parseInt(document.getElementById('cropHeight').value);
    const widthValue = parseInt(document.getElementById('cropWidth').value);

    if (isNaN(xValue) || isNaN(yValue) || isNaN(heightValue) || isNaN(widthValue) ||
        xValue < 0 || yValue < 0 || heightValue <= 0 || widthValue <= 0) {
        alert('Please enter valid positive numbers for the crop coordinates and dimensions.');
        return;
    }

    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) {
        console.error('Calibration canvas or original image not found.');
        alert('Error: Canvas or original image not loaded.');
        return;
    }

    try {
        const response = await fetch('/api/manipulate/cropImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x: xValue,
                y: yValue,
                height: heightValue,
                width: widthValue,
                imageData: originalImageDataURL,
            }),
        });

        if (response.ok) {
            const croppedBlob = await response.blob();
            const croppedImageURL = URL.createObjectURL(croppedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(croppedImageURL);
                cropDropdownContent.style.display = 'none';
                console.log('Image cropping and upload to canvas successful!');
                originalImageDataURL = canvas.toDataURL('image/png');
            };
            img.src = croppedImageURL;
        } else {
            const errorData = await response.json();
            console.error('Image cropping failed:', errorData.error || 'Unknown error');
            alert(`Image cropping failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending crop request:', error);
        alert('Error sending crop request.');
    }
});

// Perform Rotate
rotateRightButton.addEventListener('click', async () => {
    await rotateCanvas(-90);
});

rotateLeftButton.addEventListener('click', async () => {
    await rotateCanvas(90);
});

async function rotateCanvas(degrees) {
    const canvas = calibrationCanvas;
    if (!canvas) {
        console.error('Calibration canvas not found.');
        alert('Error: Canvas not found.');
        return;
    }

    const imageDataURL = canvas.toDataURL('image/png');
    try {
        const response = await fetch('/api/manipulate/rotateImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                degrees: degrees,
                imageData: imageDataURL,
            }),
        });

        if (response.ok) {
            const rotatedBlob = await response.blob();
            const rotatedImageURL = URL.createObjectURL(rotatedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Clear the canvas before drawing the rotated image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(rotatedImageURL);
                rotateDropdownContent.style.display = 'none';
                console.log(`Image rotated by ${degrees} degrees.`);
                originalImageDataURL = rotatedImageURL;
            };
            img.src = rotatedImageURL;
        } else {
            const errorData = await response.json();
            console.error('Image rotation failed:', errorData.error || 'Unknown error');
            alert(`Image rotation failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending rotation request:', error);
        alert('Error sending rotation request.');
    }
}

// Brightness Slider Event Listener
brightnessSlider.addEventListener('input', async () => {
    const brightnessValue = parseFloat(brightnessSlider.value);
    brightnessValueDisplay.textContent = parseFloat(brightnessValue).toFixed(1);
    await adjustBrightness(brightnessValue);
});

async function adjustBrightness(brightness) {
    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) {
        console.error('Canvas or original image not found.');
        alert('Error: Canvas or original image not loaded.');
        return;
    }

    try {
        const response = await fetch('/api/manipulate/adjustBrightness', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                brightness: brightness,
                imageData: originalImageDataURL,
            }),
        });

        if (response.ok) {
            const adjustedBlob = await response.blob();
            const adjustedImageURL = URL.createObjectURL(adjustedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(adjustedImageURL);
                console.log(`Image brightness adjusted to ${brightness}.`);
                originalImageDataURL = canvas.toDataURL('image/png');
            };
            img.src = adjustedImageURL;
        } else {
            const errorData = await response.json();
            console.error('Brightness adjustment failed:', errorData.error || 'Unknown error');
            alert(`Brightness adjustment failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending brightness request:', error);
        alert('Error sending brightness request.');
    }
}