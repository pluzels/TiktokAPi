const express = require('express');
const axios = require('axios');
const { load } = require('cheerio');
const HttpsProxyAgent = require('https-proxy-agent');
const SocksProxyAgent = require('socks-proxy-agent');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// TikTok URL Regex
const TiktokURLregex = /https:\/\/(?:m|www|vm|vt|lite)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;

// Function to check if a URL is valid
const isURL = (url) => {
  let status = false;
  try {
    new URL(url);
    status = true;
  } catch {
    status = false;
  }
  return status;
};

// Get request for MusicalDown
const getRequest = (url, proxy) =>
  new Promise((resolve) => {
    if (!TiktokURLregex.test(url)) {
      return resolve({
        status: 'error',
        message: 'Invalid TikTok URL. Make sure your URL is correct!'
      });
    }

    axios('https://musicaldown.com/en', {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Update-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'
      },
      httpsAgent:
        (proxy &&
          (proxy.startsWith('http') || proxy.startsWith('https')
            ? new HttpsProxyAgent(proxy)
            : proxy.startsWith('socks')
            ? new SocksProxyAgent(proxy)
            : undefined)) ||
        undefined
    })
      .then((data) => {
        const cookie = data.headers['set-cookie'][0].split(';')[0];
        const $ = load(data.data);
        const input = $('div > input').map((_, el) => $(el));
        const request = {
          [input.get(0).attr('name')]: url,
          [input.get(1).attr('name')]: input.get(1).attr('value'),
          [input.get(2).attr('name')]: input.get(2).attr('value')
        };
        resolve({ status: 'success', request, cookie });
      })
      .catch((e) =>
        resolve({ status: 'error', message: 'Failed to get the request form!' })
      );
  });

// Main scraping function
const MusicalDown = (url, proxy) =>
  new Promise(async (resolve) => {
    const request = await getRequest(url, proxy);
    if (request.status !== 'success')
      return resolve({ status: 'error', message: request.message });

    axios('https://musicaldown.com/en', {
      method: 'POST',
      headers: {
        cookie: request.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://musicaldown.com',
        Referer: 'https://musicaldown.com/en',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'
      },
      data: new URLSearchParams(Object.entries(request.request)),
      httpsAgent:
        (proxy &&
          (proxy.startsWith('http') || proxy.startsWith('https')
            ? new HttpsProxyAgent(proxy)
            : proxy.startsWith('socks')
            ? new SocksProxyAgent(proxy)
            : undefined)) ||
        undefined
    })
      .then(({ data }) => {
        const $ = load(data);

        // Get Image Video
        const images = [];
        $('div.row > div[class="col s12 m3"]').each((_, el) => {
          images.push($(el).find('img').attr('src'));
        });

        // Get Result Video
        const videos = {};
        $('div.row > div').eq(1).find('a').each((_, v) => {
          if ($(v).attr('href') !== '#modal2') {
            const event = $(v).attr('data-event');
            const href = $(v).attr('href');
            if (event.includes('hd')) {
              videos.videoHD = href;
            } else if (event.includes('mp4')) {
              videos.videoSD = href;
            } else if (event.includes('watermark')) {
              videos.videoWatermark = href;
            } else if (href.includes('type=mp3')) {
              videos.music = href;
            }
          }
        });

        // Result
        if (images.length > 0) {
          resolve({
            status: 'success',
            result: {
              type: 'image',
              images
            }
          });
        } else if (Object.keys(videos).length > 0) {
          resolve({
            status: 'success',
            result: {
              type: 'video',
              videos
            }
          });
        } else {
          resolve({
            status: 'error',
            message: 'Failed to retrieve download link.'
          });
        }
      })
      .catch((e) => resolve({ status: 'error', message: e.message }));
  });

// Route to handle TikTok download
app.post('/download', async (req, res) => {
  const { url, proxy } = req.body;
  const result = await MusicalDown(url, proxy);
  res.json(result);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
