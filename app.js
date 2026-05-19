// SONG AI - 完整业务逻辑脚本（集成Suno API）

// ===== 数据存储 =====
const DB = {
    users: JSON.parse(localStorage.getItem('songai_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('songai_currentUser')) || null,
    pointsLog: JSON.parse(localStorage.getItem('songai_pointsLog')) || [],
    works: JSON.parse(localStorage.getItem('songai_works')) || []
};

// ===== 配置（包含Minimax API Key）=====
const CONFIG = {
    newUserPoints: 10,
    generateCost: 2,
    dailyCheckIn: 1,
    memberCost: { month: 29, year: 259 },
    recharge: [
        { amount: 10, points: 10 },
        { amount: 30, points: 35 },
        { amount: 50, points: 60 },
        { amount: 100, points: 130 }
    ],
    // 🔥 Minimax API 配置
    SUNO_API_KEY: 'sk-cp-3_mAX-zdVmNqEJY9mvVaTtaaUag9r4Dm8YnT7b5BGjywY0AFefzPEHAs0EktthEzjJWEGU-xC2-ah5hyHAPgDEWevBTwxHUcHMuVBPWsaBvztRXKrJRhhGw',
    MINIMAX_API_KEY: 'sk-cp-3_mAX-zdVmNqEJY9mvVaTtaaUag9r4Dm8YnT7b5BGjywY0AFefzPEHAs0EktthEzjJWEGU-xC2-ah5hyHAPgDEWevBTwxHUcHMuVBPWsaBvztRXKrJRhhGw',
    MINIMAX_API_BASE: 'https://api.minimax.chat',
    enableRealGenerate: true
};

// ===== 初始化超级管理员 =====
function initAdmin() {
    const adminUsername = 'alex217';
    let admin = DB.users.find(u => u.username === adminUsername);
    
    if (!admin) {
        admin = {
            id: 'admin_001',
            username: adminUsername,
            password: 'alex217',
            points: 999999,
            isMember: true,
            memberExpire: '2099-12-31',
            role: 'super_admin',
            createdAt: new Date().toISOString(),
            worksCount: 0
        };
        DB.users.push(admin);
        localStorage.setItem('songai_users', JSON.stringify(DB.users));
    } else {
        admin.role = 'super_admin';
        admin.points = 999999;
        admin.isMember = true;
        admin.memberExpire = '2099-12-31';
    }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
    initUserUI();
    bindEvents();
});

// ===== 初始化用户界面 =====
function initUserUI() {
    const user = DB.currentUser;
    const userArea = document.getElementById('userArea');
    const userInfo = document.getElementById('userInfo');
    const userBar = document.getElementById('userBar');
    const lyricsInput = document.getElementById('lyricsInput');
    const loginPrompt = document.getElementById('loginPrompt');
    const generateBtn = document.getElementById('generateBtn');
    const vipBtn = document.getElementById('vipBtn');
    const memberBadge = document.getElementById('memberBadge');

    if (user) {
        userArea.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userBar.classList.remove('hidden');
        loginPrompt.classList.add('hidden');
        
        lyricsInput.disabled = false;
        lyricsInput.placeholder = `在这里输入你的歌词...

[Verse]
清晨的阳光洒在窗前
新的一天开始啦

[Chorus]
一起向前奔跑
追逐心中的光`;

        generateBtn.disabled = false;

        document.getElementById('userName').textContent = user.username;
        document.getElementById('userPoints').textContent = user.points;
        document.getElementById('myPoints').textContent = user.points;
        document.getElementById('myWorks').textContent = user.worksCount || 0;

        if (user.isMember) {
            vipBtn.classList.remove('hidden');
            memberBadge.classList.remove('hidden');
            
            if (user.role === 'super_admin') {
                generateBtn.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">管理员无限生成</span>';
            } else {
                generateBtn.innerHTML = '<span class="btn-icon">👑</span><span class="btn-text">VIP无限生成</span>';
            }
        }
    } else {
        userArea.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userBar.classList.add('hidden');
        loginPrompt.classList.remove('hidden');
        lyricsInput.disabled = true;
        generateBtn.disabled = true;
    }
}

// ===== 绑定事件 =====
function bindEvents() {
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
    document.getElementById('loginNowBtn').addEventListener('click', showLoginModal);
    document.getElementById('goToRegister').addEventListener('click', e => { e.preventDefault(); showRegisterModal(); });
    document.getElementById('goToLogin').addEventListener('click', e => { e.preventDefault(); showLoginModal(); });
    document.getElementById('loginSubmit').addEventListener('click', doLogin);
    document.getElementById('registerSubmit').addEventListener('click', doRegister);
    document.getElementById('rechargeBtn').addEventListener('click', showRechargeModal);
    document.querySelectorAll('.modal-backdrop, .modal-close').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });
    document.getElementById('lyricsInput').addEventListener('input', updateWordCount);
    document.getElementById('clearBtn').addEventListener('click', clearLyrics);
    document.getElementById('generateBtn').addEventListener('click', doGenerate);
    document.getElementById('regenerateBtn').addEventListener('click', doGenerate);
    document.getElementById('saveBtn').addEventListener('click', saveWork);
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', togglePlay);
    });
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', downloadAudio);
    });
    document.querySelectorAll('.pricing-btn').forEach(btn => {
        btn.addEventListener('click', buyMember);
    });
    document.querySelectorAll('.recharge-card').forEach(card => {
        card.addEventListener('click', () => doRecharge(card));
    });
    document.querySelectorAll('.vip-card').forEach(card => {
        card.addEventListener('click', () => buyMemberFromRecharge(card));
    });
}

// ===== 弹窗 =====
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('rechargeModal').classList.add('hidden');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function showRechargeModal() {
    const user = DB.currentUser;
    if (!user) { showLoginModal(); return; }
    document.getElementById('currentPoints').textContent = user.points;
    document.getElementById('rechargeModal').classList.remove('hidden');
}

// ===== 注册登录 =====
function doRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    if (!username || !password) { showToast('请填写完整信息', 'error'); return; }
    if (password !== password2) { showToast('两次密码不一致', 'error'); return; }
    if (password.length < 6) { showToast('密码至少6位', 'error'); return; }
    if (DB.users.find(u => u.username === username)) { showToast('用户名已存在', 'error'); return; }

    const newUser = {
        id: 'user_' + Date.now(),
        username: username,
        password: password,
        points: CONFIG.newUserPoints,
        isMember: false,
        memberExpire: null,
        createdAt: new Date().toISOString(),
        worksCount: 0
    };

    DB.users.push(newUser);
    DB.currentUser = newUser;
    logPoints(newUser.id, 'earn', CONFIG.newUserPoints, '新用户注册');
    saveData();
    initUserUI();
    closeAllModals();
    showToast(`注册成功！赠送 ${CONFIG.newUserPoints} 积分`, 'success');
}

function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) { showToast('请填写用户名和密码', 'error'); return; }

    const user = DB.users.find(u => u.username === username && u.password === password);
    if (!user) { showToast('用户名或密码错误', 'error'); return; }

    DB.currentUser = user;
    saveData();
    initUserUI();
    closeAllModals();
    showToast(`欢迎回来，${user.username}！`, 'success');
}

// ===== 充值 =====
function doRecharge(card) {
    const amount = parseInt(card.dataset.amount);
    const points = parseInt(card.dataset.points);
    const user = DB.currentUser;
    if (!user) return;

    showToast(`支付 ¥${amount} 成功！`, 'success');
    user.points += points;
    logPoints(user.id, 'earn', points, `充值 ¥${amount}`);
    saveData();
    initUserUI();
    showToast(`充值成功！+${points} 积分`, 'success');
}

function buyMember(e) {
    const plan = e.target.dataset.plan;
    const user = DB.currentUser;
    if (!user) { showLoginModal(); return; }

    const price = CONFIG.memberCost[plan];
    const planName = plan === 'month' ? '月度会员' : '年度会员';
    
    showToast(`开通 ${planName} ¥${price}，模拟支付成功`, 'success');
    user.isMember = true;
    
    if (plan === 'month') {
        const expire = new Date();
        expire.setMonth(expire.getMonth() + 1);
        user.memberExpire = expire.toISOString();
    } else {
        const expire = new Date();
        expire.setFullYear(expire.getFullYear() + 1);
        user.memberExpire = expire.toISOString();
    }
    
    saveData();
    initUserUI();
    showToast(`开通成功！${planName}，无限生成`, 'success');
}

function buyMemberFromRecharge(card) {
    const plan = card.dataset.plan;
    const price = parseInt(card.dataset.price);
    const user = DB.currentUser;
    if (!user) { showLoginModal(); return; }

    const planName = plan === 'month' ? '月度会员' : '年度会员';
    showToast(`开通 ${planName} ¥${price}，模拟支付成功`, 'success');
    
    user.isMember = true;
    if (plan === 'month') {
        const expire = new Date();
        expire.setMonth(expire.getMonth() + 1);
        user.memberExpire = expire.toISOString();
    } else {
        const expire = new Date();
        expire.setFullYear(expire.getFullYear() + 1);
        user.memberExpire = expire.toISOString();
    }
    
    saveData();
    initUserUI();
    closeAllModals();
    showToast(`开通成功！无限生成`, 'success');
}

// ===== 🔥 核心：生成歌曲（集成Minimax API）=====
async function doGenerate() {
    const user = DB.currentUser;
    const lyrics = document.getElementById('lyricsInput').value.trim();
    const style = document.getElementById('styleSelect').value;
    const duration = parseInt(document.getElementById('durationSelect').value);
    
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const costPoints = document.getElementById('costPoints');

    if (!user) { showLoginModal(); return; }
    if (!lyrics || lyrics.length < 10) { showToast('歌词内容太短（至少10个字）', 'error'); return; }

    let cost = 0;
    if (user.role === 'super_admin') { cost = 0; }
    else if (!user.isMember) {
        cost = CONFIG.generateCost;
        if (user.points < cost) {
            showToast('积分不足！请充值', 'error');
            showRechargeModal();
            return;
        }
    }

    costPoints.textContent = cost;

    if (cost > 0) {
        user.points -= cost;
        logPoints(user.id, 'spend', cost, '生成歌曲');
    }

    user.worksCount = (user.worksCount || 0) + 1;
    saveData();
    initUserUI();

    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    // 🔥 尝试调用Minimax API
    if (CONFIG.enableRealGenerate) {
        try {
            showToast('🎵 正在调用Minimax AI...', 'info');
            
            // 构建Minimax音乐生成请求
            const response = await fetch(`${CONFIG.MINIMAX_API_BASE}/v1/music/generation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'music-01',
                    lyrics: lyrics,
                    style: style,
                    duration: duration,
                    custom_backend: ''
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Minimax API response:', data);
                
                if (data.code === 0 || data.data || data.audio_url) {
                    showToast('⏳ Minimax AI 生成中...', 'success');
                    await pollMinimaxResult(data.data?.task_id || data.task_id);
                    return;
                } else {
                    console.log('Minimax error:', data);
                }
            }
            
            console.log('Minimax API响应:', response.status);
        } catch (error) {
            console.error('Minimax API error:', error);
        }
    }

    // 备用：模拟生成
    simulateGenerateProgress();
}

// ===== 轮询Minimax结果 =====
async function pollMinimaxResult(taskId) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));


        try {
            const response = await fetch(`${CONFIG.MINIMAX_API_BASE}/v1/music/get/${taskId}`, {
                headers: { 'Authorization': `Bearer ${CONFIG.MINIMAX_API_KEY}` }
            });

            if (response.ok) {
                const data = await response.json();
                const percent = Math.min((attempts / maxAttempts) * 100, 99);
                progressFill.style.width = percent + '%';
                progressText.textContent = Math.floor(percent) + '%';

                if (data.status === 'completed' || data.data?.status === 'completed') {
                    showToast('🎵 生成完成！', 'success');
                    showGenResult(data);
                    return;
                }
            }
        } catch (e) { console.error('Poll error:', e); }
        
        attempts++;
    }

    showToast('等待超时', 'warning');
    simulateGenerateProgress();
}

// ===== 显示生成结果 =====
function showGenResult(data) {
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const user = DB.currentUser;

    loadingSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    document.getElementById('remainPoints').textContent = user.points;
    showToast('生成成功！🎵', 'success');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// ===== 备用：模拟生成进度 =====
function simulateGenerateProgress() {
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const user = DB.currentUser;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;

        const percent = Math.floor(progress);
        progressFill.style.width = percent + '%';
        progressText.textContent = percent + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingSection.classList.add('hidden');
                resultSection.classList.remove('hidden');
                document.getElementById('remainPoints').textContent = user.points;
                showToast('生成成功！（模拟）', 'success');
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, 500);
}

// ===== 其他功能 =====
function updateWordCount() {
    const text = document.getElementById('lyricsInput').value.trim();
    document.getElementById('wordCount').textContent = text ? text.length : 0;
}

function clearLyrics() {
    document.getElementById('lyricsInput').value = '';
    document.getElementById('wordCount').textContent = '0';
}

function saveWork() { showToast('已保存到作品库', 'success'); }

function togglePlay(e) {
    const btn = e.currentTarget;
    const card = btn.closest('.result-card');
    const isPlaying = card.classList.contains('playing');

    document.querySelectorAll('.result-card.playing').forEach(c => {
        if (c !== card) {
            c.classList.remove('playing');
            c.querySelector('.play-icon').textContent = '▶';
            c.querySelector('.play-text').textContent = '播放';
            c.querySelector('.card-progress').classList.add('hidden');
        }
    });

    if (isPlaying) {
        card.classList.remove('playing');
        btn.querySelector('.play-icon').textContent = '▶';
        btn.querySelector('.play-text').textContent = '播放';
        card.querySelector('.card-progress').classList.add('hidden');
    } else {
        card.classList.add('playing');
        btn.querySelector('.play-icon').textContent = '⏸';
        btn.querySelector('.play-text').textContent = '暂停';
        card.querySelector('.card-progress').classList.remove('hidden');
        simulatePlay(card);
    }
}

function simulatePlay(card) {
    const fill = card.querySelector('.mini-fill');
    const timeEl = card.querySelector('.mini-time');
    const duration = card.querySelector('.card-duration').textContent.replace('时长: ', '');
    const parts = duration.split(':');
    const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    let current = 0;
    const interval = setInterval(() => {
        if (!card.classList.contains('playing')) { clearInterval(interval); return; }
        current++;
        const percent = (current / totalSec) * 100;
        fill.style.width = percent + '%';
        const m = Math.floor(current / 60);
        const s = current % 60;
        timeEl.textContent = `${m}:${s < 10 ? '0' : ''}${s} / ${duration}`;
        if (current >= totalSec) {
            clearInterval(interval);
            card.classList.remove('playing');
            card.querySelector('.play-icon').textContent = '▶';
            card.querySelector('.play-text').textContent = '播放';
            card.querySelector('.card-progress').classList.add('hidden');
            fill.style.width = '0%';
        }
    }, 1000);
}

function downloadAudio(e) {
    const card = e.currentTarget.closest('.result-card');
    const version = card.dataset.version;
    showToast(`下载 V${version} 成功！`, 'success');
}

function buyMember(e) {
    const plan = e.target.dataset.plan;
    const user = DB.currentUser;
    if (!user) { showLoginModal(); return; }

    const price = CONFIG.memberCost[plan];
    const planName = plan === 'month' ? '月度会员' : '年度会员';
    showToast(`开通 ${planName} ¥${price}，模拟支付成功`, 'success');
    
    user.isMember = true;
    if (plan === 'month') {
        const expire = new Date();
        expire.setMonth(expire.getMonth() + 1);
        user.memberExpire = expire.toISOString();
    } else {
        const expire = new Date();
        expire.setFullYear(expire.getFullYear() + 1);
        user.memberExpire = expire.toISOString();
    }
    
    saveData();
    initUserUI();
    showToast(`开通成功！${planName}，无限生成`, 'success');
}

// ===== 工具函数 =====
function logPoints(userId, type, amount, source) {
    DB.pointsLog.push({
        id: 'log_' + Date.now(),
        userId: userId,
        type: type,
        amount: amount,
        source: source,
        createdAt: new Date().toISOString()
    });
}

function saveData() {
    localStorage.setItem('songai_users', JSON.stringify(DB.users));
    localStorage.setItem('songai_currentUser', JSON.stringify(DB.currentUser));
    localStorage.setItem('songai_pointsLog', JSON.stringify(DB.pointsLog));
    localStorage.setItem('songai_works', JSON.stringify(DB.works));
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

document.getElementById('lyricsInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('generateBtn').click();
    }
});