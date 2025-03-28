const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    size: {type: Number, required: true},
    createdAt: { type: Date, default: Date.now },
    imageData: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    metadata: { type: Object }
});

module.exports = mongoose.model('Image', imageSchema);