
import { saveImage } from './imageSaveLoad.js';
import { fileInput } from './imageUpload.js';

// Button Functionality
const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');

loadButton.addEventListener('click', (e) => {
    fileInput.click();
})

saveButton.addEventListener('click', saveImage);