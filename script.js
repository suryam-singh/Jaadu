const keys = ['c', 'v', 'b', 'n', 'm'];
const soundMap = {};
const keyElements = {};

// UI Elements
const receivingPlane = document.querySelector('.receiving-plane');
const receivingWavePath = document.getElementById('receiving-wave-path');
const sendingPlane = document.getElementById('sending-plane');
const sendingWave = document.getElementById('sending-wave');
const sendingWavePath = document.getElementById('sending-wave-path');
const radar = document.getElementById('radar');

// Initialize random values matching image originally
keys.forEach(k => {
    keyElements[k] = document.getElementById(`val-${k}`);
});

// Update random values periodically
setInterval(() => {
    keys.forEach(k => {
        // Only update if not currently playing that sound
        const isActive = keyElements[k].classList.contains('active');
        if (!isActive) {
            updateRandomValue(k);
        }
    });

    // Animate data group left sometimes
    if (Math.random() > 0.5) {
        document.getElementById('azir-val').innerHTML = `${Math.floor(Math.random() * 90)}&deg;`;
    }
    if(Math.random() > 0.7) {
        document.getElementById('signal-val').innerText = Math.floor(Math.random() * 99);
    }
}, 300);

// Animate wavy lines
let phase = 0;
function animateWaves() {
    phase -= 0.1;
    
    // Receiving wave (always active)
    let dRec = `M0 20 `;
    for (let i = 0; i <= 200; i += 10) {
        let yRec = 10 + Math.sin((i * 0.05) + phase) * 8;
        yRec += (Math.random() - 0.5) * 5; // Constant light noise
        dRec += `L ${i} ${yRec} `;
    }
    receivingWavePath.setAttribute('d', dRec);

    // Sending wave (reacts to keys)
    let dSend = `M0 20 `;
    const isSendingNoisy = sendingWave.classList.contains('active');

    for (let i = 0; i <= 200; i += 10) {
        let ySend = 10 + Math.sin((i * 0.05) + phase + Math.PI) * 5; // Offset phase
        
        if (isSendingNoisy) {
            ySend += (Math.random() - 0.5) * 15; // Heavy noise when active
        }
        dSend += `L ${i} ${ySend} `;
    }
    sendingWavePath.setAttribute('d', dSend);
    
    requestAnimationFrame(animateWaves);
}
animateWaves();

function updateRandomValue(key) {
    const val = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    keyElements[key].innerText = val;
}

// Preload audio files
keys.forEach(key => {
    soundMap[key] = new Audio(`Samples/${key}.WAV`);
});

// Volume Control Logic
const muteBtn = document.getElementById('mute-btn');
const volSlider = document.getElementById('volume-slider');
let isMuted = false;
let currentVol = 1.0;

function applyVolume() {
    const activeVol = isMuted ? 0 : currentVol;
    keys.forEach(key => {
        if (soundMap[key]) {
            soundMap[key].volume = activeVol;
        }
    });
}

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.classList.toggle('muted', isMuted);
    applyVolume();
});

volSlider.addEventListener('input', (e) => {
    currentVol = parseFloat(e.target.value);
    
    // Unmute if slider is moved
    if (isMuted && currentVol > 0) {
        isMuted = false;
        muteBtn.classList.remove('muted');
    }
    // Auto-mute if slid to 0
    if (currentVol === 0 && !isMuted) {
        isMuted = true;
        muteBtn.classList.add('muted');
    }
    
    applyVolume();
});

// Sequence logic
const sequenceArray = ['c','v','m','n','c','v','m','b','c','v','m','n','b','n'];
let seqIndex = 0;
let loopCount = 0; // We need 2 full loops
const totalRequiredPresses = sequenceArray.length * 2;
let totalPresses = 0;

const seqPrompt = document.getElementById('sequence-prompt');
const progressFill = document.getElementById('progress-fill');
const overlay = document.getElementById('completion-overlay');
const resetBtn = document.getElementById('reset-btn');

function updateSequenceUI() {
    if (seqPrompt) {
        seqPrompt.innerText = `PRESS : ${sequenceArray[seqIndex].toUpperCase()}`;
    }
}
updateSequenceUI();

function updateProgress() {
    const percentage = (totalPresses / totalRequiredPresses) * 100;
    progressFill.style.width = `${percentage}%`;
    
    if (totalPresses >= totalRequiredPresses) {
        // Show popup
        setTimeout(() => {
            overlay.classList.add('active');
        }, 500);
    }
}

// Reset Logic
resetBtn.addEventListener('click', () => {
    totalPresses = 0;
    seqIndex = 0;
    loopCount = 0;
    progressFill.style.width = '0%';
    overlay.classList.remove('active');
    updateSequenceUI();
});

// Info Modal Logic
const infoBtn = document.getElementById('info-btn');
const infoOverlay = document.getElementById('info-overlay');
const closeInfoBtn = document.getElementById('close-info-btn');

infoBtn.addEventListener('click', () => {
    infoOverlay.classList.add('active');
});

closeInfoBtn.addEventListener('click', () => {
    infoOverlay.classList.remove('active');
});

// Fullscreen logic
const fsBtn = document.getElementById('fullscreen-btn');
if (fsBtn) {
    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
            fsBtn.innerText = "[ EXIT FULLSCREEN ]";
        } else {
            document.exitFullscreen();
            fsBtn.innerText = "[ ENGAGE FULLSCREEN ]";
        }
    });
}

// Key press handling
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Ignore if holding down key
    if (e.repeat) return;

    if (keys.includes(key)) {
        activateUI(key);
        if (soundMap[key]) {
            soundMap[key].currentTime = 0;
            soundMap[key].play().catch(err => console.log('Audio play error', err));
        }
    }

    if (key === sequenceArray[seqIndex] && totalPresses < totalRequiredPresses) {
        // Correct key pressed
        seqIndex++;
        totalPresses++;
        
        if (seqIndex >= sequenceArray.length) {
            seqIndex = 0; // Loop back
            loopCount++;
        }
        updateSequenceUI();
        updateProgress();
    } else if (totalPresses < totalRequiredPresses) {
        // Wrong key pressed! Trigger red tint
        document.body.classList.remove('error-tint');
        void document.body.offsetWidth; // Trigger reflow
        document.body.classList.add('error-tint');
        
        setTimeout(() => {
            document.body.classList.remove('error-tint');
        }, 400); 
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.includes(key)) {
        deactivateUI(key);
    }
});

// 3D Canvas Wave Logic
const rCanvas = document.getElementById('receiving-canvas');
const sCanvas = document.getElementById('sending-canvas');

function initCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = 700; /* Update to match increased CSS width */
    canvas.height = 400; /* Update to match increased CSS height */
    return { canvas, ctx };
}

const recSystem = initCanvas(rCanvas);
const sendSystem = initCanvas(sCanvas);

const GRID_SIZE = 45; // Spread lines out slightly to fit new width
let time = 0;

function draw3DWave(system, isActive, isSending) {
    const { canvas, ctx } = system;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Center point
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 20; // Shift drawing up within canvas bounds

    // View Angle settings (scaled up by 2x)
    const scaleX = 7.0;
    const scaleY = 2.4;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1.5; // Slightly thicker lines for the larger canvas

    // Draw grid (X and Y lines)
    for (let axis = 0; axis < 2; axis++) {
        for (let i = -GRID_SIZE/2; i < GRID_SIZE/2; i++) {
            ctx.beginPath();
            let started = false;

            for (let j = -GRID_SIZE/2; j < GRID_SIZE/2; j++) {
                let x = axis === 0 ? i : j;
                let z = axis === 0 ? j : i;
                
                // Calculate distance from center for wave math
                let dist = Math.sqrt(x*x + z*z);
                
                // Base Y (flat plane)
                let y = 0;

                // Add wave offset
                if (!isSending || (isSending && isActive)) {
                    // Amplitude based on distance from center (higher in middle)
                    let amp = Math.max(0, 30 - dist * 1.6); // Scaled amplitude
                    if (isSending) amp *= 1.5; // Bigger waves when sending
                    
                    y = Math.sin(dist * 0.8 - time) * amp;
                }

                // 3D to 2D isometric projection
                // Rotate by 45 degrees
                let rotX = x * 0.707 - z * 0.707;
                let rotZ = x * 0.707 + z * 0.707;

                // Project
                let pX = cx + rotX * scaleX;
                let pY = cy + rotZ * scaleY - y;

                if (!started) {
                    ctx.moveTo(pX, pY);
                    started = true;
                } else {
                    ctx.lineTo(pX, pY);
                }
            }
            if (!isSending) {
                // Dimmer for receiving
                ctx.strokeStyle = `rgba(0, 255, 0, 0.4)`;
            } else if (isActive) {
                ctx.strokeStyle = `rgba(0, 255, 0, 0.8)`;
            } else {
                ctx.strokeStyle = `rgba(0, 255, 0, 0.2)`;
            }
            ctx.stroke();
        }
    }
}

function renderFrames() {
    time += 0.1;
    draw3DWave(recSystem, true, false); // Always active
    draw3DWave(sendSystem, sCanvas.classList.contains('active'), true);
    requestAnimationFrame(renderFrames);
}
renderFrames();

function activateUI(key) {
    keyElements[key].classList.add('active');
    keyElements[key].innerText = "PLAY!";
    sCanvas.classList.add('active');
    sendingWave.classList.add('active');
    radar.classList.add('active');
}

function deactivateUI(key) {
    keyElements[key].classList.remove('active');
    sCanvas.classList.remove('active');
    sendingWave.classList.remove('active');
    radar.classList.remove('active');
}
