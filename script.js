function downloadContent() {
    const url = document.getElementById('urlInput').value;
    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');

    if (!url) {
        alert('Please enter a valid TikTok URL.');
        return;
    }

    loader.style.display = 'block';  // Show loader
    resultDiv.innerHTML = '';  // Clear previous results

    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = 'none';  // Hide loader

        if (data.status === 'success') {
            resultDiv.innerHTML = '';  // Clear the result

            // If the result contains videoUrl, it's a video
            if (data.result.videoUrl) {
                const videoElement = document.createElement('video');
                videoElement.src = data.result.videoUrl;
                videoElement.controls = true;
                resultDiv.appendChild(videoElement);

                // Create download button for video
                const downloadButton = document.createElement('a');
                downloadButton.href = data.result.videoUrl;
                downloadButton.textContent = 'Download Video';
                downloadButton.classList.add('download-btn');
                downloadButton.setAttribute('download', '');
                
                resultDiv.appendChild(downloadButton);

            } else if (data.result.imagesUrl) {
                // If the result contains imagesUrl, it's a photo
                data.result.imagesUrl.forEach(imageUrl => {
                    const imgElement = document.createElement('img');
                    imgElement.src = imageUrl;
                    resultDiv.appendChild(imgElement);

                    // Create download button for each photo
                    const downloadButton = document.createElement('a');
                    downloadButton.href = imageUrl;
                    downloadButton.textContent = 'Download Photo';
                    downloadButton.classList.add('download-btn');
                    downloadButton.setAttribute('download', '');
                    
                    resultDiv.appendChild(downloadButton);
                });
            } else {
                resultDiv.innerHTML = '<p>Failed to determine content type. Please check the URL.</p>';
            }
        } else {
            resultDiv.innerHTML = '<p>Failed to fetch content. Please check the URL.</p>';
        }
    })
    .catch(error => {
        loader.style.display = 'none';  // Hide loader
        resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    });
}
