const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/image');
const imageManipulationRoute = require('./routes/imageManipulationRoute');
const analyzeRoutes = require('./routes/analyze');
const sharpManipulationRoute = require('./routes/sharpManipulationRoute');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect('mongodb+srv://administrator:uMi56bBlMpbOk2IN@imageanalysis.ne3pu.mongodb.net/?retryWrites=true&w=majority&appName=imageAnalysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/manipulate', imageManipulationRoute);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/manipulate', sharpManipulationRoute);

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});