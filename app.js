// SONG AI - 完整业务逻辑脚本

// ===== 数据存储 =====
const DB = {
    // 用户数据
    users: JSON.parse(localStorage.getItem('songai_users')) || [],
    // 当前登录用户
    currentUser: JSON.parse(localStorage.getItem('songai_currentUser')) || null,
    // 积分记录
    pointsLog: JSON.parse(localStorage.getItem('songai_pointsLog')) || [],
    // 作品
    works: JSON.parse(localStorage.getItem('songai_works')) || []
};

// ===== 配置 =====
const CONFIG = {
    newUserPoints: 10,           // 新用户赠送积分
    generateCost: 2,            // 生成消耗积分
    dailyCheckIn: 1,             // 每日签到积分
    memberCost: {                 // 会员价格
        month: 29,
        year: 259
    },
    recharge: [                   // 充值套餐
        { amount: 10, points: 10 },
        { amount: 30, points: 35 },
        { amount: 50, points: 60 },
        { amount: 100, points: 130 }
    ]
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
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
        // 已登录
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
        generateBtn.innerHTML = '<span class="btn-icon">🎵</span><span class="btn-text">开始生成歌曲</span>';

        // 更新用户信息
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userPoints').textContent = user.points;
        document.getElementById('myPoints').textContent = user.points;
        document.getElementById('myWorks').textContent = user.worksCount || 0;

        // VIP标识
        if (user.isMember) {
            vipBtn.classList.remove('hidden');
            memberBadge.classList.remove('hidden');
            generateBtn.innerHTML = '<span class="btn-icon">👑</span><span class="btn-text">VIP无限生成</span>';
        }
    } else {
        // 未登录
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
    // 登录相关
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
    document.getElementById('loginNowBtn').addEventListener('click', showLoginModal);
    document.getElementById('goToRegister').addEventListener('click', switchToRegister);
    document.getElementById('goToLogin').addEventListener('click', switchToLogin);
    
    // 登录/注册提交
    document.getElementById('loginSubmit').addEventListener('click', doLogin);
    document.getElementById('registerSubmit').addEventListener('click', doRegister);
    
    // 充值
    document.getElementById('rechargeBtn').addEventListener('click', showRechargeModal);
    
    // 模态框关闭
    document.querySelectorAll('.modal-backdrop, .modal-close').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    // 字数统计
    document.getElementById('lyricsInput').addEventListener('input', updateWordCount);
    document.getElementById('clearBtn').addEventListener('click', clearLyrics);

    // 生成
    document.getElementById('generateBtn').addEventListener('click', doGenerate);
    document.getElementById('regenerateBtn').addEventListener('click', doGenerate);
    document.getElementById('saveBtn').addEventListener('click', saveWork);

    // 播放
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', togglePlay);
    });

    // 下载
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', downloadAudio);
    });

    // 定价
    document.querySelectorAll('.pricing-btn').forEach(btn => {
        btn.addEventListener('click', buyMember);
    });

    // 充值卡
    document.querySelectorAll('.recharge-card').forEach(card => {
        card.addEventListener('click', () => doRecharge(card));
    });

    // VIP卡
    document.querySelectorAll('.vip-card').forEach(card => {
        card.addEventListener('click', () => buyMemberFromRecharge(card));
    });
}

// ===== 登录相关 =====
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('rechargeModal').classList.add('hidden');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('loginModal').classList.add('hidden');
}

function switchToRegister(e) {
    e.preventDefault();
    showRegisterModal();
}

function switchToLogin(e) {
    e.preventDefault();
    showLoginModal();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// ===== 用户注册 =====
function doRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;

    if (!username || !password) {
        showToast('请填写完整信息', 'error');
        return;
    }

    if (password !== password2) {
        showToast('两次密码不一致', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('密码至少6位', 'error');
        return;
    }

    // 检查用户名是否存在
    if (DB.users.find(u => u.username === username)) {
        showToast('用户名已存在', 'error');
        return;
    }

    // 创建用户
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
    
    // 记录积分
    logPoints(newUser.id, 'earn', CONFIG.newUserPoints, '新用户注册');

    // 保存
    saveData();

    // 初始化界面
    initUserUI();
    closeAllModals();
    
    showToast(`注册成功！赠送 ${CONFIG.newUserPoints} 积分`, 'success');
}

// ===== 用户登录 =====
function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showToast('请填写用户名和密码', 'error');
        return;
    }

    const user = DB.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showToast('用户名或密码错误', 'error');
        return;
    }

    DB.currentUser = user;
    saveData();
    initUserUI();
    closeAllModals();
    
    showToast(`欢迎回来，${user.username}！`, 'success');
}

// ===== 积分充值 =====
function showRechargeModal() {
    const user = DB.currentUser;
    if (!user) {
        showLoginModal();
        return;
    }
    
    document.getElementById('currentPoints').textContent = user.points;
    document.getElementById('rechargeModal').classList.remove('hidden');
}

function doRecharge(card) {
    const amount = parseInt(card.dataset.amount);
    const points = parseInt(card.dataset.points);
    const user = DB.currentUser;
    
    if (!user) return;

    // 模拟支付
    showToast(`支付 ¥${amount} 成功！`, 'success');

    // 增加积分
    user.points += points;
    logPoints(user.id, 'earn', points, `充值 ¥${amount}`);
    
    saveData();
    initUserUI();
    
    showToast(`充值成功！+${points} 积分`, 'success');
}

// ===== 购买会员 =====
function buyMember(e) {
    const plan = e.target.dataset.plan;
    const user = DB.currentUser;
    
    if (!user) {
        showLoginModal();
        return;
    }

    const price = CONFIG.memberCost[plan];
    const planName = plan === 'month' ? '月度会员' : '年度会员';
    
    // 模拟支付
    showToast(`开通 ${planName} (¥${price})，请完成支付`, 'success');
    
    // 开通会员
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
    
    if (!user) {
        showLoginModal();
        return;
    }

    const planName = plan === 'month' ? '月度会员' : '年度会员';
    
    // 检查积分/余额（这里简化处理）
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

// ===== 生成歌曲 =====
function doGenerate() {
    const user = DB.currentUser;
    const lyrics = document.getElementById('lyricsInput').value.trim();
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const costPoints = document.getElementById('costPoints');

    if (!user) {
        showLoginModal();
        return;
    }

    if (!lyrics || lyrics.length < 10) {
        showToast('歌词内容太短（至少10个字）', 'error');
        return;
    }

    // 检查积分
    let cost = 0;
    if (!user.isMember) {
        cost = CONFIG.generateCost;
        if (user.points < cost) {
            showToast('积分不足！请充值', 'error');
            showRechargeModal();
            return;
        }
    }

    costPoints.textContent = cost;

    // 扣除积分（非会员）
    if (cost > 0) {
        user.points -= cost;
        logPoints(user.id, 'spend', cost, '生成歌曲');
    }

    // 更新作品计数
    user.worksCount = (user.worksCount || 0) + 1;
    saveData();
    initUserUI();

    // 显示加载
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    // 模拟生成进度
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;

        const percent = Math.floor(progress);
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressText').textContent = percent + '%';

        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                loadingSection.classList.add('hidden');
                resultSection.classList.remove('hidden');
                
                // 更新剩余积分
                document.getElementById('remainPoints').textContent = user.points;
                
                showToast('生成成功！', 'success');
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

function saveWork() {
    showToast('已保存到作品库', 'success');
}

function togglePlay(e) {
    const btn = e.currentTarget;
    const card = btn.closest('.result-card');
    const isPlaying = card.classList.contains('playing');

    // 停止其他
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
        
        // 模拟播放进度
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
        if (!card.classList.contains('playing')) {
            clearInterval(interval);
            return;
        }
        
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
    showToast(`下载 V${version} 成功！模拟下载开始`, 'success');
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
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ===== 键盘快捷键 =====
document.getElementById('lyricsInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('generateBtn').click();
    }
});