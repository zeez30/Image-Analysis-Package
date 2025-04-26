import { saveImage } from './imageSaveLoad.js';
import { fileInput } from './imageUpload.js';
import { calibrationCanvas } from './calibration.js';
// import { originalImageDataURL } from './imageUtils.js';
// import * as ImageUtils from './imageUtils.js';
import {originalImageDataURL, setOriginalImageDataURL} from './imageUtils.js';

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
const brightnessDropdown = document.getElementById('brightnessDropdown');

const toggleGreyscaleCheckbox = document.getElementById('greyscaleToggle');
const sharpnessSlider = document.getElementById('sharpnessSlider');
const sharpnessValueDisplay = document.getElementById('sharpnessValue');
const smoothingSlider = document.getElementById('smoothingSlider');
const smoothingValueDisplay = document.getElementById('smoothingValue');


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
    if (!canvas || !originalImageDataURL) { // Access using the module
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
                imageData: originalImageDataURL, // Access using the module
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
                setOriginalImageDataURL(canvas.toDataURL('image/png')); // Use the setter
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
                setOriginalImageDataURL(rotatedImageURL); // Use the setter
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

// Brightness Dropdown Event Listener
brightnessDropdown.addEventListener('change', async () => {
    const brightnessValue = parseFloat(brightnessDropdown.value);
    await adjustBrightness(brightnessValue);
});

async function adjustBrightness(brightness) {
    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) { // Access using the module
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
                imageData: originalImageDataURL, // Access using the module
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

// Greyscale Checkbox Event Listener
toggleGreyscaleCheckbox.addEventListener('change', async () => {
    const greyscale = toggleGreyscaleCheckbox.checked;
    await applyGreyscale(greyscale);
});

async function applyGreyscale(greyscale) {
    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) {
        console.error('Canvas or original image not found.');
        alert('Error: Canvas or original image not loaded.');
        return;
    }

    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    try {
        const response = await fetch('/api/manipulate/greyscale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
            },
            body: JSON.stringify({
                greyscale: greyscale,
                imageData: originalImageDataURL,
            }),
        });

        if (response.ok) {
            const processedBlob = await response.blob();
            const processedImageURL = URL.createObjectURL(processedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(processedImageURL);
                console.log(`Greyscale applied: ${greyscale}`);
                setOriginalImageDataURL(canvas.toDataURL('image/png'));
            };
            img.src = processedImageURL;
        } else if (response.status === 401) {
            console.error('Greyscale request unauthorized. Please log in.');
            alert('Unauthorized: Please log in to perform this action.');
            // Optionally, redirect the user to the login page
        } else {
            const errorText = await response.text(); // Get the error message as text
            console.error('Greyscale application failed:', errorText || 'Unknown error');
            alert(`Greyscale application failed: ${errorText || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending greyscale request:', error);
        alert('Error sending greyscale request.');
    }
}

// Sharpness Slider Event Listener
sharpnessSlider.addEventListener('input', async () => {
    const sharpnessValue = parseFloat(sharpnessSlider.value);
    sharpnessValueDisplay.textContent = sharpnessValue.toFixed(1);
    await applySharpness(sharpnessValue);
});

async function applySharpness(sharpness) {
    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) {
        console.error('Canvas or original image not found.');
        alert('Error: Canvas or original image not loaded.');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/manipulate/sharpen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token
            },
            body: JSON.stringify({
                sharpness: sharpness,
                imageData: originalImageDataURL,
            }),
        });

        if (response.ok) {
            const processedBlob = await response.blob();
            const processedImageURL = URL.createObjectURL(processedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(processedImageURL);
                console.log(`Sharpness applied: ${sharpness}`);
                setOriginalImageDataURL(canvas.toDataURL('image/png'));
            };
            img.src = processedImageURL;
        } else if (response.status === 401) {
            console.error('Sharpness request unauthorized. Please log in.');
            alert('Unauthorized: Please log in to perform this action.');
        } else {
            const errorText = await response.text();
            console.error('Sharpness application failed:', errorText || 'Unknown error');
            alert(`Sharpness application failed: ${errorText || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending sharpness request:', error);
        alert('Error sending sharpness request.');
    }
}

// Smoothing Slider Event Listener
smoothingSlider.addEventListener('input', async () => {
    const smoothingValue = parseInt(smoothingSlider.value);
    smoothingValueDisplay.textContent = smoothingValue.toString();
    await applySmoothing(smoothingValue);
});

async function applySmoothing(smoothing) {
    const canvas = calibrationCanvas;
    if (!canvas || !originalImageDataURL) {
        console.error('Canvas or original image not found.');
        alert('Error: Canvas or original image not loaded.');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/manipulate/smooth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token
            },
            body: JSON.stringify({
                smoothing: smoothing,
                imageData: originalImageDataURL,
            }),
        });

        if (response.ok) {
            const processedBlob = await response.blob();
            const processedImageURL = URL.createObjectURL(processedBlob);

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(processedImageURL);
                console.log(`Smoothing applied: ${smoothing}`);
                setOriginalImageDataURL(canvas.toDataURL('image/png'));
            };
            img.src = processedImageURL;
        } else if (response.status === 401) {
            console.error('Smoothing request unauthorized. Please log in.');
            alert('Unauthorized: Please log in to perform this action.');
        } else {
            const errorText = await response.text();
            console.error('Smoothing application failed:', errorText || 'Unknown error');
            alert(`Smoothing application failed: ${errorText || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending smoothing request:', error);
        alert('Error sending smoothing request.');
    }
}