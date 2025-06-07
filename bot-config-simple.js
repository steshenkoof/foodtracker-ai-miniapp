// 🚀 FoodTracker AI Pro - Simplified Bot Configuration (No API calls)
// Only Mini App support with HTTPS from GitHub Pages

process.env.TELEGRAM_BOT_TOKEN = "7328877520:AAFk4QI5dXLGlVlk5tJIGVgQ1IYvEyL83D8";
process.env.MINI_APP_URL = "https://steshenkoof.github.io/foodtracker-ai-miniapp/";
process.env.API_BASE_URL = ""; // No API calls - Mini App only
process.env.NODE_ENV = "production";
process.env.BOT_MODE = "simple"; // Flag to disable API calls

console.log("🚀 FoodTracker AI Pro - SIMPLIFIED Configuration!");
console.log("📱 HTTPS Mini App URL:", process.env.MINI_APP_URL);
console.log("🚫 API calls disabled - Mini App only mode");
console.log("✅ Telegram Mini App will work without server!");
console.log("");
console.log("🎯 Users will:");
console.log("1. Press /start in bot");
console.log('2. Click "📱 Open FoodTracker App" button');
console.log("3. Get full Mini App experience in Telegram!");
console.log("");

// Start the bot with Mini App only
require("./telegram-bot.js"); 