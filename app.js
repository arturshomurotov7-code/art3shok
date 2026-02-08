/* ============================================
   MathZone — Complete Application Logic
   ============================================ */

// ==================== DATABASE ====================
const DB = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
    set(key, data) { localStorage.setItem(key, JSON.stringify(data)); },
    getOne(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    setOne(key, data) { localStorage.setItem(key, JSON.stringify(data)); },

    users: {
        getAll() { return DB.get('mz_users'); },
        getById(id) { return DB.get('mz_users').find(u => u.id === id); },
        getByUsername(username) { return DB.get('mz_users').find(u => u.username === username); },
        save(user) {
            const users = DB.get('mz_users');
            const idx = users.findIndex(u => u.id === user.id);
            if (idx >= 0) users[idx] = user; else users.push(user);
            DB.set('mz_users', users);
        },
        delete(id) { DB.set('mz_users', DB.get('mz_users').filter(u => u.id !== id)); }
    },
    classes: {
        getAll() { return DB.get('mz_classes'); },
        getById(id) { return DB.get('mz_classes').find(c => c.id === id); },
        getByCode(code) { return DB.get('mz_classes').find(c => c.code === code.toUpperCase()); },
        getByTeacher(tid) { return DB.get('mz_classes').filter(c => c.teacherId === tid); },
        save(cls) {
            const classes = DB.get('mz_classes');
            const idx = classes.findIndex(c => c.id === cls.id);
            if (idx >= 0) classes[idx] = cls; else classes.push(cls);
            DB.set('mz_classes', classes);
        },
        delete(id) { DB.set('mz_classes', DB.get('mz_classes').filter(c => c.id !== id)); }
    },
    tests: {
        getAll() { return DB.get('mz_tests'); },
        getById(id) { return DB.get('mz_tests').find(t => t.id === id); },
        getByTeacher(tid) { return DB.get('mz_tests').filter(t => t.teacherId === tid); },
        getByClass(cid) { return DB.get('mz_tests').filter(t => t.classId === cid && t.status === 'published'); },
        save(test) {
            const tests = DB.get('mz_tests');
            const idx = tests.findIndex(t => t.id === test.id);
            if (idx >= 0) tests[idx] = test; else tests.push(test);
            DB.set('mz_tests', tests);
        },
        delete(id) { DB.set('mz_tests', DB.get('mz_tests').filter(t => t.id !== id)); }
    },
    results: {
        getAll() { return DB.get('mz_results'); },
        getByStudent(sid) { return DB.get('mz_results').filter(r => r.studentId === sid); },
        getByTest(tid) { return DB.get('mz_results').filter(r => r.testId === tid); },
        getByStudentAndTest(sid, tid) { return DB.get('mz_results').filter(r => r.studentId === sid && r.testId === tid); },
        save(result) {
            const results = DB.get('mz_results');
            results.push(result);
            DB.set('mz_results', results);
        }
    },
    notifications: {
        getAll() { return DB.get('mz_notifications'); },
        getByUser(uid) { return DB.get('mz_notifications').filter(n => n.userId === uid).sort((a, b) => b.createdAt - a.createdAt); },
        save(notif) {
            const notifs = DB.get('mz_notifications');
            notifs.push(notif);
            DB.set('mz_notifications', notifs);
        },
        markRead(id) {
            const notifs = DB.get('mz_notifications');
            const n = notifs.find(x => x.id === id);
            if (n) { n.read = true; DB.set('mz_notifications', notifs); }
        },
        markAllRead(uid) {
            const notifs = DB.get('mz_notifications');
            notifs.forEach(n => { if (n.userId === uid) n.read = true; });
            DB.set('mz_notifications', notifs);
        }
    },
    announcements: {
        getAll() { return DB.get('mz_announcements'); },
        getByClass(cid) { return DB.get('mz_announcements').filter(a => a.classId === cid || a.classId === 'all'); },
        save(ann) {
            const anns = DB.get('mz_announcements');
            anns.push(ann);
            DB.set('mz_announcements', anns);
        }
    }
};

// ==================== UTILITIES ====================
const genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
const genClassCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const hashPw = (pw) => btoa(pw);
const checkPw = (pw, hash) => btoa(pw) === hash;
const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
const formatDate = (ts) => {
    const d = new Date(ts);
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    return `${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}`;
};
const getGrade = (pct) => {
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
};
const getGradeClass = (grade) => {
    if (grade.startsWith('A')) return 'grade-a';
    if (grade === 'B') return 'grade-b';
    if (grade === 'C') return 'grade-c';
    return 'grade-d';
};
const difficultyLabel = { easy: 'Oson', medium: "O'rta", hard: 'Qiyin' };
const difficultyBadge = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' };
const categoryLabel = {
    algebra: 'Algebra', geometriya: 'Geometriya', trigonometriya: 'Trigonometriya',
    arifmetika: 'Arifmetika', statistika: 'Statistika', analiz: 'Matematik analiz'
};
const levelNames = ['', "Boshlang'ich", "O'rganuvchi", 'Bilimdon', 'Mohir', 'Usta', 'Professor', 'Akademik', 'Daho', 'Geniy', 'Legenda'];
const calcLevel = (xp) => Math.min(Math.floor(Math.sqrt(xp / 100)) + 1, 10);
const xpForLevel = (lvl) => Math.pow(lvl - 1, 2) * 100;
const xpForNextLevel = (lvl) => Math.pow(lvl, 2) * 100;

// ==================== SESSION ====================
let currentUser = null;
const getSession = () => DB.getOne('mz_session');
const setSession = (user) => { DB.setOne('mz_session', { userId: user.id, role: user.role }); currentUser = user; };
const clearSession = () => { localStorage.removeItem('mz_session'); currentUser = null; };

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]} toast-icon"></i><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ==================== CONFIRM MODAL ====================
let confirmCallback = null;
function showConfirm(message, callback, title = 'Tasdiqlash') {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').classList.remove('hidden');
    confirmCallback = callback;
}
document.getElementById('confirm-ok')?.addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
});
document.getElementById('confirm-cancel')?.addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
});

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ==================== THEME ====================
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('mz_theme', isDark ? 'light' : 'dark');
    const cb = document.getElementById('settings-darkmode');
    if (cb) cb.checked = !isDark;
    document.querySelectorAll('.fa-moon, .fa-sun').forEach(icon => {
        icon.classList.toggle('fa-moon', isDark);
        icon.classList.toggle('fa-sun', !isDark);
    });
}
function applyTheme() {
    const theme = localStorage.getItem('mz_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const cb = document.getElementById('settings-darkmode');
    if (cb) cb.checked = theme === 'dark';
    if (theme === 'dark') {
        document.querySelectorAll('.fa-moon').forEach(i => { i.classList.remove('fa-moon'); i.classList.add('fa-sun'); });
    }
}

// ==================== AUTH ====================
function showAuth(tab) {
    document.getElementById('modal-auth').classList.remove('hidden');
    switchAuthTab(tab);
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
}

// Role card click
document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', function () {
        const parent = this.closest('.role-selector');
        parent.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        this.querySelector('input').checked = true;
        const pf = document.getElementById('parent-child-field');
        if (pf) {
            const regRole = document.querySelector('input[name="reg-role"]:checked');
            if (regRole) pf.classList.toggle('hidden', regRole.value !== 'parent');
        }
    });
});

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.querySelector('input[name="login-role"]:checked').value;
    const user = DB.users.getByUsername(username);
    if (!user || !checkPw(password, user.password) || user.role !== role) {
        showToast("Noto'g'ri ma'lumotlar!", 'error');
        return;
    }
    setSession(user);
    closeModal('modal-auth');
    showToast(`Xush kelibsiz, ${user.fullName}!`, 'success');
    loadDashboard();
}

function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.querySelector('input[name="reg-role"]:checked').value;

    if (password !== confirm) { showToast('Parollar mos kelmadi!', 'error'); return; }
    if (password.length < 3) { showToast('Parol kamida 3 ta belgi!', 'error'); return; }
    if (DB.users.getByUsername(username)) { showToast('Bu username band!', 'error'); return; }

    const user = {
        id: genId(), username, password: hashPw(password), fullName, role,
        avatar: null, xp: 0, level: 1, streak: 0, lastActive: Date.now(),
        classIds: [], achievements: [], settings: { darkMode: false },
        parentOf: null, createdAt: Date.now()
    };

    if (role === 'parent') {
        const childUsername = document.getElementById('reg-child-username').value.trim();
        if (childUsername) {
            const child = DB.users.getByUsername(childUsername);
            if (child && child.role === 'student') {
                user.parentOf = child.id;
            } else {
                showToast("Farzand topilmadi!", 'warning');
            }
        }
    }

    DB.users.save(user);
    setSession(user);
    closeModal('modal-auth');
    showToast("Ro'yxatdan o'tdingiz!", 'success');
    loadDashboard();
}

function handleLogout() {
    showConfirm('Tizimdan chiqmoqchimisiz?', () => {
        clearSession();
        showPage('page-landing');
        showToast('Tizimdan chiqdingiz', 'info');
    });
}

// ==================== NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
    const page = document.getElementById(pageId);
    if (page) { page.classList.remove('hidden'); page.classList.add('active'); }
}

function showSection(sectionId) {
    const mainContent = document.querySelector('.page.active .main-content') || document.querySelector('.page.active');
    if (!mainContent) return;

    mainContent.querySelectorAll('.content-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });

    let target = mainContent.querySelector(`#${sectionId}`);
    if (!target) {
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
        target = document.getElementById(sectionId);
    }
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-page="${sectionId}"]`).forEach(n => n.classList.add('active'));

    document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));

    const sidebar = document.querySelector('.sidebar.open');
    if (sidebar && window.innerWidth <= 1024) sidebar.classList.remove('open');

    if (sectionId === 'teacher-home') loadTeacherHome();
    if (sectionId === 'teacher-classes') loadClasses();
    if (sectionId === 'teacher-tests') loadTestList();
    if (sectionId === 'teacher-results') loadTeacherResultsPage();
    if (sectionId === 'teacher-analytics') loadAnalytics();
    if (sectionId === 'teacher-create-test') loadTestCreator();
    if (sectionId === 'teacher-announcements') loadAnnouncements();
    if (sectionId === 'student-home') loadStudentHome();
    if (sectionId === 'student-tests') loadStudentTests();
    if (sectionId === 'student-results') loadStudentResults();
    if (sectionId === 'student-leaderboard') loadLeaderboard();
    if (sectionId === 'student-achievements') loadAchievements();
    if (sectionId === 'student-formulas') loadFormulas();
    if (sectionId === 'student-join') loadStudentClasses();
    if (sectionId === 'parent-home') loadParentHome();
    if (sectionId === 'settings') loadSettings();
}

function toggleSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.toggle('open'));
}

function toggleNotifications() {
    const dd = document.querySelector('.page.active .notif-dropdown');
    if (dd) dd.classList.toggle('hidden');
}

function toggleUserMenu() { /* future */ }

// ==================== LOAD DASHBOARD ====================
function loadDashboard() {
    if (!currentUser) return showPage('page-landing');

    if (currentUser.role === 'teacher') {
        showPage('page-teacher');
        document.getElementById('user-name').textContent = currentUser.fullName;
        document.getElementById('user-avatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
        document.getElementById('welcome-name').textContent = currentUser.fullName;
        loadTeacherHome();
    } else if (currentUser.role === 'student') {
        showPage('page-student');
        document.getElementById('student-name').textContent = currentUser.fullName;
        document.getElementById('student-avatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
        document.getElementById('student-welcome-name').textContent = currentUser.fullName;
        updateStudentXPBar();
        updateStreak();
        loadStudentHome();
    } else if (currentUser.role === 'parent') {
        showPage('page-parent');
        document.getElementById('parent-name').textContent = currentUser.fullName;
        document.getElementById('parent-avatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
        loadParentHome();
    }
    loadNotifications();
}

// ==================== TEACHER FEATURES ====================
function loadTeacherHome() {
    if (!currentUser) return;
    const classes = DB.classes.getByTeacher(currentUser.id);
    const tests = DB.tests.getByTeacher(currentUser.id);
    const allStudentIds = [...new Set(classes.flatMap(c => c.studentIds || []))];
    const results = DB.results.getAll().filter(r => tests.some(t => t.id === r.testId));

    document.getElementById('stat-students').textContent = allStudentIds.length;
    document.getElementById('stat-tests').textContent = tests.length;
    document.getElementById('stat-results').textContent = results.length;
    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
    document.getElementById('stat-avg').textContent = avgScore + '%';

    renderTeacherCharts(results, tests);
}

function renderTeacherCharts(results, tests) {
    const ctx1 = document.getElementById('chart-results-line');
    const ctx2 = document.getElementById('chart-category-doughnut');
    if (!ctx1 || !ctx2) return;

    if (window._chartLine) window._chartLine.destroy();
    if (window._chartDoughnut) window._chartDoughnut.destroy();

    const last10 = results.slice(-10);
    window._chartLine = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: last10.map((_, i) => `Test ${i + 1}`),
            datasets: [{
                label: "O'rtacha ball",
                data: last10.map(r => r.percentage),
                borderColor: '#6C63FF',
                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#6C63FF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    const cats = {};
    tests.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
    window._chartDoughnut = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats).map(c => categoryLabel[c] || c),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#6C63FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// --- Classes ---
function showCreateClass() { document.getElementById('create-class-form').classList.remove('hidden'); }
function hideCreateClass() { document.getElementById('create-class-form').classList.add('hidden'); }

function createClass(e) {
    e.preventDefault();
    const name = document.getElementById('class-name').value.trim();
    const desc = document.getElementById('class-desc').value.trim();
    if (!name) return;
    const cls = {
        id: genId(), name, description: desc, code: genClassCode(),
        teacherId: currentUser.id, studentIds: [], createdAt: Date.now()
    };
    DB.classes.save(cls);
    showToast('Sinf yaratildi!', 'success');
    hideCreateClass();
    document.getElementById('class-name').value = '';
    document.getElementById('class-desc').value = '';
    loadClasses();
}

function loadClasses() {
    const classes = DB.classes.getByTeacher(currentUser.id);
    const grid = document.getElementById('classes-grid');
    if (!classes.length) {
        grid.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i><br>Hali sinf yaratilmagan</p>';
        return;
    }
    grid.innerHTML = classes.map(cls => `
        <div class="class-card">
            <div class="class-card-header">
                <h3>${cls.name}</h3>
                <span class="class-code" onclick="copyToClipboard('${cls.code}')" title="Nusxa olish">
                    <i class="fas fa-key"></i> ${cls.code}
                </span>
            </div>
            ${cls.description ? `<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px">${cls.description}</p>` : ''}
            <div class="class-meta">
                <span><i class="fas fa-users"></i> ${(cls.studentIds || []).length} o'quvchi</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(cls.createdAt)}</span>
            </div>
            <div class="class-actions">
                <button class="btn btn-sm btn-secondary" onclick="showClassQR('${cls.id}')"><i class="fas fa-qrcode"></i> QR</button>
                <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${cls.code}')"><i class="fas fa-copy"></i> Kod</button>
                <button class="btn btn-sm btn-danger" onclick="deleteClass('${cls.id}')"><i class="fas fa-trash"></i></button>
            </div>
            ${(cls.studentIds || []).length ? `
                <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px">
                    <h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:8px">O'quvchilar:</h4>
                    ${cls.studentIds.map(sid => {
                        const s = DB.users.getById(sid);
                        return s ? `<span class="badge badge-info" style="margin:2px">${s.fullName}</span>` : '';
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function deleteClass(id) {
    showConfirm('Bu sinfni o\'chirmoqchimisiz?', () => {
        DB.classes.delete(id);
        showToast('Sinf o\'chirildi', 'info');
        loadClasses();
    });
}

function showClassQR(classId) {
    const cls = DB.classes.getById(classId);
    if (!cls) return;
    const link = `Sinf kodi: ${cls.code}`;
    showQRModal(link, `Sinf: ${cls.name} — Kod: ${cls.code}`);
}

function showQRModal(text, displayText) {
    const qrDiv = document.getElementById('qr-display');
    qrDiv.innerHTML = '';
    try {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        qrDiv.innerHTML = qr.createSvgTag(5);
    } catch {
        qrDiv.innerHTML = '<p>QR yaratib bo\'lmadi</p>';
    }
    document.getElementById('qr-link').textContent = displayText || text;
    document.getElementById('qr-modal').classList.remove('hidden');
    document.getElementById('qr-copy-btn').onclick = () => copyToClipboard(text);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Nusxa olindi!', 'success')).catch(() => showToast('Xatolik', 'error'));
}

// --- Test Creator ---
let questionCounter = 0;
let editingTestId = null;

function loadTestCreator() {
    const sel = document.getElementById('test-class');
    const classes = DB.classes.getByTeacher(currentUser.id);
    sel.innerHTML = '<option value="">Tanlang...</option>' + classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (!editingTestId) {
        document.getElementById('test-form').reset();
        document.getElementById('questions-container').innerHTML = '';
        questionCounter = 0;
    }
}

function addQuestion() {
    questionCounter++;
    const container = document.getElementById('questions-container');
    const qDiv = document.createElement('div');
    qDiv.className = 'question-card';
    qDiv.id = `question-${questionCounter}`;
    qDiv.innerHTML = `
        <div class="question-card-header">
            <h4><i class="fas fa-question-circle"></i> Savol ${questionCounter}</h4>
            <button type="button" class="question-remove" onclick="removeQuestion(${questionCounter})"><i class="fas fa-trash"></i></button>
        </div>
        <div class="form-group">
            <label>Savol matni (LaTeX uchun $formula$ yozing)</label>
            <textarea rows="3" class="q-text" id="q-text-${questionCounter}" placeholder="Savolni yozing..." oninput="previewLatex(this, 'preview-${questionCounter}')"></textarea>
            <div class="latex-preview" id="preview-${questionCounter}"></div>
        </div>
        <div class="form-row">
            <div class="form-group flex-1">
                <label>Savol turi</label>
                <select class="q-type" id="q-type-${questionCounter}" onchange="toggleQuestionType(${questionCounter})">
                    <option value="mcq">Ko'p tanlov</option>
                    <option value="written">Yozma javob</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>Ball</label>
                <input type="number" class="q-points" id="q-points-${questionCounter}" value="10" min="1" max="100">
            </div>
        </div>
        <div class="options-container" id="options-${questionCounter}">
            <div class="option-row"><span class="option-letter" id="ol-A-${questionCounter}">A</span><input type="text" id="opt-A-${questionCounter}" placeholder="A varianti"></div>
            <div class="option-row"><span class="option-letter" id="ol-B-${questionCounter}">B</span><input type="text" id="opt-B-${questionCounter}" placeholder="B varianti"></div>
            <div class="option-row"><span class="option-letter" id="ol-C-${questionCounter}">C</span><input type="text" id="opt-C-${questionCounter}" placeholder="C varianti"></div>
            <div class="option-row"><span class="option-letter" id="ol-D-${questionCounter}">D</span><input type="text" id="opt-D-${questionCounter}" placeholder="D varianti"></div>
        </div>
        <div class="form-group" style="margin-top:12px">
            <label>To'g'ri javob</label>
            <select class="q-correct" id="q-correct-${questionCounter}">
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
        </div>
        <div class="written-answer hidden" id="written-${questionCounter}">
            <div class="form-group">
                <label>To'g'ri javob (yozma)</label>
                <input type="text" class="q-written-answer" id="q-written-${questionCounter}" placeholder="To'g'ri javobni yozing">
            </div>
        </div>
    `;
    container.appendChild(qDiv);
}

function removeQuestion(num) {
    const el = document.getElementById(`question-${num}`);
    if (el) el.remove();
}

function toggleQuestionType(num) {
    const type = document.getElementById(`q-type-${num}`).value;
    const opts = document.getElementById(`options-${num}`);
    const written = document.getElementById(`written-${num}`);
    const correctSel = document.getElementById(`q-correct-${num}`);
    if (type === 'written') {
        opts.classList.add('hidden');
        correctSel.closest('.form-group').classList.add('hidden');
        written.classList.remove('hidden');
    } else {
        opts.classList.remove('hidden');
        correctSel.closest('.form-group').classList.remove('hidden');
        written.classList.add('hidden');
    }
}

function previewLatex(textarea, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    let text = textarea.value;
    const parts = text.split(/(\$[^$]+\$)/g);
    preview.innerHTML = '';
    parts.forEach(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
            const span = document.createElement('span');
            try { katex.render(part.slice(1, -1), span, { throwOnError: false }); } catch { span.textContent = part; }
            preview.appendChild(span);
        } else {
            preview.appendChild(document.createTextNode(part));
        }
    });
}

function collectQuestions() {
    const questions = [];
    document.querySelectorAll('.question-card').forEach(card => {
        const num = card.id.split('-')[1];
        const text = document.getElementById(`q-text-${num}`)?.value?.trim();
        if (!text) return;
        const type = document.getElementById(`q-type-${num}`)?.value || 'mcq';
        const points = parseInt(document.getElementById(`q-points-${num}`)?.value) || 10;
        let correct, options;
        if (type === 'mcq') {
            options = ['A', 'B', 'C', 'D'].map(l => document.getElementById(`opt-${l}-${num}`)?.value?.trim() || '');
            correct = document.getElementById(`q-correct-${num}`)?.value || 'A';
        } else {
            options = [];
            correct = document.getElementById(`q-written-${num}`)?.value?.trim() || '';
        }
        questions.push({ id: genId(), text, type, options, correct, points });
    });
    return questions;
}

function saveTest(e) {
    e.preventDefault();
    const questions = collectQuestions();
    if (!questions.length) { showToast('Kamida 1 ta savol qo\'shing!', 'error'); return; }

    const test = {
        id: editingTestId || genId(),
        title: document.getElementById('test-title').value.trim(),
        classId: document.getElementById('test-class').value,
        teacherId: currentUser.id,
        category: document.getElementById('test-category').value,
        difficulty: document.getElementById('test-difficulty').value,
        questions,
        totalTime: parseInt(document.getElementById('test-time').value) || 30,
        shuffleQuestions: document.getElementById('test-shuffle').checked,
        fullscreen: document.getElementById('test-fullscreen').checked,
        detectTabSwitch: document.getElementById('test-tab-detect').checked,
        allowRetry: document.getElementById('test-retry').checked,
        maxAttempts: 1,
        status: 'published',
        createdAt: editingTestId ? (DB.tests.getById(editingTestId)?.createdAt || Date.now()) : Date.now(),
        pdfData: null
    };

    DB.tests.save(test);
    editingTestId = null;
    showToast('Test nashr qilindi!', 'success');

    // Notify students
    if (test.classId) {
        const cls = DB.classes.getById(test.classId);
        if (cls) {
            (cls.studentIds || []).forEach(sid => {
                DB.notifications.save({
                    id: genId(), userId: sid,
                    text: `Yangi test: "${test.title}" (${cls.name})`,
                    type: 'test', read: false, createdAt: Date.now()
                });
            });
        }
    }

    showSection('teacher-tests');
}

function saveTestDraft() {
    const questions = collectQuestions();
    const test = {
        id: editingTestId || genId(),
        title: document.getElementById('test-title').value.trim() || 'Nomsiz test',
        classId: document.getElementById('test-class').value,
        teacherId: currentUser.id,
        category: document.getElementById('test-category').value,
        difficulty: document.getElementById('test-difficulty').value,
        questions,
        totalTime: parseInt(document.getElementById('test-time').value) || 30,
        shuffleQuestions: document.getElementById('test-shuffle').checked,
        fullscreen: document.getElementById('test-fullscreen').checked,
        detectTabSwitch: document.getElementById('test-tab-detect').checked,
        allowRetry: document.getElementById('test-retry').checked,
        status: 'draft',
        createdAt: Date.now(),
        pdfData: null
    };
    DB.tests.save(test);
    editingTestId = null;
    showToast('Qoralama saqlandi', 'info');
}

// PDF Handling
function handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const preview = document.getElementById('pdf-preview');
    preview.classList.remove('hidden');
    preview.innerHTML = `<p><i class="fas fa-file-pdf" style="color:var(--danger);font-size:2rem"></i></p>
        <p style="font-weight:600">${file.name}</p><p style="font-size:0.8rem;color:var(--text-muted)">${(file.size / 1024).toFixed(1)} KB</p>`;
}
function handlePdfDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        document.getElementById('pdf-input').files = e.dataTransfer.files;
        handlePdfUpload({ target: { files: [file] } });
    }
}

// --- Test List ---
function loadTestList() {
    const tests = DB.tests.getByTeacher(currentUser.id);
    const grid = document.getElementById('tests-grid');
    const catFilter = document.getElementById('filter-category').value;
    const diffFilter = document.getElementById('filter-difficulty').value;

    let filtered = tests;
    if (catFilter) filtered = filtered.filter(t => t.category === catFilter);
    if (diffFilter) filtered = filtered.filter(t => t.difficulty === diffFilter);

    if (!filtered.length) {
        grid.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i><br>Testlar topilmadi</p>';
        return;
    }

    grid.innerHTML = filtered.map(test => {
        const results = DB.results.getByTest(test.id);
        const cls = DB.classes.getById(test.classId);
        return `
        <div class="test-card">
            <div class="test-card-header">
                <h3>${test.title}</h3>
                <span class="badge ${test.status === 'published' ? 'badge-published' : 'badge-draft'}">${test.status === 'published' ? 'Nashr' : 'Qoralama'}</span>
            </div>
            <div class="test-card-meta">
                <span><i class="fas fa-tag"></i> ${categoryLabel[test.category] || test.category}</span>
                <span class="badge ${difficultyBadge[test.difficulty]}">${difficultyLabel[test.difficulty]}</span>
                <span><i class="fas fa-list"></i> ${test.questions.length} savol</span>
                <span><i class="fas fa-clock"></i> ${test.totalTime} daq</span>
                ${cls ? `<span><i class="fas fa-users"></i> ${cls.name}</span>` : ''}
                <span><i class="fas fa-chart-bar"></i> ${results.length} natija</span>
            </div>
            <div class="test-card-actions">
                <button class="btn btn-sm btn-secondary" onclick="editTest('${test.id}')"><i class="fas fa-edit"></i> Tahrir</button>
                <button class="btn btn-sm btn-secondary" onclick="shareTest('${test.id}')"><i class="fas fa-share"></i> Ulashish</button>
                <button class="btn btn-sm btn-secondary" onclick="showTestQR('${test.id}')"><i class="fas fa-qrcode"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest('${test.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        `;
    }).join('');
}

function filterTests() { loadTestList(); }

function editTest(id) {
    const test = DB.tests.getById(id);
    if (!test) return;
    editingTestId = id;
    showSection('teacher-create-test');

    document.getElementById('test-title').value = test.title;
    document.getElementById('test-class').value = test.classId;
    document.getElementById('test-category').value = test.category;
    document.getElementById('test-difficulty').value = test.difficulty;
    document.getElementById('test-time').value = test.totalTime;
    document.getElementById('test-shuffle').checked = test.shuffleQuestions;
    document.getElementById('test-fullscreen').checked = test.fullscreen;
    document.getElementById('test-tab-detect').checked = test.detectTabSwitch;
    document.getElementById('test-retry').checked = test.allowRetry;

    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    questionCounter = 0;

    test.questions.forEach(q => {
        addQuestion();
        const num = questionCounter;
        document.getElementById(`q-text-${num}`).value = q.text;
        document.getElementById(`q-type-${num}`).value = q.type;
        document.getElementById(`q-points-${num}`).value = q.points;
        if (q.type === 'mcq') {
            ['A', 'B', 'C', 'D'].forEach((l, i) => {
                if (q.options[i]) document.getElementById(`opt-${l}-${num}`).value = q.options[i];
            });
            document.getElementById(`q-correct-${num}`).value = q.correct;
        } else {
            toggleQuestionType(num);
            document.getElementById(`q-written-${num}`).value = q.correct;
        }
        previewLatex(document.getElementById(`q-text-${num}`), `preview-${num}`);
    });
}

function deleteTest(id) {
    showConfirm("Bu testni o'chirmoqchimisiz?", () => {
        DB.tests.delete(id);
        showToast("Test o'chirildi", 'info');
        loadTestList();
    });
}

function shareTest(id) {
    const link = `${window.location.origin}${window.location.pathname}?test=${id}`;
    copyToClipboard(link);
    showToast('Test havolasi nusxalandi!', 'success');
}

function showTestQR(id) {
    const test = DB.tests.getById(id);
    if (!test) return;
    const link = `Test: ${test.title} (ID: ${id})`;
    showQRModal(link, `Test: ${test.title}`);
}

// --- Teacher Results ---
function loadTeacherResultsPage() {
    const sel = document.getElementById('result-test-filter');
    const tests = DB.tests.getByTeacher(currentUser.id);
    sel.innerHTML = '<option value="">Test tanlang...</option>' + tests.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
}

function loadTeacherResults() {
    const testId = document.getElementById('result-test-filter').value;
    if (!testId) {
        document.getElementById('results-summary').classList.add('hidden');
        document.getElementById('results-tbody').innerHTML = '';
        return;
    }

    const results = DB.results.getByTest(testId);
    document.getElementById('results-summary').classList.remove('hidden');

    if (results.length) {
        const percentages = results.map(r => r.percentage);
        document.getElementById('res-avg').textContent = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) + '%';
        document.getElementById('res-max').textContent = Math.max(...percentages) + '%';
        document.getElementById('res-min').textContent = Math.min(...percentages) + '%';
        document.getElementById('res-count').textContent = results.length;

        document.getElementById('results-tbody').innerHTML = results
            .sort((a, b) => b.percentage - a.percentage)
            .map((r, i) => {
                const student = DB.users.getById(r.studentId);
                return `<tr>
                    <td>${i + 1}</td>
                    <td>${student?.fullName || 'Noma\'lum'}</td>
                    <td>${r.score}/${r.totalPoints}</td>
                    <td><strong>${r.percentage}%</strong></td>
                    <td><span class="badge ${r.percentage >= 80 ? 'badge-easy' : r.percentage >= 60 ? 'badge-medium' : 'badge-hard'}">${r.grade}</span></td>
                    <td>${formatTime(r.timeSpent)}</td>
                    <td>${formatDate(r.completedAt)}</td>
                </tr>`;
            }).join('');
    } else {
        document.getElementById('res-avg').textContent = '0%';
        document.getElementById('res-max').textContent = '0%';
        document.getElementById('res-min').textContent = '0%';
        document.getElementById('res-count').textContent = '0';
        document.getElementById('results-tbody').innerHTML = '<tr><td colspan="7" class="empty-state">Natijalar yo\'q</td></tr>';
    }
}

function exportResults() {
    const testId = document.getElementById('result-test-filter').value;
    if (!testId) { showToast('Avval test tanlang', 'warning'); return; }
    const results = DB.results.getByTest(testId);
    const test = DB.tests.getById(testId);
    let csv = "O'quvchi,Ball,Foiz,Baho,Vaqt,Sana\n";
    results.forEach(r => {
        const student = DB.users.getById(r.studentId);
        csv += `${student?.fullName || ''},${r.score}/${r.totalPoints},${r.percentage}%,${r.grade},${formatTime(r.timeSpent)},${formatDate(r.completedAt)}\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${test?.title || 'natijalar'}.csv`;
    link.click();
    showToast('CSV yuklab olindi', 'success');
}

// --- Analytics ---
function loadAnalytics() {
    const tests = DB.tests.getByTeacher(currentUser.id);
    const results = DB.results.getAll().filter(r => tests.some(t => t.id === r.testId));

    // Score Distribution
    const dist = [0, 0, 0, 0, 0];
    results.forEach(r => {
        if (r.percentage < 20) dist[0]++;
        else if (r.percentage < 40) dist[1]++;
        else if (r.percentage < 60) dist[2]++;
        else if (r.percentage < 80) dist[3]++;
        else dist[4]++;
    });

    const ctx1 = document.getElementById('chart-score-dist');
    if (window._chartScoreDist) window._chartScoreDist.destroy();
    window._chartScoreDist = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
            datasets: [{
                label: "O'quvchilar soni",
                data: dist,
                backgroundColor: ['#EF4444', '#F59E0B', '#06B6D4', '#3B82F6', '#10B981'],
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Topic Radar
    const topicScores = {};
    results.forEach(r => {
        const test = tests.find(t => t.id === r.testId);
        if (test) {
            if (!topicScores[test.category]) topicScores[test.category] = [];
            topicScores[test.category].push(r.percentage);
        }
    });
    const topicLabels = Object.keys(topicScores).map(c => categoryLabel[c] || c);
    const topicAvgs = Object.values(topicScores).map(arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));

    const ctx2 = document.getElementById('chart-topic-radar');
    if (window._chartTopicRadar) window._chartTopicRadar.destroy();
    window._chartTopicRadar = new Chart(ctx2, {
        type: 'radar',
        data: {
            labels: topicLabels,
            datasets: [{
                label: "O'rtacha ball",
                data: topicAvgs,
                backgroundColor: 'rgba(108, 99, 255, 0.2)',
                borderColor: '#6C63FF',
                borderWidth: 2,
                pointBackgroundColor: '#6C63FF'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });

    // AI Recommendations
    const aiBox = document.getElementById('ai-recommendations');
    if (results.length >= 3) {
        const recommendations = [];
        Object.entries(topicScores).forEach(([cat, scores]) => {
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            if (avg < 50) recommendations.push(`<div class="ai-recommendation"><i class="fas fa-robot"></i> ${categoryLabel[cat]} bo'yicha o'rtacha ball juda past (${avg}%). Qo'shimcha mashqlar tavsiya etiladi.</div>`);
            if (avg > 90) recommendations.push(`<div class="ai-recommendation"><i class="fas fa-star" style="color:var(--warning)"></i> ${categoryLabel[cat]} bo'yicha a'lo natijalar (${avg}%)! Qiyinroq savollar bering.</div>`);
        });
        if (results.length > 5) {
            const last5 = results.slice(-5);
            const trend = last5[4]?.percentage - last5[0]?.percentage;
            if (trend > 10) recommendations.push(`<div class="ai-recommendation"><i class="fas fa-chart-line" style="color:var(--success)"></i> Natijalar yaxshilanmoqda (+${trend}%). Davom eting!</div>`);
            if (trend < -10) recommendations.push(`<div class="ai-recommendation"><i class="fas fa-chart-line" style="color:var(--danger)"></i> Natijalar pasaymoqda (${trend}%). E'tibor qarating!</div>`);
        }
        aiBox.innerHTML = recommendations.length ? recommendations.join('') : '<p class="empty-state">Hozircha tavsiyalar yo\'q</p>';
    }

    // Class progress chart
    const ctx3 = document.getElementById('chart-class-progress');
    if (window._chartClassProgress) window._chartClassProgress.destroy();
    const sortedResults = [...results].sort((a, b) => a.completedAt - b.completedAt);
    const progressData = sortedResults.map((r, i) => ({
        x: i + 1,
        y: Math.round(sortedResults.slice(0, i + 1).reduce((s, rr) => s + rr.percentage, 0) / (i + 1))
    }));
    window._chartClassProgress = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: progressData.map(d => `#${d.x}`),
            datasets: [{
                label: "Umumiy o'rtacha",
                data: progressData.map(d => d.y),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true, tension: 0.4, borderWidth: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- Announcements ---
function showAnnouncementForm() { document.getElementById('announcement-form').classList.remove('hidden'); loadAnnClassSelect(); }
function hideAnnouncementForm() { document.getElementById('announcement-form').classList.add('hidden'); }

function loadAnnClassSelect() {
    const sel = document.getElementById('ann-class');
    const classes = DB.classes.getByTeacher(currentUser.id);
    sel.innerHTML = '<option value="all">Barcha sinflar</option>' + classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function postAnnouncement(e) {
    e.preventDefault();
    const ann = {
        id: genId(),
        title: document.getElementById('ann-title').value.trim(),
        text: document.getElementById('ann-text').value.trim(),
        classId: document.getElementById('ann-class').value,
        teacherId: currentUser.id,
        createdAt: Date.now()
    };
    DB.announcements.save(ann);
    showToast("E'lon joylashtirildi!", 'success');
    hideAnnouncementForm();
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-text').value = '';
    loadAnnouncements();
}

function loadAnnouncements() {
    const anns = DB.announcements.getAll().filter(a => a.teacherId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt);
    const list = document.getElementById('announcements-list');
    if (!anns.length) {
        list.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i><br>E\'lonlar yo\'q</p>';
        return;
    }
    list.innerHTML = anns.map(a => `
        <div class="announcement-item">
            <h4>${a.title}</h4>
            <p>${a.text}</p>
            <span class="ann-meta"><i class="fas fa-calendar"></i> ${formatDate(a.createdAt)}</span>
        </div>
    `).join('');
}

// ==================== STUDENT FEATURES ====================
function updateStudentXPBar() {
    if (!currentUser) return;
    const level = calcLevel(currentUser.xp);
    const currentLevelXP = xpForLevel(level);
    const nextLevelXP = xpForNextLevel(level);
    const progress = nextLevelXP > currentLevelXP ? ((currentUser.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100;

    document.getElementById('student-level-badge').textContent = level;
    document.getElementById('student-xp-fill').style.width = progress + '%';
    document.getElementById('student-xp-text').textContent = currentUser.xp + ' XP';
}

function updateStreak() {
    if (!currentUser) return;
    const today = new Date().toDateString();
    const lastActive = currentUser.lastActive ? new Date(currentUser.lastActive).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastActive === today) return;
    if (lastActive === yesterday) {
        currentUser.streak++;
    } else if (lastActive !== today) {
        currentUser.streak = 1;
    }
    currentUser.lastActive = Date.now();
    DB.users.save(currentUser);

    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = currentUser.streak;
    const homeStreak = document.getElementById('home-streak');
    if (homeStreak) homeStreak.textContent = currentUser.streak + ' kun';
    const homeLevel = document.getElementById('home-level');
    if (homeLevel) homeLevel.textContent = 'Daraja ' + calcLevel(currentUser.xp);
}

function loadStudentHome() {
    if (!currentUser) return;
    const results = DB.results.getByStudent(currentUser.id);
    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;

    document.getElementById('s-stat-tests').textContent = results.length;
    document.getElementById('s-stat-avg').textContent = avgScore + '%';
    document.getElementById('s-stat-xp').textContent = currentUser.xp;

    // Rank
    const allStudents = DB.users.getAll().filter(u => u.role === 'student').sort((a, b) => b.xp - a.xp);
    const rank = allStudents.findIndex(s => s.id === currentUser.id) + 1;
    document.getElementById('s-stat-rank').textContent = rank ? `#${rank}` : '#-';

    // Available tests
    const myClasses = DB.classes.getAll().filter(c => (c.studentIds || []).includes(currentUser.id));
    const availableTests = myClasses.flatMap(c => DB.tests.getByClass(c.id));
    const uniqueTests = [...new Map(availableTests.map(t => [t.id, t])).values()];

    const testsList = document.getElementById('available-tests-list');
    if (!uniqueTests.length) {
        testsList.innerHTML = '<p class="empty-state">Hozircha testlar yo\'q. Sinfga qo\'shiling!</p>';
    } else {
        testsList.innerHTML = uniqueTests.slice(0, 5).map(test => {
            const existing = DB.results.getByStudentAndTest(currentUser.id, test.id);
            const done = existing.length > 0;
            const canRetry = test.allowRetry && done;
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px">
                <div>
                    <strong>${test.title}</strong>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">${categoryLabel[test.category]} · ${test.questions.length} savol · ${test.totalTime} daq</div>
                </div>
                <div>
                    ${done && !canRetry ? '<span class="badge badge-easy"><i class="fas fa-check"></i> Yechilgan</span>' :
                    `<button class="btn btn-sm btn-primary" onclick="startTest('${test.id}')">${canRetry ? 'Qayta yechish' : 'Boshlash'}</button>`}
                </div>
            </div>`;
        }).join('');
    }

    // Progress chart
    const ctx = document.getElementById('chart-student-progress');
    if (window._chartStudentProgress) window._chartStudentProgress.destroy();
    if (results.length) {
        const sorted = [...results].sort((a, b) => a.completedAt - b.completedAt).slice(-10);
        window._chartStudentProgress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sorted.map((_, i) => `Test ${i + 1}`),
                datasets: [{
                    label: 'Ball (%)',
                    data: sorted.map(r => r.percentage),
                    borderColor: '#6C63FF',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    fill: true, tension: 0.4, borderWidth: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Achievements mini
    const achDiv = document.getElementById('achievements-mini');
    if (currentUser.achievements?.length) {
        achDiv.innerHTML = currentUser.achievements.slice(0, 5).map(a =>
            `<span class="badge badge-info" style="padding:8px 12px"><i class="fas fa-medal" style="color:var(--warning)"></i> ${a}</span>`
        ).join('');
    }
}

function loadStudentClasses() {
    const myClasses = DB.classes.getAll().filter(c => (c.studentIds || []).includes(currentUser.id));
    const list = document.getElementById('student-classes-list');
    if (!myClasses.length) {
        list.innerHTML = '<p class="empty-state">Hali hech qanday sinfga qo\'shilmagansiz</p>';
        return;
    }
    list.innerHTML = myClasses.map(c => {
        const teacher = DB.users.getById(c.teacherId);
        return `<div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
            <div><strong>${c.name}</strong><br><span style="font-size:0.8rem;color:var(--text-secondary)">Ustoz: ${teacher?.fullName || '?'}</span></div>
            <span class="class-code">${c.code}</span>
        </div>`;
    }).join('');
}

function joinClass(e) {
    e.preventDefault();
    const code = document.getElementById('join-class-code').value.trim().toUpperCase();
    const cls = DB.classes.getByCode(code);
    if (!cls) { showToast('Sinf topilmadi!', 'error'); return; }
    if ((cls.studentIds || []).includes(currentUser.id)) { showToast('Siz allaqachon bu sinfdagisiz!', 'warning'); return; }
    if (!cls.studentIds) cls.studentIds = [];
    cls.studentIds.push(currentUser.id);
    DB.classes.save(cls);
    if (!currentUser.classIds) currentUser.classIds = [];
    currentUser.classIds.push(cls.id);
    DB.users.save(currentUser);
    showToast(`"${cls.name}" sinfiga qo'shildingiz!`, 'success');
    document.getElementById('join-class-code').value = '';
    loadStudentClasses();
}

function loadStudentTests() {
    const myClasses = DB.classes.getAll().filter(c => (c.studentIds || []).includes(currentUser.id));
    const tests = myClasses.flatMap(c => DB.tests.getByClass(c.id));
    const uniqueTests = [...new Map(tests.map(t => [t.id, t])).values()];
    const grid = document.getElementById('student-tests-grid');

    if (!uniqueTests.length) {
        grid.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i><br>Hozircha testlar yo\'q</p>';
        return;
    }

    grid.innerHTML = uniqueTests.map(test => {
        const existing = DB.results.getByStudentAndTest(currentUser.id, test.id);
        const done = existing.length > 0;
        const bestScore = done ? Math.max(...existing.map(r => r.percentage)) : null;
        const cls = DB.classes.getById(test.classId);
        return `
        <div class="test-card">
            <div class="test-card-header">
                <h3>${test.title}</h3>
                <span class="badge ${difficultyBadge[test.difficulty]}">${difficultyLabel[test.difficulty]}</span>
            </div>
            <div class="test-card-meta">
                <span><i class="fas fa-tag"></i> ${categoryLabel[test.category]}</span>
                <span><i class="fas fa-list"></i> ${test.questions.length} savol</span>
                <span><i class="fas fa-clock"></i> ${test.totalTime} daq</span>
                ${cls ? `<span><i class="fas fa-users"></i> ${cls.name}</span>` : ''}
                ${done ? `<span><i class="fas fa-star"></i> Eng yaxshi: ${bestScore}%</span>` : ''}
            </div>
            <div class="test-card-actions">
                ${done && !test.allowRetry ?
                    '<button class="btn btn-sm btn-success" disabled><i class="fas fa-check"></i> Yechilgan</button>' :
                    `<button class="btn btn-sm btn-primary" onclick="startTest('${test.id}')"><i class="fas fa-play"></i> ${done ? 'Qayta yechish' : 'Boshlash'}</button>`
                }
            </div>
        </div>`;
    }).join('');
}

function loadStudentResults() {
    const results = DB.results.getByStudent(currentUser.id).sort((a, b) => b.completedAt - a.completedAt);
    const list = document.getElementById('student-results-list');
    if (!results.length) {
        list.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i><br>Hali test yechilmagan</p>';
        return;
    }
    list.innerHTML = results.map(r => {
        const test = DB.tests.getById(r.testId);
        return `
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
                <h4>${test?.title || 'Test'}</h4>
                <span style="font-size:0.8rem;color:var(--text-secondary)">${formatDate(r.completedAt)} · ${formatTime(r.timeSpent)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:16px">
                <span class="badge ${r.percentage >= 80 ? 'badge-easy' : r.percentage >= 60 ? 'badge-medium' : 'badge-hard'}" style="font-size:1rem;padding:8px 16px">
                    ${r.percentage}% (${r.grade})
                </span>
                <span style="color:var(--warning);font-weight:600">+${r.xpEarned || 0} XP</span>
            </div>
        </div>`;
    }).join('');
}

// ==================== TEST TAKING ENGINE ====================
let testState = null;
let timerInterval = null;

function startTest(testId) {
    const test = DB.tests.getById(testId);
    if (!test) { showToast('Test topilmadi!', 'error'); return; }

    const questions = test.shuffleQuestions ? [...test.questions].sort(() => Math.random() - 0.5) : [...test.questions];

    testState = {
        testId: test.id,
        test,
        questions,
        currentQuestion: 0,
        answers: {},
        flags: new Set(),
        startTime: Date.now(),
        timeLeft: test.totalTime * 60,
        tabSwitches: 0
    };

    showPage('page-test-taking');
    document.getElementById('taking-test-title').textContent = test.title;

    renderQuestionGrid();
    renderCurrentQuestion();
    startTimer();

    if (test.fullscreen) {
        document.documentElement.requestFullscreen?.().catch(() => { });
    }
    if (test.detectTabSwitch) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
}

function renderQuestionGrid() {
    const grid = document.getElementById('question-grid');
    grid.innerHTML = testState.questions.map((_, i) => `
        <button class="q-nav-btn ${i === 0 ? 'current' : ''}" id="qnav-${i}" onclick="goToQuestion(${i})">${i + 1}</button>
    `).join('');
}

function renderCurrentQuestion() {
    const q = testState.questions[testState.currentQuestion];
    const total = testState.questions.length;
    const current = testState.currentQuestion;

    document.getElementById('question-number').textContent = `Savol ${current + 1} / ${total}`;
    document.getElementById('question-points').textContent = `${q.points} ball`;

    // Render question text with LaTeX
    let qText = q.text;
    const parts = qText.split(/(\$[^$]+\$)/g);
    let html = '';
    parts.forEach(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
            try {
                html += katex.renderToString(part.slice(1, -1), { throwOnError: false });
            } catch { html += part; }
        } else {
            html += part.replace(/\n/g, '<br>');
        }
    });
    document.getElementById('question-text').innerHTML = html;

    // Answer area
    const area = document.getElementById('answer-area');
    if (q.type === 'mcq') {
        const letters = ['A', 'B', 'C', 'D'];
        area.innerHTML = q.options.map((opt, i) => `
            <div class="answer-option ${testState.answers[q.id] === letters[i] ? 'selected' : ''}" onclick="selectAnswer('${q.id}', '${letters[i]}')">
                <span class="answer-letter">${letters[i]}</span>
                <span>${opt}</span>
            </div>
        `).join('');
    } else {
        area.innerHTML = `<input type="text" class="answer-input" placeholder="Javobingizni yozing..." value="${testState.answers[q.id] || ''}" oninput="testState.answers['${q.id}']=this.value">`;
    }

    // Progress
    const answered = Object.keys(testState.answers).length;
    document.getElementById('test-progress-fill').style.width = (answered / total * 100) + '%';

    // Nav buttons state
    document.getElementById('btn-prev-q').disabled = current === 0;
    document.getElementById('btn-next-q').textContent = current === total - 1 ? 'Oxirgi' : 'Keyingi ';
    document.getElementById('btn-flag-q').innerHTML = testState.flags.has(current) ?
        '<i class="fas fa-flag" style="color:var(--warning)"></i> Belgilangan' :
        '<i class="fas fa-flag"></i> Belgilash';

    // Update grid
    document.querySelectorAll('.q-nav-btn').forEach((btn, i) => {
        btn.className = 'q-nav-btn';
        if (i === current) btn.classList.add('current');
        const qId = testState.questions[i].id;
        if (testState.answers[qId]) btn.classList.add('answered');
        if (testState.flags.has(i)) btn.classList.add('flagged');
    });
}

function selectAnswer(qId, answer) {
    testState.answers[qId] = answer;
    renderCurrentQuestion();
}

function nextQuestion() {
    if (testState.currentQuestion < testState.questions.length - 1) {
        testState.currentQuestion++;
        renderCurrentQuestion();
    }
}

function prevQuestion() {
    if (testState.currentQuestion > 0) {
        testState.currentQuestion--;
        renderCurrentQuestion();
    }
}

function goToQuestion(index) {
    testState.currentQuestion = index;
    renderCurrentQuestion();
}

function flagCurrentQuestion() {
    if (testState.flags.has(testState.currentQuestion)) {
        testState.flags.delete(testState.currentQuestion);
    } else {
        testState.flags.add(testState.currentQuestion);
    }
    renderCurrentQuestion();
}

function startTimer() {
    const display = document.getElementById('timer-display');
    const timerEl = document.getElementById('test-timer');
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        testState.timeLeft--;
        display.textContent = formatTime(testState.timeLeft);

        if (testState.timeLeft <= 60) {
            timerEl.classList.add('warning');
        }
        if (testState.timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest();
        }
    }, 1000);
    display.textContent = formatTime(testState.timeLeft);
}

function handleVisibilityChange() {
    if (document.hidden && testState) {
        testState.tabSwitches++;
        document.getElementById('tab-switch-count').textContent = testState.tabSwitches;
        document.getElementById('tab-warning').classList.remove('hidden');

        if (testState.tabSwitches >= 3) {
            showToast('3 marta tab almashtirildi! Test avtomatik topshirildi.', 'error');
            submitTest();
        }
    }
}

function dismissTabWarning() {
    document.getElementById('tab-warning').classList.add('hidden');
}

function submitTestConfirm() {
    const answered = Object.keys(testState.answers).length;
    const total = testState.questions.length;
    const unanswered = total - answered;

    showConfirm(
        unanswered > 0 ? `${unanswered} ta savolga javob berilmagan. Testni topshirmoqchimisiz?` : 'Testni topshirmoqchimisiz?',
        submitTest
    );
}

function submitTest() {
    if (!testState) return;
    clearInterval(timerInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });

    const test = testState.test;
    let score = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const answerDetails = [];

    testState.questions.forEach(q => {
        totalPoints += q.points;
        const userAnswer = testState.answers[q.id] || '';
        let isCorrect = false;
        if (q.type === 'mcq') {
            isCorrect = userAnswer === q.correct;
        } else {
            isCorrect = userAnswer.trim().toLowerCase() === q.correct.trim().toLowerCase();
        }
        if (isCorrect) { score += q.points; correctCount++; }
        answerDetails.push({ questionId: q.id, answer: userAnswer, correct: isCorrect });
    });

    const timeSpent = Math.round((Date.now() - testState.startTime) / 1000);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const grade = getGrade(percentage);

    // XP Calculation
    const baseXP = 10;
    const scoreXP = Math.round(percentage * 0.5);
    const speedBonus = timeSpent < (test.totalTime * 60 * 0.5) ? 20 : 0;
    const streakBonus = (currentUser.streak || 0) * 2;
    const xpEarned = baseXP + scoreXP + speedBonus + streakBonus;

    const result = {
        id: genId(), testId: test.id, studentId: currentUser.id,
        answers: answerDetails, score, totalPoints, percentage, grade,
        timeSpent, tabSwitches: testState.tabSwitches,
        startedAt: testState.startTime, completedAt: Date.now(), xpEarned
    };
    DB.results.save(result);

    // Update user XP
    currentUser.xp = (currentUser.xp || 0) + xpEarned;
    currentUser.level = calcLevel(currentUser.xp);
    DB.users.save(currentUser);

    // Check achievements
    checkAchievements(result, answerDetails);

    // Notify parent
    const parents = DB.users.getAll().filter(u => u.role === 'parent' && u.parentOf === currentUser.id);
    parents.forEach(p => {
        DB.notifications.save({
            id: genId(), userId: p.id,
            text: `${currentUser.fullName} "${test.title}" testida ${percentage}% natija oldi`,
            type: 'result', read: false, createdAt: Date.now()
        });
    });

    // Show result
    showTestResult(result, testState.questions);
    testState = null;
}

function showTestResult(result, questions) {
    showPage('page-test-result');

    const test = DB.tests.getById(result.testId);
    document.getElementById('result-test-name').textContent = test?.title || 'Test';
    document.getElementById('result-percent').textContent = result.percentage + '%';
    document.getElementById('result-time').textContent = formatTime(result.timeSpent);

    const correctCount = result.answers.filter(a => a.correct).length;
    const wrongCount = result.answers.filter(a => !a.correct && a.answer).length;
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-wrong').textContent = wrongCount;
    document.getElementById('xp-earned').textContent = result.xpEarned;

    // Grade
    const gradeEl = document.getElementById('result-grade');
    gradeEl.textContent = result.grade;
    gradeEl.className = 'result-grade ' + getGradeClass(result.grade);

    // Score circle animation
    setTimeout(() => {
        const circle = document.getElementById('score-fill-circle');
        const circumference = 339.292;
        const offset = circumference - (result.percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        if (result.percentage >= 90) circle.style.stroke = '#10B981';
        else if (result.percentage >= 70) circle.style.stroke = '#6C63FF';
        else if (result.percentage >= 50) circle.style.stroke = '#F59E0B';
        else circle.style.stroke = '#EF4444';
    }, 100);

    // Confetti
    if (result.percentage >= 80 && typeof confetti !== 'undefined') {
        setTimeout(() => {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }, 500);
    }

    // Store questions for review
    window._lastResultQuestions = questions;
    window._lastResult = result;
}

function showDetailedReview() {
    const review = document.getElementById('detailed-review');
    review.classList.remove('hidden');
    const questions = window._lastResultQuestions;
    const result = window._lastResult;
    if (!questions || !result) return;

    const container = document.getElementById('review-questions');
    container.innerHTML = questions.map((q, i) => {
        const ans = result.answers.find(a => a.questionId === q.id);
        const isCorrect = ans?.correct;
        const userAnswer = ans?.answer || 'Javob berilmagan';
        const letters = ['A', 'B', 'C', 'D'];

        return `
        <div class="review-question ${isCorrect ? 'correct-review' : 'wrong-review'}">
            <div class="review-q-header">
                <span class="badge ${isCorrect ? 'badge-easy' : 'badge-hard'}">
                    ${isCorrect ? '<i class="fas fa-check"></i> To\'g\'ri' : '<i class="fas fa-times"></i> Noto\'g\'ri'}
                </span>
                <span style="font-size:0.8rem;color:var(--text-muted)">${q.points} ball</span>
            </div>
            <div class="review-q-text">${i + 1}. ${q.text}</div>
            ${q.type === 'mcq' ? `
                ${q.options.map((opt, j) => `
                    <div style="padding:6px 12px;margin:4px 0;border-radius:6px;font-size:0.9rem;
                        ${letters[j] === q.correct ? 'background:rgba(16,185,129,0.1);color:var(--success)' :
                        letters[j] === userAnswer && !isCorrect ? 'background:rgba(239,68,68,0.1);color:var(--danger)' : ''}">
                        <strong>${letters[j]}.</strong> ${opt}
                        ${letters[j] === q.correct ? ' <i class="fas fa-check"></i>' : ''}
                        ${letters[j] === userAnswer && !isCorrect ? ' <i class="fas fa-times"></i> (sizning javobingiz)' : ''}
                    </div>
                `).join('')}
            ` : `
                <div class="review-answer your-answer">Sizning javobingiz: ${userAnswer}</div>
                <div class="review-answer correct-answer">To'g'ri javob: ${q.correct}</div>
            `}
        </div>`;
    }).join('');
}

function goToDashboard() {
    loadDashboard();
}

// ==================== GAMIFICATION ====================
const ACHIEVEMENTS = [
    { id: 'first_test', name: 'Birinchi qadam', desc: 'Birinchi testni yeching', icon: 'fa-flag-checkered', check: (u) => DB.results.getByStudent(u.id).length >= 1 },
    { id: 'perfect', name: 'Mukammal', desc: 'Biror testda 100% oling', icon: 'fa-crown', check: (u) => DB.results.getByStudent(u.id).some(r => r.percentage === 100) },
    { id: 'speed', name: 'Tez uchqun', desc: 'Testni 30% vaqtda yeching', icon: 'fa-bolt', check: (u) => {
        return DB.results.getByStudent(u.id).some(r => {
            const test = DB.tests.getById(r.testId);
            return test && r.timeSpent < test.totalTime * 60 * 0.3;
        });
    }},
    { id: 'streak5', name: '5 kunlik streak', desc: '5 kun ketma-ket yechish', icon: 'fa-fire', check: (u) => u.streak >= 5 },
    { id: 'streak30', name: '30 kunlik streak', desc: '30 kun ketma-ket yechish', icon: 'fa-fire-flame-curved', check: (u) => u.streak >= 30 },
    { id: 'tests10', name: '10 ta test', desc: '10 ta test yeching', icon: 'fa-layer-group', check: (u) => DB.results.getByStudent(u.id).length >= 10 },
    { id: 'tests50', name: '50 ta test', desc: '50 ta test yeching', icon: 'fa-mountain', check: (u) => DB.results.getByStudent(u.id).length >= 50 },
    { id: 'algebra_master', name: 'Algebra ustasi', desc: 'Algebrada 5 ta testda 90%+', icon: 'fa-calculator', check: (u) => {
        const results = DB.results.getByStudent(u.id).filter(r => {
            const t = DB.tests.getById(r.testId);
            return t?.category === 'algebra' && r.percentage >= 90;
        });
        return results.length >= 5;
    }},
    { id: 'geo_master', name: 'Geometriya ustasi', desc: 'Geometriyada 5 ta testda 90%+', icon: 'fa-shapes', check: (u) => {
        const results = DB.results.getByStudent(u.id).filter(r => {
            const t = DB.tests.getById(r.testId);
            return t?.category === 'geometriya' && r.percentage >= 90;
        });
        return results.length >= 5;
    }},
    { id: 'top3', name: 'Yulduz', desc: 'Top 3 ga chiqing', icon: 'fa-star', check: (u) => {
        const students = DB.users.getAll().filter(s => s.role === 'student').sort((a, b) => b.xp - a.xp);
        return students.findIndex(s => s.id === u.id) < 3;
    }}
];

function checkAchievements(result) {
    if (!currentUser.achievements) currentUser.achievements = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!currentUser.achievements.includes(ach.name) && ach.check(currentUser)) {
            currentUser.achievements.push(ach.name);
            showToast(`🏆 Yangi yutuq: "${ach.name}"!`, 'success');
            DB.notifications.save({
                id: genId(), userId: currentUser.id,
                text: `Yangi yutuq ochildi: "${ach.name}"`,
                type: 'achievement', read: false, createdAt: Date.now()
            });
        }
    });
    DB.users.save(currentUser);
}

function loadAchievements() {
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const unlocked = (currentUser.achievements || []).includes(ach.name);
        return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon"><i class="fas ${ach.icon}"></i></div>
            <h4>${ach.name}</h4>
            <p>${ach.desc}</p>
            ${unlocked ? '<span class="badge badge-easy" style="margin-top:8px"><i class="fas fa-check"></i> Ochildi</span>' : '<span class="badge badge-draft" style="margin-top:8px"><i class="fas fa-lock"></i> Yopiq</span>'}
        </div>`;
    }).join('');
}

// ==================== LEADERBOARD ====================
function loadLeaderboard() {
    const students = DB.users.getAll().filter(u => u.role === 'student');
    const period = document.getElementById('lb-period')?.value || 'all';

    const board = students.map(s => {
        let results = DB.results.getByStudent(s.id);
        if (period === 'week') {
            const weekAgo = Date.now() - 7 * 86400000;
            results = results.filter(r => r.completedAt > weekAgo);
        } else if (period === 'month') {
            const monthAgo = Date.now() - 30 * 86400000;
            results = results.filter(r => r.completedAt > monthAgo);
        }
        const xp = period === 'all' ? s.xp : results.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
        const avg = results.length ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0;
        return { ...s, totalXP: xp, testCount: results.length, avgScore: avg };
    }).sort((a, b) => b.totalXP - a.totalXP);

    // Podium
    [1, 2, 3].forEach(pos => {
        const user = board[pos - 1];
        document.getElementById(`pod-${pos}-name`).textContent = user?.fullName || '—';
        document.getElementById(`pod-${pos}-score`).textContent = user ? `${user.totalXP} XP` : '0 XP';
        document.getElementById(`pod-${pos}-avatar`).textContent = user?.fullName?.charAt(0) || '?';
    });

    // Table
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = board.map((s, i) => `
        <tr ${s.id === currentUser.id ? 'style="background:rgba(108,99,255,0.08);font-weight:600"' : ''}>
            <td><strong>${i + 1}</strong></td>
            <td style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar" style="width:30px;height:30px;font-size:0.7rem">${s.fullName.charAt(0)}</div>
                ${s.fullName} ${s.id === currentUser.id ? '(Siz)' : ''}
            </td>
            <td><strong>${s.totalXP}</strong></td>
            <td>${s.testCount}</td>
            <td>${s.avgScore}%</td>
            <td>${calcLevel(s.xp)} - ${levelNames[calcLevel(s.xp)] || ''}</td>
        </tr>
    `).join('');
}

// ==================== FORMULAS ====================
const FORMULAS = [
    { category: 'algebra', name: 'Kvadrat tenglama', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', desc: 'ax² + bx + c = 0 uchun' },
    { category: 'algebra', name: 'Binom formula', latex: '(a+b)^2 = a^2 + 2ab + b^2', desc: 'Ikki hadning kvadrati' },
    { category: 'algebra', name: 'Kvadratlar ayirmasi', latex: 'a^2 - b^2 = (a-b)(a+b)', desc: 'Kvadratlar ayirmasi formulasi' },
    { category: 'algebra', name: 'Kublar yig\'indisi', latex: 'a^3 + b^3 = (a+b)(a^2-ab+b^2)', desc: 'Kublar yig\'indisi formulasi' },
    { category: 'algebra', name: 'Logarifm', latex: '\\log_a(xy) = \\log_a x + \\log_a y', desc: 'Ko\'paytmaning logarifmi' },
    { category: 'algebra', name: 'Daraja', latex: 'a^m \\cdot a^n = a^{m+n}', desc: 'Darajalar ko\'paytmasi' },
    { category: 'geometriya', name: 'Pifagor teoremasi', latex: 'a^2 + b^2 = c^2', desc: 'To\'g\'ri burchakli uchburchak' },
    { category: 'geometriya', name: 'Aylana uzunligi', latex: 'C = 2\\pi r', desc: 'Aylana uzunligi formulasi' },
    { category: 'geometriya', name: 'Doira yuzi', latex: 'S = \\pi r^2', desc: 'Doira yuzasi formulasi' },
    { category: 'geometriya', name: 'Uchburchak yuzi', latex: 'S = \\frac{1}{2} \\cdot a \\cdot h', desc: 'Asos va balandlik orqali' },
    { category: 'geometriya', name: 'Shar hajmi', latex: 'V = \\frac{4}{3}\\pi r^3', desc: 'Shar hajmi formulasi' },
    { category: 'geometriya', name: 'Silindr hajmi', latex: 'V = \\pi r^2 h', desc: 'Silindr hajmi formulasi' },
    { category: 'trigonometriya', name: 'Asosiy ayniyat', latex: '\\sin^2\\alpha + \\cos^2\\alpha = 1', desc: 'Trigonometrik asosiy ayniyat' },
    { category: 'trigonometriya', name: 'Tangens', latex: '\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}', desc: 'Tangens formulasi' },
    { category: 'trigonometriya', name: 'Ikkilangan burchak', latex: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha', desc: 'Ikkilangan burchak sinusi' },
    { category: 'trigonometriya', name: 'Kosinuslar teoremasi', latex: 'c^2 = a^2+b^2-2ab\\cos C', desc: 'Ixtiyoriy uchburchak uchun' },
    { category: 'trigonometriya', name: 'Sinuslar teoremasi', latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}', desc: 'Ixtiyoriy uchburchak uchun' },
];

function loadFormulas() {
    filterFormulas();
}

function filterFormulas() {
    const cat = document.getElementById('formula-category')?.value || '';
    const search = document.getElementById('formula-search')?.value?.toLowerCase() || '';
    let filtered = FORMULAS;
    if (cat) filtered = filtered.filter(f => f.category === cat);
    if (search) filtered = filtered.filter(f => f.name.toLowerCase().includes(search) || f.desc.toLowerCase().includes(search));

    const grid = document.getElementById('formulas-grid');
    grid.innerHTML = filtered.map(f => {
        let rendered = '';
        try { rendered = katex.renderToString(f.latex, { throwOnError: false }); } catch { rendered = f.latex; }
        return `
        <div class="formula-card">
            <h4><i class="fas fa-square-root-variable"></i> ${f.name}</h4>
            <div class="formula-latex">${rendered}</div>
            <p class="formula-desc">${f.desc}</p>
            <span class="badge badge-info" style="margin-top:8px">${categoryLabel[f.category]}</span>
        </div>`;
    }).join('');
}

// ==================== PRACTICE MODE ====================
let practiceState = null;

const PRACTICE_QUESTIONS = {
    algebra: {
        easy: [
            { text: '$2x + 6 = 12$ tenglamani yeching', options: ['x = 3', 'x = 4', 'x = 2', 'x = 6'], correct: 'A', hint: 'Har ikki tomondan 6 ni ayiring' },
            { text: '$3 \\cdot 4 + 5 = ?$', options: ['17', '15', '12', '20'], correct: 'A', hint: 'Avval ko\'paytiring, keyin qo\'shing' },
            { text: '$(a+b)^2$ formulasini toping', options: ['$a^2+2ab+b^2$', '$a^2+b^2$', '$a^2-2ab+b^2$', '$2a+2b$'], correct: 'A', hint: 'Binom formulasi' },
        ],
        medium: [
            { text: '$x^2 - 5x + 6 = 0$ tenglamani yeching', options: ['x=2, x=3', 'x=1, x=6', 'x=-2, x=-3', 'x=2, x=-3'], correct: 'A', hint: 'Viyet formulasidan foydalaning' },
            { text: '$\\log_2 8 = ?$', options: ['3', '4', '2', '8'], correct: 'A', hint: '$2^? = 8$' },
        ],
        hard: [
            { text: '$\\sqrt{48} + \\sqrt{27}$ ni soddalashtiring', options: ['$7\\sqrt{3}$', '$5\\sqrt{3}$', '$6\\sqrt{3}$', '$8\\sqrt{3}$'], correct: 'A', hint: 'Ildiz ostidagi sonni tashqariga chiqaring' },
        ]
    },
    geometriya: {
        easy: [
            { text: 'Tomonlari 3 va 4 bo\'lgan to\'g\'ri burchakli uchburchakning gipotenuzasi necha?', options: ['5', '6', '7', '3.5'], correct: 'A', hint: 'Pifagor teoremasi: $a^2+b^2=c^2$' },
        ],
        medium: [
            { text: 'Radiusi 7 bo\'lgan doiraning yuzi necha? ($\\pi \\approx 3.14$)', options: ['153.86', '43.96', '21.98', '49'], correct: 'A', hint: '$S = \\pi r^2$' },
        ],
        hard: [
            { text: 'Uchburchak tomonlari 5, 12, 13. Yuzini toping.', options: ['30', '25', '60', '15'], correct: 'A', hint: 'Bu to\'g\'ri burchakli uchburchak' },
        ]
    },
    trigonometriya: {
        easy: [
            { text: '$\\sin 30° = ?$', options: ['0.5', '1', '0', '$\\frac{\\sqrt{3}}{2}$'], correct: 'A', hint: 'Asosiy burchak qiymatlarini eslang' },
        ],
        medium: [
            { text: '$\\sin^2 45° + \\cos^2 45° = ?$', options: ['1', '0', '2', '0.5'], correct: 'A', hint: 'Asosiy trigonometrik ayniyat' },
        ],
        hard: [
            { text: '$\\sin 75° = ?$', options: ['$\\frac{\\sqrt{6}+\\sqrt{2}}{4}$', '$\\frac{\\sqrt{3}}{2}$', '$\\frac{1}{2}$', '$\\frac{\\sqrt{2}}{2}$'], correct: 'A', hint: 'sin(45°+30°) formulasini ishlating' },
        ]
    },
    arifmetika: {
        easy: [
            { text: '$15 \\times 12 = ?$', options: ['180', '170', '190', '175'], correct: 'A', hint: '$15 \\times 10 + 15 \\times 2$' },
        ],
        medium: [
            { text: '144 ning kvadrat ildizi necha?', options: ['12', '14', '11', '13'], correct: 'A', hint: '$?^2 = 144$' },
        ],
        hard: [
            { text: '2024 ni tub ko\'paytuvchilarga ajrating. Eng kichik tub ko\'paytuvchi necha?', options: ['2', '3', '11', '23'], correct: 'A', hint: '2024 juft son' },
        ]
    }
};

function startPractice() {
    const topic = document.getElementById('practice-topic').value;
    const diff = document.getElementById('practice-diff').value;
    const questions = PRACTICE_QUESTIONS[topic]?.[diff];

    if (!questions || !questions.length) {
        showToast("Bu mavzu va qiyinlik uchun savollar yo'q", 'warning');
        return;
    }

    practiceState = {
        questions: [...questions].sort(() => Math.random() - 0.5),
        current: 0,
        correctCount: 0,
        wrongCount: 0,
        answered: false
    };

    document.getElementById('practice-area').classList.remove('hidden');
    renderPracticeQuestion();
}

function renderPracticeQuestion() {
    if (!practiceState || practiceState.current >= practiceState.questions.length) {
        document.getElementById('practice-question').innerHTML = `
            <div style="text-align:center;padding:24px">
                <h3>Mashq tugadi!</h3>
                <p>To'g'ri: ${practiceState.correctCount} | Noto'g'ri: ${practiceState.wrongCount}</p>
                <button class="btn btn-primary" onclick="startPractice()"><i class="fas fa-redo"></i> Qaytadan</button>
            </div>`;
        document.getElementById('practice-options').innerHTML = '';
        document.getElementById('practice-feedback').classList.add('hidden');
        return;
    }

    const q = practiceState.questions[practiceState.current];
    practiceState.answered = false;

    document.getElementById('practice-counter').textContent = `Savol ${practiceState.current + 1} / ${practiceState.questions.length}`;
    document.getElementById('practice-score-display').textContent = `To'g'ri: ${practiceState.correctCount} | Noto'g'ri: ${practiceState.wrongCount}`;

    let qHtml = q.text;
    const parts = qHtml.split(/(\$[^$]+\$)/g);
    let rendered = '';
    parts.forEach(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
            try { rendered += katex.renderToString(part.slice(1, -1), { throwOnError: false }); } catch { rendered += part; }
        } else { rendered += part; }
    });
    document.getElementById('practice-question').innerHTML = rendered;

    const letters = ['A', 'B', 'C', 'D'];
    document.getElementById('practice-options').innerHTML = q.options.map((opt, i) => {
        let optHtml = opt;
        const optParts = optHtml.split(/(\$[^$]+\$)/g);
        let optRendered = '';
        optParts.forEach(part => {
            if (part.startsWith('$') && part.endsWith('$')) {
                try { optRendered += katex.renderToString(part.slice(1, -1), { throwOnError: false }); } catch { optRendered += part; }
            } else { optRendered += part; }
        });
        return `<div class="practice-option" onclick="selectPracticeAnswer('${letters[i]}')" id="popt-${letters[i]}">${letters[i]}. ${optRendered}</div>`;
    }).join('');

    document.getElementById('practice-feedback').classList.add('hidden');
    document.getElementById('practice-next-btn').disabled = true;
    document.getElementById('practice-hint-btn').disabled = false;
}

function selectPracticeAnswer(letter) {
    if (practiceState.answered) return;
    practiceState.answered = true;

    const q = practiceState.questions[practiceState.current];
    const isCorrect = letter === q.correct;

    if (isCorrect) practiceState.correctCount++;
    else practiceState.wrongCount++;

    document.getElementById(`popt-${letter}`).classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) document.getElementById(`popt-${q.correct}`).classList.add('correct');

    const feedback = document.getElementById('practice-feedback');
    feedback.classList.remove('hidden', 'correct-fb', 'wrong-fb');
    feedback.classList.add(isCorrect ? 'correct-fb' : 'wrong-fb');
    feedback.innerHTML = isCorrect ? '<i class="fas fa-check-circle"></i> To\'g\'ri!' : `<i class="fas fa-times-circle"></i> Noto'g'ri. To'g'ri javob: ${q.correct}`;

    document.getElementById('practice-next-btn').disabled = false;
    document.getElementById('practice-score-display').textContent = `To'g'ri: ${practiceState.correctCount} | Noto'g'ri: ${practiceState.wrongCount}`;
}

function showPracticeHint() {
    const q = practiceState.questions[practiceState.current];
    if (q.hint) {
        let hintHtml = q.hint;
        const parts = hintHtml.split(/(\$[^$]+\$)/g);
        let rendered = '';
        parts.forEach(part => {
            if (part.startsWith('$') && part.endsWith('$')) {
                try { rendered += katex.renderToString(part.slice(1, -1), { throwOnError: false }); } catch { rendered += part; }
            } else { rendered += part; }
        });
        showToast(rendered, 'info');
    }
    document.getElementById('practice-hint-btn').disabled = true;
}

function nextPracticeQuestion() {
    practiceState.current++;
    renderPracticeQuestion();
}

// ==================== PARENT FEATURES ====================
function loadParentHome() {
    if (!currentUser || !currentUser.parentOf) {
        document.getElementById('child-info').innerHTML = '<p class="empty-state">Farzandingizni ulang (Sozlamalar orqali)</p>';
        return;
    }

    const child = DB.users.getById(currentUser.parentOf);
    if (!child) return;

    document.getElementById('child-info').innerHTML = `
        <div class="child-avatar-lg">${child.fullName.charAt(0)}</div>
        <div>
            <h3>${child.fullName}</h3>
            <p style="color:var(--text-secondary)">Daraja: ${calcLevel(child.xp)} (${levelNames[calcLevel(child.xp)]})</p>
            <p style="color:var(--text-secondary)">XP: ${child.xp}</p>
        </div>`;

    const results = DB.results.getByStudent(child.id);
    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;

    document.getElementById('p-stat-tests').textContent = results.length;
    document.getElementById('p-stat-avg').textContent = avg + '%';
    document.getElementById('p-stat-streak').textContent = child.streak || 0;

    // Recent results
    const recent = results.sort((a, b) => b.completedAt - a.completedAt).slice(0, 5);
    const list = document.getElementById('parent-recent-results');
    if (recent.length) {
        list.innerHTML = recent.map(r => {
            const test = DB.tests.getById(r.testId);
            return `<div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                <div><strong>${test?.title || 'Test'}</strong><br><span style="font-size:0.8rem;color:var(--text-secondary)">${formatDate(r.completedAt)}</span></div>
                <span class="badge ${r.percentage >= 80 ? 'badge-easy' : r.percentage >= 60 ? 'badge-medium' : 'badge-hard'}" style="font-size:1rem;padding:8px 16px">${r.percentage}% (${r.grade})</span>
            </div>`;
        }).join('');
    } else {
        list.innerHTML = '<p class="empty-state">Natijalar yo\'q</p>';
    }
}

// ==================== NOTIFICATIONS ====================
function loadNotifications() {
    if (!currentUser) return;
    const notifs = DB.notifications.getByUser(currentUser.id);
    const unread = notifs.filter(n => !n.read).length;

    const badges = document.querySelectorAll('.notif-badge');
    badges.forEach(b => {
        b.textContent = unread;
        b.classList.toggle('hidden', unread === 0);
    });

    const lists = document.querySelectorAll('.notif-list');
    lists.forEach(list => {
        if (!notifs.length) {
            list.innerHTML = '<p class="notif-empty">Bildirishnomalar yo\'q</p>';
        } else {
            list.innerHTML = notifs.slice(0, 10).map(n => `
                <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
                    <div>${n.text}</div>
                    <div class="notif-time">${formatDate(n.createdAt)}</div>
                </div>
            `).join('');
        }
    });
}

function markNotifRead(id) {
    DB.notifications.markRead(id);
    loadNotifications();
}

function markAllRead() {
    if (!currentUser) return;
    DB.notifications.markAllRead(currentUser.id);
    loadNotifications();
    showToast("Barcha bildirishnomalar o'qildi", 'info');
}

// ==================== SETTINGS ====================
function loadSettings() {
    if (!currentUser) return;
    const nameInput = document.getElementById('settings-name');
    const usernameInput = document.getElementById('settings-username');
    if (nameInput) nameInput.value = currentUser.fullName;
    if (usernameInput) usernameInput.value = currentUser.username;
    const dm = document.getElementById('settings-darkmode');
    if (dm) dm.checked = document.documentElement.getAttribute('data-theme') === 'dark';
}

function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('settings-name').value.trim();
    if (name) {
        currentUser.fullName = name;
        DB.users.save(currentUser);
        showToast('Profil yangilandi!', 'success');
        loadDashboard();
    }
}

// ==================== SEED DATA ====================
function seedData() {
    if (DB.get('mz_users').length > 0) return;

    // Demo teacher
    const teacher = {
        id: genId(), username: 'ustoz', password: hashPw('1234'),
        fullName: 'Abdullayev Sardor', role: 'teacher',
        avatar: null, xp: 0, level: 1, streak: 0, lastActive: Date.now(),
        classIds: [], achievements: [], settings: {}, createdAt: Date.now()
    };
    DB.users.save(teacher);

    // Demo student
    const student = {
        id: genId(), username: 'oquvchi', password: hashPw('1234'),
        fullName: 'Karimov Javohir', role: 'student',
        avatar: null, xp: 150, level: 2, streak: 3, lastActive: Date.now(),
        classIds: [], achievements: ['Birinchi qadam'], settings: {}, createdAt: Date.now()
    };
    DB.users.save(student);

    // Demo class
    const cls = {
        id: genId(), name: '9-A sinf', description: 'Matematika darslari',
        code: genClassCode(), teacherId: teacher.id, studentIds: [student.id], createdAt: Date.now()
    };
    DB.classes.save(cls);

    // Demo test
    const test = {
        id: genId(), title: 'Algebra — Kvadrat tenglamalar',
        classId: cls.id, teacherId: teacher.id,
        category: 'algebra', difficulty: 'medium',
        questions: [
            { id: genId(), text: '$x^2 - 4 = 0$ tenglamani yeching', type: 'mcq', options: ['x = ±2', 'x = 4', 'x = -4', 'x = 2'], correct: 'A', points: 10 },
            { id: genId(), text: '$x^2 + 3x + 2 = 0$ tenglamaning ildizlari yig\'indisi necha?', type: 'mcq', options: ['-3', '3', '-2', '2'], correct: 'A', points: 10 },
            { id: genId(), text: '$(x+3)(x-2) = 0$ tenglamaning ildizlarini toping', type: 'mcq', options: ['x=-3, x=2', 'x=3, x=-2', 'x=3, x=2', 'x=-3, x=-2'], correct: 'A', points: 10 },
            { id: genId(), text: 'Diskriminant formulasini yozing: $D = ?$', type: 'mcq', options: ['$b^2 - 4ac$', '$b^2 + 4ac$', '$4ac - b^2$', '$a^2 - 4bc$'], correct: 'A', points: 10 },
            { id: genId(), text: '$2x^2 - 8 = 0$ tenglamadan $x$ ning musbat qiymatini toping', type: 'written', options: [], correct: '2', points: 10 }
        ],
        totalTime: 15, shuffleQuestions: true, fullscreen: false, detectTabSwitch: true,
        allowRetry: true, maxAttempts: 3, status: 'published', createdAt: Date.now()
    };
    DB.tests.save(test);

    // Demo result
    const result = {
        id: genId(), testId: test.id, studentId: student.id,
        answers: test.questions.map(q => ({ questionId: q.id, answer: q.correct, correct: true })),
        score: 50, totalPoints: 50, percentage: 100, grade: 'A+',
        timeSpent: 420, tabSwitches: 0,
        startedAt: Date.now() - 500000, completedAt: Date.now() - 80000, xpEarned: 75
    };
    DB.results.save(result);

    console.log('Seed data created! Ustoz: ustoz/1234, O\'quvchi: oquvchi/1234');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    seedData();
    applyTheme();

    // Check session
    const session = getSession();
    if (session) {
        currentUser = DB.users.getById(session.userId);
        if (currentUser) {
            loadDashboard();
        } else {
            clearSession();
        }
    }

    // Check URL for test link
    const params = new URLSearchParams(window.location.search);
    const testParam = params.get('test');
    if (testParam && currentUser?.role === 'student') {
        startTest(testParam);
    }

    // Hide loading screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.classList.add('fade-out');
        setTimeout(() => loader.style.display = 'none', 500);
    }, 800);
});

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.notif-dropdown:not(.hidden)').forEach(d => d.classList.add('hidden'));
    }
});
