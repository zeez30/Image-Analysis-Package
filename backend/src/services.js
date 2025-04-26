const sharp = require('sharp'); // Calling Sharp library
const path = require('path'); // For handling file paths
const gui = require('node-gui');


// Function to get the input file path from the terminal
function getInputPath() {
    if (process.argv.length < 3) {
        console.error("Please provide the input file path as an argument.");
        process.exit(1); // Exit the script with an error code
    }
    return process.argv[2]; // Return the input file path
}

// Function to extract the file extension (without the dot)
function getFileExtension(filePath) {
    return path.extname(filePath).slice(1); // Remove the leading dot
}

// Function to generate the output path
function generateOutputPath(inputPath, suffix = "_edited") {
    const ext = path.extname(inputPath); // Get the file extension (with dot)
    const baseName = path.basename(inputPath, ext); // Get the file name without extension
    const dirName = path.dirname(inputPath); // Get the directory name
    return path.join(dirName, `${baseName}${suffix}${ext}`); // Append suffix to the file name
}

// Preprocessing the image
async function imagePreprocessingCalibration(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .sharpen({ sigma: 1.0 }) // Mild sharpening
            .grayscale() // Convert to grayscale
            .blur()
            .toFile(outputPath); // Save the preprocessed image

        console.log("Image preprocessing complete:", outputPath);
        return outputPath;
    } catch (error) {
        console.error("Error during preprocessing:", error);
        throw error;
    }
}

// Export image
async function exportImage(inputPath, outputPath, format = "jpeg") {
    try {
        await sharp(inputPath)
            .toFormat(format) // Convert to the specified format
            .toFile(outputPath); // Save the exported image

        console.log("Image exported successfully:", outputPath);
    } catch (error) {
        console.error("Error exporting image:", error);
        throw error;
    }
}


async function simpleDisplay(imagePath) {
    const image = await sharp(imagePath).toBuffer();

    const win = new gui.Window({
        title: 'Image Display',
        width: 800,
        height: 600
    });

    const canvas = new gui.Canvas();
    win.setContentView(canvas);

    canvas.on('draw', (ctx) => {
        // Draw image
        const img = new gui.Image(image);
        ctx.drawImage(img, 0, 0);

        // Draw lines (example)
        ctx.strokeColor = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(200, 200);
        ctx.stroke();
    });

    win.show();
}


// Main function to run the script
(async function () {
    try {
        const inputPath = getInputPath(); // Get the input file path from the terminal
        const preprocessedPath = generateOutputPath(inputPath, "_preprocessed"); // Path for preprocessed image
        const exportedPath = generateOutputPath(inputPath, "_exported"); // Path for exported image

        // Step 1: Preprocess the image
        await imagePreprocessingCalibration(inputPath, preprocessedPath);

        // Step 2: Export the preprocessed image
        const format = getFileExtension(inputPath); // Use the input file's format
        await exportImage(preprocessedPath, exportedPath, format);
    } catch (error) {
        console.error("Error in main workflow:", error);
    }
})();

