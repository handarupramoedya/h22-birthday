// --- CONFIGURATION ---
const TARGET_FREQUENCY = 13.6; // Tanggal lahir target: 13 Juni

// Tanda petik diubah menjadi single quote (') agar format JSON ke Make.com aman dan valid!
const TRANSMISSIONS = [
    { header: '[ TRANSMISI 01 ]', q: 'Transmisi diterima. Hal apa yang masih ingin kamu bawa bersamamu ke tahun berikutnya?' },
    { header: '[ TRANSMISI 02 ]', q: 'Sinyal masa lalu terdeteksi. Jika bisa berbicara dengan dirimu setahun yang lalu, apa yang ingin kamu katakan?' },
    { header: '[ TRANSMISI 03 ]', q: 'Data sedang diarsipkan. Kenangan apa dari tahun ini yang paling ingin kamu simpan?' },
    { header: '[ TRANSMISI 04 ]', q: 'Anomali teridentifikasi. Pengalaman apa yang paling mengubahmu selama setahun terakhir?' },
    { header: '[ TRANSMISI 05 ]', q: 'Proses hampir selesai. Saat membaca ini setahun dari sekarang, apa yang ingin kamu dengar dari dirimu hari ini?' },
    { header: '[ TRANSMISI 06 - FINAL ]', q: 'Sistem enkripsi kapsul waktu aktif. Masukkan alamat email aktifmu (email RP aja) untuk mengunci pesan ini ke masa depan...' }
];

let savedAnswers = {};

// --- SCHRÖDINGER LOCK (Mendeteksi kunjungan ulang) ---
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('transmission_burned') === 'true') {
        hancurkanWebsiteLansung();
    }
});

// Fungsi pembantu jika user nekat refresh halaman setelah web hangus
function hancurkanWebsiteLansung() {
    document.getElementById('radio-layer').classList.add('hidden');
    if(document.getElementById('photobooth-layer')) document.getElementById('photobooth-layer').classList.add('hidden');
    if(document.getElementById('letter-layer')) document.getElementById('letter-layer').classList.add('hidden');
    if(document.getElementById('void-layer')) document.getElementById('void-layer').classList.add('hidden');
    
    const burned = document.getElementById('burned-layer');
    burned.classList.remove('hidden');
    burned.style.opacity = '1';
    
    // Picu audio beep tak berujung via interaksi user
    document.body.addEventListener('click', () => {
        putarSuaraBeep(999);
    }, { once: true });
}

// --- DATABASE AUTOMATION CONNECTOR ---
function sendToAutomation(data) {
    console.log("Mengirim paket data kapsul waktu...", data);
    
    fetch('https://hook.eu1.make.com/l6p18if1ymveljsxob42ci38kuw1qo19', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => console.log("Data berhasil terkirim ke kapsul waktu!"))
    .catch(error => console.error("Gagal mengirim data:", error));
}

// --- AUDIO NOISE ENGINE (Suara Statis Radio) ---
let audioCtx, noiseNode, gainNode;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    noiseNode = audioCtx.createBufferSource();
    let bufferSize = 2 * audioCtx.sampleRate,
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
        output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    gainNode = audioCtx.createGain();
    noiseNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    noiseNode.start();
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime); 
}

// --- RADIO SLIDER INTERACTION ---
const tuner = document.getElementById('tuner');
const freqVal = document.getElementById('freq-val');
const bgm = document.getElementById('bgm');

if (tuner) {
    tuner.addEventListener('input', (e) => {
        if(!audioCtx) initAudio();
        let val = parseFloat(e.target.value).toFixed(1);
        freqVal.innerText = val;
        
        let distance = Math.abs(val - TARGET_FREQUENCY);
        
        if(distance === 0) {
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            if(audioCtx) audioCtx.close();
            
            document.getElementById('radio-layer').classList.add('hidden');
            document.getElementById('interlude-layer').classList.remove('hidden');
            
            bgm.volume = 0.5;
            bgm.play();
            
            setTimeout(() => {
                document.getElementById('interlude-layer').classList.add('hidden');
                document.getElementById('void-layer').classList.remove('hidden');
                startVoidPhase();
            }, 4000);
            
        } else {
            let maxDistance = 30;
            let volumeFactor = Math.min(distance / maxDistance, 1);
            let currentVolume = volumeFactor * 0.4; 
            
            gainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
        }
    });
}

// --- THE VOID ENGINE & ANIMASI PASIR CANVAS ---
const canvas = document.getElementById('canvas-sand');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let currentIdx = 0;

function resizeCanvas() { 
    if(canvas) {
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startVoidPhase() { 
    showQuestion(); 
    animate(); 
}

function showQuestion() {
    const answerInput = document.getElementById('answer-input');
    if (currentIdx < TRANSMISSIONS.length) {
        document.getElementById('tx-header').innerText = TRANSMISSIONS[currentIdx].header;
        document.getElementById('question').innerText = TRANSMISSIONS[currentIdx].q;
        answerInput.value = "";
        if(currentIdx === 5) {
            answerInput.placeholder = "contoh: nama@email.com";
            answerInput.type = "email";
        }
    } else {
        sendToAutomation(savedAnswers);
        document.getElementById('void-layer').classList.add('hidden');
        document.getElementById('letter-layer').classList.remove('hidden');
    }
}

const inputEl = document.getElementById('answer-input');
if (inputEl) {
    inputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim() !== "" && currentIdx < TRANSMISSIONS.length) {
            let ans = this.value;
            this.disabled = true; 
            savedAnswers[`pertanyaan_${currentIdx+1}`] = TRANSMISSIONS[currentIdx].q;
            savedAnswers[`jawaban_${currentIdx+1}`] = ans;
            savedAnswers[`waktu_isi`] = new Date().toISOString();

            createSandParticles(ans.length);
            currentIdx++;
            setTimeout(() => { this.disabled = false; showQuestion(); }, 1200);
        }
    });
}

function createSandParticles(length) {
    let count = Math.min(length * 15, 450); 
    let startY = window.innerHeight / 2 + 80;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: (window.innerWidth / 2 - 150) + Math.random() * 300,
            y: startY + (Math.random() * 10 - 5),
            vx: Math.random() * 1.5 - 0.75,
            vy: Math.random() * 3 + 2,
            color: '#ffffff',
            isSettled: false
        });
    }
}

function animate() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        if (!p.isSettled) {
            p.x += p.vx; 
            p.y += p.vy;
            let ground = canvas.height - 15;
            if (p.y >= ground) {
                p.y = ground - (Math.random() * (particles.filter(pt => pt.isSettled).length * 0.025)); 
                p.vy = 0; p.vx = 0; p.isSettled = true;
                p.color = '#00ffcc';
            }
        }
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
    });
    requestAnimationFrame(animate);
}

// ==================== PHOTOBOOTH ====================

const FRAME_SRC = 'jagoan-bday.png';
const CUTOUT = { x: 0.291, y: 0.406, w: 0.417, h: 0.443 };

const frameImg = new Image();
frameImg.src = FRAME_SRC;

const openPbBtn = document.getElementById('open-photobooth-btn');
if (openPbBtn) {
    openPbBtn.addEventListener('click', () => {
        document.getElementById('letter-layer').classList.add('hidden');
        const pb = document.getElementById('photobooth-layer');
        pb.classList.remove('hidden');
        pb.style.opacity = '1';
        pb.style.pointerEvents = 'auto';
        initPhotobooth();
    });
}

let stream = null;
let recordedChunks = [];
let videoRecorder = null;
let hasTakenPhoto = false;

const displayCanvas = document.getElementById('display-canvas');
const dCtx = displayCanvas ? displayCanvas.getContext('2d') : null;
const exportCanvas = document.getElementById('export-canvas');
const eCtx = exportCanvas ? exportCanvas.getContext('2d') : null;

const TMPL_W = 1080, TMPL_H = 1350;

async function initPhotobooth() {
    const videoEl = document.getElementById('camera-feed');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        videoEl.srcObject = stream;
        await new Promise(r => videoEl.onloadedmetadata = r);
        videoEl.play();
        setStatus('Kamera aktif. Siapkan pose terbaikmu! 📸');
        startLivePreview();
    } catch (err) {
        setStatus('Kamera tidak tersedia. Silakan upload foto.');
        const takeBtn = document.getElementById('btn-take');
        if(takeBtn) takeBtn.style.display = 'none';
    }
}

function getCanvasSize() {
    const wrapper = document.querySelector('.photo-stage');
    const containerW = wrapper ? wrapper.clientWidth : window.innerWidth;
    const maxW = Math.min(containerW, 520);
    const maxH = window.innerHeight * 0.60;
    const ratio = TMPL_W / TMPL_H; 
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    return { w: Math.floor(w), h: Math.floor(h) };
}

function drawFrame(canvas, ctx, source, isVideo, forceW, forceH) {
    const w = forceW || getCanvasSize().w;
    const h = forceH || getCanvasSize().h;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    const cx = CUTOUT.x * w;
    const cy = CUTOUT.y * h;
    const cw = CUTOUT.w * w;
    const ch = CUTOUT.h * h;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();

    if (isVideo && source && source.readyState >= 2) {
        const vw = source.videoWidth || 640;
        const vh = source.videoHeight || 480;
        const scale = Math.max(cw / vw, ch / vh);
        const sw = vw * scale;
        const sh = vh * scale;
        ctx.translate(cx + cw / 2, cy + ch / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(source, -sw / 2, -sh / 2, sw, sh);
    } else if (!isVideo && source) {
        const iw = source.naturalWidth || source.width || 1;
        const ih = source.naturalHeight || source.height || 1;
        const scale = Math.max(cw / iw, ch / ih);
        const sw = iw * scale;
        const sh = ih * scale;
        ctx.drawImage(source, cx + (cw - sw) / 2, cy + (ch - sh) / 2, sw, sh);
    }
    ctx.restore();

    if (frameImg.complete && frameImg.naturalWidth > 0) {
        ctx.drawImage(frameImg, 0, 0, w, h);
    }
}

function startLivePreview() {
    const video = document.getElementById('camera-feed');
    function loop() {
        if (!hasTakenPhoto) drawFrame(displayCanvas, dCtx, video, true);
        requestAnimationFrame(loop);
    }
    if (frameImg.complete && frameImg.naturalWidth > 0) {
        loop();
    } else {
        frameImg.onload = loop;
    }
}

document.getElementById('btn-take').addEventListener('click', () => {
    if (hasTakenPhoto) return;
    document.getElementById('btn-take').disabled = true;
    startCountdownAndRecord();
});

async function startCountdownAndRecord() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNum = document.getElementById('countdown-number');
    const flashEl = document.getElementById('flash-overlay');

    recordedChunks = [];
    if (stream) {
        try {
            const canvasStream = displayCanvas.captureStream(30);
            const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? { mimeType: 'video/webm;codecs=vp8' } : {};
            videoRecorder = new MediaRecorder(canvasStream, options);
            videoRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            videoRecorder.start();
        } catch(e) { console.warn('Canvas recording failed:', e); }
    }

    countdownOverlay.classList.remove('hidden');
    setStatus('Berpose...');

    for (let i = 5; i >= 1; i--) {
        countdownNum.textContent = i;
        countdownNum.style.animation = 'none';
        countdownNum.offsetHeight;
        countdownNum.style.animation = 'countPulse 1s ease-out';
        await sleep(1000);
    }

    countdownOverlay.classList.add('hidden');
    flashEl.classList.remove('hidden');
    flashEl.classList.add('flash-animate');
    setTimeout(() => { flashEl.classList.add('hidden'); flashEl.classList.remove('flash-animate'); }, 600);

    const video = document.getElementById('camera-feed');
    drawFrame(exportCanvas, eCtx, video, true, TMPL_W, TMPL_H);
    drawFrame(displayCanvas, dCtx, video, true);
    hasTakenPhoto = true;

    setTimeout(() => {
        if (videoRecorder && videoRecorder.state !== 'inactive') videoRecorder.stop();
    }, 300);

    showPostPhotoControls();
    setStatus('Cekrek! Koran memuat fotomu. Selesai & kunci transmisi jika sudah disimpan!');
}

function showPostPhotoControls() {
    document.getElementById('btn-take').style.display = 'none';
    document.getElementById('label-upload').style.display = 'none';
    document.getElementById('btn-retake').style.display = 'inline-flex';
    document.getElementById('download-controls').classList.remove('hidden');
    document.getElementById('btn-finish').style.display = 'inline-block';
}

document.getElementById('btn-retake').addEventListener('click', () => {
    hasTakenPhoto = false;
    recordedChunks = [];

    document.getElementById('btn-take').style.display = 'inline-block';
    document.getElementById('btn-take').disabled = false;
    document.getElementById('label-upload').style.display = 'inline-block';
    document.getElementById('btn-retake').style.display = 'none';
    document.getElementById('download-controls').classList.add('hidden');

    const video = document.getElementById('camera-feed');
    function loop() {
        if (!hasTakenPhoto) { drawFrame(displayCanvas, dCtx, video, true); requestAnimationFrame(loop); }
    }
    loop();
    setStatus('Siap untuk pose berikutnya!');
});

document.getElementById('file-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            drawFrame(displayCanvas, dCtx, img, false);
            drawFrame(exportCanvas, eCtx, img, false, TMPL_W, TMPL_H);
            hasTakenPhoto = true;
            showPostPhotoControls();
            setStatus('Foto berhasil ditempel ke koran!');
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('btn-dl-jpg').addEventListener('click', () => {
    exportCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'birthday-chapter22.jpg'; a.click();
        URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
});

document.getElementById('btn-dl-png').addEventListener('click', () => {
    exportCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'birthday-chapter22.png'; a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

document.getElementById('btn-dl-video').addEventListener('click', () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'birthday-chapter22.webm'; a.click();
    URL.revokeObjectURL(url);
});

// --- ENGINE SUARA BEEP (Web Audio API) ---
function putarSuaraBeep(durasiDetik) {
    try {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, actx.currentTime); 
        gain.gain.setValueAtTime(0.4, actx.currentTime);
        
        osc.start(actx.currentTime);
        osc.stop(actx.currentTime + durasiDetik);
    } catch(e) {
        console.log("AudioContext gagal berputar otomatis.");
    }
}

// --- TOMBOL SELESAI (Kunci total sistem, bunyikan BEEP, dan munculkan Burned Layer) ---
document.getElementById('btn-finish').addEventListener('click', () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); }
    if (bgm) { bgm.pause(); }
    localStorage.setItem('transmission_burned', 'true');
    putarSuaraBeep(10);
    const pb = document.getElementById('photobooth-layer');
    pb.classList.add('hidden');
    pb.style.display = 'none';

    const burned = document.getElementById('burned-layer');
    burned.classList.remove('hidden');
    burned.style.opacity = '1';
});

function setStatus(msg) { 
    const statusEl = document.getElementById('pb-status');
    if(statusEl) statusEl.textContent = msg; 
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }