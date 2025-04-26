import {loadCurrentImage, clearCurrentImage, saveCurrentImage} from './indexedDBImageStore.js';
import { setOriginalImageDataURL } from './imageUtils.js';

const calibrationCanvas = document.getElementById('calibrationCanvas'); // Get the canvas

export async function loadImage() {
    if (!calibrationCanvas) {
        console.error('Calibration canvas not found.');
        return;
    }
    const ctx = calibrationCanvas.getContext('2d');

    const loadImageOnCanvas = (imageData) => {
        const img = new Image();
        img.onload = function() {
            calibrationCanvas.width = img.width;
            calibrationCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            calibrationCanvas.style.display = 'block';
            setOriginalImageDataURL(calibrationCanvas.toDataURL('image/png')); // Set originalImageDataURL here
        };
        img.src = imageData;
    };

    try {
        const storedImageFromIDB = await loadCurrentImage();
        if (storedImageFromIDB) {
            loadImageOnCanvas(storedImageFromIDB);
            return; // Image loaded from IndexedDB
        } else {
            console.log('No current image found in IndexedDB, checking persistent storage...');
            const token = localStorage.getItem('token');
            if (token) {
                fetch('/api/images', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.imageData && data.mimeType) {
                            const imageData = `data:${data.mimeType};base64,${data.imageData}`;
                            loadImageOnCanvas(imageData);
                            saveCurrentImage(imageData); // Now imageData is in scope
                        } else {
                            console.log('No image found in persistent storage for this user.');
                            calibrationCanvas.width = 0;
                            calibrationCanvas.height = 0;
                            calibrationCanvas.style.display = 'none';
                        }
                    })
                    .catch(error => console.error("Error loading image from persistent storage:", error));
            } else {
                console.log('User not logged in, no persistent image to load.');
                calibrationCanvas.width = 0;
                calibrationCanvas.height = 0;
                calibrationCanvas.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error loading image:", error);
    }
}

export async function saveImage() {
    const canvas = document.getElementById('calibrationCanvas');
    if (!canvas) {
        console.error('Calibration canvas not found.');
        return;
    }

    const imageDataURL = canvas.toDataURL('image/png'); // Or the appropriate format

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('User not logged in.');
        return;
    }

    try {
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ imageData: imageDataURL.split(',')[1], mimeType: 'image/png', filename: 'canvas_image.png', size: imageDataURL.length }) // Adjust data as needed
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Image saved successfully:', result);
            alert('Image saved successfully!');
        } else {
            const errorData = await response.json();
            console.error('Error saving image:', errorData);
            alert('Error saving image.');
        }
    } catch (error) {
        console.error('Error sending save image request:', error);
        alert('Error saving image.');
    }
}

// Call loadImage when the page loads
window.addEventListener('load', loadImage);