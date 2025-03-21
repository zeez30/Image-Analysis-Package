const mongoose = require('mongoose');
//
const imageSchema = new mongoose.Schema({

//Identifier of the image
    _id: {
        Type: String,
        required: true
    },
    //size of the image in the number of bytes
    size: {
        type: Number,
        required: true
    },
    //When the image was created based on the date and time
    createdAt: {
        type: Date,
        default: Date.now
    },
    //Base64 encoding of the image data
    imageData: {
        type: String,
        required: true
    },
    //Original name of the file and image
    originalFilename: {
        type: String,
        required: true,
    },
    //Identify the format of the file
    mimeType: {
        type: String,
        required: true,
    },
    //Any additional metadata of the image
    metadata: {
        type: Object,
    },
});

//Saving image to database
newImage.save()
    .then(() => console.log('Image Saved'))
    .catch((err) => console.log('Error Saving Image', err));

