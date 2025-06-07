// 🚀 FoodTracker AI Pro - Bot Configuration with HTTPS
// Full Mini App support with HTTPS tunnel

process.env.TELEGRAM_BOT_TOKEN =
  "7328877520:AAFk4QI5dXLGlVlk5tJIGVgQ1IYvEyL83D8";
process.env.MINI_APP_URL = "https://foodtracker-ai.loca.lt/telegram";
process.env.API_BASE_URL = "https://foodtracker-ai.loca.lt";
process.env.NODE_ENV = "development";

console.log("🤖 FoodTracker AI Pro - Full Mini App Configuration!");
console.log("🔒 HTTPS Mini App URL:", process.env.MINI_APP_URL);
console.log("🔒 HTTPS API Base URL:", process.env.API_BASE_URL);
console.log("🌍 Now Telegram Mini App will work!");

// Start the bot with Mini App support
require("./telegram-bot.js");
