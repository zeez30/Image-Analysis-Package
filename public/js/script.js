// Button Functionality
const loadButton = document.getElementById('loadButton');

loadButton.addEventListener('click', (e) => {
    fileInput.click();
})

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
        setupCalibrationCanvas(); // Set up the calibration canvas when a new image is loaded
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

// Calibration Elements
const calibrationPanel = document.getElementById('calibrationPanel');
const resetPointsButton = document.getElementById('resetPointsButton');
const knownDistanceInput = document.getElementById('knownDistance');
const unitsInput = document.getElementById('units');
const calibrateButton = document.getElementById('calibrateButton');
const calibrationCanvas = document.getElementById('calibrationCanvas');
const calibrationInfo = document.getElementById('calibrationInfo');
const ctx = calibrationCanvas.getContext('2d');

let point1 = null;
let point2 = null;
let pixelDistance = null;
let calibrationFactor = null; // Real-world units per pixel

function drawPoint(point, color) {
    if (point && ctx) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

function handleCanvasClick(event) {
    const rect = calibrationCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = calibrationCanvas.width / rect.width;
    const scaleY = calibrationCanvas.height / rect.height;

    const adjustedX = x * scaleX;
    const adjustedY = y * scaleY;

    if (!point1) {
        point1 = { x: adjustedX, y: adjustedY };
        drawPoint(point1, 'red');
    } else if (!point2) {
        point2 = { x: adjustedX, y: adjustedY };
        drawPoint(point2, 'blue');
    }
}

function resetPoints() {
    point1 = null;
    point2 = null;
    pixelDistance = null;
    calibrationFactor = null;
    calibrationInfo.textContent = '';
    redrawCanvas();
}

function calculatePixelDistance() {
    if (point1 && point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        pixelDistance = Math.sqrt(dx * dx + dy * dy);
        return pixelDistance;
    }
    return null;
}

function calibrateImage() {
    if (point1 && point2) {
        const knownDistance = parseFloat(knownDistanceInput.value);
        const units = unitsInput.value.trim();

        if (isNaN(knownDistance) || knownDistance <= 0 || !units) {
            alert("Please enter a valid known distance and units.");
            return;
        }

        const pixelDistance = calculatePixelDistance();

        if (pixelDistance) {
            calibrationFactor = knownDistance / pixelDistance; // Units per pixel
            calibrationInfo.textContent = `Calibration Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`;
            alert(`Calibration successful! Factor: ${calibrationFactor.toFixed(4)} ${units} per pixel`);
            // Note: Store calibrationFactor and units for grain analysis
            localStorage.setItem('calibrationFactor', calibrationFactor);
            localStorage.setItem('calibrationUnits', units);
        } else {
            alert("Please select two points on the image first.");
        }
    } else {
        alert("Please select two points on the image first.");
    }
}

function redrawCanvas() {
    if (outputImage.style.display === 'block') {
        calibrationCanvas.width = outputImage.naturalWidth;
        calibrationCanvas.height = outputImage.naturalHeight;
        ctx.drawImage(outputImage, 0, 0, calibrationCanvas.width, calibrationCanvas.height);
        drawPoint(point1, 'red');
        drawPoint(point2, 'blue');
    }
}

function setupCalibrationCanvas() {
    if (outputImage.style.display === 'block') {
        calibrationCanvas.style.display = 'block';
        calibrationCanvas.width = outputImage.naturalWidth;
        calibrationCanvas.height = outputImage.naturalHeight;
        ctx.drawImage(outputImage, 0, 0, calibrationCanvas.width, calibrationCanvas.height);
        calibrationCanvas.addEventListener('click', handleCanvasClick);
    } else {
        calibrationCanvas.style.display = 'none';
        calibrationCanvas.removeEventListener('click', handleCanvasClick);
        point1 = null;
        point2 = null;
        pixelDistance = null;
        calibrationFactor = null;
        calibrationInfo.textContent = '';
    }
}

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
    localStorage.removeItem('calibrationFactor'); // Remove calibration data
    localStorage.removeItem('calibrationUnits');
    alert('Logout successful!');
    fileInput.style.display = 'block';
    outputImage.style.display = 'none'; // Hide image
    outputImage.src = ''; // Clear image src
    calibrationCanvas.style.display = 'none'; // Hide canvas
    calibrationCanvas.removeEventListener('click', handleCanvasClick);
    point1 = null;
    point2 = null;
    pixelDistance = null;
    calibrationFactor = null;
    calibrationInfo.textContent = '';
    updateUI(); // Update UI to reflect logged-out state
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
                // loadImage(); // Load saved image
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
                    fileInput.style.display = 'none';
                    setupCalibrationCanvas(); // Set up calibration canvas after loading image
                } else {
                    outputImage.style.display = 'none'; // Hide image
                    outputImage.src = ''; // Clear image src
                    calibrationCanvas.style.display = 'none'; // Hide canvas
                    calibrationCanvas.removeEventListener('click', handleCanvasClick);
                    point1 = null;
                    point2 = null;
                    pixelDistance = null;
                    calibrationFactor = null;
                    calibrationInfo.textContent = '';
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
outputImage.addEventListener('load', setupCalibrationCanvas); // Setup canvas after image loads
calibrateButton.addEventListener('click', calibrateImage);

// Initial UI Update
updateUI(); // Update UI when page loads
loadImage(); // Load saved image when page loads