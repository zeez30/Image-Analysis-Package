
import { saveImage } from './imageSaveLoad.js';
import { fileInput } from './imageUpload.js';

// Button Functionality
const loadButton = document.getElementById('loadButton');
const saveButton = document.getElementById('saveButton');
const cropButton = document.getElementById('cropButton');

loadButton.addEventListener('click', (e) => {
    fileInput.click();
})

saveButton.addEventListener('click', saveImage);

cropButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent the default form submission if the button is inside a form

    const xValue = document.getElementById('cropX').value;
    const yValue = document.getElementById('cropY').value;
    const heightValue = document.getElementById('cropHeight').value;
    const widthValue = document.getElementById('cropWidth').value;
    const imagePathValue = document.getElementById('imagePath').value;
    const outputPathValue = document.getElementById('outputPath').value;

    try {
        const response = await fetch('/api/manipulate/cropImage', { // Updated endpoint URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x: xValue,
                y: yValue,
                height: heightValue,
                width: widthValue,
                imagePath: imagePathValue,
                outputPath: outputPathValue,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Image cropping successful:', data.message);
            // Optionally update the UI
        } else {
            console.error('Image cropping failed:', data.error);
            // Optionally update the UI
        }
    } catch (error) {
        console.error('Error sending crop request:', error);
        // Optionally update the UI
    }
});