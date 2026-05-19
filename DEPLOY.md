# 🎵 SONG AI 部署指南

## 本地预览

直接用浏览器打开 `index.html` 即可体验

```bash
# 或使用本地服务器
cd SONG-AI-web
python -m http.server 8080
# 访问 http://localhost:8080
```

## 部署到 GitHub Pages

### 方法1：手动推送

```bash
# 1. 进入项目目录
cd SONG-AI-web

# 2. 添加所有文件
git add -A

# 3. 提交
git commit -m "feat: SONG AI 完整功能"

# 4. 推送到GitHub
git push origin master
```

### 方法2：直接上传

将以下文件上传到你的GitHub仓库：
- `index.html`
- `styles.css`  
- `app.js`

## 功能说明

### 积分系统
| 操作 | 积分变化 |
|------|---------|
| 新用户注册 | +10 积分 |
| 生成歌曲 | -2 积分 |
| 开通会员 | 无限生成 |

### 使用流程
1. 访问页面 → 注册/登录
2. 获得10积分 → 输入歌词
3. 点击生成 → 消耗2积分
4. 积分不足 → 充值/开通会员

## 技术说明

- 前端：HTML5 + CSS3 + JavaScript
- 数据存储：localStorage（浏览器本地）
- AI生成：模拟（需接入真实API）

---

© 2026 SONG AI - 小龙虾作品