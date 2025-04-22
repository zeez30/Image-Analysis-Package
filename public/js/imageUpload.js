
export const fileInput = document.querySelector('#fileUpload');

import { redrawCanvas } from './imageUtils.js';

fileInput.addEventListener("change", async () => {
    let [file] = fileInput.files;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            localStorage.setItem('uploadedImage', e.target.result); // Store image data in local storage
            redrawCanvas(); // Draw the image on the canvas
            fileInput.style.display = 'none'; // Hide the file input button
        }

        reader.onerror = (err) => {
            console.error("Error reading file:", err);
            alert("An error occurred while reading the file");
        }

        reader.readAsDataURL(file);
    }
});