const express = require('express');
const Axios = require('axios');
const app = express();
const port = 3000;

const apiLink = 'https://cafirexosapi-production.up.railway.app/api/tiktokv1?url='; // API Link
const apiKey = 'aan62j4gp15a9mmy3en4h'; // API Key

app.use(express.static('public'));
app.use(express.json());

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url || !/^https?:\/\/(www\.)?tiktok\.com/.test(url)) {
        return res.json({ status: 'error', message: 'Invalid TikTok URL' });
    }

    try {
        const apiResponse = await Axios.get(`${apiLink}${url}&apikey=${apiKey}`);
        const data = apiResponse.data;

        if (data.status === 'success') {
            const result = data.result;

            res.json({
                status: 'success',
                result: result.videoNoWatermark 
                    ? { type: 'video', video: result.videoNoWatermark } 
                    : { type: 'image', images: result.images }
            });
        } else {
            res.json({ status: 'error', message: 'Failed to fetch download link' });
        }
    } catch (error) {
        res.json({ status: 'error', message: 'Failed to fetch the data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
