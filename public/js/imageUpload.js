//
// export const fileInput = document.querySelector('#fileUpload');
//
// import { redrawCanvas } from './imageUtils.js';
//
// fileInput.addEventListener("change", async () => {
//     let [file] = fileInput.files;
//
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             localStorage.setItem('uploadedImage', e.target.result); // Store image data in local storage
//             redrawCanvas(); // Draw the image on the canvas
//             fileInput.style.display = 'none'; // Hide the file input button
//         }
//
//         reader.onerror = (err) => {
//             console.error("Error reading file:", err);
//             alert("An error occurred while reading the file");
//         }
//
//         reader.readAsDataURL(file);
//     }
// });

// imageUpload.js
import { saveCurrentImage } from './indexedDBImageStore.js';

const fileInput = document.getElementById('fileUpload');
export { fileInput };

document.getElementById('fileUpload').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const imageDataURL = event.target.result;
            try {
                await saveCurrentImage(imageDataURL); // Save to IndexedDB
                const calibrationCanvas = document.getElementById('calibrationCanvas');
                if (calibrationCanvas) {
                    const ctx = calibrationCanvas.getContext('2d');
                    const img = new Image();
                    img.onload = function() {
                        // Set canvas dimensions to the image dimensions
                        calibrationCanvas.width = img.width;
                        calibrationCanvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        calibrationCanvas.style.display = 'block'; // Make the canvas visible
                    };
                    img.src = imageDataURL;
                } else {
                    console.error("Error: calibrationCanvas element not found in the DOM.");
                    alert("Failed to display image.");
                }
            } catch (error) {
                console.error("Error saving image to IndexedDB:", error);
                alert("Failed to save image locally.");
            }
        };
        reader.readAsDataURL(file);
    }
});