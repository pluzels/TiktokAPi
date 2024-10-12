const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static HTML and CSS files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

// Handle API requests to fetch TikTok content
app.post('/download', async (req, res) => {
    const { url } = req.body;
    const apiUrl = `https://cafirexosapi-production.up.railway.app/api/tiktokv1?url=${encodeURIComponent(url)}&apikey=aan62j4gp15a9mmy3en4h`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch content' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
