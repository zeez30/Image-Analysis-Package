// Image Uploader
const fileInput = document.querySelector('#fileUpload');
const imageUploaderOutput = document.getElementById('outputImage');

// Event listener to check if user has selected file
fileInput.addEventListener("change", async () => {
    let [file] = fileInput.files;

    // Reads file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
        imageUploaderOutput.src = e.target.result;
        imageUploaderOutput.style.display = 'block'; //Shows the image
        fileInput.style.display = 'none'; // Hides the file input button
    }

    reader.onerror = (err) => {
        console.error("Error reading file:", err);
        alert("An error occurred while reading the file");
    }

    // Sets img element src to data URL of file
    reader.readAsDataURL(file);
})

//---------------------

// Auth Elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('registerButton');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
// const authContainer = document.getElementById('auth-container');

// Image Elements
const fileUpload = document.getElementById('fileUpload');
const outputImage = document.getElementById('outputImage');

// Authentication Functions
async function register() {
    const username = usernameInput.value; // Get username from input
    const password = passwordInput.value; // Get password from input

    try {
        const response = await fetch('/api/auth/register', { // Send POST request to the register endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }), // Send username and password in the request body
        });

        if (response.ok) { // If response is successful
            alert('Registration successful!'); // Display success message
        } else {
            const data = await response.json(); // Parse JSON response for errors
            alert(`Registration failed: ${data.message}`); // Display error message
        }
    } catch (error) {
        console.error('Registration error:', error); // Log errors
        alert('An error occurred during registration.');
    }
}

async function login() {
    const username = usernameInput.value; // Get username from input
    const password = passwordInput.value; // Get password from input

    try {
        const response = await fetch('/api/auth/login', { // Send POST request to the login endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }), // Send username and password in the request body
        });

        if (response.ok) { // If successful
            const data = await response.json(); // Parse JSON response for token and userId
            localStorage.setItem('token', data.token); //Store token in local storage
            localStorage.setItem('userId', data.userId); // Store userId in local storage
            alert('Login successful!');
            updateUI(); // Update to reflect logged-in state
            loadImage(); // Load saved image if there is one
        } else {
            const data = await response.json(); // Parse for error messages
            alert(`Login failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Login error:', error); // Log errors
        alert('An error occurred during login.');
    }
}

function logout() {
    localStorage.removeItem('token'); // Remove token from local storage
    localStorage.removeItem('userId'); // Remove userId from local storage
    alert('Logout successful!');
    updateUI(); // Update UI to reflect logged-out state
    outputImage.style.display = 'none'; // Hide image
    outputImage.src = ''; // Clear image src
}

function updateUI() {
    const token = localStorage.getItem('token'); // Check if token exists in local storage
    if (token) { // If user is logged in
        registerButton.style.display = 'none';
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        usernameInput.style.display = 'none';
        passwordInput.style.display = 'none';
    } else {
        registerButton.style.display = 'block';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        usernameInput.style.display = 'block';
        passwordInput.style.display = 'block';
    }
}

// Image Functions
fileUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0]; // Get selected file
    const reader = new FileReader(); // Create new FileReader

    reader.onload = async (e) => { // When file is loaded
        const base64Image = e.target.result.split(',')[1]; // Get base64 encoded image data
        const mimeType = file.type; // Get the MIME type of the file
        const filename = file.name; // Get the filename
        const size = file.size; // Get size of file
        const token = localStorage.getItem('token'); // Get token from local storage

        try {
            const response = await fetch('/api/images', { // Send post request to the images endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
                },
                body: JSON.stringify({ imageData: base64Image, mimeType, filename, size }), // Send image data in request body
            });

            if (response.ok) { // If successful
                alert('Image saved successfully!');
                loadImage(); // Load saved image
            } else {
                const data = await response.json(); // Parse JSON for error messages
                alert(`Image save failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving image:', error); // Log errors
            alert('An error occurred while saving the image.');
        }
    };

    reader.readAsDataURL(file); // Read file as a data URL
});

async function loadImage() {
    const token = localStorage.getItem('token'); // Get token from local storage
    if (token) { // If user is logged in
        try {
            const response = await fetch('/api/images', { // Send GET request to the images endpoint
                headers: { 'Authorization': `Bearer ${token}` }, // Include token in authorization header
            });

            if (response.ok) { // If response successful
                const data = await response.json(); // Parse JSON for image data
                if (data && data.imageData) { // If image data exists
                    outputImage.src = `data:${data.mimeType};base64,${data.imageData}`; // Set image src
                    outputImage.style.display = 'block'; // Show image
                    fileInput.style.display = 'none'; // Hides the file input button
                } else {
                    outputImage.style.display = 'none'; // Hide image
                    outputImage.src = ''; // Clear image src
                }
            } else {
                console.error('Error loading image:', response.statusText); // Log errors
            }
        } catch (error) {
            console.error('Error loading image:', error); // Log errors
        }
    }
}

// Event Listeners
registerButton.addEventListener('click', register);
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);

// Initial UI Update
updateUI(); // Update UI when page loads
loadImage(); // Load saved image when page loads

// calibration panel
document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('fileUpload'); //Reassign to the canvas functionality
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d'); // Get the canvas context
    const scalingFactorInput = document.getElementById('scalingFactor');
    const x1Input = document.getElementById('x1');
    const y1Input = document.getElementById('y1');
    const x2Input = document.getElementById('x2');
    const y2Input = document.getElementById('y2');
    const realDistanceInput = document.getElementById('realDistance');
    const applyCalibrationButton = document.getElementById('applyCalibration');
    const resetCalibrationButton = document.getElementById('resetCalibration');
    const detectMicronBarButton = document.getElementById('detectMicronBar');
    const calibrationStatus = document.getElementById('calibrationStatus');

    let img = new Image(); // Create a new Image object
    let imageLoaded = false;
    let point1 = null;
    let point2 = null;
    let pixelToRealRatio = null;
    let originalImageBase64 = null; // Store the original image data

    // Load image and display it on the canvas
    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.onload = () => {
                    imageCanvas.style.display = 'block';
                    outputImage.style.display = 'none'; // Hide the img tag
                    imageCanvas.width = img.width;
                    imageCanvas.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    imageLoaded = true;

                    // Store the original image data as a base64 string
                    originalImageBase64 = imageCanvas.toDataURL();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Function to draw a circle on the canvas
    function drawCircle(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    // Handle canvas clicks for point selection
    imageCanvas.addEventListener('click', (event) => {
        if (!imageLoaded) {
            alert('Please upload an image first.');
            return;
        }

        const x = event.offsetX;
        const y = event.offsetY;

        if (!point1) {
            point1 = { x, y };
            x1Input.value = x;
            y1Input.value = y;
            drawCircle(x, y);
        } else if (!point2) {
            point2 = { x, y };
            x2Input.value = x;
            y2Input.value = y;
            drawCircle(x, y);
        }
    });

    // Apply Calibration
    applyCalibrationButton.addEventListener('click', () => {
        if (!point1 || !point2) {
            calibrationStatus.textContent = 'Please select two calibration points.';
            return;
        }

        const realDistance = parseFloat(realDistanceInput.value);
        if (isNaN(realDistance)) {
            calibrationStatus.textContent = 'Please enter a valid real-world distance.';
            return;
        }

        const pixelDistance = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
        pixelToRealRatio = realDistance / pixelDistance;

        const scalingFactor = parseFloat(scalingFactorInput.value);
        if (!isNaN(scalingFactor)) {
            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(scalingFactor, scalingFactor);

            // Clear canvas and redraw image
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(img, 0, 0, img.width, img.height);

            //Redraw the circles after scaling
            drawCircle(point1.x, point1.y);
            drawCircle(point2.x, point2.y);
        }

        calibrationStatus.textContent = `Calibration applied. Pixel to real-world ratio: ${pixelToRealRatio.toFixed(4)}`;
    });

    // Reset Calibration
    resetCalibrationButton.addEventListener('click', () => {
        point1 = null;
        point2 = null;
        pixelToRealRatio = null;

        x1Input.value = '';
        y1Input.value = '';
        x2Input.value = '';
        y2Input.value = '';
        realDistanceInput.value = '';
        scalingFactorInput.value = '';
        calibrationStatus.textContent = '';

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Clear canvas and redraw the original image
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
    });

    // Detect Micron Bar (Placeholder)
    detectMicronBarButton.addEventListener('click', () => {
        alert('Micron bar detection not implemented yet.');
    });
});
