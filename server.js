const express = require('express');
const Axios = require('axios');
const { load } = require('cheerio');
const { HttpsProxyAgent, SocksProxyAgent } = require('https-proxy-agent');
const app = express();
const port = 3000;

const TiktokURLregex = /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
const _musicaldownurl = 'https://musicaldown.com';
const _musicaldownapi = 'https://musicaldown.com/api';

app.use(express.static('public'));
app.use(express.json());

const getRequest = (url) => {
  return new Promise((resolve, reject) => {
    if (!TiktokURLregex.test(url)) {
      return resolve({ status: 'error', message: 'Invalid TikTok URL.' });
    }

    Axios(_musicaldownurl, {
      method: 'GET',
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
      },
    })
      .then((response) => {
        const cookie = response.headers['set-cookie'][0].split(';')[0];
        const $ = load(response.data);
        const inputs = $('form input').map((_, el) => $(el).val()).get();

        const request = {
          url,
          [inputs[1]]: inputs[2],
        };

        resolve({ status: 'success', request, cookie });
      })
      .catch((e) => reject(e));
  });
};

const scrapeMusicalDown = (url) => {
  return new Promise(async (resolve) => {
    const request = await getRequest(url);
    if (request.status !== 'success') {
      return resolve({ status: 'error', message: request.message });
    }

    Axios.post(_musicaldownapi, new URLSearchParams(request.request), {
      headers: {
        cookie: request.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then(({ data }) => {
        const $ = load(data);

        const images = [];
        $('div[class="col s12 m3"] img').each((_, el) => {
          images.push($(el).attr('src'));
        });

        const videos = {};
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('https')) {
            videos[$(el).text()] = href;
          }
        });

        if (images.length > 0) {
          resolve({ status: 'success', result: { type: 'image', images } });
        } else if (Object.keys(videos).length > 0) {
          resolve({ status: 'success', result: { type: 'video', videos } });
        } else {
          resolve({ status: 'error', message: 'Failed to retrieve download link.' });
        }
      })
      .catch((e) => resolve({ status: 'error', message: e.message }));
  });
};

app.post('/download', async (req, res) => {
  const { url } = req.body;
  const result = await scrapeMusicalDown(url);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
