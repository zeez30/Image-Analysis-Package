import { saveImage } from './imageSaveLoad.js';
import { fileInput } from './imageUpload.js';
import { calibrationCanvas } from './calibration.js'; // Import the canvas element

// Button Elements
const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');
const cropButton = document.getElementById('cropButton');
const cropDropdownContainer = document.getElementById('cropDropdownContainer');
const cropDropdownContent = document.getElementById('cropDropdownContent');
const performCropButton = document.getElementById('performCrop');
const currentImageWidthDisplay = document.getElementById('currentImageWidth');
const currentImageHeightDisplay = document.getElementById('currentImageHeight');

// Button Functionality
loadButton.addEventListener('click', (e) => {
    fileInput.click();
})

saveButton.addEventListener('click', saveImage);

// Toggle Crop Dropdown
cropButton.addEventListener('click', (e) => {
    e.stopPropagation();
    cropDropdownContent.style.display = cropDropdownContent.style.display === 'block' ? 'none' : 'block';

    // Update image dimensions when dropdown is shown
    if (calibrationCanvas) {
        currentImageWidthDisplay.textContent = `Width: ${calibrationCanvas.width}px`;
        currentImageHeightDisplay.textContent = `Height: ${calibrationCanvas.height}px`;
    } else {
        currentImageWidthDisplay.textContent = `Width: -`;
        currentImageHeightDisplay.textContent = `Height: -`;
    }
});

// Close dropdown if clicked outside the container
window.addEventListener('click', (e) => {
    if (cropDropdownContent.style.display === 'block' && !cropDropdownContainer.contains(e.target)) {
        cropDropdownContent.style.display = 'none';
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
    if (!canvas) {
        console.error('Calibration canvas not found.');
        alert('Error: Canvas not found.');
        return;
    }

    const imageDataURL = canvas.toDataURL('image/png'); // Get current canvas image as data URL

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
                imageData: imageDataURL, // Send the canvas image data
            }),
        });

        if (response.ok) {
            const blob = await response.blob(); // Get the response as a Blob
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cropped_image.png'; // Set the default download filename
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('Image cropping and download successful!');
            cropDropdownContent.style.display = 'none';
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