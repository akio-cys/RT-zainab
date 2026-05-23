// admin.js - Interactive admin dashboard controller
// Default config to mirror script.js fallbacks
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
            text: 'شتفضلين تشربين؟',
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

// Current active configuration state
let ACTIVE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

// File handles for files waiting to be written to filesystem (when sync directory is enabled)
let PENDING_FILES = {
    bgMusic: null,
    memoriesMusic: null,
    endingBgImage: null,
    endingImages: [], // array of File objects
    endingVideos: []  // array of File objects
};

// Directory sync handle (File System Access API)
let dirHandle = null;

// Initializer
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupTabs();
    setupFolderSync();
    setupFormBindings();
    setupQuestionEditor();
    setupLetterParagraphsEditor();
    setupCreditsNamesEditor();
    setupMediaDropzones();
    setupSaveAndExport();

    showLog("تم تحميل لوحة الإدارة بنجاح. ✍️", "success");
});

// 1. Tab Swapper
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 2. Folder Sync Tool (File System Access API)
function setupFolderSync() {
    const btnSync = document.getElementById('btn-sync-folder');
    const syncDot = document.getElementById('sync-dot');
    const syncText = document.getElementById('sync-text');

    if (!window.showDirectoryPicker) {
        syncText.innerText = "ربط المجلد غير مدعوم في هذا الوضع (يتطلب localhost أو استضافة آمنة HTTPS)";
        btnSync.style.opacity = "0.5";
        btnSync.title = "هذه الميزة تتطلب تشغيل الموقع عبر خادم محلي (Local Server) أو استضافة آمنة HTTPS وليس فتح الملف مباشرة.";
        btnSync.addEventListener('click', () => {
            showLog("ميزة ربط المجلد تتطلب تشغيل الموقع عبر خادم محلي (localhost) أو HTTPS آمن لتعمل.", "error");
        });
        return;
    }

    btnSync.addEventListener('click', async () => {
        try {
            // Request folder picker readwrite access
            dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            syncDot.classList.add('connected');
            syncText.innerText = `متصل بمجلد العمل ✅ (${dirHandle.name})`;
            showLog("تم ربط مجلد المشروع بنجاح. سيتم حفظ الملفات والصور مباشرة للمجلد!", "success");

            // Try to load dynamic config.js from directory if it exists
            try {
                const configHandle = await dirHandle.getFileHandle('config.js');
                const file = await configHandle.getFile();
                const text = await file.text();
                // Extract window.CONFIG content safely
                const startIdx = text.indexOf('{');
                const endIdx = text.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    const jsonStr = text.substring(startIdx, endIdx + 1);
                    const parsed = JSON.parse(jsonStr);
                    ACTIVE_CONFIG = { ...ACTIVE_CONFIG, ...parsed };
                    populateInputs();
                    renderQuestionsList();
                    renderParagraphsList();
                    renderCreditsNamesList();
                    renderMediaPreviews();
                    showLog("تم استيراد التكوين الحالي من ملف config.js بمجلدك!", "success");
                }
            } catch (err) {
                console.log("No config.js found in connected folder, using defaults.", err);
            }
        } catch (err) {
            console.warn("Folder sync permission denied or not supported:", err);
            showLog("فشل ربط المجلد أو لم يتم منح الصلاحيات. سيتم الحفظ محلياً وتوفير تنزيل يدوي.", "error");
        }
    });
}

// 3. Bind standard form inputs
function setupFormBindings() {
    const inputs = {
        'personName': 'person-name',
        'introBadge': 'intro-badge-input',
        'introTitle': 'intro-title-input',
        'introText': 'intro-text-input',
        'btnYesText': 'btn-yes-input',
        'btnNoText': 'btn-no-input',
        'creditsSectionTitle': 'credits-section-title-input',
        'creditsHighlightTitle': 'credits-highlight-title-input',
        'endingTitle': 'ending-title-input',
        'endingText': 'ending-text-input',
        'fakeMessageTitle': 'fake-message-title-input'
    };

    // Bind change/input events to update active state
    for (const [key, id] of Object.entries(inputs)) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                ACTIVE_CONFIG[key] = el.value;
            });
        }
    }

    const birthdateLockCheckbox = document.getElementById('enable-birthdate-lock');
    if (birthdateLockCheckbox) {
        birthdateLockCheckbox.addEventListener('change', (e) => {
            ACTIVE_CONFIG.enableBirthdateLock = e.target.checked;
        });
    }

    const daySelect = document.getElementById('target-birthdate-day');
    const monthSelect = document.getElementById('target-birthdate-month');
    const yearSelect = document.getElementById('target-birthdate-year');

    function updateTargetBirthdate() {
        if (daySelect && monthSelect && yearSelect) {
            const day = daySelect.value;
            const month = monthSelect.value;
            const year = yearSelect.value;
            if (day && month && year) {
                ACTIVE_CONFIG.targetBirthdate = `${day}/${month}/${year}`;
                const hiddenInput = document.getElementById('target-birthdate');
                if (hiddenInput) hiddenInput.value = ACTIVE_CONFIG.targetBirthdate;
            }
        }
    }

    if (daySelect) daySelect.addEventListener('change', updateTargetBirthdate);
    if (monthSelect) monthSelect.addEventListener('change', updateTargetBirthdate);
    if (yearSelect) yearSelect.addEventListener('change', updateTargetBirthdate);
}

// Populate UI inputs with configuration values
function populateInputs() {
    const inputs = {
        'personName': 'person-name',
        'introBadge': 'intro-badge-input',
        'introTitle': 'intro-title-input',
        'introText': 'intro-text-input',
        'btnYesText': 'btn-yes-input',
        'btnNoText': 'btn-no-input',
        'creditsSectionTitle': 'credits-section-title-input',
        'creditsHighlightTitle': 'credits-highlight-title-input',
        'endingTitle': 'ending-title-input',
        'endingText': 'ending-text-input',
        'fakeMessageTitle': 'fake-message-title-input'
    };

    for (const [key, id] of Object.entries(inputs)) {
        const el = document.getElementById(id);
        if (el) {
            el.value = ACTIVE_CONFIG[key] || '';
        }
    }

    const birthdateLockCheckbox = document.getElementById('enable-birthdate-lock');
    if (birthdateLockCheckbox) {
        birthdateLockCheckbox.checked = !!ACTIVE_CONFIG.enableBirthdateLock;
    }

    // Populate and set birthdate dropdowns
    const daySelect = document.getElementById('target-birthdate-day');
    const monthSelect = document.getElementById('target-birthdate-month');
    const yearSelect = document.getElementById('target-birthdate-year');

    if (daySelect && daySelect.options.length <= 1) {
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            daySelect.appendChild(opt);
        }
    }

    if (monthSelect && monthSelect.options.length <= 1) {
        for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            monthSelect.appendChild(opt);
        }
    }

    if (yearSelect && yearSelect.options.length <= 1) {
        const currentYear = new Date().getFullYear();
        for (let i = 1990; i <= currentYear; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            yearSelect.appendChild(opt);
        }
    }

    if (ACTIVE_CONFIG.targetBirthdate) {
        const parts = ACTIVE_CONFIG.targetBirthdate.split('/');
        if (parts.length === 3) {
            if (daySelect) daySelect.value = parts[0];
            if (monthSelect) monthSelect.value = parts[1];
            if (yearSelect) yearSelect.value = parts[2];
            const hiddenInput = document.getElementById('target-birthdate');
            if (hiddenInput) hiddenInput.value = ACTIVE_CONFIG.targetBirthdate;
        }
    }

    // Set static media filename previews
    document.getElementById('music-filename').value = ACTIVE_CONFIG.bgMusic || 'music.mp3';
    const sMusic = document.getElementById('slideshow-music-filename');
    if (sMusic) {
        sMusic.value = ACTIVE_CONFIG.memoriesMusic ? (ACTIVE_CONFIG.memoriesMusic.startsWith('data:') ? 'موسيقى الذكريات المدمجة 🎶' : ACTIVE_CONFIG.memoriesMusic) : 'بدون موسيقى مخصصة (يستمر تشغيل الموسيقى العامة)';
    }
    document.getElementById('bg-image-filename').value = ACTIVE_CONFIG.endingBgImage || 'photo.jpg';
}

// 4. Questions Editor
function setupQuestionEditor() {
    const btnAdd = document.getElementById('btn-add-question');
    btnAdd.addEventListener('click', () => {
        const newKey = `question_${Date.now()}`;
        ACTIVE_CONFIG.questions.push({
            key: newKey,
            text: "سؤال جديد؟",
            options: [
                { text: "خيار أول 🤍", val: "أول" },
                { text: "خيار ثاني 💜", val: "ثاني" }
            ]
        });
        renderQuestionsList();
        showLog("تمت إضافة سؤال جديد.");
    });
}

function renderQuestionsList() {
    const container = document.getElementById('questions-list');
    if (!container) return;
    container.innerHTML = '';

    ACTIVE_CONFIG.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'card-item';

        card.innerHTML = `
            <div class="card-item-header">
                <span class="card-item-title">السؤال ${idx + 1} (${q.key})</span>
                <button class="btn-icon-del" onclick="deleteQuestion(${idx})" title="حذف السؤال">🗑️</button>
            </div>
            <div class="form-grid">
                <div class="form-group" style="grid-column: 1 / span 2;">
                    <label>نص السؤال</label>
                    <input type="text" value="${q.text}" oninput="updateQuestionText(${idx}, this.value)" placeholder="مثال: شتفضلين تشربين؟">
                </div>
                <div class="form-group">
                    <label>مفتاح التتبع (Key)</label>
                    <input type="text" value="${q.key}" oninput="updateQuestionKey(${idx}, this.value)" placeholder="مثال: drink">
                </div>
            </div>
            
            <div class="options-editor-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h4>الخيارات المتاحة لهذا السؤال</h4>
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size:0.75rem;" onclick="addOption(${idx})">إضافة خيار ➕</button>
                </div>
                <div id="options-container-${idx}">
                    <!-- Options rows injected here -->
                </div>
            </div>
        `;

        container.appendChild(card);
        renderOptionsList(idx);
    });
}

window.deleteQuestion = function (idx) {
    ACTIVE_CONFIG.questions.splice(idx, 1);
    renderQuestionsList();
    showLog("تم حذف السؤال.");
};

window.updateQuestionText = function (idx, val) {
    ACTIVE_CONFIG.questions[idx].text = val;
};

window.updateQuestionKey = function (idx, val) {
    ACTIVE_CONFIG.questions[idx].key = val.replace(/\s+/g, '_').toLowerCase();
};

// Options nested editor helper routines
function renderOptionsList(qIdx) {
    const container = document.getElementById(`options-container-${qIdx}`);
    if (!container) return;
    container.innerHTML = '';

    ACTIVE_CONFIG.questions[qIdx].options.forEach((opt, optIdx) => {
        const row = document.createElement('div');
        row.className = 'option-edit-row';
        row.innerHTML = `
            <input type="text" value="${opt.text}" oninput="updateOptionText(${qIdx}, ${optIdx}, this.value)" placeholder="نص الخيار">
            <input type="text" value="${opt.val}" oninput="updateOptionVal(${qIdx}, ${optIdx}, this.value)" placeholder="قيمة الإجابة المرسلة للبوت">
            <button class="btn-icon-del" onclick="deleteOption(${qIdx}, ${optIdx})" title="حذف الخيار">🗑️</button>
        `;
        container.appendChild(row);
    });
}

window.addOption = function (qIdx) {
    ACTIVE_CONFIG.questions[qIdx].options.push({ text: "خيار جديد 🤍", val: "جديد" });
    renderOptionsList(qIdx);
};

window.deleteOption = function (qIdx, optIdx) {
    ACTIVE_CONFIG.questions[qIdx].options.splice(optIdx, 1);
    renderOptionsList(qIdx);
};

window.updateOptionText = function (qIdx, optIdx, val) {
    ACTIVE_CONFIG.questions[qIdx].options[optIdx].text = val;
};

window.updateOptionVal = function (qIdx, optIdx, val) {
    ACTIVE_CONFIG.questions[qIdx].options[optIdx].val = val;
};

// 5. Credits Roll emotional paragraphs editor
function setupLetterParagraphsEditor() {
    const btnAdd = document.getElementById('btn-add-paragraph');
    btnAdd.addEventListener('click', () => {
        ACTIVE_CONFIG.creditsLetter.push("فقرة جديدة لرسالة الاعتذار...");
        renderParagraphsList();
        showLog("تمت إضافة فقرة جديدة.");
    });
}

function renderParagraphsList() {
    const container = document.getElementById('paragraphs-list');
    if (!container) return;
    container.innerHTML = '';

    ACTIVE_CONFIG.creditsLetter.forEach((para, idx) => {
        const row = document.createElement('div');
        row.className = 'paragraph-editor-row';
        row.innerHTML = `
            <textarea placeholder="اكتب الفقرة هنا..." oninput="updateParagraphText(${idx}, this.value)">${para}</textarea>
            <button class="btn-icon-del" onclick="deleteParagraph(${idx})" title="حذف الفقرة">🗑️</button>
        `;
        container.appendChild(row);
    });
}

window.updateParagraphText = function (idx, val) {
    ACTIVE_CONFIG.creditsLetter[idx] = val;
};

window.deleteParagraph = function (idx) {
    ACTIVE_CONFIG.creditsLetter.splice(idx, 1);
    renderParagraphsList();
    showLog("تم حذف الفقرة.");
};

// 5b. Credits Roll scrolling names list editor
function setupCreditsNamesEditor() {
    const btnAdd = document.getElementById('btn-add-credit-name');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            if (!ACTIVE_CONFIG.creditsNames) ACTIVE_CONFIG.creditsNames = [];
            ACTIVE_CONFIG.creditsNames.push("اسم طالبة جديد...");
            renderCreditsNamesList();
            showLog("تمت إضافة اسم مخصص لشريط النهاية.");
        });
    }
}

function renderCreditsNamesList() {
    const container = document.getElementById('credits-names-list');
    if (!container) return;
    container.innerHTML = '';

    if (!ACTIVE_CONFIG.creditsNames) ACTIVE_CONFIG.creditsNames = [];
    ACTIVE_CONFIG.creditsNames.forEach((name, idx) => {
        const row = document.createElement('div');
        row.className = 'paragraph-editor-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '10px';
        row.innerHTML = `
            <input type="text" value="${name}" placeholder="اكتب اسم الطالبة هنا..." oninput="updateCreditNameText(${idx}, this.value)" style="flex: 1; padding: 10px 14px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color:#fff; font-size:0.9rem;">
            <button class="btn-icon-del" onclick="deleteCreditName(${idx})" title="حذف الاسم" style="margin-right: 10px;">🗑️</button>
        `;
        container.appendChild(row);
    });
}

window.updateCreditNameText = function (idx, val) {
    ACTIVE_CONFIG.creditsNames[idx] = val;
};

window.deleteCreditName = function (idx) {
    ACTIVE_CONFIG.creditsNames.splice(idx, 1);
    renderCreditsNamesList();
    showLog("تم حذف الاسم من شريط النهاية.");
};

// 6. Media Dropzones and drag-and-drop managers (with Telegram files compatibility)
function setupMediaDropzones() {
    // Media configuration mappings
    const dropzones = [
        {
            id: 'music-dropzone',
            input: 'music-file-input',
            handler: handleMusicUpload
        },
        {
            id: 'slideshow-music-dropzone',
            input: 'slideshow-music-file-input',
            handler: handleMemoriesMusicUpload
        },
        {
            id: 'bg-image-dropzone',
            input: 'bg-image-file-input',
            handler: handleBgImageUpload
        },
        {
            id: 'gallery-dropzone',
            input: 'gallery-file-input',
            handler: handleGalleryUpload,
            multiple: true
        },
        {
            id: 'videos-dropzone',
            input: 'videos-file-input',
            handler: handleVideosUpload
        }
    ];

    dropzones.forEach(zone => {
        const dropzoneEl = document.getElementById(zone.id);
        const inputEl = document.getElementById(zone.input);
        if (!dropzoneEl || !inputEl) return;

        // Clicks open file selector
        dropzoneEl.addEventListener('click', () => inputEl.click());

        inputEl.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                zone.handler(zone.multiple ? e.target.files : e.target.files[0]);
            }
        });

        // Drag over animations
        dropzoneEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzoneEl.classList.add('dragover');
        });

        dropzoneEl.addEventListener('dragleave', () => {
            dropzoneEl.classList.remove('dragover');
        });

        // Drop file handler
        dropzoneEl.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzoneEl.classList.remove('dragover');

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                zone.handler(zone.multiple ? e.dataTransfer.files : e.dataTransfer.files[0]);
            }
        });
    });
}

// Single Uploads (Music)
function handleMusicUpload(file) {
    if (!file) return;

    if (dirHandle) {
        // Direct sync handles
        PENDING_FILES.bgMusic = file;
        ACTIVE_CONFIG.bgMusic = file.name;
        document.getElementById('music-filename').value = file.name;
        showLog(`تم اختيار ملف الموسيقى ${file.name} للربط المباشر بمجلدك!`, "success");
    } else {
        // Read as base64 fallback
        showLog("جاري قراءة ملف الموسيقى (ترميز Base64)... ⏳");
        const reader = new FileReader();
        reader.onload = (e) => {
            ACTIVE_CONFIG.bgMusic = e.target.result;
            document.getElementById('music-filename').value = "ملف مدمج (Base64) 🎶";
            renderMediaPreviews();
            showLog("تم دمج ملف الموسيقى بنجاح! 🎵", "success");
            checkConfigSize();
        };
        reader.readAsDataURL(file);
    }
}

// Single Uploads (Memories Music)
function handleMemoriesMusicUpload(file) {
    if (!file) return;

    if (dirHandle) {
        PENDING_FILES.memoriesMusic = file;
        ACTIVE_CONFIG.memoriesMusic = file.name;
        document.getElementById('slideshow-music-filename').value = file.name;
        showLog(`تم اختيار ملف موسيقى الذكريات ${file.name} للربط المباشر!`, "success");
    } else {
        showLog("جاري قراءة ملف موسيقى الذكريات (ترميز Base64)... ⏳");
        const reader = new FileReader();
        reader.onload = (e) => {
            ACTIVE_CONFIG.memoriesMusic = e.target.result;
            document.getElementById('slideshow-music-filename').value = "ملف مدمج (Base64) 🎶";
            renderMediaPreviews();
            showLog("تم دمج ملف موسيقى الذكريات بنجاح! 🎵", "success");
            checkConfigSize();
        };
        reader.readAsDataURL(file);
    }
}

// Single Uploads (Background Image)
function handleBgImageUpload(file) {
    if (!file) return;

    if (dirHandle) {
        PENDING_FILES.endingBgImage = file;
        ACTIVE_CONFIG.endingBgImage = file.name;
        document.getElementById('bg-image-filename').value = file.name;
        showLog(`تم اختيار صورة الخلفية ${file.name} للربط المباشر!`, "success");
    } else {
        showLog("جاري قراءة صورة الخلفية... ⏳");
        const reader = new FileReader();
        reader.onload = (e) => {
            ACTIVE_CONFIG.endingBgImage = e.target.result;
            document.getElementById('bg-image-filename').value = "صورة مدمجة (Base64) 🖼️";
            renderMediaPreviews();
            showLog("تم دمج صورة الخلفية بنجاح! 🖼️", "success");
            checkConfigSize();
        };
        reader.readAsDataURL(file);
    }
}

// Multiple Uploads (Gallery Images)
function handleGalleryUpload(filesList) {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    if (dirHandle) {
        files.forEach((file, index) => {
            const ext = file.name.split('.').pop() || 'jpg';
            const uniqueName = `gallery_img_${Date.now()}_${index}.${ext}`;
            // Proxy name for writing
            Object.defineProperty(file, 'customName', { value: uniqueName, writable: false });
            PENDING_FILES.endingImages.push(file);
            ACTIVE_CONFIG.endingImages.push(uniqueName);
        });
        renderMediaPreviews();
        showLog(`تم تجهيز عدد ${files.length} صورة للربط المباشر!`, "success");
    } else {
        showLog("جاري قراءة الصور ودمجها... ⏳");
        let loadedCount = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                ACTIVE_CONFIG.endingImages.push(e.target.result);
                loadedCount++;
                if (loadedCount === files.length) {
                    renderMediaPreviews();
                    showLog(`تم دمج عدد ${files.length} صورة بالمعرض بنجاح!`, "success");
                    checkConfigSize();
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

// Multiple Uploads (Videos)
function handleVideosUpload(fileOrList) {
    const files = fileOrList instanceof FileList || Array.isArray(fileOrList)
        ? Array.from(fileOrList)
        : [fileOrList];

    if (files.length === 0) return;

    if (dirHandle) {
        files.forEach((file, index) => {
            const ext = file.name.split('.').pop() || 'mp4';
            const uniqueName = `video_${Date.now()}_${index}.${ext}`;
            Object.defineProperty(file, 'customName', { value: uniqueName, writable: false });
            PENDING_FILES.endingVideos.push(file);
            ACTIVE_CONFIG.endingVideos.push(uniqueName);
        });
        renderMediaPreviews();
        showLog(`تم تجهيز مقاطع الفيديو للربط المباشر!`, "success");
    } else {
        // Read base64 fallback
        showLog("جاري قراءة ملف الفيديو (قد يستغرق بعض الوقت)... ⏳");
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                ACTIVE_CONFIG.endingVideos.push(e.target.result);
                renderMediaPreviews();
                showLog("تم دمج مقطع الفيديو بنجاح! 🎥", "success");
                checkConfigSize();
            };
            reader.readAsDataURL(file);
        });
    }
}

// Render dynamic previews of uploaded gallery images & videos
function renderMediaPreviews() {
    // Render static previews
    const previewMusicContainer = document.getElementById('music-preview-container');
    if (ACTIVE_CONFIG.bgMusic && ACTIVE_CONFIG.bgMusic.startsWith('data:')) {
        previewMusicContainer.style.display = 'block';
        previewMusicContainer.innerHTML = `
            <div class="preview-card" style="grid-column: 1 / -1; aspect-ratio: auto; padding:15px;">
                <div class="audio-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <span>موسيقى مدمجة مسبقاً (جاهزة للتشغيل)</span>
                    <audio src="${ACTIVE_CONFIG.bgMusic}" controls style="margin-top: 8px; width: 100%;"></audio>
                </div>
                <div class="card-remove-badge" onclick="removeMusic()">&times;</div>
            </div>
        `;
    } else {
        previewMusicContainer.style.display = 'none';
    }

    const previewSlideshowMusicContainer = document.getElementById('slideshow-music-preview-container');
    if (previewSlideshowMusicContainer) {
        if (ACTIVE_CONFIG.memoriesMusic && ACTIVE_CONFIG.memoriesMusic.startsWith('data:')) {
            previewSlideshowMusicContainer.style.display = 'block';
            previewSlideshowMusicContainer.innerHTML = `
                <div class="preview-card" style="grid-column: 1 / -1; aspect-ratio: auto; padding:15px;">
                    <div class="audio-indicator">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        <span>موسيقى الذكريات مدمجة مسبقاً (جاهزة للتشغيل)</span>
                        <audio src="${ACTIVE_CONFIG.memoriesMusic}" controls style="margin-top: 8px; width: 100%;"></audio>
                    </div>
                    <div class="card-remove-badge" onclick="removeMemoriesMusic()">&times;</div>
                </div>
            `;
        } else {
            previewSlideshowMusicContainer.style.display = 'none';
        }
    }

    const previewBgContainer = document.getElementById('bg-image-preview-container');
    if (ACTIVE_CONFIG.endingBgImage && ACTIVE_CONFIG.endingBgImage.startsWith('data:')) {
        previewBgContainer.style.display = 'block';
        previewBgContainer.innerHTML = `
            <div class="preview-card">
                <img src="${ACTIVE_CONFIG.endingBgImage}" alt="خلفية المعرض">
                <div class="card-remove-badge" onclick="removeBgImage()">&times;</div>
            </div>
        `;
    } else {
        previewBgContainer.style.display = 'none';
    }

    // Render Ending Gallery Previews
    const galleryPreviews = document.getElementById('gallery-previews');
    if (galleryPreviews) {
        galleryPreviews.innerHTML = '';
        ACTIVE_CONFIG.endingImages.forEach((imgSrc, index) => {
            const card = document.createElement('div');
            card.className = 'preview-card';

            // If it's a proxy file name (directory handle connected)
            if (!imgSrc.startsWith('data:')) {
                card.innerHTML = `
                    <div style="padding:10px; text-align:center; font-size:0.75rem; color:var(--text-muted);">
                        🖼️ ${imgSrc}
                    </div>
                    <div class="card-remove-badge" onclick="removeGalleryImage(${index})">&times;</div>
                `;
            } else {
                card.innerHTML = `
                    <img src="${imgSrc}">
                    <div class="card-remove-badge" onclick="removeGalleryImage(${index})">&times;</div>
                `;
            }
            galleryPreviews.appendChild(card);
        });
    }

    // Render Videos Previews
    const videosPreviews = document.getElementById('videos-previews');
    if (videosPreviews) {
        videosPreviews.innerHTML = '';
        ACTIVE_CONFIG.endingVideos.forEach((vidSrc, index) => {
            const card = document.createElement('div');
            card.className = 'preview-card';

            if (!vidSrc.startsWith('data:')) {
                card.innerHTML = `
                    <div style="padding:10px; text-align:center; font-size:0.75rem; color:var(--text-muted);">
                        🎥 ${vidSrc}
                    </div>
                    <div class="card-remove-badge" onclick="removeVideo(${index})">&times;</div>
                `;
            } else {
                card.innerHTML = `
                    <video src="${vidSrc}" muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                    <div class="card-remove-badge" onclick="removeVideo(${index})">&times;</div>
                `;
            }
            videosPreviews.appendChild(card);
        });
    }
}

// Media element deletion functions
window.removeMusic = function () {
    ACTIVE_CONFIG.bgMusic = "music.mp3";
    PENDING_FILES.bgMusic = null;
    document.getElementById('music-filename').value = "music.mp3";
    renderMediaPreviews();
};

window.removeMemoriesMusic = function () {
    ACTIVE_CONFIG.memoriesMusic = "";
    PENDING_FILES.memoriesMusic = null;
    const sMusic = document.getElementById('slideshow-music-filename');
    if (sMusic) {
        sMusic.value = 'بدون موسيقى مخصصة (يستمر تشغيل الموسيقى العامة)';
    }
    renderMediaPreviews();
};

window.removeBgImage = function () {
    ACTIVE_CONFIG.endingBgImage = "photo.jpg";
    PENDING_FILES.endingBgImage = null;
    document.getElementById('bg-image-filename').value = "photo.jpg";
    renderMediaPreviews();
};

window.removeGalleryImage = function (index) {
    const filename = ACTIVE_CONFIG.endingImages[index];
    ACTIVE_CONFIG.endingImages.splice(index, 1);

    // If it was a pending file write
    if (!filename.startsWith('data:')) {
        PENDING_FILES.endingImages = PENDING_FILES.endingImages.filter(f => f.customName !== filename);
    }
    renderMediaPreviews();
    showLog("تمت إزالة الصورة من المعرض.");
};

window.removeVideo = function (index) {
    const filename = ACTIVE_CONFIG.endingVideos[index];
    ACTIVE_CONFIG.endingVideos.splice(index, 1);

    if (!filename.startsWith('data:')) {
        PENDING_FILES.endingVideos = PENDING_FILES.endingVideos.filter(f => f.customName !== filename);
    }
    renderMediaPreviews();
    showLog("تمت إزالة مقطع الفيديو.");
};

// 7. Save & Export logic
function setupSaveAndExport() {
    document.getElementById('btn-save-local').addEventListener('click', saveToLocalStorage);
    document.getElementById('btn-save-main').addEventListener('click', saveEverything);
    document.getElementById('btn-download-config').addEventListener('click', downloadConfigJS);
    document.getElementById('btn-reset-defaults').addEventListener('click', resetToDefaults);
}

// Saves local state to IndexedDB / LocalStorage
async function saveToLocalStorage() {
    try {
        if (window.ConfigRepo) {
            await window.ConfigRepo.save(ACTIVE_CONFIG);
            showLog("تم حفظ التعديلات بذاكرة المتصفح (IndexedDB) بنجاح! قم بمعاينة الموقع الآن. 💾", "success");
        } else {
            localStorage.setItem('site_config', JSON.stringify(ACTIVE_CONFIG));
            showLog("تم حفظ التعديلات بذاكرة المتصفح (LocalStorage)! 💾", "success");
        }
        checkConfigSize();
    } catch (e) {
        showLog("تنبيه: حجم الملفات والصور كبير جداً لحفظه بذاكرة المتصفح! يرجى استخدام الربط بالمجلد أو تحميل الملف يدوياً.", "error");
        console.error(e);
    }
}

// Saves local storage AND writes to connected folder directly
async function saveEverything() {
    await saveToLocalStorage();

    if (dirHandle) {
        showLog("جاري كتابة الملفات لمجلد المشروع... ⏳");
        try {
            // Write config.js
            const configHandle = await dirHandle.getFileHandle('config.js', { create: true });
            const writable = await configHandle.createWritable();
            await writable.write(`window.CONFIG = ${JSON.stringify(ACTIVE_CONFIG, null, 4)};`);
            await writable.close();

            // Write pending music file
            if (PENDING_FILES.bgMusic) {
                const musicHandle = await dirHandle.getFileHandle(PENDING_FILES.bgMusic.name, { create: true });
                const mWritable = await musicHandle.createWritable();
                await mWritable.write(PENDING_FILES.bgMusic);
                await mWritable.close();
                PENDING_FILES.bgMusic = null;
            }

            // Write pending memories music file
            if (PENDING_FILES.memoriesMusic) {
                const sMusicHandle = await dirHandle.getFileHandle(PENDING_FILES.memoriesMusic.name, { create: true });
                const smWritable = await sMusicHandle.createWritable();
                await smWritable.write(PENDING_FILES.memoriesMusic);
                await smWritable.close();
                PENDING_FILES.memoriesMusic = null;
            }

            // Write pending background image
            if (PENDING_FILES.endingBgImage) {
                const bgHandle = await dirHandle.getFileHandle(PENDING_FILES.endingBgImage.name, { create: true });
                const bWritable = await bgHandle.createWritable();
                await bWritable.write(PENDING_FILES.endingBgImage);
                await bWritable.close();
                PENDING_FILES.endingBgImage = null;
            }

            // Write gallery images
            for (const file of PENDING_FILES.endingImages) {
                const imgHandle = await dirHandle.getFileHandle(file.customName, { create: true });
                const iWritable = await imgHandle.createWritable();
                await iWritable.write(file);
                await iWritable.close();
            }
            PENDING_FILES.endingImages = [];

            // Write gallery videos
            for (const file of PENDING_FILES.endingVideos) {
                const vidHandle = await dirHandle.getFileHandle(file.customName, { create: true });
                const vWritable = await vidHandle.createWritable();
                await vWritable.write(file);
                await vWritable.close();
            }
            PENDING_FILES.endingVideos = [];

            showLog("تم حفظ التعديلات وكتابة الملفات لمجلد المشروع بنجاح! 🎉", "success");
        } catch (err) {
            showLog("خطأ أثناء الكتابة في مجلد المشروع! تأكد من منح الصلاحيات اللازمة للمجلد.", "error");
            console.error(err);
        }
    }
}

// Download dynamic config.js file helper
function downloadConfigJS() {
    const fileContent = `window.CONFIG = ${JSON.stringify(ACTIVE_CONFIG, null, 4)};`;
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showLog("تم تجهيز وتحميل ملف config.js بنجاح! ضعه بمجلد الموقع.", "success");
}

// Factory Resets
async function resetToDefaults() {
    if (confirm("هل أنت متأكد من رغبتك في مسح كافة التعديلات واسترجاع القيم الافتراضية الأولى لمسرة؟")) {
        if (window.ConfigRepo) {
            await window.ConfigRepo.clear();
        } else {
            localStorage.removeItem('site_config');
        }
        ACTIVE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        PENDING_FILES = {
            bgMusic: null,
            memoriesMusic: null,
            endingBgImage: null,
            endingImages: [],
            endingVideos: []
        };
        populateInputs();
        renderQuestionsList();
        renderParagraphsList();
        renderCreditsNamesList();
        renderMediaPreviews();
        showLog("تمت استعادة إعدادات مصنع مسرة بنجاح! 🔄", "success");
    }
}

// Load config from config.js (window.CONFIG), LocalStorage, or IndexedDB
async function initializeConfig() {
    ACTIVE_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if (window.CONFIG) {
        ACTIVE_CONFIG = JSON.parse(JSON.stringify({ ...ACTIVE_CONFIG, ...window.CONFIG }));
    }

    if (window.ConfigRepo) {
        try {
            const dbConfig = await window.ConfigRepo.load();
            if (dbConfig) {
                ACTIVE_CONFIG = JSON.parse(JSON.stringify({ ...ACTIVE_CONFIG, ...dbConfig }));
            }
        } catch (e) {
            console.error("Failed to load IndexedDB config:", e);
        }
    } else {
        const localConfig = localStorage.getItem('site_config');
        if (localConfig) {
            try {
                const parsed = JSON.parse(localConfig);
                ACTIVE_CONFIG = JSON.parse(JSON.stringify({ ...ACTIVE_CONFIG, ...parsed }));
            } catch (e) {
                console.error("Failed to parse local config", e);
            }
        }
    }
}

// Check configuration size for localStorage limits (approx 5MB)
function checkConfigSize() {
    try {
        const str = JSON.stringify(ACTIVE_CONFIG);
        const sizeMB = (str.length / (1024 * 1024)).toFixed(2);
        if (str.length > 4.5 * 1024 * 1024) {
            showLog(`تحذير: حجم البيانات الحالي (${sizeMB} ميجابايت) يقترب من الحد الأقصى للمتصفح. يرجى ربط مجلد المشروع لحفظ الملفات مباشرة! ⚠️`, "error");
            return false;
        } else if (str.length > 3.0 * 1024 * 1024) {
            showLog(`تنبيه: حجم البيانات (${sizeMB} ميجابايت) كبير نسبياً. يفضل استخدام ربط المجلد لتخزين أفضل. ⚠️`, "warning");
        }
        return true;
    } catch (e) {
        return true;
    }
}

// 8. Global Configuration Loader
async function loadConfig() {
    await initializeConfig();
    populateInputs();
    renderQuestionsList();
    renderParagraphsList();
    renderCreditsNamesList();
    renderMediaPreviews();
    checkConfigSize();
}

// 9. Logger status updater
function showLog(text, type = "") {
    const logger = document.getElementById('status-log');
    if (!logger) return;
    logger.innerText = text;
    logger.className = `status-log ${type}`;
}
