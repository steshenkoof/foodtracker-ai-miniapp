// 🧪 Live Bot Tester - Check if bot is working
const axios = require("axios");

const BOT_TOKEN = "7328877520:AAFk4QI5dXLGlVlk5tJIGVgQ1IYvEyL83D8";
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function testBot() {
  console.log("🤖 Testing FoodTracker AI Pro Bot...\n");

  try {
    // Test 1: Get bot info
    console.log("📋 Test 1: Getting bot information...");
    const response = await axios.get(`${BASE_URL}/getMe`);

    if (response.data.ok) {
      const bot = response.data.result;
      console.log("✅ Bot is alive!");
      console.log(`🤖 Name: ${bot.first_name}`);
      console.log(`👤 Username: @${bot.username}`);
      console.log(`🆔 ID: ${bot.id}`);
      console.log(`🔗 Can join groups: ${bot.can_join_groups}`);
      console.log(`📱 Can read messages: ${bot.can_read_all_group_messages}`);
      console.log(`🌐 Supports inline: ${bot.supports_inline_queries}\n`);
    }

    // Test 2: Check webhook status
    console.log("📋 Test 2: Checking webhook status...");
    const webhookResponse = await axios.get(`${BASE_URL}/getWebhookInfo`);

    if (webhookResponse.data.ok) {
      const webhook = webhookResponse.data.result;
      console.log("✅ Webhook info retrieved");
      console.log(`🔗 Webhook URL: ${webhook.url || "Not set (polling mode)"}`);
      console.log(`⏰ Last error: ${webhook.last_error_date || "None"}`);
      console.log(`📊 Pending updates: ${webhook.pending_update_count || 0}\n`);
    }

    // Test 3: Set bot commands
    console.log("📋 Test 3: Setting bot commands...");
    const commands = [
      { command: "start", description: "🚀 Welcome & open Mini App" },
      { command: "help", description: "❓ Show help and commands" },
      { command: "stats", description: "📊 Your nutrition statistics" },
      { command: "track", description: "📸 Track food with AI" },
      { command: "language", description: "🌍 Change language" },
      { command: "goals", description: "🎯 Set nutrition goals" },
    ];

    const commandsResponse = await axios.post(`${BASE_URL}/setMyCommands`, {
      commands: commands,
    });

    if (commandsResponse.data.ok) {
      console.log("✅ Bot commands set successfully!");
      commands.forEach((cmd) => {
        console.log(`   /${cmd.command} - ${cmd.description}`);
      });
    }

    console.log("\n🎉 Bot is fully operational!");
    console.log("\n📱 How to test:");
    console.log("1. Open Telegram");
    console.log(`2. Search for @${bot.username || "your_bot"}`);
    console.log("3. Send /start command");
    console.log('4. Click "📱 Open FoodTracker App" button');
    console.log("5. Send a food photo for AI analysis");

    console.log("\n🌍 Supported languages:");
    console.log("🇺🇸 English, 🇷🇺 Russian, 🇩🇪 German, 🇫🇷 French");
  } catch (error) {
    console.error("❌ Bot test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log("\n🔧 Bot token issue - check if token is correct");
    } else if (error.response?.status === 429) {
      console.log("\n⏰ Too many requests - wait a moment");
    } else {
      console.log("\n🔧 Check internet connection and bot token");
    }
  }
}

testBot();
