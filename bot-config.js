// 🚀 FoodTracker AI Pro - Bot Configuration
// Temporary config to set environment variables

process.env.TELEGRAM_BOT_TOKEN =
  "7328877520:AAFk4QI5dXLGlVlk5tJIGVgQ1IYvEyL83D8";
process.env.MINI_APP_URL = "http://localhost:3000/telegram";
process.env.API_BASE_URL = "http://localhost:3000";
process.env.NODE_ENV = "development";

console.log("🤖 Bot Configuration Loaded!");
console.log("🔗 Mini App URL:", process.env.MINI_APP_URL);
console.log("🔗 API Base URL:", process.env.API_BASE_URL);

// Now start the actual bot
require("./telegram-bot.js");
