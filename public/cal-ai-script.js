// FoodTracker AI Pro - Cal AI Clone JavaScript
class FoodTrackerAI {
  constructor() {
    this.authToken = localStorage.getItem("authToken");
    this.currentUser = null;
    this.currentAnalysis = null;
    this.camera = null;
    this.isLoading = false;

    this.init();
  }

  async init() {
    this.showLoadingScreen();
    this.setupEventListeners();
    await this.checkAuthStatus();
    this.hideLoadingScreen();
  }

  // ===== LOADING & INITIALIZATION =====
  showLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      loadingScreen.style.display = "flex";
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add("fade-out");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 500);
      }, 500); // Сократили время с 1000ms до 500ms
    }
  }

  setupEventListeners() {
    // Auth tabs
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.addEventListener("click", (e) =>
        this.switchAuthTab(e.target.dataset.tab)
      );
    });

    // Auth forms
    document
      .getElementById("loginForm")
      .addEventListener("submit", (e) => this.handleLogin(e));
    document
      .getElementById("registerForm")
      .addEventListener("submit", (e) => this.handleRegister(e));

    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.showSection(e.target.closest(".nav-link").dataset.section);
      });
    });

    // Quick actions
    document.querySelectorAll("[data-section]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!e.target.closest(".nav-link")) {
          this.showSection(e.target.closest("[data-section]").dataset.section);
        }
      });
    });

    // Analysis tabs
    document.querySelectorAll(".analysis-tab").forEach((tab) => {
      tab.addEventListener("click", (e) =>
        this.switchAnalysisMethod(e.target.dataset.method)
      );
    });

    // Camera controls
    document
      .getElementById("startCamera")
      .addEventListener("click", () => this.startCamera());
    document
      .getElementById("capturePhoto")
      .addEventListener("click", () => this.capturePhoto());
    document
      .getElementById("uploadPhoto")
      .addEventListener("click", () =>
        document.getElementById("fileUpload").click()
      );
    document
      .getElementById("fileUpload")
      .addEventListener("change", (e) => this.handleFileUpload(e));

    // Barcode analysis
    document
      .getElementById("analyzeBarcodeBtn")
      .addEventListener("click", () => this.analyzeBarcode());

    // Text analysis
    document
      .getElementById("analyzeTextBtn")
      .addEventListener("click", () => this.analyzeText());
    document
      .getElementById("foodDescription")
      .addEventListener("input", (e) => this.updateCharCount(e));

    // Example pills
    document.querySelectorAll(".example-pill").forEach((pill) => {
      pill.addEventListener("click", (e) => {
        document.getElementById("foodDescription").value =
          e.target.textContent.replace(/"/g, "");
        this.updateCharCount({
          target: document.getElementById("foodDescription"),
        });
      });
    });

    // Results actions
    document
      .getElementById("saveMealBtn")
      .addEventListener("click", () => this.showMealSaveModal());
    document
      .getElementById("newAnalysisBtn")
      .addEventListener("click", () => this.resetAnalysis());

    // Theme toggle
    document
      .getElementById("themeToggle")
      .addEventListener("click", () => this.toggleTheme());

    // Logout
    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.logout());

    // Date selector
    document
      .getElementById("dateSelector")
      .addEventListener("change", (e) =>
        this.loadNutritionData(e.target.value)
      );
    document.getElementById("todayBtn").addEventListener("click", () => {
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("dateSelector").value = today;
      this.loadNutritionData(today);
    });

    // Initialize date selector with today's date
    document.getElementById("dateSelector").value = new Date()
      .toISOString()
      .split("T")[0];
  }

  // ===== AUTHENTICATION =====
  switchAuthTab(tab) {
    document
      .querySelectorAll(".auth-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".auth-form")
      .forEach((f) => f.classList.remove("active"));

    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
    document.getElementById(`${tab}Form`).classList.add("active");
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
      this.showToast("Please fill in all fields", "error");
      return;
    }

    this.showLoadingOverlay("Signing in...");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.authToken = data.token;
        this.currentUser = data.user;
        localStorage.setItem("authToken", this.authToken);

        this.hideAuthModal();
        this.showToast(data.message || "Welcome back!", "success");
        this.showDashboard();
      } else {
        this.showToast(data.error || "Login failed", "error");
      }
    } catch (error) {
      this.showToast("Network error. Please try again.", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  async handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!username || !email || !password || !confirmPassword) {
      this.showToast("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      this.showToast("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      this.showToast("Password must be at least 6 characters", "error");
      return;
    }

    this.showLoadingOverlay("Creating account...");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        this.authToken = data.token;
        this.currentUser = data.user;
        localStorage.setItem("authToken", this.authToken);

        this.hideAuthModal();
        this.showToast(
          data.message || "Account created successfully!",
          "success"
        );
        this.showDashboard();
      } else {
        this.showToast(data.error || "Registration failed", "error");
      }
    } catch (error) {
      this.showToast("Network error. Please try again.", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  async checkAuthStatus() {
    if (!this.authToken) {
      this.showAuthModal();
      return;
    }

    try {
      const response = await fetch("/api/nutrition-goals", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (response.ok) {
        this.showDashboard();
        this.loadNutritionData();
      } else {
        this.logout();
      }
    } catch (error) {
      this.logout();
    }
  }

  logout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem("authToken");
    this.showAuthModal();
    this.showToast("Logged out successfully", "success");
  }

  // ===== UI NAVIGATION =====
  showAuthModal() {
    document.getElementById("authModal").classList.add("active");
    document.getElementById("appContainer").classList.add("hidden");
  }

  hideAuthModal() {
    document.getElementById("authModal").classList.remove("active");
    document.getElementById("appContainer").classList.remove("hidden");
  }

  showDashboard() {
    this.hideAuthModal();
    this.showSection("dashboard");
  }

  showSection(sectionName) {
    // Update navigation
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.remove("active"));
    document
      .querySelector(`[data-section="${sectionName}"]`)
      .classList.add("active");

    // Show section
    document
      .querySelectorAll(".app-section")
      .forEach((section) => section.classList.remove("active"));
    document.getElementById(sectionName).classList.add("active");

    // Load section-specific data
    switch (sectionName) {
      case "dashboard":
        this.loadNutritionData();
        break;
      case "camera":
        this.resetAnalysis();
        break;
      case "history":
        this.loadNutritionHistory();
        break;
      case "goals":
        this.loadNutritionGoals();
        break;
    }
  }

  // ===== FOOD ANALYSIS =====
  switchAnalysisMethod(method) {
    document
      .querySelectorAll(".analysis-tab")
      .forEach((tab) => tab.classList.remove("active"));
    document
      .querySelectorAll(".analysis-method")
      .forEach((method) => method.classList.remove("active"));

    document.querySelector(`[data-method="${method}"]`).classList.add("active");
    document.getElementById(`${method}Analysis`).classList.add("active");

    // Reset any previous analysis
    this.hideAnalysisResults();
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const video = document.getElementById("video");
      video.srcObject = stream;
      this.camera = stream;

      document.getElementById("startCamera").disabled = true;
      document.getElementById("capturePhoto").disabled = false;

      this.showToast("Camera started! Position food in frame", "success");
    } catch (error) {
      this.showToast("Camera access denied or not available", "error");
    }
  }

  capturePhoto() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        this.analyzeImage(blob);
      },
      "image/jpeg",
      0.8
    );
  }

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      this.analyzeImage(file);
    } else {
      this.showToast("Please select a valid image file", "error");
    }
  }

  async analyzeImage(imageFile) {
    this.showLoadingOverlay("Analyzing food with AI...");

    const formData = new FormData();
    formData.append("food_image", imageFile);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.authToken}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        this.currentAnalysis = data.data;
        this.showAnalysisResults(data);
        this.showToast("Food analyzed successfully! 🎉", "success");
      } else {
        this.showToast(data.error || "Analysis failed", "error");
      }
    } catch (error) {
      this.showToast("Network error during analysis", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  async analyzeBarcode() {
    const barcode = document.getElementById("barcodeInput").value.trim();

    if (!barcode) {
      this.showToast("Please enter a barcode", "error");
      return;
    }

    if (!/^\d{8,13}$/.test(barcode)) {
      this.showToast("Please enter a valid barcode (8-13 digits)", "error");
      return;
    }

    this.showLoadingOverlay("Looking up product...");

    try {
      const response = await fetch("/api/analyze-barcode", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode }),
      });

      const data = await response.json();

      if (response.ok) {
        this.currentAnalysis = data.data;
        this.showAnalysisResults(data);
        this.showToast("Product found! 📦", "success");
      } else {
        this.showToast(data.error || "Product not found", "error");
      }
    } catch (error) {
      this.showToast("Network error during lookup", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  async analyzeText() {
    const description = document.getElementById("foodDescription").value.trim();

    if (!description) {
      this.showToast("Please describe your food", "error");
      return;
    }

    if (description.length < 3) {
      this.showToast("Description too short", "error");
      return;
    }

    this.showLoadingOverlay("Analyzing description...");

    try {
      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (response.ok) {
        this.currentAnalysis = data.data;
        this.showAnalysisResults(data);
        this.showToast("Description analyzed! 📝", "success");
      } else {
        this.showToast(data.error || "Analysis failed", "error");
      }
    } catch (error) {
      this.showToast("Network error during analysis", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  showAnalysisResults(data) {
    const resultsContainer = document.getElementById("analysisResults");
    const itemsContainer = document.getElementById("analyzedItems");
    const summaryContainer = document.getElementById("nutritionSummary");

    // Clear previous results
    itemsContainer.innerHTML = "";

    // Show confidence
    const confidence = data.data.confidence || 0.5;
    const confidenceBadge = document.getElementById("confidenceBadge");
    const confidenceText = document.getElementById("confidenceText");

    confidenceText.textContent = `${Math.round(confidence * 100)}% Confidence`;

    if (confidence > 0.8) {
      confidenceBadge.className = "confidence-badge";
    } else if (confidence > 0.6) {
      confidenceBadge.className = "confidence-badge medium";
    } else {
      confidenceBadge.className = "confidence-badge low";
    }

    // Display analyzed items
    data.data.items.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "food-item";
      itemDiv.innerHTML = `
        <h4>${item.name}</h4>
        <p class="portion">${item.portion}</p>
        <div class="nutrition-values">
          <div class="nutrition-value">
            <span class="value">${Math.round(item.calories)}</span>
            <span class="label">Calories</span>
          </div>
          <div class="nutrition-value">
            <span class="value">${Math.round(item.protein * 10) / 10}g</span>
            <span class="label">Protein</span>
          </div>
          <div class="nutrition-value">
            <span class="value">${Math.round(item.carbs * 10) / 10}g</span>
            <span class="label">Carbs</span>
          </div>
          <div class="nutrition-value">
            <span class="value">${Math.round(item.fat * 10) / 10}g</span>
            <span class="label">Fat</span>
          </div>
        </div>
      `;
      itemsContainer.appendChild(itemDiv);
    });

    // Update summary
    const total = data.data.total;
    document.getElementById("summaryCalories").textContent = Math.round(
      total.calories
    );
    document.getElementById("summaryProtein").textContent = `${
      Math.round(total.protein * 10) / 10
    }g`;
    document.getElementById("summaryCarbs").textContent = `${
      Math.round(total.carbs * 10) / 10
    }g`;
    document.getElementById("summaryFat").textContent = `${
      Math.round(total.fat * 10) / 10
    }g`;

    // Show results
    resultsContainer.classList.remove("hidden");
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  }

  hideAnalysisResults() {
    document.getElementById("analysisResults").classList.add("hidden");
  }

  resetAnalysis() {
    this.currentAnalysis = null;
    this.hideAnalysisResults();

    // Stop camera if running
    if (this.camera) {
      this.camera.getTracks().forEach((track) => track.stop());
      this.camera = null;
      document.getElementById("startCamera").disabled = false;
      document.getElementById("capturePhoto").disabled = true;
    }

    // Clear inputs
    document.getElementById("barcodeInput").value = "";
    document.getElementById("foodDescription").value = "";
    this.updateCharCount({ target: { value: "" } });
  }

  // ===== MEAL SAVING =====
  showMealSaveModal() {
    if (!this.currentAnalysis) {
      this.showToast("No analysis to save", "error");
      return;
    }

    // Set current time
    const now = new Date();
    document.getElementById("mealTime").value = now.toTimeString().slice(0, 5);

    // Show modal
    document.getElementById("mealSaveModal").classList.add("active");

    // Setup modal events
    document.getElementById("closeMealModal").onclick = () =>
      this.hideMealSaveModal();
    document.getElementById("cancelSave").onclick = () =>
      this.hideMealSaveModal();
    document.getElementById("confirmSave").onclick = () => this.saveMeal();
  }

  hideMealSaveModal() {
    document.getElementById("mealSaveModal").classList.remove("active");
  }

  async saveMeal() {
    const mealType = document.getElementById("mealType").value;
    const mealTime = document.getElementById("mealTime").value;

    const mealData = {
      meal_type: mealType,
      meal_time: mealTime,
      items: this.currentAnalysis.items,
      total: this.currentAnalysis.total,
    };

    this.showLoadingOverlay("Saving meal...");

    try {
      const response = await fetch("/api/save-meal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mealData),
      });

      const data = await response.json();

      if (response.ok) {
        this.hideMealSaveModal();
        this.showToast(
          data.message || "Meal saved successfully! 🍽️",
          "success"
        );
        this.loadNutritionData(); // Refresh dashboard
        this.resetAnalysis();
      } else {
        this.showToast(data.error || "Failed to save meal", "error");
      }
    } catch (error) {
      this.showToast("Network error saving meal", "error");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  // ===== NUTRITION DATA =====
  async loadNutritionData(date = null) {
    const selectedDate = date || document.getElementById("dateSelector").value;

    try {
      const response = await fetch(
        `/api/nutrition-history?date=${selectedDate}&limit=50`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        this.updateDashboardStats(data.daily_stats, selectedDate);
        this.updateRecentMeals(data.data);
      }
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    }
  }

  updateDashboardStats(dailyStats, selectedDate) {
    // Find today's stats
    const todayStats = dailyStats.find(
      (stat) => stat.date === selectedDate
    ) || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
    };

    // Update values
    document.getElementById("caloriesValue").textContent = Math.round(
      todayStats.total_calories
    );
    document.getElementById("proteinValue").textContent =
      Math.round(todayStats.total_protein * 10) / 10;
    document.getElementById("carbsValue").textContent =
      Math.round(todayStats.total_carbs * 10) / 10;
    document.getElementById("fatValue").textContent =
      Math.round(todayStats.total_fat * 10) / 10;

    // Update progress bars
    const goals = {
      calories:
        parseInt(document.getElementById("caloriesGoal").textContent) || 2000,
      protein:
        parseInt(document.getElementById("proteinGoal").textContent) || 150,
      carbs: parseInt(document.getElementById("carbsGoal").textContent) || 250,
      fat: parseInt(document.getElementById("fatGoal").textContent) || 67,
    };

    this.updateProgressBar(
      "caloriesProgress",
      todayStats.total_calories,
      goals.calories
    );
    this.updateProgressBar(
      "proteinProgress",
      todayStats.total_protein,
      goals.protein
    );
    this.updateProgressBar(
      "carbsProgress",
      todayStats.total_carbs,
      goals.carbs
    );
    this.updateProgressBar("fatProgress", todayStats.total_fat, goals.fat);
  }

  updateProgressBar(elementId, current, goal) {
    const progressBar = document.getElementById(elementId);
    const percentage = Math.min(100, (current / goal) * 100);
    progressBar.style.width = `${percentage}%`;
  }

  updateRecentMeals(meals) {
    const container = document.getElementById("recentMealsList");
    container.innerHTML = "";

    if (meals.length === 0) {
      container.innerHTML =
        "<p>No meals recorded yet. Start by analyzing your first meal!</p>";
      return;
    }

    meals.slice(0, 5).forEach((meal) => {
      const mealDiv = document.createElement("div");
      mealDiv.className = "meal-item";
      mealDiv.innerHTML = `
        <div class="meal-header">
          <h4>${meal.food_name}</h4>
          <span class="meal-type">${meal.meal_type}</span>
        </div>
        <div class="meal-nutrition">
          <span>${Math.round(meal.calories)} cal</span>
          <span>${Math.round(meal.protein * 10) / 10}g protein</span>
        </div>
        <div class="meal-time">${new Date(
          meal.created_at
        ).toLocaleTimeString()}</div>
      `;
      container.appendChild(mealDiv);
    });
  }

  // ===== UTILITY FUNCTIONS =====
  updateCharCount(e) {
    const charCount = document.getElementById("charCount");
    charCount.textContent = e.target.value.length;
  }

  showLoadingOverlay(text = "Loading...") {
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = document.getElementById("loadingText");
    loadingText.textContent = text;
    overlay.classList.remove("hidden");
    this.isLoading = true;
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.add("hidden");
    this.isLoading = false;
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "⚠️";
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    const icon = document.querySelector("#themeToggle i");
    icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  // ===== NUTRITION GOALS =====
  async loadNutritionGoals() {
    try {
      const response = await fetch("/api/nutrition-goals", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      const data = await response.json();

      if (response.ok && data.goals) {
        document.getElementById("caloriesGoalInput").value =
          data.goals.calories_goal;
        document.getElementById("proteinGoalInput").value =
          data.goals.protein_goal;
        document.getElementById("carbsGoalInput").value = data.goals.carbs_goal;
        document.getElementById("fatGoalInput").value = data.goals.fat_goal;

        // Update dashboard goals display
        document.getElementById("caloriesGoal").textContent =
          data.goals.calories_goal;
        document.getElementById("proteinGoal").textContent =
          data.goals.protein_goal;
        document.getElementById("carbsGoal").textContent =
          data.goals.carbs_goal;
        document.getElementById("fatGoal").textContent = data.goals.fat_goal;
      }
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  }

  async loadNutritionHistory() {
    try {
      const response = await fetch("/api/nutrition-history?limit=100", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      const data = await response.json();

      if (response.ok) {
        this.displayNutritionHistory(data.data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }

  displayNutritionHistory(history) {
    const container = document.getElementById("historyList");
    container.innerHTML = "";

    if (history.length === 0) {
      container.innerHTML =
        "<p>No nutrition history yet. Start tracking your meals!</p>";
      return;
    }

    // Group by date
    const groupedByDate = history.reduce((groups, entry) => {
      const date = entry.created_at.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
      return groups;
    }, {});

    Object.keys(groupedByDate).forEach((date) => {
      const dateDiv = document.createElement("div");
      dateDiv.className = "history-date-group";

      const dateHeader = document.createElement("h3");
      dateHeader.textContent = new Date(date).toLocaleDateString();
      dateDiv.appendChild(dateHeader);

      groupedByDate[date].forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "history-entry";
        entryDiv.innerHTML = `
          <div class="entry-header">
            <h4>${entry.food_name}</h4>
            <span class="meal-type">${entry.meal_type}</span>
          </div>
          <div class="entry-nutrition">
            <span>${Math.round(entry.calories)} cal</span>
            <span>${Math.round(entry.protein * 10) / 10}g protein</span>
            <span>${Math.round(entry.carbs * 10) / 10}g carbs</span>
            <span>${Math.round(entry.fat * 10) / 10}g fat</span>
          </div>
          <div class="entry-time">${new Date(
            entry.created_at
          ).toLocaleTimeString()}</div>
        `;
        dateDiv.appendChild(entryDiv);
      });

      container.appendChild(dateDiv);
    });
  }
}

// Language Support Functions
function changeLanguage(language) {
  console.log(`🌍 Attempting to change language to: ${language}`);

  if (window.languageManager) {
    window.languageManager.setLanguage(language);
    console.log(`✅ Language changed to: ${language}`);

    // Update specific components that need manual refresh
    updateDashboardLabels();
    updateAnalysisLabels();

    // Force update interface
    setTimeout(() => {
      window.languageManager.updateInterface();
    }, 100);
  } else {
    console.error("❌ Language Manager not available");
    // Try to initialize language manager
    if (window.translations) {
      window.languageManager = new LanguageManager();
      window.languageManager.setLanguage(language);
      console.log(
        `🔄 Language Manager recreated and language set to: ${language}`
      );
    }
  }
}

function updateDashboardLabels() {
  // Update dashboard stat labels dynamically - the data-i18n attributes handle this now
  // But we need to add (g) suffix for macros
  if (window.languageManager) {
    const proteinLabel = document.querySelector(".protein .stat-label");
    if (proteinLabel) {
      proteinLabel.textContent =
        window.languageManager.getText("protein") + " (g)";
    }

    const carbsLabel = document.querySelector(".carbs .stat-label");
    if (carbsLabel) {
      carbsLabel.textContent = window.languageManager.getText("carbs") + " (g)";
    }

    const fatLabel = document.querySelector(".fat .stat-label");
    if (fatLabel) {
      fatLabel.textContent = window.languageManager.getText("fat") + " (g)";
    }
  }
}

function updateAnalysisLabels() {
  // Update placeholders
  const textDescription = document.getElementById("textDescription");
  if (textDescription && window.languageManager) {
    textDescription.placeholder =
      window.languageManager.getText("textDescription");
  }

  // Update button texts that aren't handled by data-i18n
  const analyzeButton = document.querySelector(
    '.btn-primary[onclick="foodTracker.analyzeText()"]'
  );
  if (analyzeButton && window.languageManager) {
    analyzeButton.innerHTML = `<i class="fas fa-magic"></i> ${window.languageManager.getText(
      "analyzeText"
    )}`;
  }
}

// Listen for language changes
document.addEventListener("languageChanged", function (event) {
  console.log("🌍 Language changed event received:", event.detail.language);

  // Update any dynamic content
  updateDashboardLabels();
  updateAnalysisLabels();
});

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM loaded, initializing app...");

  // Initialize language system first
  if (window.languageManager) {
    console.log("✅ Language Manager available, initializing...");
    window.languageManager.init();
    console.log("🌍 Multi-language system initialized");
  } else {
    console.warn(
      "⚠️ Language Manager not available yet, trying to initialize..."
    );
    if (window.translations && window.LanguageManager) {
      window.languageManager = new LanguageManager();
      window.languageManager.init();
      console.log("🔄 Language Manager created and initialized");
    }
  }

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeIcon = document.querySelector("#themeToggle i");
  if (themeIcon) {
    themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  // Initialize the app
  window.foodTracker = new FoodTrackerAI();

  // Set up language selector event listener
  const languageSelector = document.getElementById("languageSelector");
  if (languageSelector) {
    languageSelector.addEventListener("change", (e) => {
      console.log(`🌍 Language selector changed to: ${e.target.value}`);
      changeLanguage(e.target.value);
    });

    // Set current language in selector
    if (window.languageManager) {
      languageSelector.value = window.languageManager.currentLanguage;
    }
  }
});

// Add some CSS for the new history styles
const additionalCSS = `
.meal-item {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border-left: 4px solid var(--primary-color);
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.meal-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.meal-type {
  background: var(--primary-color);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  text-transform: capitalize;
}

.meal-nutrition {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.meal-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.history-date-group {
  margin-bottom: var(--spacing-xl);
}

.history-date-group h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--border-color);
}

.history-entry {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.entry-nutrition {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.entry-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
`;

// Inject additional CSS
const style = document.createElement("style");
style.textContent = additionalCSS;
document.head.appendChild(style);
