import { saveCurrentImage } from './indexedDBImageStore.js';
import { setOriginalImageDataURL } from './imageUtils.js';

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
                        calibrationCanvas.width = img.width;
                        calibrationCanvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        calibrationCanvas.style.display = 'block';
                        setOriginalImageDataURL(calibrationCanvas.toDataURL('image/png')); // Set originalImageDataURL here
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