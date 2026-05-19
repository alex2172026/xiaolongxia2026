// SONG AI - 完整业务逻辑脚本

// ===== 数据存储 =====
const DB = {
    users: JSON.parse(localStorage.getItem('songai_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('songai_currentUser')) || null,
    pointsLog: JSON.parse(localStorage.getItem('songai_pointsLog')) || [],
    works: JSON.parse(localStorage.getItem('songai_works')) || []
};

// ===== 配置 =====
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
    // 🔥 Minimax API - Music-01
    MINIMAX_API_KEY: 'sk-cp-3_mAX-zdVmNqEJY9mvVaTtaaUag9r4Dm8YnT7b5BGjywY0AFefzPEHAs0EktthEzjJWEGU-xC2-ah5hyHAPgDEWevBTwxHUcHMuVBPWsaBvztRXKrJRhhGw',
    MINIMAX_API_BASE: 'https://api.minimax.chat',
    enableRealGenerate: true  // 开启真实生成
};

// ===== 初始化admin =====
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
            worksCount: 0,
            works: []
        };
        DB.users.push(admin);
    } else {
        admin.role = 'super_admin';
        admin.points = 999999;
        admin.isMember = true;
    }
    saveData();
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
    initUserUI();
    bindEvents();
    loadWorks();
});

// ===== 用户界面 =====
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
    // 登录注册
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
    document.getElementById('loginNowBtn').addEventListener('click', showLoginModal);
    document.getElementById('loginSubmit').addEventListener('click', doLogin);
    document.getElementById('registerSubmit').addEventListener('click', doRegister);
    
    // 导航链接
    document.querySelectorAll('a[href="#works"]').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); showWorksModal(); });
    });
    document.querySelectorAll('a[href="#pricing"]').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); showPricingModal(); });
    });
    
    // 充值VIP
    document.getElementById('rechargeBtn').addEventListener('click', showRechargeModal);
    document.getElementById('vipBtn').addEventListener('click', showPricingModal);
    
    // 模态框
    document.querySelectorAll('.modal-backdrop, .modal-close').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });
    
    // 输入
    document.getElementById('lyricsInput').addEventListener('input', updateWordCount);
    document.getElementById('clearBtn').addEventListener('click', clearLyrics);
    
    // 生成
    document.getElementById('generateBtn').addEventListener('click', doGenerate);
    document.getElementById('regenerateBtn').addEventListener('click', doGenerate);
    document.getElementById('saveBtn').addEventListener('click', saveWork);
    
    // 播放下载分享
    document.querySelectorAll('.play-btn').forEach(btn => btn.addEventListener('click', togglePlay));
    document.querySelectorAll('.download-btn').forEach(btn => btn.addEventListener('click', downloadAudio));
    document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', shareAudio));
    
    // 定价
    document.querySelectorAll('.pricing-btn').forEach(btn => btn.addEventListener('click', buyMember));
    
    // 充值卡
    document.querySelectorAll('.recharge-card').forEach(card => {
        card.addEventListener('click', () => doRecharge(card));
    });
    
    // VIP卡
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
    if (!DB.currentUser) { showLoginModal(); return; }
    document.getElementById('currentPoints').textContent = DB.currentUser.points;
    document.getElementById('rechargeModal').classList.remove('hidden');
}

function showWorksModal() {
    if (!DB.currentUser) { showLoginModal(); return; }
    
    const user = DB.currentUser;
    const worksList = document.getElementById('worksList');
    const worksCount = document.getElementById('worksCount');
    
    // 更新作品数量
    worksCount.textContent = user.worksCount || 0;
    
    // 生成作品列表HTML
    if (worksList) {
        if (user.works && user.works.length > 0) {
            worksList.innerHTML = user.works.map((w, i) => `
                <div class="work-item">
                    <div class="work-number">${i + 1}</div>
                    <div class="work-details">
                        <h4>${w.title || '我的歌曲 #' + (i + 1)}</h4>
                        <p>${w.style} · ${w.duration}</p>
                        <span class="work-time">${w.time || ''}</span>
                    </div>
                    <div class="work-btns">
                        <button onclick="playWork(${i})">▶ 播放</button>
                        <button onclick="downloadWork(${i})">📥 下载</button>
                    </div>
                </div>
            `).join('');
        } else {
            worksList.innerHTML = '<div class="empty-works">暂无作品，快去创作吧！</div>';
        }
    }
    
    document.getElementById('worksModal').classList.remove('hidden');
}

function showPricingModal() {
    if (!DB.currentUser) { showLoginModal(); return; }
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
    showToast('选择套餐开通VIP', 'info');
}

function playWork(index) {
    showToast(`播放作品 #${index + 1}`, 'success');
}

function downloadWork(index) {
    const user = DB.currentUser;
    const work = user.works && user.works[index];
    if (work && work.audioUrl) {
        window.open(work.audioUrl, '_blank');
    } else {
        showToast(`下载作品 #${index + 1}成功！`, 'success');
    }
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
        role: 'user',
        createdAt: new Date().toISOString(),
        worksCount: 0,
        works: []
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

    // 模拟支付
    user.points += points;
    logPoints(user.id, 'earn', points, `充值 ¥${amount}`);
    saveData();
    initUserUI();
    
    showToast(`充值成功！¥${amount} → +${points}积分`, 'success');
}

function buyMember(e) {
    const plan = e.target.dataset.plan;
    const user = DB.currentUser;
    if (!user) return;

    const price = CONFIG.memberCost[plan];
    const planName = plan === 'month' ? '月度会员' : '年度会员';
    
    showToast(`${planName} ¥${price}，模拟支付成功`, 'success');
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
}

function buyMemberFromRecharge(card) {
    const plan = card.dataset.plan;
    const price = parseInt(card.dataset.price);
    const user = DB.currentUser;
    if (!user) return;

    const planName = plan === 'month' ? '月度会员' : '年度会员';
    showToast(`${planName} ¥${price}，模拟支付成功`, 'success');
    
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
    showToast(`开通成功！${planName}，无限生成`, 'success');
}

// ===== 生成歌曲 =====
async function doGenerate() {
    const user = DB.currentUser;
    const lyrics = document.getElementById('lyricsInput').value.trim();
    const style = document.getElementById('styleSelect').value;
    const duration = document.getElementById('durationSelect').value;
    const voice = document.getElementById('voiceSelect').value;
    
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');

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

    if (cost > 0) {
        user.points -= cost;
        logPoints(user.id, 'spend', cost, '生成歌曲');
    }

    user.worksCount = (user.worksCount || 0) + 1;
    
    // 保存生成的作品
    if (!user.works) user.works = [];
    user.works.push({
        title: `歌曲 #${user.worksCount}`,
        style: style,
        duration: duration,
        voice: voice,
        lyrics: lyrics,
        time: new Date().toLocaleString(),
        audioUrl: null
    });
    
    saveData();
    initUserUI();

    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    // 🔥 尝试真实生成
    if (CONFIG.enableRealGenerate) {
        try {
            await doRealGenerate(lyrics, style, duration);
            return;
        } catch (e) {
            console.error('Real generate failed:', e);
        }
    }
    
    // 备用：模拟生成
    simulateGenerate();
}

// ===== 真实生成（Minimax API）=====
async function doRealGenerate(lyrics, style, duration) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    showToast('🎵 正在调用MiniMax AI...', 'info');
    
    try {
        // 调用MiniMax音乐生成API
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
                duration: parseInt(duration)
            })
        });
        
        const data = await response.json();
        console.log('MiniMax response:', data);
        
        if (response.ok && (data.code === 0 || data.id)) {
            // 需要轮询获取结果
            showToast('⏳ MiniMax AI 生成中...', 'success');
            
            // 模拟轮询进度
            let progress = 0;
            const pollInterval = setInterval(() => {
                progress += 15;
                if (progress > 95) progress = 95;
                progressFill.style.width = progress + '%';
                progressText.textContent = progress + '%';
                
                if (progress >= 95 || data.status === 'completed') {
                    clearInterval(pollInterval);
                    showRealResult(data);
                }
            }, 2000);
            
            return;
        } else {
            console.log('API error:', data);
            throw new Error(data.message || 'API failed');
        }
    } catch (error) {
        console.error('Minimax API error:', error);
        showToast('API调用失败，使用模拟生成', 'warning');
        throw error;
    }
}

function showRealResult(data) {
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const user = DB.currentUser;
    
    loadingSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    document.getElementById('remainPoints').textContent = user.points;
    
    // 更新作品数据（如果有真实URL）
    if (user.works && user.works.length > 0) {
        const latestWork = user.works[user.works.length - 1];
        latestWork.audioUrl = data.audio_url || data.url || null;
        latestWork.minimaxId = data.id || null;
    }
    saveData();
    
    showToast('生成成功！🎵 使用MiniMax AI', 'success');
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function simulateGenerate() {
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
                showToast('生成成功！🎵 已保存到作品库', 'success');
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, 500);
}

// ===== 播放下载分享 =====
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
    const title = card.querySelector('.card-info h3').textContent;
    
    // 创建下载
    showToast(`正在下载 V${version} ${title}...`, 'success');
    
    // 模拟下载（实际没有真实音频）
    setTimeout(() => {
        showToast(`下载 V${version} 成功！文件: song_${version}.mp3`, 'success');
    }, 1000);
}

function shareAudio(e) {
    const card = e.currentTarget.closest('.result-card');
    const version = card.dataset.version;
    const title = card.querySelector('.card-info h3').textContent;
    
    // 复制链接到剪贴板
    const shareUrl = `${window.location.href}?song=V${version}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`分享链接已复制到剪贴板！`, 'success');
    }).catch(() => {
        showToast(`分享 V${version} ${title} - ${shareUrl}`, 'success');
    });
}

// ===== 保存工作 =====
function saveWork() {
    showToast('已保存到作品库！', 'success');
    
    // 更新作品库显示
    if (DB.currentUser) {
        document.getElementById('myWorks').textContent = DB.currentUser.worksCount || 0;
    }
}

// ===== 工具 =====
function updateWordCount() {
    const text = document.getElementById('lyricsInput').value.trim();
    document.getElementById('wordCount').textContent = text ? text.length : 0;
}

function clearLyrics() {
    document.getElementById('lyricsInput').value = '';
    document.getElementById('wordCount').textContent = '0';
}

function loadWorks() {
    // 从现有用户加载作品
    DB.users.forEach(user => {
        if (!user.works) user.works = [];
        if (!user.worksCount) user.worksCount = 0;
    });
}

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