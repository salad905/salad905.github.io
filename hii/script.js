// ── Encrypted vault ──────────────────────────────────────────────────────────
// The letter text, photos, and audio are all AES-GCM encrypted at build time
// with a key derived from the password (PBKDF2). Nothing readable exists in
// this repo — even someone browsing the raw files on GitHub only finds
// ciphertext. Decryption happens here, in the browser, after a correct
// password is entered. AES-GCM's built-in authentication tag also doubles as
// the "is this the right password" check: decrypting with the wrong key
// throws instead of silently returning garbage.

const subtle = crypto.subtle;
const vaultPromise = fetch('media/vault.json').then(r => r.json());

function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function deriveKey(password, saltB64, iterations) {
    const passKey = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations, hash: 'SHA-256' },
        passKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
}

async function decryptItem(key, item) {
    const iv = b64ToBytes(item.iv);
    const data = b64ToBytes(item.data);
    return subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
}

// ── Lock screen ──────────────────────────────────────────────────────────────

const lockScreen = document.getElementById('lock-screen');
const lockForm = document.getElementById('lock-form');
const lockInput = document.getElementById('lock-input');
const lockError = document.getElementById('lock-error');
const lockBtn = lockForm.querySelector('.lock-btn');
const letterText = document.getElementById('letter-text');
const carouselTrack = document.getElementById('carousel-track');

function buildCarousel(urls) {
    const doubled = urls.concat(urls);
    carouselTrack.innerHTML = '';
    doubled.forEach((url) => {
        const slot = document.createElement('div');
        slot.className = 'photo-slot';
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        slot.appendChild(img);
        carouselTrack.appendChild(slot);
    });
}

lockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    lockError.textContent = '';
    lockBtn.disabled = true;
    lockBtn.textContent = 'unlocking…';

    let vault;
    try {
        vault = await vaultPromise;
    } catch (err) {
        lockError.textContent = "couldn't load the letter — open this from the actual website link, not by double-clicking the file";
        lockBtn.disabled = false;
        lockBtn.textContent = 'unlock';
        return;
    }

    try {
        const key = await deriveKey(lockInput.value, vault.salt, vault.iterations);

        const letterBuf = await decryptItem(key, vault.letter); // throws on wrong password
        letterText.innerHTML = new TextDecoder().decode(letterBuf);

        const photoBufs = await Promise.all(vault.photos.map(p => decryptItem(key, p)));
        const photoUrls = photoBufs.map((buf, i) => URL.createObjectURL(new Blob([buf], { type: vault.photos[i].type })));
        buildCarousel(photoUrls);

        const audioBuf = await decryptItem(key, vault.audio);
        readingAudio.src = URL.createObjectURL(new Blob([audioBuf], { type: vault.audio.type }));

        lockScreen.classList.add('is-unlocked');
    } catch (err) {
        lockError.textContent = 'hint: ishbash??';
        lockInput.value = '';
        lockInput.focus();
    } finally {
        lockBtn.disabled = false;
        lockBtn.textContent = 'unlock';
    }
});

// ── Envelope open ────────────────────────────────────────────────────────────

const stage = document.getElementById('stage');
const envelopeBtn = document.getElementById('envelope-btn');

let isOpen = false;

envelopeBtn.addEventListener('click', () => {
    if (isOpen) return;
    isOpen = true;
    stage.classList.add('is-open');
});

// ── Audio reading ────────────────────────────────────────────────────────────

const audioBtn = document.getElementById('audio-btn');
const audioIcon = document.getElementById('audio-icon');
const readingAudio = document.getElementById('reading-audio');

audioBtn.addEventListener('click', async () => {
    if (readingAudio.paused) {
        try {
            await readingAudio.play();
        } catch (err) {
            return; // audio not decrypted/available yet
        }
    } else {
        readingAudio.pause();
    }
});

readingAudio.addEventListener('play', () => {
    audioIcon.textContent = '⏸';
    audioBtn.classList.add('is-playing');
    readingAudio.controls = true; // reveal native scrub/volume controls once playback starts
});
readingAudio.addEventListener('pause', () => {
    audioIcon.textContent = '▶';
    audioBtn.classList.remove('is-playing');
});
readingAudio.addEventListener('ended', () => {
    audioIcon.textContent = '▶';
    audioBtn.classList.remove('is-playing');
});
