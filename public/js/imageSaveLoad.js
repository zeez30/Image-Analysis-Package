//
// import { calibrationCanvas } from './calibration.js';
// import { fileInput } from './imageUpload.js';
// import { redrawCanvas } from './imageUtils.js';
// import { resetPoints, calibrationInfo, point1, point2, pixelDistance, calibrationFactor } from './calibration.js';
//
// fileInput.addEventListener('change', async (event) => {
//     const file = event.target.files[0];
//     const reader = new FileReader();
//
//     reader.onload = async (e) => {
//         const base64Image = e.target.result.split(',')[1];
//         const mimeType = file.type;
//         const filename = file.name;
//         const size = file.size;
//         const token = localStorage.getItem('token');
//
//         try {
//             const response = await fetch('/api/images', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ imageData: base64Image, mimeType, filename, size }),
//             });
//
//             if (response.ok) {
//                 alert('Image saved successfully!');
//                 loadImage(); // Load the saved image onto the canvas
//             } else {
//                 const data = await response.json();
//                 alert(`Image save failed: ${data.message}`);
//             }
//         } catch (error) {
//             console.error('Error saving image:', error);
//             alert('An error occurred while saving the image.');
//         }
//     };
//
//     reader.readAsDataURL(file);
// });
//
// export async function saveImage() {
//     const token = localStorage.getItem('token');
//     if (!token) {
//         alert('Please log in to save the image.');
//         return;
//     }
//
//     const imageDataURL = calibrationCanvas.toDataURL();
//     const base64Image = imageDataURL.split(',')[1];
//     const mimeType = imageDataURL.substring(imageDataURL.indexOf(":") + 1, imageDataURL.indexOf(";"));
//
//     try {
//         const response = await fetch('/api/images', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`,
//             },
//             body: JSON.stringify({ imageData: base64Image, mimeType: mimeType }),
//         });
//
//         if (response.ok) {
//             alert('Current image saved successfully!');
//             loadImage(); // Reload the saved image to ensure consistency
//         } else {
//             const data = await response.json();
//             alert(`Image save failed: ${data.message}`);
//         }
//     } catch (error) {
//         console.error('Error saving image:', error);
//         alert('An error occurred while saving the image.');
//     }
// }
//
//
// export async function loadImage() {
//     const token = localStorage.getItem('token');
//     if (token) {
//         try {
//             const response = await fetch('/api/images', {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'content-type': 'application/json',
//                 },
//             });
//             if (response.ok) {
//                 const data = await response.json();
//                 if (data && data.imageData && data.mimeType) {
//                     const imageUrl = `data:${data.mimeType};base64,${data.imageData}`;
//                     localStorage.setItem('uploadedImage', imageUrl); // Store in local storage
//                     redrawCanvas(); // Draw on canvas
//                     fileInput.style.display = 'none';
//                 } else {
//                     calibrationCanvas.style.display = 'none';
//                     calibrationCanvas.removeEventListener('click', () => {
//                         import('./calibration.js').then(module => {
//                             module.handleCanvasClick
//                         });
//                     });
//                     localStorage.removeItem('uploadedImage');
//                     // Reset calibration state
//                     import('./calibration.js').then(module => {
//                         module.point1 = null;
//                         module.point2 = null;
//                         module.pixelDistance = null;
//                         module.calibrationFactor = null;
//                         module.calibrationInfo.textContent = '';
//                     });
//                 }
//             } else {
//                 console.error('Error loading image:', response.statusText);
//             }
//         } catch (error) {
//             console.error('Error loading image:', error);
//         }
//     } else {
//         localStorage.removeItem('uploadedImage');
//         redrawCanvas(); // Ensure canvas is cleared if no token
//     }
// }

// imageSaveLoad.js
import { loadCurrentImage, clearCurrentImage } from './indexedDBImageStore.js';

const calibrationCanvas = document.getElementById('calibrationCanvas'); // Get the canvas

export async function loadImage() {
    if (!calibrationCanvas) {
        console.error('Calibration canvas not found.');
        return;
    }
    const ctx = calibrationCanvas.getContext('2d');

    try {
        const storedImageFromIDB = await loadCurrentImage();
        if (storedImageFromIDB) {
            const img = new Image();
            img.onload = function() {
                calibrationCanvas.width = img.width;
                calibrationCanvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                calibrationCanvas.style.display = 'block';
            };
            img.src = storedImageFromIDB;
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
                        if (data && data.imageData) {
                            const img = new Image();
                            img.onload = function() {
                                calibrationCanvas.width = img.width;
                                calibrationCanvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                                calibrationCanvas.style.display = 'block';
                            };
                            img.src = `data:${data.mimeType};base64,${data.imageData}`;
                        } else {
                            console.log('No image found in persistent storage for this user.');
                            // Optionally clear the canvas if no image is loaded
                            calibrationCanvas.width = 0;
                            calibrationCanvas.height = 0;
                            calibrationCanvas.style.display = 'none';
                        }
                    })
                    .catch(error => console.error("Error loading image from persistent storage:", error));
            } else {
                console.log('User not logged in, no persistent image to load.');
                // Optionally clear the canvas if no image is loaded
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