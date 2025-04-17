const fs = require('fs');
const path = require('path');
const jimp = require('jimp')
const imagePath = 'imagePath.png, imagePath.jpeg';
const outputPath = 'outputPath.png, imagePath.jpeg';

//Cropping function
async function imageCrop(x, y, height, width) {
    try {
        const image = await jimp.read(imagePath);
        image.crop(x, y, height, width);
        await image.writeAsync(outputPath);
        console.log(`Image Cropped to height:${height}, width: ${width} and save as ${outputPath}`);
    } catch (error) {
        console.error('Error Cropping the Image, please try again', error);
    }
}

//Rotation function
async function imageRotate() {
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