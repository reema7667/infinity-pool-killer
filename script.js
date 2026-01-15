// State management
let paragraphs = [];
let currentParagraph = null;
let words = [];
let currentWordIndex = 0;
let intervalId = null;
let isPlaying = false;
let wpm = 300;

// Elements
const textInput = document.getElementById('textInput');
const processBtn = document.getElementById('processBtn');
const paragraphList = document.getElementById('paragraphList');
const wordDisplay = document.getElementById('wordDisplay');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const themeToggle = document.getElementById('themeToggle');
const progressInfo = document.getElementById('progressInfo');

// Process text into paragraphs
processBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;

    // Split by double line breaks or single line breaks
    paragraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0);

    renderParagraphs();
});

// Render paragraph cards
function renderParagraphs() {
    if (paragraphs.length === 0) {
        paragraphList.innerHTML = '<div class="empty-state">No paragraphs found.</div>';
        return;
    }

    paragraphList.innerHTML = paragraphs.map((para, index) => `
        <div class="paragraph-card" data-index="${index}">
            <div class="paragraph-number">Paragraph ${index + 1}</div>
            <div class="paragraph-preview">${para}</div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.paragraph-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            selectParagraph(index);
        });
    });
}

// Select paragraph for reading
function selectParagraph(index) {
    // Stop current playback
    stopPlayback();

    // Update UI
    document.querySelectorAll('.paragraph-card').forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });

    currentParagraph = index;
    words = paragraphs[index].split(/\s+/).filter(w => w.length > 0);
    currentWordIndex = 0;

    // Enable controls
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;

    // Display first word
    wordDisplay.textContent = words[0];
    updateProgress();
}

// Playback controls
playBtn.addEventListener('click', startPlayback);
pauseBtn.addEventListener('click', pausePlayback);
resetBtn.addEventListener('click', resetPlayback);

function startPlayback() {
    if (words.length === 0) return;

    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;

    const interval = 60000 / wpm; // milliseconds per word

    intervalId = setInterval(() => {
        if (currentWordIndex >= words.length) {
            stopPlayback();
            wordDisplay.textContent = 'Completed!';
            return;
        }

        wordDisplay.textContent = words[currentWordIndex];
        currentWordIndex++;
        updateProgress();
    }, interval);
}

function pausePlayback() {
    isPlaying = false;
    clearInterval(intervalId);
    playBtn.disabled = false;
    pauseBtn.disabled = true;
}

function resetPlayback() {
    stopPlayback();
    currentWordIndex = 0;
    wordDisplay.textContent = words[0];
    updateProgress();
}

function stopPlayback() {
    isPlaying = false;
    clearInterval(intervalId);
    playBtn.disabled = false;
    pauseBtn.disabled = true;
}

function updateProgress() {
    const total = words.length;
    const current = currentWordIndex + 1;
    progressInfo.textContent = `Word ${current} of ${total} | Paragraph ${currentParagraph + 1}`;
}

// Speed control
speedSlider.addEventListener('input', (e) => {
    wpm = parseInt(e.target.value);
    speedValue.textContent = wpm;

    // If playing, restart with new speed
    if (isPlaying) {
        pausePlayback();
        startPlayback();
    }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
});
