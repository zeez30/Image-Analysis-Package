const fs = require('fs');
const path = require('path');
const {Jimp} = require('jimp')

//Cropping function
async function imageCrop(x, y, height, width, inputPath) {
    try {
        const image = await Jimp.read(inputPath);
        const croppedImage = image.crop({
            x: x,
            y: y,
            w: width,
            h: height,
        });
        const croppedBuffer = await croppedImage.getBuffer('image/png'); // Get the buffer
        console.log(`Image Cropped to height:${height}, width: ${width}`);
        return croppedBuffer; // Return the buffer
    } catch (error) {
        console.error('Error Cropping the Image, please try again', error);
        throw error;
    }
}

//Rotation function
async function imageRotate(degrees) {
    try {
        const image = await jimp.read(imagePath);
        image.rotate(degrees);
        await image.writeAsync(outputPath);
        console.log(`Image Rotated: ${degrees} and Saved As ${outputPath}`);
    } catch (error) {
        console.error('Error Rotating the Image, please try again', error);
    }
}

//Image Brightness function
async function imageBrightness(brightness) {
    try {
        const image = await jimp.read(imagePath);
        image.brightness(brightness);
        await image.writeAsync(outputPath);
        console.log(`Image brightness adjusted by ${brightness} and saved as ${outputPath}`);
    } catch (error) {
        console.error('Error Adjusting Image Brightness, please try again', error);
    }
}

module.exports = {imageCrop, imageRotate, imageBrightness};