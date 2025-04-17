// Button Functionality
const loadButton = document.getElementById('loadButton');

loadButton.addEventListener('click', (e) => {
    fileInput.click();
})

// Image Uploader
const fileInput = document.querySelector('#fileUpload');
const calibrationCanvas = document.getElementById('calibrationCanvas');
const ctx = calibrationCanvas.getContext('2d');

// Calibration Elements
const calibrationPanel = document.getElementById('calibrationPanel');
const resetPointsButton = document.getElementById('resetPointsButton');
const knownDistanceInput = document.getElementById('knownDistance');
const unitsInput = document.getElementById('units');
const calibrateButton = document.getElementById('calibrateButton');
const calibrationInfo = document.getElementById('calibrationInfo');

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
    const storedImage = localStorage.getItem('uploadedImage');
    if (storedImage) {
        const img = new Image();
        img.onload = () => {
            calibrationCanvas.width = img.naturalWidth;
            calibrationCanvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0, calibrationCanvas.width, calibrationCanvas.height);
            drawPoint(point1, 'red');
            drawPoint(point2, 'blue');
        };
        img.src = storedImage;
        calibrationCanvas.style.display = 'block';
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

// Event listener to check if user has selected file
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

function setupCalibrationCanvas() {
    redrawCanvas(); // Call redrawCanvas to handle initial setup or image change
}

// Auth Elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('registerButton');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
// const authContainer = document.getElementById('auth-container');

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
    localStorage.removeItem('uploadedImage'); // Remove stored image data
    alert('Logout successful!');
    fileInput.style.display = 'block';
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

async function loadImage() {
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
                    calibrationCanvas.removeEventListener('click', handleCanvasClick);
                    point1 = null;
                    point2 = null;
                    pixelDistance = null;
                    calibrationFactor = null;
                    calibrationInfo.textContent = '';
                    localStorage.removeItem('uploadedImage');
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

// Event Listeners
registerButton.addEventListener('click', register);
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);
calibrateButton.addEventListener('click', calibrateImage);

// Initial UI Update
updateUI();
loadImage(); // Load saved image when page loads
setupCalibrationCanvas(); // Initial setup