// State management
let paragraphs = [];
let currentParagraph = null;
let words = [];
let currentWordIndex = 0;
let intervalId = null;
let isPlaying = false;
let wpm = 300;
let isReadingAll = false;
let allWords = [];

// Elements
const textInput = document.getElementById('textInput');
const processBtn = document.getElementById('processBtn');
const paragraphList = document.getElementById('paragraphList');
const wordDisplay = document.getElementById('wordDisplay');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const readAllBtn = document.getElementById('readAllBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const themeToggle = document.getElementById('themeToggle');
const progressInfo = document.getElementById('progressInfo');
const pdfInput = document.getElementById('pdfInput');
const uploadBtn = document.getElementById('uploadBtn');
const pdfStatus = document.getElementById('pdfStatus');

// Process text into paragraphs
processBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;

    // Split by double line breaks or single line breaks
    let rawParagraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0);

    // Combine paragraphs with less than 70 words
    paragraphs = [];
    let currentChunk = '';

    for (let i = 0; i < rawParagraphs.length; i++) {
        const para = rawParagraphs[i];
        const wordCount = para.split(/\s+/).filter(w => w.length > 0).length;

        if (currentChunk === '') {
            currentChunk = para;
        } else {
            currentChunk += ' ' + para;
        }

        const totalWords = currentChunk.split(/\s+/).filter(w => w.length > 0).length;

        // If we've reached 70+ words or it's the last paragraph, save the chunk
        if (totalWords >= 70 || i === rawParagraphs.length - 1) {
            paragraphs.push(currentChunk);
            currentChunk = '';
        }
    }

    // Prepare all words for "Read All" feature
    allWords = text.split(/\s+/).filter(w => w.length > 0);

    // Enable Read All button
    readAllBtn.disabled = false;

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

    isReadingAll = false;
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

// Read All button
readAllBtn.addEventListener('click', () => {
    stopPlayback();

    // Clear paragraph selection
    document.querySelectorAll('.paragraph-card').forEach(card => {
        card.classList.remove('active');
    });

    // Set up for reading all text
    isReadingAll = true;
    currentParagraph = null;
    words = allWords;
    currentWordIndex = 0;

    // Enable controls
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;

    // Display first word
    wordDisplay.textContent = words[0];
    progressInfo.textContent = `Word 1 of ${words.length} | Reading All`;
});

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

    if (isReadingAll) {
        progressInfo.textContent = `Word ${current} of ${total} | Reading All`;
    } else {
        progressInfo.textContent = `Word ${current} of ${total} | Paragraph ${currentParagraph + 1}`;
    }
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

// PDF Upload handling
uploadBtn.addEventListener('click', () => {
    pdfInput.click();
});

pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        pdfStatus.textContent = 'Error: Please upload a PDF file';
        pdfStatus.style.color = '#f44336';
        return;
    }

    pdfStatus.textContent = `Processing: ${file.name}...`;
    pdfStatus.style.color = 'var(--text-secondary)';

    try {
        const extractedText = await extractTextFromPDF(file);

        if (extractedText.trim().length === 0) {
            pdfStatus.textContent = 'Error: No text found in PDF';
            pdfStatus.style.color = '#f44336';
            return;
        }

        // Put extracted text into textarea
        textInput.value = extractedText;

        // Auto-process the text
        processBtn.click();

        pdfStatus.textContent = `✓ Loaded: ${file.name} (${extractedText.split(/\s+/).length} words)`;
        pdfStatus.style.color = 'var(--accent-color)';

    } catch (error) {
        console.error('PDF extraction error:', error);
        pdfStatus.textContent = `Error: ${error.message}`;
        pdfStatus.style.color = '#f44336';
    }
});

// Extract text from PDF using PDF.js with edge case handling
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();

    let pdf;
    try {
        pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            // Handle password-protected PDFs
            password: ''
        }).promise;
    } catch (error) {
        if (error.name === 'PasswordException') {
            throw new Error('PDF is password protected. Please unlock it first.');
        }
        throw error;
    }

    let fullText = '';
    const numPages = pdf.numPages;

    // Handle large PDFs
    if (numPages > 500) {
        const proceed = confirm(`This PDF has ${numPages} pages. Processing may take a while. Continue?`);
        if (!proceed) {
            throw new Error('Processing cancelled by user');
        }
    }

    // Track potential headers/footers across pages for detection
    const pageTexts = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Sort text items by vertical position (y) then horizontal (x)
            // This helps with multi-column and reading order issues
            const sortedItems = textContent.items.sort((a, b) => {
                // First sort by y position (top to bottom)
                const yDiff = Math.abs(a.transform[5] - b.transform[5]);
                if (yDiff > 5) { // Same line threshold
                    return b.transform[5] - a.transform[5]; // Higher y = top of page
                }
                // If on same line, sort by x position (left to right)
                return a.transform[4] - b.transform[4];
            });

            // Build text with better spacing
            let pageText = '';
            let lastY = null;

            for (let i = 0; i < sortedItems.length; i++) {
                const item = sortedItems[i];
                const currentY = item.transform[5];

                // Add line break if y position changed significantly
                if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                    pageText += '\n';
                }

                // Handle hyphenation: remove hyphen if word continues on next line
                let text = item.str;
                if (text.endsWith('-') && i < sortedItems.length - 1) {
                    const nextItem = sortedItems[i + 1];
                    // If next item is on a new line and starts with lowercase, likely continuation
                    if (Math.abs(nextItem.transform[5] - currentY) > 5 && /^[a-z]/.test(nextItem.str)) {
                        text = text.slice(0, -1); // Remove hyphen
                    }
                }

                // Add space between words if needed
                if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ') && text.trim().length > 0) {
                    pageText += ' ';
                }

                pageText += text;
                lastY = currentY;
            }

            // Clean up the page text
            const cleanedPageText = pageText
                .replace(/\s+/g, ' ')  // Multiple spaces to single space
                .replace(/\n\s+/g, '\n')  // Remove spaces after line breaks
                .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive line breaks
                .trim();

            if (cleanedPageText.length > 10) { // Skip nearly empty pages
                pageTexts.push(cleanedPageText);
            }

        } catch (pageError) {
            console.warn(`Error processing page ${pageNum}:`, pageError);
            // Continue with other pages
        }
    }

    // Check if PDF appears to be scanned (no text extracted)
    if (pageTexts.length === 0 || pageTexts.join('').length < 100) {
        throw new Error('PDF appears to be scanned or has no extractable text. OCR is not currently supported.');
    }

    // Join all pages
    fullText = pageTexts.join('\n\n');

    // Final cleanup
    fullText = fullText
        .replace(/[^\S\n]+/g, ' ')  // Normalize spaces but keep line breaks
        .replace(/\n\s*\n\s*\n/g, '\n\n')  // Max 2 line breaks
        .trim();

    return fullText;
}
