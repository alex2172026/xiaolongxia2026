
        // ============ 多服务商配置 ============
        const PROVIDERS = {
            minimax: {
                name: 'MiniMax',
                apiUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
                models: ['MiniMax-M2.5', 'MiniMax-M2.5-0805'],
                headers: { 'Authorization': 'Bearer ' },
                bodyKey: 'model'
            },
            moonshot: {
                name: '月之暗面',
                apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
                models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
                headers: { 'Authorization': 'Bearer ' },
                bodyKey: 'model'
            },
            zhipu: {
                name: '智谱AI',
                apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                models: ['glm-4', 'glm-4-flash', 'glm-3-turbo', 'glm-3-flash'],
                headers: { 'Authorization': 'Bearer ' },
                bodyKey: 'model'
            },
            openai: {
                name: 'OpenAI',
                apiUrl: 'https://api.openai.com/v1/chat/completions',
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                headers: { 'Authorization': 'Bearer ' },
                bodyKey: 'model'
            },
            anthropic: {
                name: 'Anthropic',
                apiUrl: 'https://api.anthropic.com/v1/messages',
                models: ['claude-sonnet-4-20250514', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
                headers: { 'x-api-key': '', 'anthropic-version': '2023-06-01' },
                bodyKey: 'model',
                isAnthropic: true
            }
        };

        // ============ 配置管理 ============
        const SETTINGS_KEY = 'ai_case_settings';
        
        function getSavedSettings() {
            try {
                return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
            } catch { return {}; }
        }

        function saveSettings() {
            const provider = document.getElementById('providerSelect').value;
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            const model = document.getElementById('modelSelect').value;

            if (!apiKey) {
                alert('请输入API Key');
                return;
            }

            // 拒绝非 ASCII（防止 fetch headers 抛 ISO-8859-1 错误）
            if (/[^\x00-\xFF]/.test(apiKey)) {
                alert('API Key 含非 ASCII 字符（中文/emoji 等），请重新输入纯 ASCII 的 Key');
                return;
            }

            const settings = {
                provider: provider,
                apiKey: apiKey,
                model: model
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

            // 应用设置
            applySettings(settings);

            closeSettings();
            alert('设置已保存！');
        }

        function applySettings(settings) {
            const providerConfig = PROVIDERS[settings.provider];
            CONFIG.PROVIDER = settings.provider;
            CONFIG.API_KEY = settings.apiKey;
            CONFIG.API_URL = providerConfig.apiUrl;
            CONFIG.MODEL = settings.model;
            CONFIG.HEADERS = { ...providerConfig.headers };
            CONFIG.HEADERS[Object.keys(CONFIG.HEADERS)[0]] = settings.apiKey;
            CONFIG.BODY_KEY = providerConfig.bodyKey;
            CONFIG.IS_ANTHROPIC = providerConfig.isAnthropic || false;
        }

        function loadSettings() {
            const settings = getSavedSettings();
            if (settings.provider && settings.apiKey) {
                applySettings(settings);
            }
        }

        function onProviderChange() {
            const provider = document.getElementById('providerSelect').value;
            const config = PROVIDERS[provider];
            const modelSelect = document.getElementById('modelSelect');
            
            modelSelect.innerHTML = config.models.map(m => `<option value="${m}">${m}</option>`).join('');
        }

        function openSettings() {
            const settings = getSavedSettings();
            if (settings.provider) {
                document.getElementById('providerSelect').value = settings.provider;
                document.getElementById('apiKeyInput').value = settings.apiKey;
                onProviderChange();
                document.getElementById('modelSelect').value = settings.model;
            } else {
                document.getElementById('providerSelect').value = 'minimax';
                onProviderChange();
            }
            document.getElementById('settingsPanel').classList.add('active');
        }

        function closeSettings() {
            document.getElementById('settingsPanel').classList.remove('active');
            document.getElementById('testResult').textContent = '';
        }

        function fillDemoKey(provider) {
            document.getElementById('providerSelect').value = provider;
            onProviderChange();
            const demoKeys = {
                minimax: 'sk-demo-minimax-key',
                moonshot: 'sk-demo-moonshot-key',
                zhipu: 'sk-demo-zhipu-key'
            };
            document.getElementById('apiKeyInput').value = demoKeys[provider] || 'sk-demo-key';
        }

        async function testApiConnection() {
            const resultEl = document.getElementById('testResult');
            resultEl.textContent = '测试中...';
            resultEl.className = 'ml-3 text-sm text-blue-400';
            
            const provider = document.getElementById('providerSelect').value;
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            const model = document.getElementById('modelSelect').value;
            const config = PROVIDERS[provider];
            
            try {
                const testHeaders = {
                    'Content-Type': 'application/json',
                    ...config.headers,
                    [Object.keys(config.headers)[0]]: apiKey
                };
                for (const k of Object.keys(testHeaders)) {
                    if (/[^\x00-\xFF]/.test(testHeaders[k])) { resultEl.textContent = '✗ API Key 含非 ASCII 字符'; resultEl.className = 'ml-3 text-sm text-red-400'; return; }
                }
                const response = await fetch(config.apiUrl, {
                    method: 'POST',
                    headers: testHeaders,
                    body: JSON.stringify({
                        [config.bodyKey]: model,
                        messages: [{ role: 'user', content: 'Hi' }],
                        max_tokens: 10
                    })
                });
                
                if (response.ok || response.status === 200) {
                    resultEl.textContent = '✓ 连接成功！';
                    resultEl.className = 'ml-3 text-sm text-green-400';
                } else {
                    const err = await response.json().catch(() => ({}));
                    resultEl.textContent = '✗ ' + (err.error?.message || '连接失败');
                    resultEl.className = 'ml-3 text-sm text-red-400';
                }
            } catch (e) {
                resultEl.textContent = '✗ ' + e.message;
                resultEl.className = 'ml-3 text-sm text-red-400';
            }
        }

        // 等待法典数据就绪（用于评查：条文可显著提升报告质量）
        var CODEX_SYNC_WAIT = function(cb) {
            if (CODEX) { if (cb) cb(true); return Promise.resolve(true); }
            var started = Date.now();
            var MAX_WAIT = 8000;
            return new Promise(function(resolve) {
                function poll() {
                    if (CODEX) { resolve(true); return; }
                    if (Date.now() - started > MAX_WAIT) { resolve(false); return; }
                    var el = document.getElementById('codexLoadingHint');
                    if (el) {
                        el.style.display = 'flex';
                        var t = el.querySelector('[data-tip]');
                        if (t) {
                            var left = Math.max(0, Math.ceil((MAX_WAIT - (Date.now() - started)) / 1000));
                            t.textContent = '法典数据加载中（剩余约 ' + left + ' 秒），完成后自动继续…';
                        }
                    }
                    setTimeout(poll, 200);
                }
                poll();
            });
        };

        // ============ 配置 ============
        const CONFIG = {
            PROVIDER: 'minimax',
            API_KEY: '',
            API_URL: 'https://api.minimaxi.com/v1/chat/completions',
            MODEL: 'MiniMax-M2.7',
            HEADERS: { 'Authorization': 'Bearer ' },
            BODY_KEY: 'model',
            IS_ANTHROPIC: false
        };

        
        // ============ 法典数据懒加载 ============
        // 数据独立存放在 codex-data.js，由页面按需引入，避免主脚本阻塞 UI 交互
        var CODEX_DATA_READY = false;
        var CODEX_LOADING = null;

        function loadCodexData() {
            if (CODEX_DATA_READY) return Promise.resolve(true);
            if (CODEX_LOADING) return CODEX_LOADING;
            CODEX_LOADING = new Promise(function(resolve) {
                if (typeof window.CODEX_POLICY_DATABASE !== 'undefined') {
                    window.policyDatabase = window.CODEX_POLICY_DATABASE;
                    window.codexInterpretations = window.CODEX_INTERPRETATIONS || {};
                    CODEX_DATA_READY = true;
                    resolve(true);
                    return;
                }
                var s = document.createElement('script');
                s.src = 'codex-data.js';
                s.onload = function() {
                    window.policyDatabase = window.CODEX_POLICY_DATABASE;
                    window.codexInterpretations = window.CODEX_INTERPRETATIONS || {};
                    CODEX_DATA_READY = true;
                    resolve(true);
                };
                s.onerror = function() { resolve(false); };
                document.head.appendChild(s);
            });
            return CODEX_LOADING;
        }

        // ============ 预置政策法规库 ============
        


        // ============ 法条释义库（实操要点导向）============
        // 数据格式: { "第X条": "实操要点释义文本..." }
        // 1242 条全覆盖，按需使用（条文详情展示 / AI 问答增强 / 搜索结果）
        ;

        // ============ 进度条控制 ============
        function showProgress(percent, text) {
            document.getElementById('progressContainer').classList.remove('hidden');
            document.getElementById('progressBar').style.width = percent + '%';
            document.getElementById('progressText').textContent = text + ' (' + percent + '%)';
        }

        function hideProgress() {
            document.getElementById('progressContainer').classList.add('hidden');
            document.getElementById('progressBar').style.width = '0%';
        }

        function setStatus(text) {
            document.getElementById('statusText').textContent = text;
        }

        // 初始化PDF.js —— worker 优先用本地副本，避免 CDN 不可达时 PDF 全部无法解析
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
        // 若本地 worker 加载失败，回退到 CDN
        (function () {
            var local = 'vendor/pdfjs/pdf.worker.min.js';
            var cdn = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            fetch(local, { method: 'HEAD' }).then(function (r) {
                if (!r.ok) pdfjsLib.GlobalWorkerOptions.workerSrc = cdn;
            }).catch(function () {
                pdfjsLib.GlobalWorkerOptions.workerSrc = cdn;
            });
        })();

        // ============ OCR 本地化配置 ============
        // 原因：Tesseract v5 的 worker 在子线程用 importScripts 从 CDN 加载，
        // 在 GitHub Pages（国内带宽低 + 跨域 importScripts 限制）会失败，
        // 导致上传图片/扫描件时提示"无法读取"。
        // 方案：worker / wasm core / 语言包全部随仓库本地托管，彻底脱离 CDN。
        var OCR_LOCAL = {
            workerPath: 'vendor/tesseract/worker.min.js',
            corePath: 'vendor/tesseract/',
            langPath: 'vendor/tessdata/'
        };

        function ocrOptions(logger) {
            var o = {
                logger: logger || function () { }
            };
            // 仅当本地资源存在时启用（避免路径错误导致整体不可用）
            o.workerPath = OCR_LOCAL.workerPath;
            o.corePath = OCR_LOCAL.corePath;
            o.langPath = OCR_LOCAL.langPath;
            // 部分浏览器不支持 SIMD，需指定非 SIMD 的 core 文件；
            // 本地已内置 simd-lstm 版本，这里显式给出完整路径避免 worker 去猜。
            o.corePath = OCR_LOCAL.corePath + 'tesseract-core-simd-lstm.wasm.js';
            return o;
        }

        let uploadedFiles = [];
        let reportText = '';
        let highlightEnabled = false;
        let isLightTheme = false;

        // ============ 拖拽上传 ============
        function initDragDrop() {
            const dropZone = document.getElementById('dropZone');
            if (!dropZone) return;

            dropZone.addEventListener('click', () => document.getElementById('fileInput').click());

            dropZone.addEventListener('dragover', e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    files.forEach(f => uploadedFiles.push(f));
                    renderFileList();
                }
            });
        }

        // ============ 主题切换 ============
        function toggleTheme() {
            isLightTheme = !isLightTheme;
            document.body.classList.toggle('light-theme', isLightTheme);
            document.getElementById('themeText').textContent = isLightTheme ? '夜晚' : '白天';
            const codexThemeTextEl = document.getElementById('codexThemeText');
            if (codexThemeTextEl) codexThemeTextEl.textContent = isLightTheme ? '夜晚' : '白天';
            document.getElementById('themeIcon').innerHTML = isLightTheme
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.75 9.75 0 0012 21a9.75 9.75 0 008.354-5.646z"/>';
            localStorage.setItem('case_theme', isLightTheme ? 'light' : 'dark');
        }

        function loadThemePreference() {
            const saved = localStorage.getItem('case_theme');
            if (saved === 'light') {
                isLightTheme = true;
                document.body.classList.add('light-theme');
                document.getElementById('themeText').textContent = '夜晚';
            }
        }

        // 页面加载完成后初始化
        window.addEventListener('DOMContentLoaded', () => {
            initDragDrop();
            loadThemePreference();
            loadSettings();
        });


        // ============ 单份笔录评查 ============
        // 用途：仅有一份询问笔录/现场笔录时，可直接上传并一键评查，无需批量模式
        var SINGLE_FILE_KIND = '';

        function openSingleFilePicker(kind) {
            SINGLE_FILE_KIND = kind || '';
            var inp = document.getElementById('singleFileInput');
            if (!inp) return;
            inp.accept = kind === 'image' ? 'image/*' : '';
            inp.click();
        }

        function handleSingleFile() {
            var inp = document.getElementById('singleFileInput');
            var files = inp ? Array.from(inp.files || []) : [];
            if (!files.length) return;
            if (inp) inp.value = '';

            var f = files[0];
            var kindLabel = SINGLE_FILE_KIND === 'image' ? '现场照片' : '笔录';

            // 校验类型
            var ext = (f.name.split('.').pop() || '').toLowerCase();
            var imgExts = ['png','jpg','jpeg','gif','bmp','webp'];
            var isImg = imgExts.indexOf(ext) >= 0;
            if (SINGLE_FILE_KIND === 'image' && !isImg) {
                alert('请选择图片文件（现场照片）。');
                return;
            }
            if (SINGLE_FILE_KIND === 'record') {
                var okExts = ['txt','doc','docx','pdf','jpg','jpeg','png','webp','bmp','gif','xls','xlsx'];
                if (okExts.indexOf(ext) < 0) {
                    alert('不支持的文件格式：' + ext + '\n支持 TXT / Word / PDF / 图片 / Excel');
                    return;
                }
            }

            // 清空批量列表，走单份通道
            uploadedFiles = [f];
            renderFileList();
            updateBatchCount();

            var statusEl = document.getElementById('fileReadStatus');
            if (statusEl) statusEl.textContent = '已选择：' + f.name;

            // 自动滚动到上传区
            var dz = document.getElementById('dropZone');
            if (dz && dz.scrollIntoView) dz.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 单份模式：载入后由用户确认再评查（可在补充描述里追加案情）
            setTimeout(function() {
                var tip = document.getElementById('singleModeHint');
                if (tip) {
                    tip.style.display = 'flex';
                    tip.innerHTML = '已载入单份' + kindLabel + '（<b>' + escapeHtml(f.name) + '</b>）。' +
                        '可在下方补充案件描述，确认无误后点击「生成评查报告」开始评查。' +
                        '<button onclick="generateSingleReport()" ' +
                        'style="margin-left:10px;padding:4px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">' +
                        '立即评查</button>';
                }
            }, 120);
        }

        // 单份评查按钮
        async function generateSingleReport() {
            if (!uploadedFiles.length) {
                alert('请先选择要评查的笔录文件');
                return;
            }
            await generateReport();
        }

        // ============ 文件上传 ============
        function handleFiles() {
            const files = Array.from(document.getElementById('fileInput').files);
            files.forEach(f => uploadedFiles.push(f));
            renderFileList();
            document.getElementById('fileInput').value = '';
        }

        function renderFileList() {
            document.getElementById('fileList').innerHTML = uploadedFiles.map((f, i) => `
                <div class="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                    <span>${f.name} <span class="text-xs text-slate-400">(${formatSize(f.size)})</span></span>
                    <button onclick="uploadedFiles.splice(${i},1);renderFileList();updateBatchCount()" class="text-red-400">删除</button>
                </div>
            `).join('');
            updateBatchCount();
        }

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + 'B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
            return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
        }

        function updateBatchCount() {
            const count = uploadedFiles.length;
            const badge = document.getElementById('batchCount');
            const num = document.getElementById('batchNum');
            if (count > 1) {
                badge.classList.remove('hidden');
                num.textContent = count;
            } else {
                badge.classList.add('hidden');
            }
        }

        // ============ 读取文件内容 ============
        async function mergeFileContent() {
            let content = '';
            for (const file of uploadedFiles) {
                try {
                    const text = await readFileContent(file);
                    content += `\n[文件: ${file.name}]\n${text}\n`;
                } catch (e) {
                    content += `\n[文件: ${file.name}]\n读取失败: ${e.message}\n`;
                }
            }
            return content;
        }

        async function readFileContent(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            try {
                if (['txt', 'log', 'json', 'xml', 'csv'].includes(ext)) return await readTextFile(file);
                if (['doc', 'docx'].includes(ext)) return await readDocxFile(file);
                if (['xls', 'xlsx'].includes(ext)) return await readExcelFile(file);
                if (['pdf'].includes(ext)) return await readPdfFile(file);
                if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return await readImageFile(file);
                // 默认当作文本尝试
                return await readTextFile(file);
            } catch (e) {
                console.error('文件读取出错:', e);
                return '[文件读取失败: ' + e.message;
            }
        }

        function readTextFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result || '[空文件]');
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file, 'utf-8');
            });
        }

        async function readDocxFile(file) {
            console.log('开始读取Word文件:', file.name, file.type, file.size);
            const buffer = await file.arrayBuffer();
            console.log('arrayBuffer大小:', buffer.byteLength);
            
            // 方法1：mammoth主方法
            try {
                const result = await mammoth.extractRawText({arrayBuffer: buffer});
                if (result.value && result.value.length > 10 && !hasGarbledChars(result.value)) {
                    return result.value;
                }
            } catch (e) { console.log('extractRawText失败'); }
            
            // 方法2：convertToHtml
            try {
                const result2 = await mammoth.convertToHtml({arrayBuffer: buffer});
                if (result2.value) {
                    const text = cleanHtml(result2.value);
                    if (text.length > 10 && !hasGarbledChars(text)) return text;
                }
            } catch (e) { console.log('convertToHtml失败'); }
            
            // 方法3：尝试DOC文件多种编码
            const encodings = ['gbk', 'gb2312', 'utf-8', 'big5'];
            for (const enc of encodings) {
                try {
                    const blob = new Blob([buffer], {type: 'application/msword'});
                    const text = await new Promise((resolve, reject) => {
                        const r = new FileReader();
                        r.onload = e => resolve(e.target.result);
                        r.onerror = reject;
                        r.readAsText(blob, enc);
                    });
                    if (text && text.length > 20 && !hasGarbledChars(text)) {
                        console.log('成功编码:', enc);
                        return text.substring(0, 5000);
                    }
                } catch (e) { console.log('编码'+enc+'失败'); }
            }
            
            return '【文件' + file.name + '读取失败，请复制文件内容粘贴到上方输入框】';
        }
        
        // 检查是否为乱码（包含过多不可见字符）
        function hasGarbledChars(text) {
            if (!text) return true;
            const invalidRatio = (text.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g) || []).length / text.length;
            if (invalidRatio > 0.1 || text.includes('\x00')) return true;

            // PDF 乱码特征：大量高位字符（CJK 之外的扩展区）/ 私用区 / 非常见符号，
            // 或可打印 ASCII 占比过低且中文字符极少 —— 这类内容对用户不可读。
            const total = text.replace(/\s/g, '').length;
            if (total < 10) return true;
            const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
            const weird = (text.match(/[\u0080-\u00ff\ue000-\uf8ff\ufffd]/g) || []).length;
            const printableAscii = (text.match(/[\x20-\x7e]/g) || []).length;
            // 乱码：高位/私用区字符占比高，且几乎没有中文
            if (weird / total > 0.25 && cjk / total < 0.05) return true;
            // 乱码：可打印字符极少（说明是二进制/编码错误内容）
            if (printableAscii / total < 0.1 && cjk / total < 0.05) return true;
            return false;
        }

        // 判断提取出的文本是否"可读"——用于决定是否走 OCR 回退
        function isReadableText(text) {
            if (!text || !text.trim()) return false;
            if (hasGarbledChars(text)) return false;
            return true;
        }
        
        // 清理HTML
        function cleanHtml(html) {
            return html
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/&amp;/gi, '&')
                .replace(/\s+/g, ' ')
                .trim();
        }

        function readExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const wb = XLSX.read(e.target.result, {type: 'array'});
                        let text = '';
                        wb.SheetNames.forEach(name => {
                            text += '\n--- ' + name + ' ---\n' + XLSX.utils.sheet_to_csv(wb.Sheets[name]);
                        });
                        resolve(text || '[Excel文件为空]');
                    } catch (err) {
                        console.error('excel错误:', err);
                        reject(new Error('Excel解析失败'));
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsArrayBuffer(file);
            });
        }

        function readPdfFile(file) {
            return new Promise(async (resolve, reject) => {
                try {
                    const arr = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({data: arr}).promise;
                    let text = '';

                    // 先尝试提取文字层
                    for (let i = 1; i <= pdf.numPages; i++) {
                        setStatus('正在提取PDF文字 ' + i + '/' + pdf.numPages);
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        if (pageText.trim()) text += pageText + '\n';
                    }

                    // 关键：部分中文 PDF（无 ToUnicode 映射）提取出的是乱码，
                    // 这类必须回退到 OCR，否则用户看到的是一堆无法辨认的字符。
                    let needOcr = !text.trim();
                    if (!needOcr && !isReadableText(text)) {
                        console.warn('PDF文字层为乱码，改用OCR识别');
                        text = '';
                        needOcr = true;
                    }

                    if (needOcr) {
                        setStatus('正在初始化OCR识别（首次需下载中文语言包，请稍候）...');
                        console.log('PDF无有效文字层，启用OCR识别...');
                        text = await ocrPdfPages(pdf);
                    }

                    if (!text.trim()) {
                        resolve('【PDF提取失败：既无文字层也无OCR结果。请把内容复制到下方输入框，或另存为 Word/TXT 后重试】');
                        return;
                    }
                    resolve(text);
                } catch (e) {
                    console.error('PDF解析异常:', e);
                    reject(new Error('PDF解析失败：' + (e && e.message ? e.message : '未知错误')));
                }
            });
        }

        // 对 PDF 每页渲染成图片后做 OCR
        async function ocrPdfPages(pdf) {
            let worker = null;
            let out = '';
            try {
                worker = await Tesseract.createWorker('chi_sim+eng', 1, ocrOptions(function (m) {
                    if (m.status === 'recognizing text') {
                        setStatus('OCR识别中: ' + Math.round(m.progress * 100) + '%');
                    } else if (m.status === 'loading tesseract core') {
                        setStatus('正在加载OCR引擎...');
                    } else if (m.status === 'loading language traineddata') {
                        setStatus('正在加载中文语言包...');
                    } else if (m.status === 'initializing api') {
                        setStatus('正在初始化OCR...');
                    }
                }));

                for (let i = 1; i <= pdf.numPages; i++) {
                    setStatus('OCR识别第 ' + i + '/' + pdf.numPages + ' 页...');
                    const page = await pdf.getPage(i);
                    const viewport = await page.getViewport({ scale: 2.0 });

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
                    const ret = await worker.recognize(blob);
                    out += ret.data.text.trim() + '\n';
                }
            } finally {
                if (worker) { try { await worker.terminate(); } catch (e) { } }
            }
            return out;
        }

        function readImageFile(file) {
            return new Promise(async (resolve, reject) => {
                try {
                    setStatus('正在OCR识别图片（首次加载引擎，请稍候）...');
                    var logger = function (m) {
                        if (m.status === 'recognizing text') {
                            setStatus('OCR识别中: ' + Math.round(m.progress * 100) + '%');
                        } else if (m.status === 'loading tesseract core') {
                            setStatus('正在加载OCR引擎...');
                        } else if (m.status === 'loading language traineddata') {
                            setStatus('正在加载中文语言包...');
                        } else if (m.status === 'initializing api') {
                            setStatus('正在初始化OCR...');
                        }
                    };
                    var result = await Tesseract.recognize(file, 'chi_sim+eng', ocrOptions(logger));
                    var txt = (result.data.text || '').trim();
                    if (!txt) {
                        resolve('【图片中未识别到文字。请确认图片清晰、光线充足，或把笔录内容复制到下方输入框】');
                        return;
                    }
                    resolve(txt);
                } catch (e) {
                    console.error('图片OCR失败:', e);
                    reject(new Error('OCR识别失败：' + (e && e.message ? e.message : '未知错误')));
                }
            });
        }

        // ============ 法律依据条文库（已替代旧法） ============
        // 旧的环境单行法律已整合/将被生态环境法典替代
        const REPLACED_LAWS = [
            '《环境保护法》(2014)',
            '《大气污染防治法》',
            '《水污染防治法》',
            '《噪声污染防治法》',
            '《固体废物污染环境防治法》',
            '《放射性污染防治法》',
            '《环境影响评价法》',
            '《排污许可管理条例》',
            '《建设项目环境保护管理条例》',
            '《医疗废物管理条例》',
            '《危险化学品安全管理条例》(涉生态部分)',
            '《清洁生产促进法》(涉生态部分)'
        ];

        function buildLegalSystemPrompt(caseContent) {
            // 初始化法典解析（如果还没初始化）
            if (!CODEX) {
                try { initCodex(); } catch (e) { console.warn('法典初始化失败', e); }
            }
            // 数据仍在下载时，同步等待一小段时间（法典条文能显著提升评查质量）
            if (!CODEX && typeof CODEX_SYNC_WAIT !== 'undefined') {
                CODEX_SYNC_WAIT();
            }

            // 从法典里捞相关条款
            let relevantArticles = [];
            if (CODEX && CODEX.articles) {
                try {
                    relevantArticles = findRelevantArticles(caseContent || '', 12);
                } catch (e) {
                    console.warn('法典检索失败', e);
                }
            }

            let articlesText = '';
            if (relevantArticles.length > 0) {
                articlesText = relevantArticles.map(a => `【${a.num}】（${a.book}${a.chapter ? '·' + a.chapter : ''}）${a.content.substring(0, 300)}${a.content.length > 300 ? '...' : ''}`).join('\n');
            } else {
                articlesText = '（未检索到直接相关条款，按法典总则及污染防治编通用条款评查）';
            }

            return `你是生态环境执法领域的专业案件评查专家。基于《中华人民共和国生态环境法典》（2026年8月15日起施行，共1242条，5编）进行分析。

【⚠️ 法律依据更新提示（重要）】
1. 生态环境法典已整合并替代以下旧法律：
   ${REPLACED_LAWS.join('、')}
2. 评查报告中的条文应优先、必须引用生态环境法典的"第X条"，格式：[第X条]
3. 严禁再引用已废止/已整合的旧单行法条款（旧法条款已整体纳入法典对应章节）
4. 如案件涉及的行为在法典中已有对应条款，必须用法典条款评查

【相关生态环境法典条款（已根据案件内容自动检索）】
${articlesText}

【评查要求】
1. 必须有理有据，引用具体条文编号（格式：第X条），条款引用务求现行有效
2. 区分"已废止旧法"和"现行法典"，不得使用已废止条款
3. 引用条款时注明所属编章节
4. 给出明确的处罚依据和幅度区间
5. 重点审查维度：
   - 执法主体与管辖权限
   - 违法事实认定（构成要件是否齐备）
   - 证据链（合法性、真实性、关联性、完整性）
   - 法律适用（条款援引是否现行有效）
   - 程序合法性（告知、听证、送达、时限）
   - 自由裁量基准（过罚相当原则）
   - 责令改正内容是否具体可执行
6. 涉及询问笔录类材料，重点审查：
   - 权利义务告知书是否当场送达
   - 询问地点、起止时间是否符合规定
   - 询问人/记录人主体资格
   - 被询问人签字捺印
   - 笔录与事实陈述的一致性

【报告格式】
1. 案件基本情况（案号、来源、当事人、违法行为）
2. 违法事实认定（含证据）
3. 法律适用（含法典具体条款引用）
4. 程序合法性审查
5. 处罚建议（依据 + 幅度）
6. 整改要求
7. 综合评查结论（含问题清单与改进建议）`;
        }

        // ============ 生成评查报告 ============
        async function generateReport() {
            const content = document.getElementById('caseContent').value.trim();
            
            // 读取所有上传的文件
            let fileInfo = '';
            const MAX_LEN = 5000;
            
            if (uploadedFiles.length > 0) {
                document.getElementById('status').classList.remove('hidden');
                showProgress(10, '正在读取文件...');
                setStatus('文件读取中...');
                
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const file = uploadedFiles[i];
                    showProgress(10 + Math.round((i / Math.max(uploadedFiles.length, 1)) * 30), '读取: ' + file.name);

                    // 显示读取状态
                    document.getElementById('fileReadStatus').textContent = '读取中...';

                    let text = '';
                    let readFailed = false;
                    let failReason = '';
                    try {
                        text = await readFileContent(file);
                    } catch (e) {
                        readFailed = true;
                        failReason = e && e.message ? e.message : '未知错误';
                        console.error('文件错误:', e);
                    }

                    // 判定是否真的读到了可用内容
                    // （readFileContent 失败时可能返回带说明的占位文本，不是真实内容）
                    if (!readFailed && (!text || text.length < 5 || /^[\s【\[]*(读取失败|文件内容为空|文件读取失败|PDF提取失败|图片中未识别到文字)/.test(text))) {
                        readFailed = true;
                        failReason = text && text.length ? text.replace(/^[【\[]|[】\]]$/g, '').slice(0, 80) : '文件内容为空';
                    }
                    if (readFailed) {
                        // 明确告知用户并中止 —— 不要把占位文本当成案件材料送去评查，
                        // 否则生成的报告会通篇是"无法读取"，完全失去意义。
                        showProgress(0, '读取失败');
                        setStatus('文件读取失败');
                        var stEl = document.getElementById('fileReadStatus');
                        if (stEl) {
                            stEl.textContent = '❌ ' + file.name + ' 读取失败';
                            stEl.classList.add('text-red-400');
                        }
                        alert('【' + file.name + '】读取失败：' + failReason +
                            '\n\n可能原因：\n• 文件已加密或损坏\n• 扫描件为图片格式（可尝试"上传现场照片（OCR）"）\n• 网络较慢，OCR 引擎尚未就绪\n\n' +
                            '建议：把笔录内容复制粘贴到下方「补充案件描述」输入框，也可另存为 Word/TXT 后重试。');
                        return;
                    }

                    // 截断太长内容
                    if (text.length > MAX_LEN) {
                        text = text.substring(0, MAX_LEN) + '\n...[内容过长，已截断]';
                    }

                    fileInfo += `【文件${i+1}: ${file.name}】\n${text}\n`;

                    // 更新状态
                    var stEl2 = document.getElementById('fileReadStatus');
                    if (stEl2) {
                        stEl2.textContent = '已读取 ' + text.length + ' 字';
                        stEl2.classList.remove('text-red-400');
                    }

                    // 检测是否是询问笔录（文件名+内容双重检测）
                    const isInquiry = /询问|笔录|询话/i.test(file.name) ||
                        /被询问人|询问人|询问时间|询问地点|询问室/i.test(text);
                    if (isInquiry) {
                        fileInfo += '\n【重要】该材料为询问笔录，请按照询问笔录规范进行重点审查！\n';
                    }
                }
            }
            
            // 合并文件内容与手工补充描述（两者都保留，避免补充信息丢失）
            const allContent = (fileInfo && content)
                ? fileInfo + '\n【补充案件描述】\n' + content + '\n'
                : (fileInfo || content);
            if (!allContent) return alert('请输入案件内容或上传文件');

            // 等待法典数据就绪（最多 8 秒），确保评查能引用准确条文
            if (!CODEX) {
                setStatus('正在加载法典数据…');
                showProgress(45, '加载法典数据...');
                var okData = await CODEX_SYNC_WAIT();
                if (!okData) console.warn('法典数据未就绪，继续生成（报告将缺少条文引用）');
            }
            
            console.log('发送内容长度:', allContent.length); // 调试

            document.getElementById('status').classList.remove('hidden');
            showProgress(50, '正在生成AI评查报告...');
            setStatus('AI分析中...');
            document.getElementById('reportSection').classList.add('hidden');

            try {
                showProgress(60, '连接AI服务...');

                // 未配置 Key 时直接给出明确提示
                if (!CONFIG.API_KEY || CONFIG.API_KEY.trim() === '') {
                    alert('未配置 API Key！\n请到右上角 ⚙ 设置中填写并保存 API Key。');
                    openSettings();
                    return;
                }

                // 构建请求
                const headers = { 'Content-Type': 'application/json' };
                if (CONFIG.IS_ANTHROPIC) {
                    headers['x-api-key'] = CONFIG.API_KEY;
                    headers['anthropic-version'] = '2023-06-01';
                } else {
                    headers['Authorization'] = 'Bearer ' + CONFIG.API_KEY;
                }

                // 兜底：检查 header 里的非 ASCII 字符（防止 API Key 含中文/全角字符触发 ISO-8859-1 报错）
                for (const k of Object.keys(headers)) {
                    if (/[^\x00-\xFF]/.test(headers[k])) {
                        alert('API Key 含有非 ASCII 字符，请检查设置中的 Key（不要包含中文/emoji）。');
                        return;
                    }
                }
                
                const requestBody = CONFIG.IS_ANTHROPIC ? {
                    model: CONFIG.MODEL,
                    max_tokens: 4096,
                    system: buildLegalSystemPrompt(allContent),
                    messages: [{ role: 'user', content: '【案件内容】\n' + allContent + '\n\n请生成详细的专业评查报告。' }]
                } : {
                    model: CONFIG.MODEL,
                    messages: [
                        { role: 'system', content: buildLegalSystemPrompt(allContent) },
                        { role: 'user', content: '【案件内容】\n' + allContent + '\n\n请生成详细的专业评查报告。' }
                    ]
                };
                
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    const errMsg = errBody.error?.message || errBody.base_resp?.status_msg || ('HTTP ' + response.status);
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('API Key 无效或过期 (HTTP ' + response.status + ')\n\n请到 ⚙ 设置中检查并更新 API Key。\n\n服务器返回：' + errMsg);
                    }
                    throw new Error('API 请求失败 (HTTP ' + response.status + ')：' + errMsg);
                }
                
                const data = await response.json();
                showProgress(70, 'AI分析中...');
                console.log('API响应:', data);
                
                let reportContent = '';
                if (CONFIG.IS_ANTHROPIC) {
                    if (data.content && data.content[0]) {
                        reportContent = data.content[0].text;
                    } else {
                        throw new Error('API返回格式错误');
                    }
                } else if (data.choices && data.choices[0]) {
                    reportContent = data.choices[0].message?.content || '';
                } else {
                    throw new Error(data.base_resp?.status_msg || 'API返回格式错误');
                }
                
                const now = new Date();
                const reportDate = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
                reportText = reportContent + '\n\n--- 评查日期：' + reportDate + ' ---';
                    
                    // 显示报告（根据是否开启高亮）
                    renderReportContent();
                    
                    document.getElementById('reportSection').classList.remove('hidden');
                    showProgress(100, '完成');
                    setStatus('评查报告生成完成');

                    // 保存到历史记录
                    saveHistory(content || (uploadedFiles.length > 0 ? uploadedFiles.map(f=>f.name).join('、') : ''), reportText, reportDate);

                    // 显示返回按钮
                    document.getElementById('backToMain').style.display = 'flex';
            } catch (e) {
                console.error('生成错误:', e);
                alert('生成失败: ' + e.message);
            }

            document.getElementById('status').classList.add('hidden');
            hideProgress();
        }

        // ============ 关键字高亮功能 ============
        function renderReportContent() {
            const reportEl = document.getElementById('reportContent');
            if (highlightEnabled) {
                // 1. 转义 → 2. 包装条文引用 → 3. 应用关键字高亮
                let html = escapeHtml(reportText);
                html = wrapArticleRefs(html);
                html = applyKeywordHighlights(html);
                reportEl.innerHTML = html;
                reportEl.classList.remove('whitespace-pre-wrap');
            } else {
                reportEl.textContent = reportText;
                reportEl.classList.add('whitespace-pre-wrap');
            }
        }

        // 仅应用关键字高亮（输入已是转义后的HTML片段）
        function applyKeywordHighlights(html) {
            const blueKeywords = KEYWORDS.legal.join('|');
            html = html.replace(new RegExp('([' + blueKeywords + '])([^\\s])', 'g'), '<span class="highlight-info">$1$2</span>');
            const redKeywords = KEYWORDS.risk.join('|');
            html = html.replace(new RegExp('(' + redKeywords + ')', 'g'), '<span class="highlight-danger">$1</span>');
            const yellowKeywords = KEYWORDS.important.join('|');
            html = html.replace(new RegExp('(' + yellowKeywords + ')', 'g'), '<span class="highlight-keyword">$1</span>');
            html = html.replace(/\n/g, '<br>');
            return html;
        }

        // 包装条文引用为可点击链接（点击跳转到法典查询）
        function wrapArticleRefs(html) {
            return html.replace(/第([一二三四五六七八九十百千零〇两]+)条/g, function(match, num) {
                const tiao = '第' + num + '条';
                return '<a href="#" class="codex-link" onclick="event.preventDefault();openCodexAt(\'' + tiao + '\')">' + match + '</a>';
            });
        }

        // ============ Word格式化功能 =============
        function formatReportForWord(text) {
            if (!text) return '<p></p>';
            
            const lines = text.split('\n').filter(line => line.trim());
            let html = '';
            let inList = false;
            
            // 正则匹配章节标题
            const sectionRegex = /^([（(]?[一二三四五六七八九十\d]+[）)]?)[.、.\s]+(.+)/;
            const bulletRegex = /^[-•·]\s+(.+)/;
            const numListRegex = /^(\d+)[.、]\s+(.+)/;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;
                
                const trimmedLine = line.replace(/^[\s\u3000　]+/g, '');
                
                // 检测是否为章节标题
                let isSection = false;
                if (/^[一二三四五六七八九十]+[、]/.test(trimmedLine) || 
                    /^[\(（]?[一二三四五六七八九十]+[\)）]/.test(trimmedLine) ||
                    /^\d+[.、]/.test(trimmedLine)) {
                    isSection = true;
                }
                
                if (isSection) {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += `<h2>${escapeHtml(trimmedLine)}</h2>`;
                } else if (bulletRegex.test(trimmedLine) || numListRegex.test(trimmedLine)) {
                    if (!inList) { html += '<ul>'; inList = true; }
                    const content = trimmedLine.replace(bulletRegex, '$1').replace(numListRegex, '$1');
                    html += `<li>${escapeHtml(content)}</li>`;
                } else {
                    if (inList) { html += '</ul>'; inList = false; }
                    html += `<p>${escapeHtml(trimmedLine)}</p>`;
                }
            }
            
            if (inList) html += '</ul>';
            return html || '<p>' + escapeHtml(text) + '</p>';
        }

        function highlightKeywords(text) {
            let html = escapeHtml(text);
            
            // 首先处理蓝色关键字（法律条文）- 最后处理，避免被其他高亮覆盖
            const blueKeywords = KEYWORDS.legal.join('|');
            html = html.replace(new RegExp('([' + blueKeywords + '])([^\\s])', 'g'), '<span class="highlight-info">$1$2</span>');
            
            // 处理红色关键字（风险/问题）
            const redKeywords = KEYWORDS.risk.join('|');
            html = html.replace(new RegExp('(' + redKeywords + ')', 'g'), '<span class="highlight-danger">$1</span>');
            
            // 处理黄色关键字（重要信息）
            const yellowKeywords = KEYWORDS.important.join('|');
            html = html.replace(new RegExp('(' + yellowKeywords + ')', 'g'), '<span class="highlight-keyword">$1</span>');
            
            // 换行处理
            html = html.replace(/\n/g, '<br>');
            
            return html;
        }

        function escapeHtml(str) {
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function toggleHighlight() {
            highlightEnabled = !highlightEnabled;
            const btn = document.getElementById('highlightBtn');
            if (highlightEnabled) {
                btn.classList.remove('bg-purple-600');
                btn.classList.add('bg-yellow-600');
                btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>取消高亮';
            } else {
                btn.classList.remove('bg-yellow-600');
                btn.classList.add('bg-purple-600');
                btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>关键字高亮';
            }
            renderReportContent();
        }

        function copyReport() { navigator.clipboard.writeText(reportText).then(() => alert('已复制')); }
        
        function downloadReport(type) {
            const now = new Date();
            const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
            
            let blob, fileName;
            
            if (type === 'doc') {
                // ... (保持不变)
                const formattedContent = formatReportForWord(reportText);
                const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>案件评查报告</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    font-family: "宋体", "SimSun", serif; 
    font-size: 12pt; 
    line-height: 1.8; 
    padding: 40pt 50pt 40pt 60pt; 
    color: #000;
}
.title {
    font-size: 22pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 30pt;
    padding-bottom: 15pt;
    border-bottom: 2px solid #333;
}
.subtitle {
    font-size: 14pt;
    text-align: center;
    margin-bottom: 25pt;
    color: #666;
}
h2 {
    font-size: 14pt;
    font-weight: bold;
    margin-top: 20pt;
    margin-bottom: 12pt;
    color: #1a365d;
    border-left: 4px solid #1a365d;
    padding-left: 10pt;
}
h3 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 15pt;
    margin-bottom: 10pt;
    color: #2d3748;
}
p {
    margin-bottom: 8pt;
    text-indent: 0pt;
}
ul {
    margin-left: 20pt;
    margin-bottom: 10pt;
}
li {
    margin-bottom: 6pt;
    margin-left: 10pt;
    list-style-type: disc;
}
.content { 
    white-space: pre-wrap; 
    word-wrap: break-word;
}
.footer {
    margin-top: 40pt;
    padding-top: 15pt;
    border-top: 1px solid #ccc;
    font-size: 10pt;
    color: #888;
    text-align: center;
}
.disclaimer {
    margin-top: 30pt;
    padding: 12pt;
    background: #f5f5f5;
    border: 1px solid #ddd;
    font-size: 10pt;
    color: #666;
}
@media print {
    body { padding: 0; }
}
</style>
</head>
<body>
<h1 class="title">案件评查报告</h1>
<p class="subtitle">AI智能案件分析与评查</p>
<div class="content">${formattedContent}</div>
<div class="disclaimer">
    <strong>免责声明：</strong>本报告仅供参考，不作为正式法律意见。分析结果基于案件材料和法律规定生成，仅供内部参考使用。
</div>
<div class="footer">
    联系QQ：7879113 | 生成时间：${dateStr}
</div>
</body>
</html>`;
                blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
                fileName = '案件评查报告_' + dateStr + '_' + timeStr + '.doc';
            } else if (type === 'pdf') {
                // PDF导出
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('a4', 'mm', 'a4');
                const pageWidth = 190;
                const pageHeight = 297;
                const margin = 20;
                const lineHeight = 7;
                let y = margin;
                
                // 标题
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('案件评查报告', 105, y, { align: 'center' });
                y += 12;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(100);
                doc.text('AI智能案件分析与评查', 105, y, { align: 'center' });
                y += 15;
                
                doc.setTextColor(0);
                
                // 报告正文（自动分页）
                const lines = reportText.split('\n');
                const tempDiv = document.createElement('div');
                
                for (const line of lines) {
                    if (!line.trim()) {
                        y += lineHeight;
                        continue;
                    }
                    
                    // 检测章节标题
                    const isTitle = /^[一二三四五六七八九十]+[、]/.test(line.trim()) || 
                                  /^\d+[.、]/.test(line.trim()) ||
                                  /^[（(]\d+[）)]/.test(line.trim());
                    
                    if (isTitle) {
                        doc.setFont(undefined, 'bold');
                        y += 3;
                    }
                    
                    // 处理超长行
                    const maxWidth = pageWidth - margin * 2;
                    const wrappedLines = doc.splitTextToSize(line, maxWidth);
                    
                    for (const wl of wrappedLines) {
                        if (y > pageHeight - margin) {
                            doc.addPage();
                            y = margin;
                        }
                        doc.text(wl, margin, y);
                        y += lineHeight;
                    }
                    
                    doc.setFont(undefined, 'normal');
                }
                
                // 页脚
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text(`联系QQ：7879113 | 生成时间：${dateStr}`, 105, pageHeight - 10, { align: 'center' });
                    doc.text(`第 ${i} / ${totalPages} 页`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                }
                
                blob = doc.output('blob');
                fileName = '案件评查报告_' + dateStr + '_' + timeStr + '.pdf';
            } else {
                // TXT格式
                blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                fileName = '案件评查报告_' + dateStr + '_' + timeStr + '.txt';
            }
            
            // ============ 移动端文件保存 ============
            async function saveFileMobile(blob, fileName) {
                // 方法1: 尝试 Capacitor (如使用Capacitor打包的APK)
                if (window.Capacitor && window.Capacitor.isNative) {
                    try {
                        const { Filesystem, Directory } = window.Capacitor.Plugins || window.Capacitor;
                        if (Filesystem) {
                            const base64 = await blobToBase64(blob);
                            await Filesystem.writeFile({
                                path: fileName,
                                data: base64,
                                directory: Directory.Documents
                            });
                            alert('已保存到: ' + fileName);
                            return true;
                        }
                    } catch(e) { console.log('Capacitor保存失败:', e); }
                }
                
                // 方法2: 尝试 Cordova
                if (window.cordova && window.cordova.file) {
                    try {
                        const base64 = await blobToBase64(blob);
                        const dirEntry = await new Promise((resolve, reject) => {
                            window.cordova.file.resolveDirectory(window.cordova.file.documentsDirectory, resolve, reject);
                        });
                        const fileEntry = await new Promise((resolve, reject) => {
                            dirEntry.getFile(fileName, { create: true }, resolve, reject);
                        });
                        await new Promise((resolve, reject) => {
                            fileEntry.createWriter(resolve, reject);
                        }).then(writer => {
                            writer.write(blob);
                        });
                        alert('已保存到: ' + fileName);
                        return true;
                    } catch(e) { console.log('Cordova保存失败:', e); }
                }
                
                // 方法3: Android分享Intent (通过自定义协议)
                if (/Android/i.test(navigator.userAgent)) {
                    const base64 = await blobToBase64(blob);
                    // 尝试通过Intent协议保存
                    try {
                        const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 
                                      fileName.endsWith('.doc') ? 'application/msword' : 'text/plain';
                        // 使用自定义协议唤起原生应用
                        window.location = 'intent://save?filename=' + encodeURIComponent(fileName) + '&mime=' + encodeURIComponent(mimeType) + '#Intent;scheme=aisave;package=com.aiplugin.save;end';
                    } catch(e) {}
                }
                
                // 方法4: 回退到传统方式 (可能在部分Android浏览器有效)
                return false;
            }
            
            // Blob转Base64辅助函数
            function blobToBase64(blob) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
            
            // 根据环境选择保存方式
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) {
                saveFileMobile(blob, fileName).then(success => {
                    if (!success) {
                        // 最后尝试: 使用隐藏的iframe方式
                        try {
                            const url = URL.createObjectURL(blob);
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = url;
                            document.body.appendChild(iframe);
                            setTimeout(() => {
                                if (document.getElementById('downloadFrame')) {
                                    document.getElementById('downloadFrame').remove();
                                }
                                iframe.id = 'downloadFrame';
                                // 提示用户手动下载
                                alert('请长按屏幕或点击右上角菜单另存为: ' + fileName);
                            }, 1000);
                        } catch(e) {
                            alert('无法自动保存，请手动长按屏幕选择"另存为": ' + fileName);
                        }
                    }
                });
            } else {
                // 桌面端
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                a.click();
            }
        }

        // ============ 打印功能 ============
        function printReport() {
            const printWindow = window.open('', '_blank');
            const now = new Date();
            const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>案件评查报告 - 打印</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: "宋体", serif; font-size: 12pt; line-height: 1.8; padding: 20mm; color: #000; }
                        h1 { font-size: 18pt; text-align: center; margin-bottom: 10pt; }
                        .subtitle { text-align: center; color: #666; margin-bottom: 20pt; }
                        .content { white-space: pre-wrap; text-align: justify; }
                        .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; text-align: center; color: #888; font-size: 10pt; }
                    </style>
                </head>
                <body>
                    <h1>案件评查报告</h1>
                    <p class="subtitle">AI智能案件分析与评查 - ${dateStr}</p>
                    <div class="content">${escapeHtml(reportText)}</div>
                    <div class="footer">联系QQ：7879113</div>
                    <script>window.onload = function() { window.print(); window.close(); }<\/script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        // ============ 返回主页面 ============
        function backToMainView() {
            document.getElementById('reportSection').classList.add('hidden');
            document.getElementById('backToMain').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ============ 历史记录 ============
        const HISTORY_KEY = 'ai_case_history';

        function getHistory() {
            try {
                return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            } catch { return []; }
        }

        function saveHistory(caseDesc, report, date) {
            const history = getHistory();
            const title = caseDesc.length > 40 ? caseDesc.substring(0, 40) + '...' : (caseDesc || '未命名案件');
            history.unshift({
                id: Date.now(),
                title: title,
                date: date,
                report: report
            });
            // 最多保存50条
            if (history.length > 50) history.pop();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }

        function openHistory() {
            const history = getHistory();
            const listEl = document.getElementById('historyList');
            const emptyEl = document.getElementById('historyEmpty');

            if (history.length === 0) {
                listEl.innerHTML = '';
                emptyEl.classList.remove('hidden');
            } else {
                emptyEl.classList.add('hidden');
                listEl.innerHTML = history.map(item => `
                    <div class="history-item" onclick="loadHistoryItem(${item.id})">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-white truncate">${escapeHtml(item.title)}</p>
                                <p class="text-xs text-slate-400 mt-1">📅 ${item.date}</p>
                            </div>
                            <button onclick="event.stopPropagation();deleteHistoryItem(${item.id})" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-900/20 rounded border border-red-700/30 flex-shrink-0">删除</button>
                        </div>
                    </div>
                `).join('');
            }

            document.getElementById('historyPanel').classList.add('active');
        }

        function closeHistory() {
            document.getElementById('historyPanel').classList.remove('active');
        }

        function loadHistoryItem(id) {
            const history = getHistory();
            const item = history.find(h => h.id === id);
            if (!item) return;

            reportText = item.report;
            renderReportContent();
            document.getElementById('reportSection').classList.remove('hidden');
            document.getElementById('backToMain').style.display = 'flex';
            closeHistory();
            setTimeout(() => {
                document.getElementById('reportSection').scrollIntoView({ behavior: 'smooth' });
            }, 200);
        }

        function deleteHistoryItem(id) {
            let history = getHistory();
            history = history.filter(h => h.id !== id);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            openHistory();
        }

        function clearAllHistory() {
            if (!confirm('确定清空所有历史记录？此操作不可恢复！')) return;
            localStorage.removeItem(HISTORY_KEY);
            openHistory();
        }

        // ============ 生态环境法典查询系统 ============
        const CODEX_FAV_KEY = 'codex_favorites';
        const CODEX_AI_KEY = 'codex_ai_history';
        let CODEX = null;
        let codexCurrentTab = 'search';
        let codexFavorites = [];

        // ----- 法典数据解析 -----
        function parseCodex(rawText) {
            const marker = '第一编 总则';
            const firstIdx = rawText.indexOf(marker);
            if (firstIdx === -1) return null;
            const secondIdx = rawText.indexOf(marker, firstIdx + marker.length);
            const startIdx = secondIdx === -1 ? firstIdx : secondIdx;
            const text = rawText.substring(startIdx);

            const CN = '[一二三四五六七八九十百千零〇两]+';
            const BOOK_RE = new RegExp('^第(' + CN + ')编\\s+(.+)$');
            const SUBBOOK_RE = new RegExp('^第(' + CN + ')分编\\s+(.+)$');
            const CHAPTER_RE = new RegExp('^第(' + CN + ')章\\s+(.+)$');
            const SECTION_RE = new RegExp('^第(' + CN + ')节\\s+(.+)$');
            const ARTICLE_RE = new RegExp('^第(' + CN + ')条(.*)$');

            const articles = [];
            const byNum = {};
            let book = '', subbook = '', chapter = '', section = '';
            let currentArticle = null;

            function flushArticle() {
                if (currentArticle) {
                    articles.push(currentArticle);
                    byNum[currentArticle.num] = currentArticle;
                    currentArticle = null;
                }
            }

            for (const rawLine of text.split('\n')) {
                const line = rawLine.trim();
                if (!line) continue;
                let m;
                if ((m = line.match(SUBBOOK_RE))) {
                    flushArticle(); subbook = line; chapter = ''; section = '';
                } else if ((m = line.match(BOOK_RE))) {
                    flushArticle(); book = line; subbook = ''; chapter = ''; section = '';
                } else if ((m = line.match(CHAPTER_RE))) {
                    flushArticle(); chapter = line; section = '';
                } else if ((m = line.match(SECTION_RE))) {
                    flushArticle(); section = line;
                } else if ((m = line.match(ARTICLE_RE))) {
                    flushArticle();
                    const tiaoIdx = line.indexOf('条');
                    currentArticle = {
                        num: line.substring(0, tiaoIdx + 1),
                        book, subbook, chapter, section,
                        content: line.substring(tiaoIdx + 1).trim(),
                        interpretation: (typeof codexInterpretations !== 'undefined' && codexInterpretations[line.substring(0, tiaoIdx + 1)]) || ''
                    };
                } else {
                    if (currentArticle) currentArticle.content += '\n' + line;
                }
            }
            flushArticle();

            const tree = [];
            let curBook = null;
            for (const a of articles) {
                if (!curBook || curBook.name !== a.book) {
                    curBook = { name: a.book, articles: [], subbooks: [] };
                    tree.push(curBook);
                }
                if (a.subbook) {
                    let sb = curBook.subbooks.find(s => s.name === a.subbook);
                    if (!sb) { sb = { name: a.subbook, articles: [] }; curBook.subbooks.push(sb); }
                    sb.articles.push(a);
                } else {
                    curBook.articles.push(a);
                }
            }
            return { articles, byNum, tree, bookNames: tree.map(b => b.name), totalCount: articles.length };
        }

        // ----- 视图切换 -----
                function showCodexView() {
            document.body.classList.add('codex-mode');
            if (!CODEX) {
                showCodexLoading(true);
                initCodex().then(function(codex) {
                    showCodexLoading(false);
                    if (codex) renderCodexTree();
                });
            }
            // 同步主题按钮状态
            var ct = document.getElementById('codexThemeText');
            if (ct) ct.textContent = isLightTheme ? '夜晚' : '白天';
        }

        function showCodexLoading(on) {
            var el = document.getElementById('codexLoadingHint');
            if (el) el.style.display = on ? 'flex' : 'none';
            var tree = document.getElementById('codexTree');
            if (tree && on && !tree.innerHTML.trim()) {
                tree.innerHTML = '<div class="text-xs text-slate-400 text-center py-8">法典数据加载中…</div>';
            }
        }

        // 启动法典数据的后台预加载（不阻塞 UI），带进度反馈
        function prefetchCodexData() {
            if (CODEX || CODEX_LOADING) return;
            var el = document.getElementById('codexLoadingHint');
            var tree = document.getElementById('codexTree');
            var tip = el ? el.querySelector('[data-tip]') : null;
            var started = Date.now();
            var t = setInterval(function() {
                if (CODEX) { clearInterval(t); return; }
                var sec = Math.round((Date.now() - started) / 1000);
                var tip2 = document.getElementById('codexLoadingHint');
                var tipEl = tip2 ? tip2.querySelector('[data-tip]') : null;
                if (tipEl) tipEl.textContent = '法典数据加载中…（已等待 ' + sec + ' 秒，GitHub Pages 首次加载较慢）';
                if (sec > 8) {
                    var tr = document.getElementById('codexTree');
                    if (tr && tr.innerHTML.indexOf('加载中') >= 0) {
                        tr.innerHTML = '<div class="text-xs text-slate-400 text-center py-8 leading-relaxed">' +
                            '法典数据仍在加载…<br><span class="text-[11px] text-slate-300">' +
                            '（GitHub Pages 在国内带宽较低，全量法典约需 1.8MB）<br>您可以先使用「案件评查」功能，加载完成后法典检索自动可用</span></div>';
                    }
                }
            }, 1000);
            loadCodexData().then(function(ok) {
                clearInterval(t);
                if (ok) {
                    initCodex().then(function(codex) {
                        showCodexLoading(false);
                        if (codex) renderCodexTree();
                    });
                } else {
                    showCodexLoading(false);
                    var tree2 = document.getElementById('codexTree');
                    if (tree2 && !CODEX) {
                        tree2.innerHTML = '<div class="text-xs text-amber-300 text-center py-8">法典数据加载失败，请检查网络后刷新重试</div>';
                    }
                }
            });
        }
        function showMainView() {
            document.body.classList.remove('codex-mode');
        }

        // ----- 初始化（法典数据异步加载）-----
        var CODEX_INIT_PROMISE = null;

        function initCodex() {
            if (CODEX_INIT_PROMISE) return CODEX_INIT_PROMISE;
            CODEX_INIT_PROMISE = loadCodexData().then(function(ok) {
                if (!ok) {
                    console.error('法典数据加载失败');
                    var cnt = document.getElementById('codexArticleCount');
                    if (cnt) cnt.textContent = '加载失败';
                    return null;
                }
                if (CODEX) return CODEX;
                try {
                    CODEX = parseCodex(policyDatabase);
                    if (!CODEX) { console.error('法典解析失败'); return null; }
                    var ac = document.getElementById('codexArticleCount');
                    var bc = document.getElementById('codexBookCount');
                    if (ac) ac.textContent = CODEX.totalCount;
                    if (bc) bc.textContent = CODEX.tree.length;
                    var filter = document.getElementById('codexBookFilter');
                    if (filter && !filter.dataset.filled) {
                        filter.dataset.filled = '1';
                        CODEX.bookNames.forEach(function(name) {
                            var opt = document.createElement('option');
                            opt.value = name; opt.textContent = name;
                            filter.appendChild(opt);
                        });
                    }
                    renderCodexTree();
                    try { codexFavorites = JSON.parse(localStorage.getItem(CODEX_FAV_KEY) || '[]'); }
                    catch (e2) { codexFavorites = []; }
                    window.__CODEX_READY = true;
                    document.dispatchEvent(new CustomEvent('codexReady'));
                    return CODEX;
                } catch (e) {
                    console.error('initCodex 错误:', e);
                    return null;
                }
            });
            return CODEX_INIT_PROMISE;
        }

        // ----- Tab 切换 -----
        function switchCodexTab(tab) {
            codexCurrentTab = tab;
            document.getElementById('codexSearchPanel').style.display = tab === 'search' ? 'block' : 'none';
            document.getElementById('codexBrowsePanel').style.display = tab === 'browse' ? 'block' : 'none';
            document.getElementById('codexAIPanel').style.display = tab === 'ai' ? 'block' : 'none';
            document.getElementById('codexTabSearchBtn').classList.toggle('active', tab === 'search');
            document.getElementById('codexTabBrowseBtn').classList.toggle('active', tab === 'browse');
            document.getElementById('codexTabAIBtn').classList.toggle('active', tab === 'ai');
        }

        // ----- 中文数字转阿拉伯数字 -----
        function chineseNumToInt(str) {
            const d = {'零':0, '〇':0, '一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '两':2};
            let result = 0, current = 0;
            for (const c of str) {
                if (c === '十') { if (current === 0) current = 1; result += current * 10; current = 0; }
                else if (c === '百') { result += current * 100; current = 0; }
                else if (c === '千') { result += current * 1000; current = 0; }
                else if (c in d) current = d[c];
            }
            result += current;
            return result || null;
        }

        // ----- 关键词搜索 -----
        function doCodexSearch() {
            try {
                if (!CODEX) initCodex();
                if (!CODEX || !CODEX.articles || CODEX.articles.length === 0) {
                    // 数据仍在下载：等待加载完成后自动重试，而不是直接报错
                    var resultsEl0 = document.getElementById('codexSearchResults');
                    if (resultsEl0) {
                        resultsEl0.innerHTML = '<div class="text-center text-blue-300 py-8">' +
                            '<div class="spinner w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"></div>' +
                            '法典数据加载中，请稍候…<br><span class="text-xs text-slate-400">加载完成后会自动显示结果</span></div>';
                    }
                    showCodexLoading(true);
                    var waitStart = Date.now();
                    var poll = setInterval(function() {
                        if (CODEX) {
                            clearInterval(poll);
                            showCodexLoading(false);
                            doCodexSearch();
                        } else if (Date.now() - waitStart > 120000) {
                            clearInterval(poll);
                            if (resultsEl0) {
                                resultsEl0.innerHTML = '<div class="text-center text-amber-300 py-8">⚠️ 法典数据加载超时，请检查网络后刷新重试</div>';
                            }
                            showCodexLoading(false);
                        }
                    }, 500);
                    return;
                }
                const query = document.getElementById('codexSearchInput').value.trim();
                const bookFilter = document.getElementById('codexBookFilter').value;
                const resultsEl = document.getElementById('codexSearchResults');

                if (!query) {
                    resultsEl.innerHTML = '<div class="text-center text-slate-400 py-8">请输入搜索关键词</div>';
                    return;
                }

                const queryNum = chineseNumToInt(query.replace(/^第/, '').replace(/条$/, ''));
                // 阿拉伯数字查询支持：如 83 / 第83 / 第83条 / 83条
                const arabicQueryMatch = query.match(/^第?(\d+)(条)?$/);
                const arabicQueryNum = arabicQueryMatch ? parseInt(arabicQueryMatch[1], 10) : null;
                const results = [];

                for (const art of CODEX.articles) {
                    if (bookFilter && art.book !== bookFilter) continue;
                    let score = 0;
                    let snippet = '';

                    // 条文号精确匹配（最高优先级）
                    const strippedQ = query.replace(/^第/, '').replace(/条$/, '');
                    if (art.num === ('第' + strippedQ + '条') ||
                        art.num === ('第' + query + '条') ||
                        art.num === query) {
                        score = 100000;
                    } else if (queryNum) {
                        const artNum = chineseNumToInt(art.num.replace(/^第/, '').replace(/条$/, ''));
                        if (artNum === queryNum) score = 100000;
                    } else if (arabicQueryNum !== null) {
                        // 阿拉伯数字条文号匹配：art.num 是中文数字"第八十三条"，转成数字后比较
                        const artNumInt = chineseNumToInt(art.num.replace(/^第/, '').replace(/条$/, ''));
                        if (artNumInt === arabicQueryNum) score = 100000;
                    }

                    if (score === 0) {
                        const content = art.content;
                        let idx = 0;
                        let count = 0;
                        while ((idx = content.indexOf(query, idx)) !== -1) {
                            count++;
                            idx += query.length;
                        }
                        if (count > 0) {
                            score = count * 10;
                            if (art.chapter && art.chapter.includes(query)) score += 30;
                            if (art.section && art.section.includes(query)) score += 20;
                            const mIdx = content.indexOf(query);
                            const start = Math.max(0, mIdx - 30);
                            const end = Math.min(content.length, mIdx + query.length + 100);
                            snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
                        }
                    } else {
                        snippet = art.content.substring(0, 180) + (art.content.length > 180 ? '...' : '');
                    }

                    if (score > 0) results.push({ art, score, snippet });
                }

                results.sort((a, b) => b.score - a.score);
                const top = results.slice(0, 80);

                if (top.length === 0) {
                    resultsEl.innerHTML = '<div class="text-center text-slate-400 py-8">未找到匹配条文，请换个关键词试试（已搜索 ' + CODEX.articles.length + ' 条）</div>';
                    return;
                }

                let html = '<div class="codex-search-stats">共找到 <strong class="text-amber-400">' + results.length + '</strong> 条匹配，显示前 ' + top.length + ' 条</div>';
                for (const r of top) {
                    const isFav = codexFavorites.includes(r.art.num);
                    html += '<div class="codex-result-card" onclick="openCodexAt(\'' + r.art.num + '\')">';
                    html += '<div class="flex items-center justify-between flex-wrap gap-2">';
                    html += '<span class="codex-result-num">' + escapeHtml(r.art.num) + '</span>';
                    if (r.art.chapter) html += '<span class="codex-result-meta">' + escapeHtml(r.art.chapter) + '</span>';
                    if (r.art.section) html += '<span class="codex-result-meta">' + escapeHtml(r.art.section) + '</span>';
                    html += '<button onclick="event.stopPropagation();toggleCodexFav(\'' + r.art.num + '\', this)" class="codex-fav-btn ' + (isFav ? 'is-fav' : '') + ' text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white">' + (isFav ? '★ 已收藏' : '☆ 收藏') + '</button>';
                    html += '</div>';
                    html += '<div class="codex-result-content">' + highlightCodexContent(r.snippet, query) + '</div>';
                    if (r.art.interpretation && r.art.interpretation.includes(query)) {
                        html += '<div class="codex-result-interpretation">📖 ' + highlightCodexContent(r.art.interpretation.substring(0, 120) + (r.art.interpretation.length > 120 ? '...' : ''), query) + '</div>';
                    }
                    html += '</div>';
                }
                resultsEl.innerHTML = html;
            } catch (err) {
                console.error('doCodexSearch 出错:', err);
                const resultsEl = document.getElementById('codexSearchResults');
                if (resultsEl) {
                    resultsEl.innerHTML = '<div class="text-center text-red-300 py-8">❌ 搜索出错: ' + escapeHtml(err.message || String(err)) + '<br><br>请打开浏览器控制台 (F12) 查看详细信息</div>';
                }
            }
        }

        function highlightCodexContent(text, keyword) {
            if (!keyword) return escapeHtml(text);
            const escaped = escapeHtml(text);
            const safeKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            try {
                return escaped.replace(new RegExp(safeKw, 'g'), '<span class="codex-mark">$&</span>');
            } catch (e) {
                return escaped;
            }
        }

        // ----- 章节树渲染 -----
        function renderCodexTree() {
            const treeEl = document.getElementById('codexTree');
            let html = '';
            for (const book of CODEX.tree) {
                const cnt = book.articles.length + book.subbooks.reduce((s, sb) => s + sb.articles.length, 0);
                html += '<div class="codex-tree-node codex-tree-book" onclick="toggleCodexTreeNode(this)">';
                html += '<span class="codex-tree-toggle">▶</span>';
                html += '<span class="flex-1">' + escapeHtml(book.name) + ' <span class="text-xs text-slate-500">(' + cnt + ')</span></span>';
                html += '</div><div class="codex-tree-children">';
                for (const art of book.articles) html += renderArticleNode(art);
                for (const sub of book.subbooks) {
                    html += '<div class="codex-tree-node codex-tree-subbook" onclick="toggleCodexTreeNode(this)">';
                    html += '<span class="codex-tree-toggle">▶</span>';
                    html += '<span class="flex-1">' + escapeHtml(sub.name) + ' (' + sub.articles.length + ')</span>';
                    html += '</div><div class="codex-tree-children">';
                    for (const art of sub.articles) html += renderArticleNode(art);
                    html += '</div>';
                }
                html += '</div>';
            }
            treeEl.innerHTML = html;
        }

        function renderArticleNode(art) {
            const summary = art.content.substring(0, 40).replace(/\n/g, ' ');
            return '<div class="codex-tree-node codex-tree-article" onclick="event.stopPropagation();openCodexAt(\'' + art.num + '\')">' +
                '<span style="width:14px;flex-shrink:0"></span>' +
                '<span class="flex-1 truncate">' + escapeHtml(art.num) + ' ' + escapeHtml(summary) + (art.content.length > 40 ? '...' : '') + '</span>' +
                '</div>';
        }

        function toggleCodexTreeNode(el) {
            el.classList.toggle('expanded');
        }

        function expandAllCodexTree() {
            document.querySelectorAll('#codexTree .codex-tree-node').forEach(n => n.classList.add('expanded'));
        }

        // ----- 条文详情 -----
        function openCodexAt(num) {
            if (!CODEX) initCodex();
            if (!CODEX) return;
            const art = CODEX.byNum[num];
            if (!art) {
                alert('未找到条文：' + num);
                return;
            }
            showCodexView();
            switchCodexTab('browse');
            renderCodexArticle(art);
        }

        function renderCodexArticle(art) {
            const panel = document.getElementById('codexArticlePanel');
            const isFav = codexFavorites.includes(art.num);
            const idx = CODEX.articles.findIndex(a => a.num === art.num);
            const prev = idx > 0 ? CODEX.articles[idx - 1] : null;
            const next = idx < CODEX.articles.length - 1 ? CODEX.articles[idx + 1] : null;

            let meta = '';
            if (art.book) meta += '<span class="codex-result-meta">' + escapeHtml(art.book) + '</span>';
            if (art.subbook) meta += '<span class="codex-result-meta">' + escapeHtml(art.subbook) + '</span>';
            if (art.chapter) meta += '<span class="codex-result-meta">' + escapeHtml(art.chapter) + '</span>';
            if (art.section) meta += '<span class="codex-result-meta">' + escapeHtml(art.section) + '</span>';

            let nav = '';
            if (prev) nav += '<button onclick="openCodexAt(\'' + prev.num + '\')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">← ' + escapeHtml(prev.num) + '</button>';
            if (next) nav += '<button onclick="openCodexAt(\'' + next.num + '\')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">' + escapeHtml(next.num) + ' →</button>';

            panel.innerHTML = '<div class="codex-article-display">' +
                '<div class="article-meta">' + meta + '</div>' +
                '<div class="mb-3"><span class="article-num">' + escapeHtml(art.num) + '</span></div>' +
                '<div class="article-content">' + escapeHtml(art.content) + '</div>' +
                (function() {
                    const interp = art.interpretation;
                    if (!interp) {
                        return '<div class="article-interpretation-empty">📖 该条文暂无实操要点释义</div>';
                    }
                    return '<div class="article-interpretation" id="articleInterp_' + art.num.replace(/[^一-鿿]/g, '') + '">' +
                        '<div class="article-interpretation-header" onclick="this.parentElement.classList.toggle(\'collapsed\')">' +
                            '<span class="article-interpretation-title">📖 实操要点释义</span>' +
                            '<span class="article-interpretation-toggle"></span>' +
                        '</div>' +
                        '<div class="article-interpretation-body">' + escapeHtml(interp) + '</div>' +
                    '</div>';
                })() +
                '<div class="article-actions">' +
                    '<button onclick="toggleCodexFav(\'' + art.num + '\', this)" class="codex-fav-btn ' + (isFav ? 'is-fav' : '') + ' px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">' + (isFav ? '★ 已收藏' : '☆ 收藏') + '</button>' +
                    '<button onclick="copyCodexArticle(\'' + art.num + '\', this)" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white">复制条文</button>' +
                    '<button onclick="copyCodexCitation(\'' + art.num + '\', this)" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white">复制引文格式</button>' +
                    nav +
                '</div>' +
                '</div>';
            panel.scrollTop = 0;
        }

        function toggleCodexFav(num, btn) {
            const idx = codexFavorites.indexOf(num);
            if (idx >= 0) {
                codexFavorites.splice(idx, 1);
                if (btn) btn.classList.remove('is-fav');
            } else {
                codexFavorites.push(num);
                if (btn) btn.classList.add('is-fav');
            }
            localStorage.setItem(CODEX_FAV_KEY, JSON.stringify(codexFavorites));
            // 更新所有相关按钮文字
            document.querySelectorAll('.codex-fav-btn').forEach(b => {
                const m = b.getAttribute('onclick')?.match(/'([^']+)'/);
                if (m && m[1] === num) b.textContent = codexFavorites.includes(num) ? '★ 已收藏' : '☆ 收藏';
            });
        }

        function copyCodexArticle(num, btn) {
            const art = CODEX.byNum[num];
            if (!art) return;
            const text = art.num + ' ' + art.content;
            navigator.clipboard.writeText(text).then(() => flashBtn(btn, '✓ 已复制'));
        }

        function copyCodexCitation(num, btn) {
            const art = CODEX.byNum[num];
            if (!art) return;
            const text = '《中华人民共和国生态环境法典》' + art.num;
            navigator.clipboard.writeText(text).then(() => flashBtn(btn, '✓ 已复制'));
        }

        function flashBtn(btn, msg) {
            if (!btn) return;
            const old = btn.textContent;
            btn.textContent = msg;
            setTimeout(() => { btn.textContent = old; }, 1500);
        }

        // ----- AI 问答 -----
        async function askCodexAI() {
            if (!CODEX) initCodex();
            if (!CONFIG.API_KEY && !localStorage.getItem(SETTINGS_KEY)) {
                alert('请先在设置中配置 API Key');
                openSettings();
                return;
            }
            const question = document.getElementById('codexAIQuestion').value.trim();
            if (!question) return;

            const statusEl = document.getElementById('codexAIStatus');
            const askBtn = document.getElementById('codexAIAskBtn');
            statusEl.classList.remove('hidden');
            askBtn.disabled = true;
            const oldBtnText = askBtn.textContent;
            askBtn.textContent = '思考中...';

            const relevantArticles = findRelevantArticles(question, 6);
            let contextText = '';
            for (const a of relevantArticles) {
                contextText += '\n【' + a.num + '】' + a.content + '\n';
                if (a.interpretation) {
                    contextText += '  [实操要点释义]: ' + a.interpretation + '\n';
                }
            }

            const systemPrompt = '你是《中华人民共和国生态环境法典》智能助手。基于以下法典条文回答用户问题。\n\n要求：\n1. 回答必须有理有据，引用具体条文编号（如"第八十三条"）\n2. 在回答末尾用 [第X条] 格式列出所有引用的条文\n3. 如果问题超出法典范围，明确告知"该问题不在生态环境法典规定范围内"\n4. 简洁、准确、专业；不超过500字\n5. 用中文回答\n\n【相关条文】\n' + contextText;

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (CONFIG.IS_ANTHROPIC) {
                    headers['x-api-key'] = CONFIG.API_KEY;
                    headers['anthropic-version'] = '2023-06-01';
                } else {
                    headers['Authorization'] = 'Bearer ' + CONFIG.API_KEY;
                }
                for (const k of Object.keys(headers)) {
                    if (/[^\x00-\xFF]/.test(headers[k])) { alert('API Key 含非 ASCII 字符'); return; }
                }
                const requestBody = CONFIG.IS_ANTHROPIC ? {
                    model: CONFIG.MODEL,
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: question }]
                } : {
                    model: CONFIG.MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: question }
                    ]
                };
                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    const errMsg = errBody.error?.message || errBody.base_resp?.status_msg || ('HTTP ' + response.status);
                    if (response.status === 401 || response.status === 403) {
                        throw new Error('API Key 无效或过期 (HTTP ' + response.status + ')\n\n请到 ⚙ 设置中检查并更新 API Key。\n\n服务器返回：' + errMsg);
                    }
                    throw new Error('API 请求失败 (HTTP ' + response.status + ')：' + errMsg);
                }
                const data = await response.json();
                let answer = '';
                if (CONFIG.IS_ANTHROPIC) {
                    answer = data.content?.[0]?.text || '';
                } else {
                    answer = data.choices?.[0]?.message?.content || '';
                }
                if (!answer) throw new Error('AI 返回为空');

                const qa = { question, answer, articles: relevantArticles.map(a => a.num), time: new Date().toLocaleString('zh-CN') };
                appendCodexAIQA(qa);
                document.getElementById('codexAIQuestion').value = '';
            } catch (e) {
                alert('AI 问答失败: ' + e.message + '\n\n请检查：\n1. API Key 是否正确\n2. 网络是否可达\n3. AI 服务是否支持当前模型');
            } finally {
                statusEl.classList.add('hidden');
                askBtn.disabled = false;
                askBtn.textContent = oldBtnText;
            }
        }

        function findRelevantArticles(question, n) {
            // 清理标点，按词拆分（中文按字符，英文按词）
            const cleaned = question.replace(/[，。？、；：""''《》\.\?\!\,\;\:\"\']/g, ' ');
            const tokens = [];
            // 中文按 2-4 字滑动窗口
            for (let i = 0; i < cleaned.length; i++) {
                for (let len = 2; len <= 4; len++) {
                    if (i + len <= cleaned.length) {
                        const sub = cleaned.substring(i, i + len).trim();
                        if (sub && /[\u4e00-\u9fa5]/.test(sub)) tokens.push(sub);
                    }
                }
            }
            // 英文/数字按词
            cleaned.split(/\s+/).forEach(w => {
                if (w && w.length >= 2) tokens.push(w);
            });

            const scored = [];
            for (const art of CODEX.articles) {
                let score = 0;
                for (const t of tokens) {
                    if (art.content.includes(t)) score += 5;
                    if (art.chapter && art.chapter.includes(t)) score += 3;
                    if (art.section && art.section.includes(t)) score += 2;
                }
                if (score > 0) scored.push({ art, score });
            }
            scored.sort((a, b) => b.score - a.score);
            return scored.slice(0, n).map(s => s.art);
        }

        function appendCodexAIQA(qa) {
            const historyEl = document.getElementById('codexAIHistory');
            let answerHtml = escapeHtml(qa.answer);
            // 把 [第X条] 和 第X条 替换为可点击徽章
            answerHtml = answerHtml.replace(/\[?第([一二三四五六七八九十百千零〇两]+)条\]?/g, function(match, num) {
                const tiao = '第' + num + '条';
                if (CODEX.byNum[tiao]) {
                    return '<span class="codex-citation" onclick="openCodexAt(\'' + tiao + '\')">' + match + '</span>';
                }
                return match;
            });
            answerHtml = answerHtml.replace(/\n/g, '<br>');

            const html = '<div class="glass rounded-2xl p-5 space-y-3">' +
                '<div class="flex items-start gap-3">' +
                    '<div class="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">问</div>' +
                    '<div class="flex-1 text-white">' + escapeHtml(qa.question) + '</div>' +
                '</div>' +
                '<div class="flex items-start gap-3">' +
                    '<div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">答</div>' +
                    '<div class="flex-1 text-slate-100 leading-relaxed">' + answerHtml + '</div>' +
                '</div>' +
                (qa.articles.length > 0 ? '<div class="text-xs text-slate-400 pt-2 border-t border-slate-700">📚 参考条文：' +
                    qa.articles.map(n => '<span class="codex-citation" onclick="openCodexAt(\'' + n + '\')">' + n + '</span>').join(' ') +
                '</div>' : '') +
                '<div class="text-xs text-slate-500 text-right">' + qa.time + '</div>' +
            '</div>';
            historyEl.insertAdjacentHTML('afterbegin', html);
        }

        // 点击遮罩关闭面板
        document.getElementById('historyPanel').addEventListener('click', function(e) {
            if (e.target === this) closeHistory();
        });
        document.getElementById('settingsPanel').addEventListener('click', function(e) {
            if (e.target === this) closeSettings();
        });
    