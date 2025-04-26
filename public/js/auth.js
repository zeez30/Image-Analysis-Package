
// Auth Elements
export const usernameInput = document.getElementById('username');
export const passwordInput = document.getElementById('password');
export const registerButton = document.getElementById('registerButton');
export const loginButton = document.getElementById('loginButton');
export const logoutButton = document.getElementById('logoutButton');

import { loadImage } from './imageSaveLoad.js'; // Assuming image loading is in imageSaveLoad.js

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
export { register };

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
export { login };

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('calibrationFactor');
    localStorage.removeItem('calibrationUnits');
    localStorage.removeItem('uploadedImage');

    // --- IndexedDB Interaction ---
    const dbName = 'grainAnalysisDB';
    const storeName = 'currentImage';

    const request = indexedDB.open(dbName);

    request.onsuccess = (event) => {
        const db = event.target.result;
        if (db) {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                console.log('Image data removed from IndexedDB.');
                const imageContainer = document.querySelector('.imageContainer');
                if (imageContainer) {
                    const canvas = imageContainer.querySelector('canvas');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                    const img = imageContainer.querySelector('img#outputImage');
                    if (img) {
                        img.src = '';
                        img.style.display = 'none';
                    }
                }
            };

            clearRequest.onerror = (error) => {
                console.error('Error clearing image data from IndexedDB:', error);
            };

            transaction.oncomplete = () => {
                db.close();
            };

            transaction.onerror = (error) => {
                console.error('Transaction error:', error);
            };
        } else {
            console.warn('IndexedDB not opened.');
        }
    };

    request.onerror = (error) => {
        console.error('Error opening IndexedDB:', error);
    };

    alert('Logout successful!');

    import('./imageUpload.js').then(module => {
        module.fileInput.style.display = 'block';
    });

    import('./calibration.js').then(module => {
        module.calibrationCanvas.style.display = 'none';
        module.calibrationCanvas.removeEventListener('click', module.handleCanvasClick);
        module.point1 = null;
        module.point2 = null;
        module.pixelDistance = null;
        module.calibrationFactor = null;
        module.calibrationInfo.textContent = '';
    });
    updateUI();
}

export { logout };

export function updateUI() {
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