// Image Uploader
const fileInput = document.querySelector('#fileUpload');
const imageOutput = document.getElementById('outputImage');

// Event listener to check if user has selected file
fileInput.addEventListener("change", async () => {
    let [file] = fileInput.files;

    // Reads file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
        imageOutput.src = e.target.result;
        imageOutput.style.display = 'block'; //Shows the image
        fileInput.style.display = 'none'; // Hides the file input button
    }

    reader.onerror = (err) => {
        console.error("Error reading file:", err);
        alert("An error occurred while reading the file");
    }

    // Sets img element src to data URL of file
    reader.readAsDataURL(file);
})