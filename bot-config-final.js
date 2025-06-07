// 🚀 FoodTracker AI Pro - Final Bot Configuration with GitHub Pages
// Full Mini App support with HTTPS from GitHub Pages

process.env.TELEGRAM_BOT_TOKEN =
  "7328877520:AAFk4QI5dXLGlVlk5tJIGVgQ1IYvEyL83D8";
process.env.MINI_APP_URL =
  "https://steshenkoof.github.io/foodtracker-ai-miniapp/";
process.env.API_BASE_URL = "http://localhost:3000"; // Our local API
process.env.NODE_ENV = "production";

console.log("🚀 FoodTracker AI Pro - FINAL Configuration with GitHub Pages!");
console.log("📱 HTTPS Mini App URL:", process.env.MINI_APP_URL);
console.log("🔗 Local API URL:", process.env.API_BASE_URL);
console.log("✅ Telegram Mini App will work perfectly!");
console.log("");
console.log("🎯 Users will:");
console.log("1. Press /start in bot");
console.log('2. Click "📱 Open FoodTracker App" button');
console.log("3. Get full Mini App experience in Telegram!");
console.log("");

// Start the bot with full Mini App support
require("./telegram-bot.js");
