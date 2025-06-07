// 🧠 FoodTracker AI Pro - Mini App Script
// Telegram Mini App integration and functionality

let tg = window.Telegram?.WebApp;
let camera, canvas, ctx;

// Initialize Telegram Mini App
if (tg) {
  tg.expand();
  tg.ready();
  console.log("🤖 Telegram Mini App initialized");
}

// Multilingual support
const messages = {
  en: {
    title: "🧠 FoodTracker AI Pro",
    analyzeFood: "📸 Analyze Food",
    results: "🍽️ Analysis Results",
    todayProgress: "📊 Today's Progress",
    saveEntry: "💾 Save Entry",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    confidence: "Confidence",
  },
  ru: {
    title: "🧠 FoodTracker AI Pro",
    analyzeFood: "📸 Анализировать Еду",
    results: "🍽️ Результаты Анализа",
    todayProgress: "📊 Прогресс За Сегодня",
    saveEntry: "💾 Сохранить Запись",
    calories: "Калории",
    protein: "Белки",
    carbs: "Углеводы",
    fat: "Жиры",
    confidence: "Точность",
  },
  de: {
    title: "🧠 FoodTracker AI Pro",
    analyzeFood: "📸 Essen Analysieren",
    results: "🍽️ Analyse Ergebnisse",
    todayProgress: "📊 Heutiger Fortschritt",
    saveEntry: "💾 Eintrag Speichern",
    calories: "Kalorien",
    protein: "Protein",
    carbs: "Kohlenhydrate",
    fat: "Fett",
    confidence: "Genauigkeit",
  },
  fr: {
    title: "🧠 FoodTracker AI Pro",
    analyzeFood: "📸 Analyser Nourriture",
    results: "🍽️ Résultats d'Analyse",
    todayProgress: "📊 Progrès d'Aujourd'hui",
    saveEntry: "💾 Sauvegarder",
    calories: "Calories",
    protein: "Protéines",
    carbs: "Glucides",
    fat: "Lipides",
    confidence: "Précision",
  },
};

let currentLang = "en";

// Sample food database for demo
const foodDatabase = [
  {
    name: "Pizza Margherita 🍕",
    calories: 485,
    protein: 18,
    carbs: 58,
    fat: 20,
    confidence: 92,
  },
  {
    name: "Cheeseburger 🍔",
    calories: 540,
    protein: 25,
    carbs: 45,
    fat: 30,
    confidence: 89,
  },
  {
    name: "Caesar Salad 🥗",
    calories: 320,
    protein: 15,
    carbs: 12,
    fat: 25,
    confidence: 87,
  },
  {
    name: "Spaghetti Bolognese 🍝",
    calories: 380,
    protein: 20,
    carbs: 55,
    fat: 12,
    confidence: 91,
  },
  {
    name: "Sushi Roll 🍣",
    calories: 280,
    protein: 22,
    carbs: 35,
    fat: 8,
    confidence: 94,
  },
];

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initCamera();
  setupEventListeners();
  updateLanguage();

  // Telegram user info
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    console.log("👤 User:", user.first_name, user.last_name);

    // Auto-detect language
    if (user.language_code) {
      const lang = user.language_code.slice(0, 2);
      if (messages[lang]) {
        currentLang = lang;
        updateLanguage();
      }
    }
  }
});

function initCamera() {
  camera = document.getElementById("camera");
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  // Request camera access
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      .then(function (stream) {
        camera.srcObject = stream;
        console.log("📸 Camera initialized");
      })
      .catch(function (err) {
        console.log("❌ Camera error:", err);
        // Show placeholder for demo
        camera.style.background = "linear-gradient(45deg, #f0f0f0, #e0e0e0)";
        camera.style.display = "flex";
        camera.style.alignItems = "center";
        camera.style.justifyContent = "center";
        camera.innerHTML =
          '<div style="color: #666; text-align: center;">📸<br>Camera Preview<br><small>Tap to analyze</small></div>';
      });
  }
}

function setupEventListeners() {
  // Take photo button
  document.getElementById("take-photo").addEventListener("click", analyzeFood);

  // Save entry button
  document.getElementById("save-entry").addEventListener("click", saveEntry);

  // Language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentLang = this.dataset.lang;
      updateLanguage();
      updateActiveLanguage();
    });
  });

  // Camera click for mobile
  camera.addEventListener("click", analyzeFood);
}

function analyzeFood() {
  const btn = document.getElementById("take-photo");
  const originalText = btn.textContent;

  // Show loading
  btn.textContent = "🧠 Analyzing...";
  btn.disabled = true;

  // Simulate AI analysis
  setTimeout(() => {
    // Random food from database
    const randomFood =
      foodDatabase[Math.floor(Math.random() * foodDatabase.length)];

    // Update results
    document.getElementById("food-name").textContent = randomFood.name;
    document.getElementById("calories").textContent = randomFood.calories;
    document.getElementById("protein").textContent = randomFood.protein + "g";
    document.getElementById("carbs").textContent = randomFood.carbs + "g";
    document.getElementById("fat").textContent = randomFood.fat + "g";
    document.getElementById("confidence").textContent =
      randomFood.confidence + "%";

    // Show results
    document.getElementById("results").hidden = false;
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });

    // Reset button
    btn.textContent = originalText;
    btn.disabled = false;

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("medium");
    }

    console.log("✅ Analysis complete:", randomFood);
  }, 2000);
}

function saveEntry() {
  const btn = document.getElementById("save-entry");
  const originalText = btn.textContent;

  // Show saving
  btn.textContent = "💾 Saving...";
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = "✅ Saved!";

    // Haptic feedback
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("success");
    }

    // Send data back to bot
    if (tg) {
      const data = {
        action: "save_nutrition",
        food: document.getElementById("food-name").textContent,
        calories: parseInt(document.getElementById("calories").textContent),
        protein: parseInt(document.getElementById("protein").textContent),
        carbs: parseInt(document.getElementById("carbs").textContent),
        fat: parseInt(document.getElementById("fat").textContent),
      };

      tg.sendData(JSON.stringify(data));
    }

    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  }, 1000);
}

function updateLanguage() {
  const msgs = messages[currentLang];

  // Update text content
  document.querySelector("h1").textContent = msgs.title;
  document.getElementById("take-photo").textContent = msgs.analyzeFood;
  document.querySelector(".stats-section h3").textContent = msgs.todayProgress;
  document.getElementById("save-entry").textContent = msgs.saveEntry;

  // Update nutrition labels
  const labels = document.querySelectorAll(".nutrition-item .label");
  if (labels.length >= 4) {
    labels[0].textContent = msgs.calories;
    labels[1].textContent = msgs.protein;
    labels[2].textContent = msgs.carbs;
    labels[3].textContent = msgs.fat;
  }

  console.log("🌍 Language updated to:", currentLang);
}

function updateActiveLanguage() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[data-lang="${currentLang}"]`)
    .classList.add("active");
}

// Telegram Mini App specific functions
if (tg) {
  // Handle back button
  tg.BackButton.onClick(() => {
    if (!document.getElementById("results").hidden) {
      document.getElementById("results").hidden = true;
      tg.BackButton.hide();
    } else {
      tg.close();
    }
  });

  // Show back button when results are visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "hidden"
      ) {
        const results = document.getElementById("results");
        if (!results.hidden) {
          tg.BackButton.show();
        } else {
          tg.BackButton.hide();
        }
      }
    });
  });

  observer.observe(document.getElementById("results"), {
    attributes: true,
    attributeFilter: ["hidden"],
  });
}

// Initialize active language
updateActiveLanguage();

console.log("🚀 FoodTracker AI Pro Mini App loaded successfully!");
