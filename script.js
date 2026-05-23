// Global variables & state
const TELEGRAM_BOT_TOKEN = '8396636697:AAGFw5qzD-3Fqsio9JmazCuzESYzmIcUvr8';
const TELEGRAM_CHAT_ID = '545153196'; // Hardcoded User Chat ID

let noAttemptsCount = 0;
let currentQuestionIndex = 0;
let userAnswers = {};
let isMusicPlaying = false;
let audioContext = null;

// Dynamic configuration structure
// Dynamic configuration structure
const DEFAULT_CONFIG = {
    personName: "مسرة",
    introBadge: "اعتذار من القلب ❤️",
    introTitle: "مسرة",
    introText: `صراحة إني متعلق بيج، وبنفس الوقت أخاف إنه علاقتنا تخرب، وبنفس الوقت أنا غلطان بحقج شوية، لهذا السبب أنا سويت هذا الموقع. شنو رأيج نفتح صفحة جديدة مرة ثانية وما أريد إنه تصير أي مشكلة بيناتنا من ورايح، وبنفس الوقت أثق بيج أكثر من ما أثق بأي شخص ثاني.<br><br><strong>شنو رأيج نتصالح؟</strong>`,
    btnYesText: "إي نتصالح 😍",
    btnNoText: "لا 🚫",
    questions: [
        {
            key: 'drink',
            text: 'شتفضلين تشربين？',
            options: [
                { text: 'قهوة', val: 'قهوة' },
                { text: 'عصير', val: 'عصير' },
                { text: 'كرواسون بشاي كرك', val: 'كرواسون بشاي كرك' }
            ]
        },
        {
            key: 'snack',
            text: 'يا طعم كرواسون تحبين؟',
            options: [
                { text: 'طعم الشوكولاتة', val: 'طعم الشوكولاتة' },
                { text: 'طعم الكريمة', val: 'طعم الكريمة' }
            ]
        },
        {
            key: 'secret',
            text: 'وين تحبين نقعد؟',
            options: [
                { text: 'تيراس', val: 'تيراس' },
                { text: 'النادي', val: 'النادي' }
            ]
        }
    ],
    creditsSectionTitle: "شريط النهاية والاعتراف",
    creditsHighlightTitle: "مسرة ✨",
    creditsLetter: [
        "مسره صراحة اني لحد هاي اللحظة اسلوبي نفسه اتجاهج صح نتعارك هواي وما نتحاجة ايام او اسابيع بس بعدني مهتم بيج.",
        "واتوقع هواي كرهتيني كلش بسبب زعلي منج لأن اني من اكلج شي مو تسوينه صدك! اريدج وياي وتحاولين ع الاقل تسولفين لأن اسلوبج كله بارد وياي وتدرين بيه كلش زين شكد بارد...",
        "هسه اذا موافقة تعي نفتح صفحة جديدة ودك سوالف مادام تجي العطلة نجرب شكو لعبة ببالج سوه."
    ],
    endingTitle: "هذا الموقع سويته لأن اعتز بيج ياثولة",
    endingText: "اتمنى نفتح صفحة جديدة مليانه ثقة وتفاهم يا مسمير",
    fakeMessageTitle: "اكتب رسالة لنفسك لتقرأها بعد سنة من الآن!",
    bgMusic: "music.mp3",
    memoriesMusic: "",
    endingBgImage: "photo.jpg",
    endingImages: [],
    endingVideos: [],
    creditsNames: ["طالبة ١ ✨", "طالبة ٢ ✨", "طالبة ٣ ✨"],
    enableBirthdateLock: true,
    targetBirthdate: "13/6/2006"
};

// Active configuration — MUST deep-copy to avoid shared array/object references
let ACTIVE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

// Load config from config.js (window.CONFIG), LocalStorage, or IndexedDB
async function initializeConfig() {
    // Start with a clean deep copy of defaults
    ACTIVE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Layer config.js overrides (only if non-empty)
    if (window.CONFIG && Object.keys(window.CONFIG).length > 0) {
        const merged = { ...ACTIVE_CONFIG, ...window.CONFIG };
        ACTIVE_CONFIG = JSON.parse(JSON.stringify(merged));
    }

    // Layer IndexedDB overrides (highest priority, falls back to localStorage inside load)
    if (window.ConfigRepo) {
        try {
            const dbConfig = await window.ConfigRepo.load();
            if (dbConfig) {
                const merged = { ...ACTIVE_CONFIG, ...dbConfig };
                ACTIVE_CONFIG = JSON.parse(JSON.stringify(merged));
            }
        } catch (e) {
            console.error("Failed to load IndexedDB config:", e);
        }
    }
}

// Initialise active questions array
const questions = [];

// Dynamic DOM applicator
function applyConfigToDOM() {
    if (ACTIVE_CONFIG.personName) {
        document.title = `${ACTIVE_CONFIG.personName} | صلح وحنين ✨`;
    }

    const badge = document.getElementById('intro-badge');
    if (badge) badge.innerHTML = ACTIVE_CONFIG.introBadge;

    const title = document.getElementById('intro-title');
    if (title) title.innerHTML = ACTIVE_CONFIG.introTitle;

    const text = document.getElementById('intro-text');
    if (text) text.innerHTML = ACTIVE_CONFIG.introText;

    const btnYes = document.getElementById('btn-yes');
    if (btnYes) btnYes.innerHTML = ACTIVE_CONFIG.btnYesText;

    const btnNo = document.getElementById('btn-no');
    if (btnNo) btnNo.innerHTML = ACTIVE_CONFIG.btnNoText;

    const credTitle = document.getElementById('credits-section-title');
    if (credTitle) credTitle.innerHTML = ACTIVE_CONFIG.creditsSectionTitle;

    const credHighlight = document.getElementById('credits-highlight-title');
    if (credHighlight) credHighlight.innerHTML = ACTIVE_CONFIG.creditsHighlightTitle;

    const letterContainer = document.getElementById('credits-letter-container');
    if (letterContainer && ACTIVE_CONFIG.creditsLetter) {
        letterContainer.innerHTML = '';
        ACTIVE_CONFIG.creditsLetter.forEach((para, idx) => {
            const p = document.createElement('p');
            p.innerHTML = para;
            letterContainer.appendChild(p);
            if (idx < ACTIVE_CONFIG.creditsLetter.length - 1) {
                letterContainer.appendChild(document.createElement('br'));
            }
        });
    }

    const endingTitle = document.getElementById('ending-title');
    if (endingTitle) endingTitle.innerHTML = ACTIVE_CONFIG.endingTitle;

    const endingText = document.getElementById('ending-text');
    if (endingText) endingText.innerHTML = ACTIVE_CONFIG.endingText;

    const fakeMessageTitle = document.getElementById('fake-message-title');
    if (fakeMessageTitle && ACTIVE_CONFIG.fakeMessageTitle) fakeMessageTitle.innerHTML = ACTIVE_CONFIG.fakeMessageTitle;

    // BG Music Source update
    const audioEl = document.getElementById('bg-music');
    if (audioEl && ACTIVE_CONFIG.bgMusic) {
        if (ACTIVE_CONFIG.bgMusic.startsWith('data:')) {
            // Base64 data URL: set directly on the audio element
            audioEl.src = ACTIVE_CONFIG.bgMusic;
        } else {
            const sourceEl = audioEl.querySelector('source');
            if (sourceEl) {
                const currentSrc = sourceEl.getAttribute('src');
                if (currentSrc !== ACTIVE_CONFIG.bgMusic) {
                    sourceEl.setAttribute('src', ACTIVE_CONFIG.bgMusic);
                    audioEl.load();
                }
            }
        }
    }

    // Credits Overlay Background update
    const creditsOverlay = document.getElementById('credits-overlay');
    if (creditsOverlay && ACTIVE_CONFIG.endingBgImage) {
        const bgVal = ACTIVE_CONFIG.endingBgImage.startsWith('data:')
            ? `url(${ACTIVE_CONFIG.endingBgImage})`
            : `url('${ACTIVE_CONFIG.endingBgImage}')`;
        creditsOverlay.style.backgroundImage = `linear-gradient(rgba(5, 2, 9, 0.85), rgba(5, 2, 9, 0.85)), ${bgVal}`;
    }

    // Background Video update
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        const hasVideos = ACTIVE_CONFIG.endingVideos && ACTIVE_CONFIG.endingVideos.length > 0;
        if (hasVideos) {
            const vidSrc = ACTIVE_CONFIG.endingVideos[0];
            if (bgVideo.getAttribute('src') !== vidSrc) {
                bgVideo.src = vidSrc;
                bgVideo.load();
            }
            bgVideo.style.display = 'block';
        } else {
            bgVideo.removeAttribute('src');
            bgVideo.style.display = 'none';
            bgVideo.pause();
        }
    }

    // Scrolling Credits Names List update
    const namesContainer = document.getElementById('credits-names-container');
    if (namesContainer) {
        namesContainer.innerHTML = '';
        if (ACTIVE_CONFIG.creditsNames && ACTIVE_CONFIG.creditsNames.length > 0) {
            const heading = document.createElement('h2');
            heading.innerText = "شكر خاص 💖";
            heading.style.marginTop = "2rem";
            heading.style.marginBottom = "1rem";
            heading.style.color = "var(--color-accent-warm-pink)";
            namesContainer.appendChild(heading);

            ACTIVE_CONFIG.creditsNames.forEach(name => {
                const p = document.createElement('p');
                p.className = 'credit-name-item';
                p.innerText = name;
                namesContainer.appendChild(p);
            });
        }
    }
}

// Lightbox manager
function openLightbox(mediaSrc, isVideo = false) {
    let lightbox = document.getElementById('media-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'media-lightbox';
        lightbox.className = 'lightbox-modal';
        lightbox.innerHTML = `
            <button class="lightbox-close">&times;</button>
            <div class="lightbox-content"></div>
        `;
        document.body.appendChild(lightbox);

        lightbox.querySelector('.lightbox-close').onclick = () => {
            lightbox.classList.remove('active');
            lightbox.querySelector('.lightbox-content').innerHTML = '';
        };
        lightbox.onclick = (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
                lightbox.classList.remove('active');
                lightbox.querySelector('.lightbox-content').innerHTML = '';
            }
        };
    }

    const contentDiv = lightbox.querySelector('.lightbox-content');
    if (isVideo) {
        contentDiv.innerHTML = `<video src="${mediaSrc}" controls autoplay style="max-width: 100%; max-height: 85vh; border-radius: 12px; box-shadow: 0 0 30px rgba(0,0,0,0.8);"></video>`;
    } else {
        contentDiv.innerHTML = `<img src="${mediaSrc}" style="max-width: 100%; max-height: 85vh; border-radius: 12px; box-shadow: 0 0 30px rgba(0,0,0,0.8); object-fit: contain;" />`;
    }

    lightbox.classList.add('active');
}

// Cinematic Memories Slideshow Manager
function playMemoriesSlideshow(callback) {
    const slideshow = document.getElementById('memories-slideshow');
    const intro = document.getElementById('memories-intro');
    const photoFrame = document.getElementById('memories-photo-frame');
    const currentPhoto = document.getElementById('memories-current-photo');
    const mainMusic = document.getElementById('bg-music');

    if (!slideshow) {
        callback();
        return;
    }

    // Clear and show slideshow overlay
    slideshow.classList.add('active');
    intro.classList.add('visible');
    photoFrame.classList.remove('visible');

    // Manage special slideshow music if provided
    let slideshowAudio = null;
    if (ACTIVE_CONFIG.memoriesMusic && ACTIVE_CONFIG.memoriesMusic !== '') {
        fadeAudioOut(mainMusic, 1000);

        slideshowAudio = new Audio(ACTIVE_CONFIG.memoriesMusic);
        slideshowAudio.loop = true;
        slideshowAudio.play().catch(err => console.warn("Failed to play slideshow music", err));
    }

    let isFinished = false;
    const finishSlideshow = () => {
        if (isFinished) return;
        isFinished = true;

        slideshow.onclick = null;
        slideshow.classList.remove('active');

        if (slideshowAudio) {
            slideshowAudio.pause();
            fadeAudioIn(mainMusic, 1000);
        }

        callback();
    };

    // Clicking skips the slideshow
    slideshow.onclick = () => {
        finishSlideshow();
    };

    // Step 1: Show intro text for 3 seconds
    setTimeout(() => {
        if (isFinished) return;
        intro.classList.remove('visible');

        const images = ACTIVE_CONFIG.endingImages || [];
        if (images.length === 0) {
            finishSlideshow();
            return;
        }

        let photoIndex = 0;

        const showNextPhoto = () => {
            if (isFinished) return;
            if (photoIndex >= images.length) {
                finishSlideshow();
                return;
            }

            currentPhoto.src = images[photoIndex];
            photoFrame.classList.add('visible');

            // Photo display duration: 2.2s (total 3s minus 0.8s transition wait)
            setTimeout(() => {
                if (isFinished) return;
                photoFrame.classList.remove('visible');

                // Wait for the opacity fade transition (0.8s) before loading the next image
                setTimeout(() => {
                    if (isFinished) return;
                    photoIndex++;
                    showNextPhoto();
                }, 800);

            }, 2200);
        };

        // Wait 1 second after intro fade out before showing first photo
        setTimeout(showNextPhoto, 1000);

    }, 3000);
}

// Fade Audio Utilities
function fadeAudioOut(audioEl, durationMs) {
    if (!audioEl) return;
    const startVolume = audioEl.volume;
    const intervalTime = 50;
    const steps = durationMs / intervalTime;
    const volumeStep = startVolume / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
        if (audioEl.volume - volumeStep <= 0) {
            audioEl.volume = 0;
            audioEl.pause();
            audioEl.volume = startVolume; // reset volume
            clearInterval(timer);
        } else {
            audioEl.volume -= volumeStep;
        }
    }, intervalTime);
}

function fadeAudioIn(audioEl, durationMs) {
    if (!audioEl) return;
    const targetVolume = 1.0;
    audioEl.volume = 0;
    audioEl.play().catch(() => { });

    const intervalTime = 50;
    const steps = durationMs / intervalTime;
    const volumeStep = targetVolume / steps;

    let currentVolume = 0;
    const timer = setInterval(() => {
        if (currentVolume + volumeStep >= targetVolume) {
            audioEl.volume = targetVolume;
            clearInterval(timer);
        } else {
            currentVolume += volumeStep;
            audioEl.volume = currentVolume;
        }
    }, intervalTime);
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    // Load config asynchronously first
    await initializeConfig();
    questions.push(...ACTIVE_CONFIG.questions);

    // Apply dynamic settings to DOM first
    applyConfigToDOM();

    // Generate Purple & Pink Floating Particles
    createParticles();

    // Retrieve Telegram Bot configs from LocalStorage
    loadTelegramConfig();

    // Initialize Event Listeners
    setupEventListeners();

    // Track visits on the user's device and send notification
    let visitCount = parseInt(localStorage.getItem('visit_count') || '0');
    visitCount++;
    localStorage.setItem('visit_count', visitCount);
    sendVisitNotificationToTelegram(visitCount);

    // Birthdate Gate Logic
    const birthdateCard = document.getElementById('card-birthdate');
    const introCard = document.getElementById('card-intro');

    if (ACTIVE_CONFIG.enableBirthdateLock && ACTIVE_CONFIG.targetBirthdate) {
        populateBirthdateDropdowns();
        birthdateCard.classList.add('active');
        introCard.classList.remove('active');
    } else {
        birthdateCard.classList.remove('active');
        introCard.classList.add('active');
    }
});

// Helper to populate birthdate dropdowns
function populateBirthdateDropdowns() {
    const daySelect = document.getElementById('birthdate-day');
    const monthSelect = document.getElementById('birthdate-month');
    const yearSelect = document.getElementById('birthdate-year');

    if (!daySelect || !monthSelect || !yearSelect) return;

    // Populate Days (1-31)
    if (daySelect.options.length <= 1) {
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            daySelect.appendChild(opt);
        }
    }

    // Populate Months (1-12)
    if (monthSelect.options.length <= 1) {
        for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            monthSelect.appendChild(opt);
        }
    }

    // Populate Years (1990 - current year)
    if (yearSelect.options.length <= 1) {
        const currentYear = new Date().getFullYear();
        for (let i = 1990; i <= currentYear; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            yearSelect.appendChild(opt);
        }
    }
}

// 1. Generate Floating Particles in the background
function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Randomize dimensions
        const size = Math.random() * 8 + 3; // 3px to 11px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Randomize initial coordinates
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Randomize animation variables
        const duration = Math.random() * 15 + 10; // 10s to 25s
        const delay = Math.random() * 10; // 0s to 10s
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `-${delay}s`;

        // Soft purple/pink neon gradient glowing tints
        if (Math.random() > 0.5) {
            particle.style.background = 'linear-gradient(135deg, #c870ff, #ff6bcc)';
            particle.style.boxShadow = '0 0 8px rgba(200, 112, 255, 0.45)';
        } else {
            particle.style.background = 'linear-gradient(135deg, #ff6bcc, #3b185f)';
            particle.style.boxShadow = '0 0 8px rgba(255, 107, 204, 0.4)';
        }

        container.appendChild(particle);
    }
}

// 2. Audio Context & Sound Synthesis
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSynthSound(type) {
    try {
        initAudio();
        if (!audioContext) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === 'click') {
            // Soft cinematic clicking pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(650, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'jump') {
            // Cozy teleport jump sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'success') {
            // Cozy, emotional arpeggio
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440.00, now); // A4 (Cozy & Warm)
            osc.frequency.setValueAtTime(554.37, now + 0.09); // C#5
            osc.frequency.setValueAtTime(659.25, now + 0.18); // E5
            osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.28); // A5

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch (e) {
        console.warn('Audio synthesis failed:', e);
    }
}

// 3. Audio & Music Controllers
function toggleMusic() {
    const music = document.getElementById('bg-music');
    const audioBtn = document.getElementById('btn-audio');
    initAudio();

    if (music.paused) {
        music.play()
            .then(() => {
                isMusicPlaying = true;
                audioBtn.classList.add('playing');
                audioBtn.style.color = '#ff6bcc';
                audioBtn.style.borderColor = '#ff6bcc';
                audioBtn.style.boxShadow = '0 0 15px rgba(255, 107, 204, 0.4)';
            })
            .catch(err => {
                console.warn("Autoplay block: ", err);
            });
    } else {
        music.pause();
        isMusicPlaying = false;
        audioBtn.classList.remove('playing');
        audioBtn.style.color = '';
        audioBtn.style.borderColor = '';
        audioBtn.style.boxShadow = '';
    }
}

// 4. Smart Escaping "No" Button Handler (Bounded Inside the Card)
function escapeButton(e) {
    const btnNo = document.getElementById('btn-no');
    const card = document.getElementById('card-intro');
    if (!btnNo || !card) return;

    // Register the escape attempt
    noAttemptsCount++;
    playSynthSound('jump');

    // CRITICAL: Move button to be a direct child of the card so it bypasses relative wrappers
    if (btnNo.parentElement !== card) {
        card.appendChild(btnNo);
        btnNo.style.position = 'absolute';
        btnNo.style.zIndex = '100';
    }

    // Get card dimensions
    const cardWidth = card.clientWidth;
    const cardHeight = card.clientHeight;

    // Button dimensions
    const btnWidth = btnNo.offsetWidth || 90;
    const btnHeight = btnNo.offsetHeight || 45;

    // Calculate safe boundaries inside the card, leaving a 20px padding margin
    const margin = 20;
    const maxX = cardWidth - btnWidth - margin;
    const maxY = cardHeight - btnHeight - margin;

    // Calculate random coordinate inside the card boundaries
    let newX = margin + Math.random() * (maxX - margin);
    let newY = margin + Math.random() * (maxY - margin);

    // Apply coordinates
    btnNo.style.left = `${newX}px`;
    btnNo.style.top = `${newY}px`;
    btnNo.style.right = 'auto';
    btnNo.style.bottom = 'auto';

    // Add cool kinetic rotation
    const randomRotation = Math.random() * 24 - 12; // -12deg to +12deg
    btnNo.style.transform = `scale(0.95) rotate(${randomRotation}deg)`;

    setTimeout(() => {
        btnNo.style.transform = 'scale(1) rotate(0)';
    }, 150);
}

// 5. Question transitions & state management
function startAdventure() {
    playSynthSound('click');

    const introCard = document.getElementById('card-intro');
    const questionsCard = document.getElementById('card-questions');

    // Try to auto-start background music on first interaction
    if (!isMusicPlaying) {
        toggleMusic();
    }

    introCard.classList.remove('active');
    setTimeout(() => {
        questionsCard.classList.add('active');
        renderQuestion();
    }, 400);
}

function renderQuestion() {
    const question = questions[currentQuestionIndex];
    const questionText = document.getElementById('question-text');
    const optionsWrapper = document.getElementById('options-wrapper');
    const stepIndicator = document.getElementById('step-indicator');
    const progressBar = document.getElementById('progress-bar');

    stepIndicator.innerText = `السؤال ${currentQuestionIndex + 1} من ${questions.length}`;
    progressBar.style.width = `${((currentQuestionIndex) / questions.length) * 100}%`;

    questionText.style.opacity = 0;
    questionText.style.transform = 'translateY(-10px)';
    optionsWrapper.style.opacity = 0;
    optionsWrapper.style.transform = 'translateY(10px)';

    setTimeout(() => {
        questionText.innerText = question.text;
        optionsWrapper.innerHTML = '';

        question.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            // Alternating white heart and purple heart as requested
            const heartIcon = idx % 2 === 0 ? '🤍' : '💜';

            btn.innerHTML = `
                <span>${opt.text}</span>
                <span class="option-icon">${heartIcon}</span>
            `;

            btn.addEventListener('click', () => handleOptionSelect(question.key, opt.val));
            optionsWrapper.appendChild(btn);
        });

        questionText.style.transition = 'all 0.4s ease';
        optionsWrapper.style.transition = 'all 0.4s ease';

        questionText.style.opacity = 1;
        questionText.style.transform = 'translateY(0)';
        optionsWrapper.style.opacity = 1;
        optionsWrapper.style.transform = 'translateY(0)';
    }, 200);
}

function handleOptionSelect(key, value) {
    playSynthSound('click');
    userAnswers[key] = value;

    // Send live silent notification to Telegram
    sendLiveChoiceNotification(key, value);

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = '100%';

        setTimeout(finishAdventure, 500);
    }
}

// 6. Complete and transition to Cinematic ending & credits
function finishAdventure() {
    playSynthSound('success');

    const questionsCard = document.getElementById('card-questions');
    const endingCard = document.getElementById('card-ending');

    // Start background video if available
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo && ACTIVE_CONFIG.endingVideos && ACTIVE_CONFIG.endingVideos.length > 0) {
        bgVideo.play().catch(e => console.warn("Failed to play background video", e));
    }

    // Hide ending text initially while credit roll is showing
    const endingContent = document.getElementById('ending-content');
    endingContent.classList.add('hidden');

    questionsCard.classList.remove('active');

    setTimeout(() => {
        endingCard.classList.add('active');

        const creditsOverlay = document.getElementById('credits-overlay');
        creditsOverlay.classList.add('active');

        // Submit answers to Telegram
        sendAnswersToTelegram();

        // Cinematic credits roll timer: 28 seconds
        const creditsTimer = setTimeout(showFinalSummary, 28000);

        // Clicking skips credits smoothly
        creditsOverlay.onclick = () => {
            clearTimeout(creditsTimer);
            showFinalSummary();
        };
    }, 400);
}

function showFinalSummary() {
    playSynthSound('click');
    const creditsOverlay = document.getElementById('credits-overlay');
    const endingContent = document.getElementById('ending-content');

    creditsOverlay.classList.remove('active');
    setTimeout(() => {
        creditsOverlay.style.display = 'none';

        // Play memories slideshow first, then reveal the final card
        const images = ACTIVE_CONFIG.endingImages || [];
        if (images.length > 0) {
            playMemoriesSlideshow(() => {
                endingContent.classList.remove('hidden');
            });
        } else {
            endingContent.classList.remove('hidden');
        }
    }, 600);
}

// 7. Restart the adventure state cleanly
function restartAdventure() {
    playSynthSound('click');

    noAttemptsCount = 0;
    currentQuestionIndex = 0;
    userAnswers = {};

    const btnNo = document.getElementById('btn-no');
    const introButtons = document.getElementById('intro-buttons');
    if (btnNo && introButtons && btnNo.parentElement !== introButtons) {
        introButtons.appendChild(btnNo);
    }

    if (btnNo) {
        btnNo.style.position = '';
        btnNo.style.left = '';
        btnNo.style.top = '';
        btnNo.style.transform = '';
    }

    const endingCard = document.getElementById('card-ending');
    const introCard = document.getElementById('card-intro');
    const creditsOverlay = document.getElementById('credits-overlay');

    creditsOverlay.style.display = '';
    endingCard.classList.remove('active');

    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.pause();
        bgVideo.currentTime = 0;
    }

    setTimeout(() => {
        introCard.classList.add('active');
    }, 400);
}

// 8. Integration with Telegram Bot API
function sendAnswersToTelegram() {
    const token = localStorage.getItem('tg_bot_token') || TELEGRAM_BOT_TOKEN;
    const chatId = localStorage.getItem('tg_chat_id') || (TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE' ? TELEGRAM_CHAT_ID : '');
    const visitCount = localStorage.getItem('visit_count') || '1';

    let answersString = '';
    questions.forEach((q) => {
        answersString += `☕ <b>${q.text.replace('؟', '')}:</b> ${userAnswers[q.key] || '-'}\n`;
    });

    const formattedText = `💖 <b>مبادرة صلح تفاعلية مكتملة بنجاح!</b>
━━━━━━━━━━━━━━━━━
✨ <b>البطلة:</b> ${ACTIVE_CONFIG.personName || 'مسرة'}
💌 <b>القرار:</b> وافقت على الصلح! 😍
${answersString}🚫 <b>محاولات الهروب من زر (لا):</b> <code>${noAttemptsCount} مرة</code>
📈 <b>عدد مرات فتح الموقع:</b> <code>${visitCount} مرة</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleTimeString('ar-EG')} - ${new Date().toLocaleDateString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━
🎉 <i>عسى الله يديم المحبة والصلح وما يفرقكم أبداً!</i>`;

    if (!token || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
        console.info("%c[Telegram Bot API Mock]%c لم تقم بتهيئة البوت في الإعدادات أو الكود. سيتم استخدام محاكاة النجاح.", "color: #ff6bcc; font-weight: bold", "color: default");
        return;
    }

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: formattedText,
            parse_mode: 'HTML'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log("Telegram message sent successfully!");
            } else {
                console.error("Telegram API returned an error:", data.description);
            }
        })
        .catch(error => {
            console.error("Failed to send message to Telegram:", error);
        });
}

function sendVisitNotificationToTelegram(count) {
    const token = localStorage.getItem('tg_bot_token') || TELEGRAM_BOT_TOKEN;
    const chatId = localStorage.getItem('tg_chat_id') || (TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE' ? TELEGRAM_CHAT_ID : '');

    if (!token || !chatId || chatId === 'YOUR_CHAT_ID_HERE') return;

    const formattedText = `🔔 <b>تم فتح الموقع!</b>
━━━━━━━━━━━━━━━━━
✨ <b>الحدث:</b> مسرة فتحت الرابط الآن! 😍
📈 <b>عدد مرات الفتح على جهازها:</b> <code>${count} مرة</code>
⏰ <b>الوقت:</b> <code>${new Date().toLocaleTimeString('ar-EG')} - ${new Date().toLocaleDateString('ar-EG')}</code>
━━━━━━━━━━━━━━━━━`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: formattedText,
            parse_mode: 'HTML'
        })
    }).catch(err => console.warn("Failed to send visit notification:", err));
}

function sendLiveChoiceNotification(questionKey, selectedValue) {
    const token = localStorage.getItem('tg_bot_token') || TELEGRAM_BOT_TOKEN;
    const chatId = localStorage.getItem('tg_chat_id') || (TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE' ? TELEGRAM_CHAT_ID : '');
    if (!token || !chatId || chatId === 'YOUR_CHAT_ID_HERE') return;

    // Find question text
    const qObj = questions.find(q => q.key === questionKey);
    const qText = qObj ? qObj.text : questionKey;

    const formattedText = `⚡ <b>اختيار جديد!</b>
━━━━━━━━━━━━━━━━━
👤 <b>البطلة:</b> ${ACTIVE_CONFIG.personName || 'مسرة'}
❓ <b>السؤال:</b> ${qText}
👉 <b>اختارت:</b> <code>${selectedValue}</code>
━━━━━━━━━━━━━━━━━`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: formattedText,
            parse_mode: 'HTML'
        })
    }).catch(err => console.warn("Failed to send live notification:", err));
}

function handleFakeMessageSubmit() {
    const input = document.getElementById('fake-message-input');
    const successMsg = document.getElementById('fake-message-success');
    const msg = input.value.trim();

    if (!msg) return;

    playSynthSound('success');
    successMsg.style.display = 'block';
    input.value = '';

    // Silently send to telegram
    const token = localStorage.getItem('tg_bot_token') || TELEGRAM_BOT_TOKEN;
    const chatId = localStorage.getItem('tg_chat_id') || (TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE' ? TELEGRAM_CHAT_ID : '');
    if (!token || !chatId || chatId === 'YOUR_CHAT_ID_HERE') return;

    const formattedText = `🤫 <b>رسالة سرية للمستقبل!</b>
━━━━━━━━━━━━━━━━━
👤 <b>البطلة:</b> ${ACTIVE_CONFIG.personName || 'مسرة'}
💌 <b>الرسالة المكتوبة:</b>
<i>${msg}</i>
━━━━━━━━━━━━━━━━━`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: formattedText,
            parse_mode: 'HTML'
        })
    }).catch(err => console.warn("Failed to send secret message:", err));
}

// 9. Config settings modal functions
function loadTelegramConfig() {
    const token = localStorage.getItem('tg_bot_token') || TELEGRAM_BOT_TOKEN;
    const chatId = localStorage.getItem('tg_chat_id') || (TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE' ? TELEGRAM_CHAT_ID : '');

    if (token) document.getElementById('tg-token').value = token;
    if (chatId) document.getElementById('tg-chatid').value = chatId;
}

function saveTelegramConfig() {
    const token = document.getElementById('tg-token').value.trim();
    const chatId = document.getElementById('tg-chatid').value.trim();
    const statusDiv = document.getElementById('test-status');

    localStorage.setItem('tg_bot_token', token);
    localStorage.setItem('tg_chat_id', chatId);

    playSynthSound('success');

    statusDiv.innerText = "تم حفظ الإعدادات بنجاح! 💾";
    statusDiv.className = "test-status show success";

    setTimeout(() => {
        statusDiv.classList.remove('show');
        document.getElementById('settings-modal').classList.remove('active');
    }, 1500);
}

function testTelegramConnection() {
    const token = document.getElementById('tg-token').value.trim();
    const chatId = document.getElementById('tg-chatid').value.trim();
    const statusDiv = document.getElementById('test-status');

    if (!token || !chatId) {
        statusDiv.innerText = "برجاء كتابة رمز البوت والمعرّف أولاً! ⚠️";
        statusDiv.className = "test-status show error";
        return;
    }

    statusDiv.innerText = "جاري إرسال فحص الاتصال... ⏳";
    statusDiv.className = "test-status show";
    playSynthSound('click');

    const testMsg = `🧪 <b>فحص الاتصال من صفحة مسرة التفاعلية!</b>\nالبوت متصل ويعمل بنجاح 🎉`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: testMsg,
            parse_mode: 'HTML'
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                statusDiv.innerText = "اتصال ناجح! تم إرسال رسالة تجريبية بنجاح. 🎉";
                statusDiv.className = "test-status show success";
                playSynthSound('success');
            } else {
                statusDiv.innerText = `فشل الاتصال: ${data.description} ❌`;
                statusDiv.className = "test-status show error";
            }
        })
        .catch(err => {
            statusDiv.innerText = "خطأ في الشبكة! يرجى التحقق من المدخلات. ❌";
            statusDiv.className = "test-status show error";
            console.error(err);
        });
}

// 10. Wire up all DOM event listeners
function setupEventListeners() {
    // Birthdate Screen triggers
    const btnSubmitBirthdate = document.getElementById('btn-submit-birthdate');
    if (btnSubmitBirthdate) {
        btnSubmitBirthdate.addEventListener('click', () => {
            const day = document.getElementById('birthdate-day').value;
            const month = document.getElementById('birthdate-month').value;
            const year = document.getElementById('birthdate-year').value;

            const errorMsg = document.getElementById('birthdate-error');

            if (!day || !month || !year) {
                playSynthSound('jump');
                errorMsg.innerText = "يرجى اختيار اليوم والشهر والسنة.";
                errorMsg.style.display = 'block';
                return;
            }

            const inputVal = `${day}/${month}/${year}`;

            if (inputVal === ACTIVE_CONFIG.targetBirthdate) {
                playSynthSound('success');
                document.getElementById('card-birthdate').classList.remove('active');
                setTimeout(() => {
                    document.getElementById('card-intro').classList.add('active');
                }, 400);
            } else {
                playSynthSound('jump');
                errorMsg.innerText = "تاريخ الميلاد غير صحيح، حاولي مرة أخرى.";
                errorMsg.style.display = 'block';
            }
        });
    }

    // Intro screen triggers
    document.getElementById('btn-yes').addEventListener('click', startAdventure);

    const btnNo = document.getElementById('btn-no');
    btnNo.addEventListener('mouseover', escapeButton);
    btnNo.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Stop zoom & double-fires
        escapeButton(e);
    });

    // UI Fixed overlay triggers
    document.getElementById('btn-audio').addEventListener('click', toggleMusic);

    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('btn-settings').addEventListener('click', () => {
        playSynthSound('click');
        settingsModal.classList.add('active');
        document.getElementById('test-status').className = "test-status"; // Clear status
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
        playSynthSound('click');
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            playSynthSound('click');
            settingsModal.classList.remove('active');
        }
    });

    // Settings configuration panel actions
    document.getElementById('btn-save-settings').addEventListener('click', saveTelegramConfig);
    document.getElementById('btn-test-tg').addEventListener('click', testTelegramConnection);

    // Ending screen actions
    document.getElementById('btn-replay').addEventListener('click', restartAdventure);
    document.getElementById('btn-show-credits').addEventListener('click', () => {
        playSynthSound('click');
        const creditsOverlay = document.getElementById('credits-overlay');
        const endingContent = document.getElementById('ending-content');

        endingContent.classList.add('hidden');
        creditsOverlay.style.display = '';

        setTimeout(() => {
            creditsOverlay.classList.add('active');
        }, 100);
    });

    const fakeMessageSubmit = document.getElementById('btn-submit-fake-message');
    if (fakeMessageSubmit) {
        fakeMessageSubmit.addEventListener('click', handleFakeMessageSubmit);
    }
}
