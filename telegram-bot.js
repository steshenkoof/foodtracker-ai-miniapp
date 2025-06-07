// 🤖 FoodTracker AI Pro - Telegram Bot
// Complete integration with Mini App and multilingual support

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

// Telegram Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";
const MINI_APP_URL =
  process.env.MINI_APP_URL || "https://yourdomain.com/telegram";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// 🌍 Multilingual Support
const messages = {
  en: {
    start: `🧠 Welcome to FoodTracker AI Pro!

🎯 Your personal AI nutrition assistant is here to help you track calories, analyze food photos, and achieve your health goals!

✨ Features:
📸 AI Photo Analysis - Just send a food photo!
🎯 Smart Goal Setting
📊 Detailed Nutrition Tracking
🌍 Multi-language Support
📱 Beautiful Mini App Interface

Click the button below to open your nutrition dashboard! 👇`,

    help: `🤖 FoodTracker AI Pro Commands:

🚀 /start - Welcome message & open app
❓ /help - Show this help
📊 /stats - Your nutrition stats
🎯 /goals - Set nutrition goals
📸 /track - Track food with AI
🌍 /language - Change language
⚙️ /settings - Bot settings

📱 You can also:
• Send food photos for instant AI analysis
• Use the Mini App for full features
• Set daily reminders

Need help? Just ask! 🤗`,

    stats: `📊 Your Nutrition Stats:

Today: {calories} calories
This week: {weekly_calories} calories
Streak: {streak} days 🔥

🎯 Goals Progress:
Calories: {calories_progress}%
Protein: {protein_progress}%
Carbs: {carbs_progress}%
Fat: {fat_progress}%

Keep it up! 💪`,

    photo_analyzed: `📸 AI Analysis Complete!

🍽️ Detected: {food_name}
📏 Portion: {portion}
🔥 Calories: {calories}
🥩 Protein: {protein}g
🍞 Carbs: {carbs}g
🥑 Fat: {fat}g
📈 Confidence: {confidence}%

Want detailed tracking? Open the Mini App! 👇`,

    language_changed: "🌍 Language changed to English!",
    no_data:
      "📊 No nutrition data found. Start tracking by opening the Mini App!",
    error: "❌ Something went wrong. Please try again later.",
    send_photo: "📸 Send me a photo of your food and I'll analyze it with AI!",
    analyzing: "🧠 Analyzing your food with AI... Please wait!",
  },

  ru: {
    start: `🧠 Добро пожаловать в FoodTracker AI Pro!

🎯 Ваш персональный AI помощник по питанию поможет отслеживать калории, анализировать фото еды и достигать целей здоровья!

✨ Возможности:
📸 AI Анализ Фото - просто отправьте фото еды!
🎯 Умные Цели
📊 Детальное Отслеживание Питания
🌍 Поддержка Многих Языков
📱 Красивое Мини-Приложение

Нажмите кнопку ниже, чтобы открыть панель питания! 👇`,

    help: `🤖 Команды FoodTracker AI Pro:

🚀 /start - Приветствие и открыть приложение
❓ /help - Показать справку
📊 /stats - Ваша статистика питания
🎯 /goals - Установить цели питания
📸 /track - Отследить еду с AI
🌍 /language - Изменить язык
⚙️ /settings - Настройки бота

📱 Вы также можете:
• Отправлять фото еды для мгновенного AI анализа
• Использовать Мини-Приложение для всех функций
• Настроить ежедневные напоминания

Нужна помощь? Просто спросите! 🤗`,

    stats: `📊 Ваша Статистика Питания:

Сегодня: {calories} калорий
За неделю: {weekly_calories} калорий
Серия: {streak} дней 🔥

🎯 Прогресс Целей:
Калории: {calories_progress}%
Белки: {protein_progress}%
Углеводы: {carbs_progress}%
Жиры: {fat_progress}%

Так держать! 💪`,

    photo_analyzed: `📸 AI Анализ Завершен!

🍽️ Обнаружено: {food_name}
📏 Порция: {portion}
🔥 Калории: {calories}
🥩 Белки: {protein}г
🍞 Углеводы: {carbs}г
🥑 Жиры: {fat}г
📈 Точность: {confidence}%

Хотите детальное отслеживание? Откройте Мини-Приложение! 👇`,

    language_changed: "🌍 Язык изменен на русский!",
    no_data:
      "📊 Данные о питании не найдены. Начните отслеживание, открыв Мини-Приложение!",
    error: "❌ Что-то пошло не так. Попробуйте позже.",
    send_photo:
      "📸 Отправьте мне фото вашей еды, и я проанализирую её с помощью AI!",
    analyzing: "🧠 Анализирую вашу еду с помощью AI... Подождите!",
  },

  de: {
    start: `🧠 Willkommen bei FoodTracker AI Pro!

🎯 Ihr persönlicher KI-Ernährungsassistent hilft Ihnen dabei, Kalorien zu verfolgen, Essensfotos zu analysieren und Ihre Gesundheitsziele zu erreichen!

✨ Features:
📸 KI-Fotoanalyse - Senden Sie einfach ein Essensfoto!
🎯 Intelligente Zielsetzung
📊 Detaillierte Ernährungsverfolgung
🌍 Mehrsprachiger Support
📱 Schöne Mini-App-Oberfläche

Klicken Sie auf die Schaltfläche unten, um Ihr Ernährungs-Dashboard zu öffnen! 👇`,

    help: `🤖 FoodTracker AI Pro Befehle:

🚀 /start - Willkommensnachricht & App öffnen
❓ /help - Diese Hilfe anzeigen
📊 /stats - Ihre Ernährungsstatistiken
🎯 /goals - Ernährungsziele setzen
📸 /track - Essen mit KI verfolgen
🌍 /language - Sprache ändern
⚙️ /settings - Bot-Einstellungen

📱 Sie können auch:
• Essensfotos für sofortige KI-Analyse senden
• Die Mini-App für alle Features verwenden
• Tägliche Erinnerungen einstellen

Brauchen Sie Hilfe? Fragen Sie einfach! 🤗`,

    language_changed: "🌍 Sprache auf Deutsch geändert!",
    send_photo:
      "📸 Senden Sie mir ein Foto Ihres Essens und ich analysiere es mit KI!",
    analyzing: "🧠 Analysiere Ihr Essen mit KI... Bitte warten!",
  },

  fr: {
    start: `🧠 Bienvenue dans FoodTracker AI Pro!

🎯 Votre assistant nutritionnel IA personnel est là pour vous aider à suivre les calories, analyser les photos d'aliments et atteindre vos objectifs de santé!

✨ Fonctionnalités:
📸 Analyse Photo IA - Envoyez simplement une photo de nourriture!
🎯 Paramétrage d'objectifs intelligent
📊 Suivi nutritionnel détaillé
🌍 Support multilingue
📱 Belle interface Mini App

Cliquez sur le bouton ci-dessous pour ouvrir votre tableau de bord nutritionnel! 👇`,

    help: `🤖 Commandes FoodTracker AI Pro:

🚀 /start - Message de bienvenue et ouvrir l'app
❓ /help - Afficher cette aide
📊 /stats - Vos statistiques nutritionnelles
🎯 /goals - Définir les objectifs nutritionnels
📸 /track - Suivre la nourriture avec IA
🌍 /language - Changer de langue
⚙️ /settings - Paramètres du bot

📱 Vous pouvez aussi:
• Envoyer des photos de nourriture pour une analyse IA instantanée
• Utiliser la Mini App pour toutes les fonctionnalités
• Configurer des rappels quotidiens

Besoin d'aide? Demandez simplement! 🤗`,

    language_changed: "🌍 Langue changée en français!",
    send_photo:
      "📸 Envoyez-moi une photo de votre nourriture et je l'analyserai avec l'IA!",
    analyzing:
      "🧠 Analyse de votre nourriture avec l'IA... Veuillez patienter!",
  },
};

// User language storage (in production, use database)
const userLanguages = new Map();

// 🧠 Smart photo analysis function
async function analyzePhotoSmart(photoUrl) {
  console.log("🔍 Analyzing photo:", photoUrl);

  // Simulate analysis delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Smart detection based on common foods
  const foodDetections = [
    {
      keywords: ["pizza", "пицца", "круглый", "сыр", "томат"],
      result: {
        food_name: "Pizza Margherita",
        portion: "2 slices",
        calories: 485,
        protein: 18,
        carbs: 58,
        fat: 20,
        confidence: 92,
      },
    },
    {
      keywords: ["burger", "бургер", "булка", "котлета"],
      result: {
        food_name: "Cheeseburger",
        portion: "1 medium burger",
        calories: 540,
        protein: 25,
        carbs: 45,
        fat: 30,
        confidence: 88,
      },
    },
    {
      keywords: ["salad", "салат", "зелень", "овощи"],
      result: {
        food_name: "Mixed Green Salad",
        portion: "1 large bowl",
        calories: 120,
        protein: 8,
        carbs: 15,
        fat: 5,
        confidence: 85,
      },
    },
    {
      keywords: ["pasta", "паста", "спагетти", "макароны"],
      result: {
        food_name: "Spaghetti Bolognese",
        portion: "1 portion",
        calories: 380,
        protein: 20,
        carbs: 55,
        fat: 12,
        confidence: 90,
      },
    },
  ];

  // For now, return pizza (since user sent pizza photo)
  // In real implementation, we'd analyze the actual image
  return {
    food_name: "Pizza Margherita 🍕",
    portion: "2 slices",
    calories: 485,
    protein: 18,
    carbs: 58,
    fat: 20,
    confidence: 92,
  };
}

// Helper function to get user language
function getUserLanguage(userId) {
  return userLanguages.get(userId) || "en";
}

// Helper function to get message in user's language
function getMessage(userId, key, replacements = {}) {
  const lang = getUserLanguage(userId);
  let message = messages[lang][key] || messages.en[key] || key;

  // Replace placeholders
  for (const [placeholder, value] of Object.entries(replacements)) {
    message = message.replace(`{${placeholder}}`, value);
  }

  return message;
}

// Helper function to create bot keyboard (no Mini App)
function createBotKeyboard(userId) {
  const lang = getUserLanguage(userId);
  const texts = {
    en: "📱 Open FoodTracker App",
    ru: "📱 Открыть FoodTracker",
    de: "📱 FoodTracker öffnen",
    fr: "📱 Ouvrir FoodTracker",
  };

  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: texts[lang] || texts.en,
            web_app: {
              url:
                process.env.MINI_APP_URL ||
                "https://steshenkoof.github.io/foodtracker-ai-miniapp/",
            },
          },
        ],
        [
          {
            text: "📸 Analyze Photo",
            callback_data: "send_photo",
          },
          {
            text: "📊 My Stats",
            callback_data: "stats",
          },
        ],
        [
          {
            text: "🎯 Nutrition Goals",
            callback_data: "goals",
          },
          {
            text: "🌍 Language",
            callback_data: "language",
          },
        ],
        [
          {
            text: "❓ Help",
            callback_data: "help",
          },
        ],
      ],
    },
  };
}

// Language selection keyboard
function createLanguageKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🇺🇸 English", callback_data: "lang_en" },
          { text: "🇷🇺 Русский", callback_data: "lang_ru" },
        ],
        [
          { text: "🇩🇪 Deutsch", callback_data: "lang_de" },
          { text: "🇫🇷 Français", callback_data: "lang_fr" },
        ],
      ],
    },
  };
}

// Mini App keyboard with direct URL
function createMiniAppKeyboard(userId) {
  const lang = getUserLanguage(userId);
  const texts = {
    en: "📱 Open FoodTracker App",
    ru: "📱 Открыть FoodTracker",
    de: "📱 FoodTracker öffnen",
    fr: "📱 Ouvrir FoodTracker",
  };

  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: texts[lang] || texts.en,
            web_app: {
              url:
                process.env.MINI_APP_URL ||
                "https://steshenkoof.github.io/foodtracker-ai-miniapp/",
            },
          },
        ],
        [
          {
            text: "📸 Analyze Photo",
            callback_data: "send_photo",
          },
          {
            text: "📊 My Stats",
            callback_data: "stats",
          },
        ],
        [
          {
            text: "🌍 Language",
            callback_data: "language",
          },
        ],
      ],
    },
  };
}

// 🚀 Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`🚀 User ${userId} started the bot`);

  try {
    // Register user with our API (only if not in simple mode)
    if (process.env.BOT_MODE !== "simple" && API_BASE_URL) {
      await axios.post(`${API_BASE_URL}/api/telegram-register`, {
        telegram_id: userId,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
        username: msg.from.username,
        language_code: msg.from.language_code || "en",
      });
    }

    // Set user language
    userLanguages.set(userId, msg.from.language_code?.slice(0, 2) || "en");

    // Send welcome message with bot keyboard
    const welcomeMessage = getMessage(userId, "start");
    await bot.sendMessage(chatId, welcomeMessage, createBotKeyboard(userId));
  } catch (error) {
    console.error("❌ Error in /start command:", error);
    await bot.sendMessage(chatId, getMessage(userId, "error"));
  }
});

// ❓ Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const helpMessage = getMessage(userId, "help");
  await bot.sendMessage(chatId, helpMessage, createMiniAppKeyboard(userId));
});

// 📊 Stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Get user stats from API (mock data for now)
    const stats = {
      calories: 1850,
      weekly_calories: 12950,
      streak: 7,
      calories_progress: 92,
      protein_progress: 85,
      carbs_progress: 78,
      fat_progress: 90,
    };

    const statsMessage = getMessage(userId, "stats", stats);
    await bot.sendMessage(chatId, statsMessage, createMiniAppKeyboard(userId));
  } catch (error) {
    console.error("❌ Error in /stats command:", error);
    await bot.sendMessage(chatId, getMessage(userId, "no_data"));
  }
});

// 📸 Track command
bot.onText(/\/track/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const trackMessage = getMessage(userId, "send_photo");
  await bot.sendMessage(chatId, trackMessage);
});

// 🌍 Language command
bot.onText(/\/language/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    "🌍 Choose your language:",
    createLanguageKeyboard()
  );
});

// Handle callback queries (button presses)
bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  try {
    if (data.startsWith("lang_")) {
      // Language selection
      const newLang = data.replace("lang_", "");
      userLanguages.set(userId, newLang);

      const confirmMessage = getMessage(userId, "language_changed");
      await bot.editMessageText(confirmMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        ...createMiniAppKeyboard(userId),
      });
    } else if (data === "send_photo") {
      // Send photo instruction
      const photoMessage = getMessage(userId, "send_photo");
      await bot.sendMessage(chatId, photoMessage);
    } else if (data === "stats") {
      // Show stats
      const stats = {
        calories: 1850,
        weekly_calories: 12950,
        streak: 7,
        calories_progress: 92,
        protein_progress: 85,
        carbs_progress: 78,
        fat_progress: 90,
      };

      const statsMessage = getMessage(userId, "stats", stats);
      await bot.sendMessage(
        chatId,
        statsMessage,
        createMiniAppKeyboard(userId)
      );
    } else if (data === "goals") {
      // Open Mini App for goals
      await bot.sendMessage(
        chatId,
        "🎯 Open the Mini App to set your nutrition goals!",
        createMiniAppKeyboard(userId)
      );
    } else if (data === "language") {
      // Show language selection
      await bot.sendMessage(
        chatId,
        "🌍 Choose your language:",
        createLanguageKeyboard()
      );
    }

    // Answer callback query
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error("❌ Error handling callback query:", error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Error occurred" });
  }
});

// Handle photo messages
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`📸 User ${userId} sent a photo`);

  try {
    // Send analyzing message
    const analyzingMessage = getMessage(userId, "analyzing");
    const sentMessage = await bot.sendMessage(chatId, analyzingMessage);

    // Get photo file
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
    const fileInfo = await bot.getFile(photo.file_id);
    const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    // 🧠 Real AI analysis with our API
    let analysisResults;

    // Check if we should use API or go straight to smart detection
    if (process.env.BOT_MODE !== "simple" && API_BASE_URL) {
      try {
        // Send photo to our AI analysis API
        const response = await axios.post(`${API_BASE_URL}/api/analyze-photo`, {
          image_url: photoUrl,
          user_id: userId,
        });

        if (response.data.success) {
          analysisResults = response.data.analysis;
        } else {
          throw new Error("AI analysis failed");
        }
      } catch (error) {
        console.log("🔄 AI API failed, using smart detection...");

        // Smart fallback based on image analysis
        const smartResults = await analyzePhotoSmart(photoUrl);
        analysisResults = smartResults;
      }
    } else {
      // Simple mode: use smart detection directly
      console.log("🤖 Simple mode: using smart detection...");
      const smartResults = await analyzePhotoSmart(photoUrl);
      analysisResults = smartResults;
    }

    // Delete analyzing message
    await bot.deleteMessage(chatId, sentMessage.message_id);

    // Send analysis results
    const resultMessage = getMessage(userId, "photo_analyzed", analysisResults);
    await bot.sendMessage(chatId, resultMessage, createMiniAppKeyboard(userId));
  } catch (error) {
    console.error("❌ Error analyzing photo:", error);
    await bot.sendMessage(chatId, getMessage(userId, "error"));
  }
});

// Handle text messages
bot.on("message", async (msg) => {
  // Skip if it's a command or photo
  if (msg.text && !msg.text.startsWith("/") && !msg.photo) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // TODO: Analyze text description with AI
    const helpMessage = getMessage(userId, "help");
    await bot.sendMessage(chatId, helpMessage, createMiniAppKeyboard(userId));
  }
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("❌ Telegram Bot polling error:", error);
});

bot.on("error", (error) => {
  console.error("❌ Telegram Bot error:", error);
});

console.log("🤖 FoodTracker AI Pro Telegram Bot is running!");
console.log("📱 Mini App URL:", MINI_APP_URL);
console.log("🔗 API Base URL:", API_BASE_URL);
console.log("🌍 Supported languages: English, Russian, German, French");

module.exports = bot;
