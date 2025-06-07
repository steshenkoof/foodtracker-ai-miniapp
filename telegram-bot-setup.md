# 🤖 FoodTracker AI Pro - Telegram Bot Setup Guide

Complete guide to set up your Telegram bot with Mini App integration and multilingual support.

## 🚀 Quick Start

### 1. Create Your Telegram Bot

1. **Open Telegram and find @BotFather**
2. **Send `/newbot` command**
3. **Choose a name**: `FoodTracker AI Pro`
4. **Choose a username**: `@YourFoodTrackerBot` (must end with 'bot')
5. **Copy the bot token** (looks like: `123456789:ABCdefGhIJKlmNoPQRstUVwxYZ`)

### 2. Configure Bot Settings

Send these commands to @BotFather:

```
/setcommands
```

Then paste this command list:

```
start - 🚀 Welcome & open Mini App
help - ❓ Show help and commands
stats - 📊 Your nutrition statistics
track - 📸 Track food with AI
language - 🌍 Change language
goals - 🎯 Set nutrition goals
```

**Set bot description:**

```
/setdescription
```

```
🧠 FoodTracker AI Pro - Your personal AI nutrition assistant!

✨ Features:
📸 AI Photo Analysis
🎯 Smart Goal Setting
📊 Detailed Nutrition Tracking
🌍 Multi-language Support
📱 Beautiful Mini App Interface

Track calories, analyze food photos, and achieve your health goals with AI!
```

**Set about text:**

```
/setabouttext
```

```
AI-powered food tracking with photo analysis, goal setting, and health insights. Supports English, Russian, German, and French.
```

### 3. Enable Mini App (Web App)

```
/newapp
```

- **Select your bot**
- **App name**: `FoodTracker AI Pro`
- **Description**: `AI-powered nutrition tracking with photo analysis`
- **Photo**: Upload your app icon
- **Web App URL**: `https://yourdomain.com/telegram` (replace with your domain)

### 4. Configure Environment

1. **Copy config file:**

```bash
cp config.env .env
```

2. **Edit `.env` file with your settings:**

```env
# 🤖 TELEGRAM BOT SETTINGS
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRstUVwxYZ
MINI_APP_URL=https://yourdomain.com/telegram
API_BASE_URL=https://yourdomain.com

# 🌐 SERVER SETTINGS
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here

# 🤖 AI SETTINGS (optional)
OPENAI_API_KEY=your-openai-api-key
CLAUDE_API_KEY=your-claude-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### 5. Test Configuration

```bash
node test-telegram-bot.js
```

Expected output:

```
🤖 FoodTracker AI Pro - Telegram Bot Configuration Test

📋 Environment Configuration:
✅ BOT_TOKEN: ✓ Set
✅ MINI_APP_URL: https://yourdomain.com/telegram
✅ API_BASE_URL: https://yourdomain.com
✅ NODE_ENV: production

🎉 All tests passed! Bot is ready for deployment.
```

### 6. Start the Bot

**Development:**

```bash
node telegram-bot.js
```

**Production (with PM2):**

```bash
npm install -g pm2
pm2 start telegram-bot.js --name "telegram-bot"
pm2 startup
pm2 save
```

## 🌍 Multilingual Support

Your bot automatically supports:

- 🇺🇸 **English** - Default language
- 🇷🇺 **Russian** - Автоматическая поддержка русского языка
- 🇩🇪 **German** - Automatische deutsche Sprachunterstützung
- 🇫🇷 **French** - Support automatique du français

Language is auto-detected from user's Telegram settings, but users can change it with `/language` command.

## 🎯 Bot Commands

| Command     | Description                       | Multi-language |
| ----------- | --------------------------------- | -------------- |
| `/start`    | Welcome message + Mini App button | ✅             |
| `/help`     | Show all commands and features    | ✅             |
| `/stats`    | Display nutrition statistics      | ✅             |
| `/track`    | Instructions for food tracking    | ✅             |
| `/language` | Change interface language         | ✅             |

## 📸 Photo Analysis

Users can:

1. **Send food photos** → Get instant AI analysis
2. **Receive detailed breakdown**: calories, protein, carbs, fats
3. **See confidence score** and portion estimates
4. **Open Mini App** for detailed tracking

## 📱 Mini App Features

When users click "📱 Open FoodTracker App":

- **Full nutrition dashboard**
- **Photo analysis with camera**
- **Barcode scanning**
- **Goal setting and tracking**
- **Progress charts and insights**
- **Multi-language interface**

## ⚙️ Advanced Configuration

### Custom Domain Setup

1. **Update Mini App URL:**

```env
MINI_APP_URL=https://yourdomain.com/telegram
```

2. **Set webhook (optional):**

```javascript
bot.setWebHook(`https://yourdomain.com/telegram-webhook`);
```

### Database Integration

The bot automatically:

- **Registers new users** via `/api/telegram-register`
- **Stores user preferences** (language, goals)
- **Syncs with main application** database

### AI Integration

Configure AI providers for photo analysis:

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
CLAUDE_API_KEY=sk-ant-...
```

## 🔧 Troubleshooting

### Common Issues

**❌ "Bot token is missing"**

- Check `.env` file exists
- Verify `TELEGRAM_BOT_TOKEN` is set correctly

**❌ "Mini App doesn't open"**

- Verify `MINI_APP_URL` is accessible
- Check domain SSL certificate
- Ensure Mini App is configured in @BotFather

**❌ "Commands not working"**

- Restart the bot: `node telegram-bot.js`
- Check server logs for errors
- Test with `/help` command first

### Debug Mode

Enable verbose logging:

```env
NODE_ENV=development
DEBUG=telegram-bot:*
```

## 🚀 Deployment Options

### Option 1: VPS/Server

```bash
# Install dependencies
npm install

# Start with PM2
pm2 start telegram-bot.js --name "foodtracker-bot"
```

### Option 2: Railway/Heroku

```bash
# Add Procfile
echo "bot: node telegram-bot.js" > Procfile

# Deploy
git push railway main
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "telegram-bot.js"]
```

## 📊 Monitoring

Check bot status:

```bash
# PM2 status
pm2 status

# Logs
pm2 logs telegram-bot

# Restart
pm2 restart telegram-bot
```

Bot health endpoint:

```
GET https://yourdomain.com/api/health
```

## 🎉 Success!

Your FoodTracker AI Pro Telegram bot is now ready! Users can:

1. **Start with `/start`** → Get welcome message + Mini App button
2. **Send food photos** → Get instant AI analysis
3. **Use Mini App** → Full nutrition tracking experience
4. **Multi-language support** → Works in 4 languages
5. **Smart commands** → Easy nutrition management

---

### 📞 Support

If you need help:

1. Check the logs: `pm2 logs telegram-bot`
2. Test configuration: `node test-telegram-bot.js`
3. Verify environment variables in `.env`
4. Ensure your domain has valid SSL certificate

**Happy tracking! 🥗💪**
