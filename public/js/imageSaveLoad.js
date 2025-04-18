
import { calibrationCanvas } from './calibration.js';
import { fileInput } from './imageUpload.js';
import { redrawCanvas } from './imageUtils.js';
import { resetPoints, calibrationInfo, point1, point2, pixelDistance, calibrationFactor } from './calibration.js';

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const base64Image = e.target.result.split(',')[1];
        const mimeType = file.type;
        const filename = file.name;
        const size = file.size;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ imageData: base64Image, mimeType, filename, size }),
            });

            if (response.ok) {
                alert('Image saved successfully!');
                loadImage(); // Load the saved image onto the canvas
            } else {
                const data = await response.json();
                alert(`Image save failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert('An error occurred while saving the image.');
        }
    };

    reader.readAsDataURL(file);
});

export async function saveImage() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to save the image.');
        return;
    }

    const imageDataURL = calibrationCanvas.toDataURL();
    const base64Image = imageDataURL.split(',')[1];
    const mimeType = imageDataURL.substring(imageDataURL.indexOf(":") + 1, imageDataURL.indexOf(";"));

    try {
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ imageData: base64Image, mimeType: mimeType }),
        });

        if (response.ok) {
            alert('Current image saved successfully!');
            loadImage(); // Reload the saved image to ensure consistency
        } else {
            const data = await response.json();
            alert(`Image save failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Error saving image:', error);
        alert('An error occurred while saving the image.');
    }
}


export async function loadImage() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/images', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.imageData && data.mimeType) {
                    const imageUrl = `data:${data.mimeType};base64,${data.imageData}`;
                    localStorage.setItem('uploadedImage', imageUrl); // Store in local storage
                    redrawCanvas(); // Draw on canvas
                    fileInput.style.display = 'none';
                } else {
                    calibrationCanvas.style.display = 'none';
                    calibrationCanvas.removeEventListener('click', () => {
                        import('./calibration.js').then(module => {
                            module.handleCanvasClick
                        });
                    });
                    localStorage.removeItem('uploadedImage');
                    // Reset calibration state
                    import('./calibration.js').then(module => {
                        module.point1 = null;
                        module.point2 = null;
                        module.pixelDistance = null;
                        module.calibrationFactor = null;
                        module.calibrationInfo.textContent = '';
                    });
                }
            } else {
                console.error('Error loading image:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading image:', error);
        }
    } else {
        localStorage.removeItem('uploadedImage');
        redrawCanvas(); // Ensure canvas is cleared if no token
    }
}