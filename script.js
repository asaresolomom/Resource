const videoContainer = document.getElementById('video-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

const videos = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: '3tmd-ClafbY', title: 'Toto - Africa' },
    { id: 'QH2-TGUlwu4', title: 'a-ha - Take on Me' },
    { id: 'V2hlQkVJZhE', title: 'Keyboard Cat' },
    { id: 'O91_voO-sAo', title: 'Nyan Cat' },
    { id: 'uKxyLmbOcM4', title: 'Charlie Bit My Finger' }
];

function renderVideos(videoList) {
    videoContainer.innerHTML = '';
    videoList.forEach(video => {
        const videoWrapper = document.createElement('div');
        videoWrapper.classList.add('video-wrapper');

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${video.id}`;
        iframe.title = video.title;
        iframe.frameborder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowfullscreen = true;

        const title = document.createElement('p');
        title.textContent = video.title;

        videoWrapper.appendChild(iframe);
        videoWrapper.appendChild(title);
        videoContainer.appendChild(videoWrapper);
    });
}

function filterVideos() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredVideos = videos.filter(video => video.title.toLowerCase().includes(searchTerm));
    renderVideos(filteredVideos);
}

searchButton.addEventListener('click', filterVideos);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        filterVideos();
    }
});

renderVideos(videos);
