const DB_NAME = 'grainAnalysisDB';
const IMAGE_STORE_NAME = 'currentImage';
const DB_VERSION = 1;

let db;

// Initialize the IndexedDB database
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event);
            reject(event);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
    });
}

// Save the current image data to IndexedDB
async function saveCurrentImage(imageDataURL) {
    if (!db) {
        db = await initializeDB();
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.clear(); // Clear any existing image
        request.onsuccess = () => {
            const addRequest = store.add({ data: imageDataURL });
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = (event) => {
                console.error("Error saving image to IndexedDB:", event);
                reject(event);
            };
        };
        request.onerror = (event) => {
            console.error("Error clearing IndexedDB store:", event);
            reject(event);
        };
    });
}

// Load the current image data from IndexedDB
async function loadCurrentImage() {
    if (!db) {
        db = await initializeDB();
    }
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.getAll(); // Get all (should only be one)

        request.onsuccess = (event) => {
            const results = event.target.result;
            if (results && results.length > 0) {
                resolve(results[0].data);
            } else {
                resolve(null); // No image found
            }
        };

        request.onerror = (event) => {
            console.error("Error loading image from IndexedDB:", event);
            reject(event);
        };
    });
}

// // Clear the current image from IndexedDB
// async function clearCurrentImage() {
//     if (!db) {
//         db = await initializeDB();
//     }
//     return new Promise((resolve, reject) => {
//         const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
//         const store = transaction.objectStore(IMAGE_STORE_NAME);
//         const request = store.clear();
//         request.onsuccess = () => resolve();
//         request.onerror = (event) => {
//             console.error("Error clearing IndexedDB store:", event);
//             reject(event);
//         };
//     });
// }

// Initialize the database when the module loads
initializeDB().catch(error => console.error("Failed to initialize IndexedDB:", error));

export { saveCurrentImage, loadCurrentImage};