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
async function imageRotate(degrees, inputPath) {
    try {
        const image = await Jimp.read(inputPath);
        image.rotate(degrees);
        const rotatedBuffer = await image.getBuffer('image/png');
        console.log(`Image Rotated ${degrees} degrees`);
        return rotatedBuffer;
    } catch (error) {
        console.error('Error Rotating the Image, please try again', error);
        throw error;
    }
}

//Image Brightness function
async function imageBrightness(brightness, inputPath) {
    try {
        const image = await Jimp.read(inputPath);
        let totalBrightness = (brightness + 1);
        image.brightness(totalBrightness);

        return await image.getBuffer('image/png');
    } catch (error) {
        console.error('Error Adjusting Image Brightness, please try again', error);
        throw error;
    }
}

module.exports = {imageCrop, imageRotate, imageBrightness};