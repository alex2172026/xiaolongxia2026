// SONG AI - 交互脚本

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== DOM 元素 =====
    const lyricsInput = document.getElementById('lyricsInput');
    const wordCount = document.getElementById('wordCount');
    const clearBtn = document.querySelector('.clear-btn');
    const generateBtn = document.getElementById('generateBtn');
    const loadingSection = document.getElementById('loadingSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultSection = document.getElementById('resultSection');
    const playBtns = document.querySelectorAll('.play-btn');
    const downloadBtns = document.querySelectorAll('.download-btn');
    const regenerateBtn = document.querySelector('.regenerate-btn');
    const saveBtn = document.querySelector('.save-btn');
    
    // ===== 字数统计 =====
    lyricsInput.addEventListener('input', function() {
        const text = this.value.trim();
        const count = text ? text.length : 0;
        wordCount.textContent = count;
    });
    
    // ===== 清空歌词 =====
    clearBtn.addEventListener('click', function() {
        lyricsInput.value = '';
        wordCount.textContent = '0';
    });
    
    // ===== 生成歌曲 =====
    generateBtn.addEventListener('click', function() {
        const lyrics = lyricsInput.value.trim();
        
        // 验证歌词
        if (!lyrics) {
            alert('请先输入歌词！');
            lyricsInput.focus();
            return;
        }
        
        if (lyrics.length < 10) {
            alert('歌词内容太短，请输入更多内容（至少10个字）');
            lyricsInput.focus();
            return;
        }
        
        // 开始生成
        startGeneration();
    });
    
    // ===== 开始生成流程 =====
    function startGeneration() {
        // 禁用按钮
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">生成中...</span>';
        
        // 显示加载
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        
        // 模拟进度
        let progress = 0;
        const progressInterval = setInterval(function() {
            // 随机增加进度
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            const percent = Math.floor(progress);
            progressFill.style.width = percent + '%';
            progressText.textContent = percent + '%';
            
            // 加载完成
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                setTimeout(function() {
                    // 隐藏加载
                    loadingSection.classList.add('hidden');
                    
                    // 显示结果
                    resultSection.classList.remove('hidden');
                    
                    // 恢复按钮
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<span class="btn-icon">🎵</span><span class="btn-text">重新生成</span>';
                    
                    // 滚动到结果
                    resultSection.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        }, 500);
    }
    
    // ===== 播放/暂停 =====
    playBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const card = this.closest('.result-card');
            const playIcon = card.querySelector('.play-icon');
            const playText = card.querySelector('.play-text');
            const progressDiv = card.querySelector('.card-progress');
            const miniFill = card.querySelector('.mini-fill');
            const miniTime = card.querySelector('.mini-time');
            const isPlaying = card.classList.contains('playing');
            
            // 停止其他卡片
            document.querySelectorAll('.result-card.playing').forEach(function(c) {
                if (c !== card) {
                    c.classList.remove('playing');
                    c.querySelector('.play-icon').textContent = '▶';
                    c.querySelector('.play-text').textContent = '播放';
                    c.querySelector('.card-progress').classList.add('hidden');
                }
            });
            
            if (isPlaying) {
                // 停止播放
                card.classList.remove('playing');
                playIcon.textContent = '▶';
                playText.textContent = '播放';
                progressDiv.classList.add('hidden');
            } else {
                // 开始播放
                card.classList.add('playing');
                playIcon.textContent = '⏸';
                playText.textContent = '暂停';
                progressDiv.classList.remove('hidden');
                
                // 模拟播放进度
                simulatePlay(miniFill, miniTime, card);
            }
        });
    });
    
    // ===== 模拟播放进度 =====
    function simulatePlay(fill, timeEl, card) {
        let current = 0;
        const duration = card.querySelector('.card-duration').textContent.replace('时长: ', '');
        const durationSec = parseTime(duration);
        
        const playInterval = setInterval(function() {
            if (!card.classList.contains('playing')) {
                clearInterval(playInterval);
                return;
            }
            
            current += 1;
            const percent = (current / durationSec) * 100;
            fill.style.width = percent + '%';
            
            timeEl.textContent = formatTime(current) + ' / ' + duration;
            
            if (current >= durationSec) {
                clearInterval(playInterval);
                card.classList.remove('playing');
                card.querySelector('.play-icon').textContent = '▶';
                card.querySelector('.play-text').textContent = '播放';
                card.querySelector('.card-progress').classList.add('hidden');
                fill.style.width = '0%';
                timeEl.textContent = '0:00 / ' + duration;
            }
        }, 1000);
    }
    
    // ===== 解析时间 =====
    function parseTime(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    // ===== 格式化时间 =====
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
    
    // ===== 下载 =====
    downloadBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const card = this.closest('.result-card');
            const version = card.dataset.version;
            const style = card.querySelector('.card-info h3').textContent;
            
            // 模拟下载
            alert('开始下载 V' + version + ' - ' + style + '\n实际产品将返回MP3文件');
            // 实际开发中，这里调用后端API获取音频文件
        });
    });
    
    // ===== 重新生成 =====
    regenerateBtn.addEventListener('click', function() {
        resultSection.classList.add('hidden');
        startGeneration();
    });
    
    // ===== 保存到作品库 =====
    saveBtn.addEventListener('click', function() {
        alert('歌曲已保存到作品库！');
    });
    
    // ===== 平滑滚动 =====
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // ===== 键盘快捷键 =====
    // Ctrl + Enter 快速生成
    lyricsInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            generateBtn.click();
        }
    });
});