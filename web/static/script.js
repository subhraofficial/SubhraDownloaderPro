const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    body.classList.toggle('light');
    themeToggle.textContent = body.classList.contains('dark') ? '☀️' : '🌙';
});

// Folder selection
const folderBtn = document.getElementById('folder-btn');
const folderPath = document.getElementById('folder-path');
let selectedFolder = '';

folderBtn.addEventListener('click', async () => {
    const res = await fetch('/choose_folder');
    const data = await res.json();
    if(data.path) {
        selectedFolder = data.path;
        folderPath.textContent = selectedFolder;
    }
});

// Download
const downloadBtn = document.getElementById('download-btn');
const urlInput = document.getElementById('url-input');
const formatSelect = document.getElementById('format-select');
const mp3Check = document.getElementById('mp3-check');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

downloadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if(!url) return alert('Paste a URL!');
    const format_id = formatSelect.value;
    const mp3 = mp3Check.checked;
    const folder = selectedFolder;

    fetch('/download', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({url, format_id, mp3, folder})
    }).then(() => {
        progressText.textContent = 'Starting...';
    });
});

// Progress polling
setInterval(async () => {
    const res = await fetch('/progress');
    const data = await res.json();
    progressBar.style.width = data.percent + '%';
    progressText.textContent = data.status + (data.title ? ` - ${data.title}` : '');
}, 500);

// History modal
const historyBtn = document.getElementById('history-btn');
const modal = document.getElementById('history-modal');
const closeModal = document.querySelector('.close');
const historyList = document.getElementById('history-list');

historyBtn.addEventListener('click', async () => {
    const res = await fetch('/history');
    const data = await res.json();
    historyList.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.time} - ${item.title}`;
        historyList.appendChild(li);
    });
    modal.style.display = 'block';
});

closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
