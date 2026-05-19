# 🎵 Suno API 申请指南

## 官方渠道

### 方法1: 官网申请（推荐）
1. 访问 https://suno.ai
2. 点击 "API" 或 "Developer"
3. 注册账号
4. 申请API Key

### 方法2: 官方Discord
1. 加入 Suno Discord: https://discord.gg/suno-ai
2. 找到 #api 或 #developer 频道
3. 申请API访问权限

---

## 第三方Suno API服务

如果官方API不可用，可以考虑第三方服务：

### 1. v3api.xyz（付费）
- 网站: https://v3api.xyz
- 价格: $5-10/月
- 接口文档完善

### 2. api.suno.genius（收费）
- 网站: https://api.suno.genius
- 按生成次数计费

### 3. SunoAPI（开源自建）
```bash
# 自建Suno API服务
git clone https://github.com/gcatanelli/SunoAPI
cd SunoAPI
pip install -r requirements.txt
python app.py
```

---

## Suno API 基本用法

```javascript
// 接入代码示例
async function generateSong(lyrics, style) {
    const response = await fetch('https://api.suno.ai/api/v1/generate', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: lyrics,
            style: style,  // pop, rock, electronic...
            duration: 300  // 5分钟
        })
    });
    
    const data = await response.json();
    return data.audio_url;  // 返回音频URL
}
```

---

## 当前网站状态

网站已经有完整的UI界面，只需要：
1. 获取API Key
2. 接入真实生成服务

获取到API Key后，告诉我，我会帮你把API接入到网站！

---

© 2026 SONG AI