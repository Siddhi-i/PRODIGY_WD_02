// Stopwatch state
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let lapCounter = 0;
let laps = []; // { totalTime, splitTime }
let previousLapTime = 0;

// DOM elements
const display = document.getElementById('display');
const displayWrapper = document.getElementById('displayWrapper');
const runningIndicator = document.getElementById('runningIndicator');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');
const lapsList = document.getElementById('lapsList');
const lapCountEl = document.getElementById('lapCount');
const bestLapEl = document.getElementById('bestLap');
const copyBtn = document.getElementById('copyBtn');
const clearLapsBtn = document.getElementById('clearLapsBtn');
const themeToggle = document.getElementById('themeToggle');

// Theme
function initTheme() {
    const saved = localStorage.getItem('stopwatch-theme');
    const prefersDark = !window.matchMedia?.('(prefers-color-scheme: light)').matches;
    document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('stopwatch-theme', next);
}

// Format time as MM:SS.ms
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
}

// Update display
function updateDisplay() {
    const now = Date.now();
    elapsedTime = startTime ? now - startTime : 0;
    display.textContent = formatTime(elapsedTime);
}

// Update stats bar
function updateStats() {
    lapCountEl.textContent = `${lapCounter} lap${lapCounter !== 1 ? 's' : ''}`;
    if (laps.length > 0) {
        const best = Math.min(...laps.map(l => l.splitTime));
        bestLapEl.textContent = `Best: ${formatTime(best)}`;
        bestLapEl.classList.add('best');
    } else {
        bestLapEl.textContent = 'Best: —';
        bestLapEl.classList.remove('best');
    }
}

// Update laps UI
function renderLaps() {
    if (laps.length === 0) {
        lapsList.innerHTML = '<li class="empty-laps">No lap times recorded</li>';
    } else {
        const best = Math.min(...laps.map(l => l.splitTime));
        const worst = laps.length > 1 ? Math.max(...laps.map(l => l.splitTime)) : null;

        lapsList.innerHTML = laps.map((lap, i) => {
            const idx = laps.length - i;
            let cls = 'lap-item';
            if (lap.splitTime === best) cls += ' best';
            if (worst !== null && lap.splitTime === worst && lap.splitTime !== best) cls += ' worst';
            return `<li class="${cls}">
                <span class="lap-number">Lap ${idx}</span>
                <span class="lap-time">${formatTime(lap.totalTime)}</span>
                <span class="lap-split">+${formatTime(lap.splitTime)}</span>
            </li>`;
        }).reverse().join('');
    }

    const hasLaps = laps.length > 0;
    copyBtn.disabled = !hasLaps;
    clearLapsBtn.disabled = !hasLaps;
}

// Start stopwatch
function start() {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateDisplay, 10);
        isRunning = true;
        displayWrapper.classList.add('running');

        startBtn.disabled = true;
        pauseBtn.disabled = false;
        lapBtn.disabled = false;
    }
}

// Pause stopwatch
function pause() {
    if (isRunning) {
        clearInterval(timerInterval);
        elapsedTime = Date.now() - startTime;
        isRunning = false;
        displayWrapper.classList.remove('running');

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        lapBtn.disabled = true;
    }
}

// Reset stopwatch
function reset() {
    pause();
    elapsedTime = 0;
    startTime = 0;
    lapCounter = 0;
    previousLapTime = 0;
    laps = [];
    display.textContent = '00:00:00.00';

    lapsList.innerHTML = '<li class="empty-laps">No lap times recorded</li>';
    updateStats();
    copyBtn.disabled = true;
    clearLapsBtn.disabled = true;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    lapBtn.disabled = true;
}

// Record lap time
function lap() {
    if (isRunning && elapsedTime > 0) {
        lapCounter++;
        const splitTime = elapsedTime - previousLapTime;
        previousLapTime = elapsedTime;
        laps.push({ totalTime: elapsedTime, splitTime });
        renderLaps();
        updateStats();
    }
}

// Clear laps only
function clearLaps() {
    laps = [];
    lapCounter = 0;
    previousLapTime = elapsedTime;
    renderLaps();
    updateStats();
}

// Copy laps to clipboard
function copyLaps() {
    if (laps.length === 0) return;
    const lines = laps.map((lap, i) => 
        `Lap ${i + 1}: ${formatTime(lap.totalTime)} (+${formatTime(lap.splitTime)})`
    ).reverse();
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        copyBtn.disabled = true;
        setTimeout(() => {
            copyBtn.innerHTML = orig;
            copyBtn.disabled = false;
        }, 1500);
    });
}

// Keyboard shortcuts
function handleKeydown(e) {
    if (e.target.matches('input, textarea, select')) return;
    switch (e.code) {
        case 'Space':
            e.preventDefault();
            isRunning ? pause() : start();
            break;
        case 'KeyR':
            e.preventDefault();
            reset();
            break;
        case 'KeyL':
            e.preventDefault();
            if (lapBtn.disabled === false) lap();
            break;
    }
}

// Event listeners
initTheme();
themeToggle.addEventListener('click', toggleTheme);
startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);
lapBtn.addEventListener('click', lap);
copyBtn.addEventListener('click', copyLaps);
clearLapsBtn.addEventListener('click', clearLaps);
document.addEventListener('keydown', handleKeydown);

// Initialize
lapsList.innerHTML = '<li class="empty-laps">No lap times recorded</li>';
updateStats();
