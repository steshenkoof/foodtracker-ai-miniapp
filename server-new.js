const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const { body, validationResult } = require("express-validator");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Import AI service
const aiService = require("./services/aiService");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your_super_secret_jwt_key_here_change_in_production";

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));

// Rate limiting - Cal AI style
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit image uploads
  message: {
    error: "Too many image uploads, please wait before uploading again.",
  },
});

// Apply rate limiting
app.use("/api/", apiLimiter);
app.use("/api/analyze-image", uploadLimiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit like Cal AI
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Initialize database with extended schema for Cal AI features
const db = new sqlite3.Database("foodtracker_ai.db");

// Create tables for Cal AI clone
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    subscription_type TEXT DEFAULT 'free',
    profile_data TEXT
  )`);

  // Food entries table (Cal AI core feature)
  db.run(`CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    food_name TEXT NOT NULL,
    portion TEXT NOT NULL,
    calories REAL NOT NULL,
    protein REAL DEFAULT 0,
    carbs REAL DEFAULT 0,
    fat REAL DEFAULT 0,
    fiber REAL DEFAULT 0,
    analysis_method TEXT NOT NULL,
    confidence REAL DEFAULT 0,
    image_path TEXT,
    barcode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Health metrics table (Cal AI health integration)
  db.run(`CREATE TABLE IF NOT EXISTS health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'manual',
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Nutrition goals table
  db.run(`CREATE TABLE IF NOT EXISTS nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    calories_goal REAL NOT NULL,
    protein_goal REAL NOT NULL,
    carbs_goal REAL NOT NULL,
    fat_goal REAL NOT NULL,
    activity_level TEXT DEFAULT 'moderate',
    goal_type TEXT DEFAULT 'maintain',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // User corrections for AI learning
  db.run(`CREATE TABLE IF NOT EXISTS ai_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    original_calories REAL NOT NULL,
    corrected_calories REAL NOT NULL,
    original_protein REAL,
    corrected_protein REAL,
    original_carbs REAL,
    corrected_carbs REAL,
    original_fat REAL,
    corrected_fat REAL,
    correction_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Barcode cache for faster lookups
  db.run(`CREATE TABLE IF NOT EXISTS barcode_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    calories_per_serving REAL NOT NULL,
    protein_per_serving REAL,
    carbs_per_serving REAL,
    fat_per_serving REAL,
    serving_size TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateAnalysisRequest = [
  body("metadata").optional().isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// =============================================================================
// AUTHENTICATION ROUTES (Extended for Cal AI)
// =============================================================================

app.post(
  "/api/register",
  [
    body("username").isLength({ min: 3 }).trim().escape(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("profile").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, profile } = req.body;

      // Check existing user
      db.get(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, email],
        async (err, row) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          if (row) {
            return res.status(400).json({ error: "User already exists" });
          }

          const hashedPassword = await bcrypt.hash(password, 12);
          const profileData = JSON.stringify(profile || {});

          db.run(
            "INSERT INTO users (username, email, password, profile_data) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, profileData],
            function (err) {
              if (err) {
                return res.status(500).json({ error: "Error creating user" });
              }

              // Create default nutrition goals
              const defaultGoals = {
                calories_goal: 2000,
                protein_goal: 150,
                carbs_goal: 250,
                fat_goal: 67,
              };

              db.run(
                `INSERT INTO nutrition_goals 
            (user_id, calories_goal, protein_goal, carbs_goal, fat_goal) 
            VALUES (?, ?, ?, ?, ?)`,
                [
                  this.lastID,
                  defaultGoals.calories_goal,
                  defaultGoals.protein_goal,
                  defaultGoals.carbs_goal,
                  defaultGoals.fat_goal,
                ]
              );

              const token = jwt.sign(
                { id: this.lastID, username: username },
                JWT_SECRET,
                { expiresIn: "30d" } // Cal AI style long sessions
              );

              res.status(201).json({
                success: true,
                message: "Account created successfully",
                token: token,
                user: {
                  id: this.lastID,
                  username: username,
                  email: email,
                  subscription: "free",
                },
              });
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.post(
  "/api/login",
  [body("username").trim().escape(), body("password").isLength({ min: 1 })],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      db.get(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, username],
        async (err, user) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
          }

          const validPassword = await bcrypt.compare(password, user.password);
          if (!validPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
          }

          // Update last login
          db.run(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
            [user.id]
          );

          const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "30d" }
          );

          res.json({
            success: true,
            message: "Login successful",
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              subscription: user.subscription_type,
              profile: JSON.parse(user.profile_data || "{}"),
            },
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// =============================================================================
// FOOD ANALYSIS ROUTES (Cal AI Core Features)
// =============================================================================

// Analyze food from image (Cal AI's main feature)
app.post(
  "/api/analyze-image",
  authenticateToken,
  upload.single("food_image"),
  validateAnalysisRequest,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

      // Process image with AI service
      const analysis = await aiService.analyzeFood(req.file.buffer, metadata);

      if (!analysis.success) {
        return res.status(500).json({
          error: "Analysis failed",
          fallback: analysis.fallback,
          details: analysis.error,
        });
      }

      // Save analysis to database for learning
      const imageId = uuidv4();

      // Store each food item
      for (const item of analysis.data.items) {
        db.run(
          `INSERT INTO food_entries 
        (user_id, meal_type, food_name, portion, calories, protein, carbs, fat, fiber, analysis_method, confidence, image_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            "unspecified",
            item.name,
            item.portion,
            item.calories,
            item.protein,
            item.carbs,
            item.fat,
            item.fiber || 0,
            "image_ai",
            item.confidence,
            imageId,
          ]
        );
      }

      res.json({
        success: true,
        data: analysis.data,
        provider: analysis.provider,
        processing_time: Date.now() - analysis.processingTime,
        tips: {
          accuracy:
            analysis.data.accuracy_notes ||
            "For better accuracy, ensure good lighting and clear view of food",
          confidence:
            analysis.data.confidence > 0.8
              ? "High confidence result"
              : "Consider verifying the analysis",
        },
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze image",
        fallback: await aiService.basicFoodAnalysis(),
      });
    }
  }
);

// Analyze barcode (Cal AI feature)
app.post(
  "/api/analyze-barcode",
  authenticateToken,
  [body("barcode").isLength({ min: 8, max: 13 }).isNumeric()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid barcode format" });
      }

      const { barcode } = req.body;

      // Check cache first
      db.get(
        "SELECT * FROM barcode_cache WHERE barcode = ?",
        [barcode],
        async (err, cached) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          if (cached) {
            // Return cached result
            return res.json({
              success: true,
              data: {
                items: [
                  {
                    name: cached.product_name,
                    brand: cached.brand,
                    portion: cached.serving_size,
                    calories: cached.calories_per_serving,
                    protein: cached.protein_per_serving,
                    carbs: cached.carbs_per_serving,
                    fat: cached.fat_per_serving,
                    confidence: 0.95,
                  },
                ],
                total: {
                  calories: cached.calories_per_serving,
                  protein: cached.protein_per_serving,
                  carbs: cached.carbs_per_serving,
                  fat: cached.fat_per_serving,
                },
              },
              source: "cache",
            });
          }

          // Analyze with AI service
          const analysis = await aiService.analyzeBarcodeProduct(barcode);

          if (analysis.error) {
            return res
              .status(404)
              .json({ error: "Product not found in database" });
          }

          // Cache the result
          if (analysis.success) {
            const item = analysis.items[0];
            db.run(
              `INSERT OR REPLACE INTO barcode_cache 
          (barcode, product_name, brand, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, serving_size) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                barcode,
                item.name,
                item.brand || "",
                item.calories,
                item.protein,
                item.carbs,
                item.fat,
                item.portion,
              ]
            );
          }

          res.json({
            success: true,
            data: analysis,
            source: "api",
          });
        }
      );
    } catch (error) {
      console.error("Barcode analysis error:", error);
      res.status(500).json({ error: "Failed to analyze barcode" });
    }
  }
);

// Analyze text description (Cal AI feature)
app.post(
  "/api/analyze-text",
  authenticateToken,
  [body("description").isLength({ min: 3, max: 1000 }).trim().escape()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid description" });
      }

      const { description } = req.body;

      const analysis = await aiService.analyzeTextDescription(description);

      if (!analysis || !analysis.items) {
        return res
          .status(500)
          .json({ error: "Failed to analyze text description" });
      }

      // Save to database
      for (const item of analysis.items) {
        db.run(
          `INSERT INTO food_entries 
        (user_id, meal_type, food_name, portion, calories, protein, carbs, fat, analysis_method, confidence) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            "unspecified",
            item.name,
            item.portion,
            item.calories,
            item.protein,
            item.carbs,
            item.fat,
            "text_ai",
            item.confidence,
          ]
        );
      }

      res.json({
        success: true,
        data: analysis,
        input: description,
      });
    } catch (error) {
      console.error("Text analysis error:", error);
      res.status(500).json({ error: "Failed to analyze text description" });
    }
  }
);

// =============================================================================
// NUTRITION TRACKING ROUTES (Cal AI Dashboard Features)
// =============================================================================

// Save meal (manually or from analysis)
app.post(
  "/api/save-meal",
  authenticateToken,
  [
    body("meal_type").isIn(["breakfast", "lunch", "dinner", "snack"]),
    body("items").isArray({ min: 1 }),
    body("total").isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { meal_type, items, total } = req.body;
      const mealId = uuidv4();

      // Save each item
      for (const item of items) {
        db.run(
          `INSERT INTO food_entries 
        (user_id, meal_type, food_name, portion, calories, protein, carbs, fat, analysis_method, confidence) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            meal_type,
            item.name,
            item.portion,
            item.calories,
            item.protein,
            item.carbs,
            item.fat,
            "manual",
            1.0,
          ]
        );
      }

      res.json({
        success: true,
        meal_id: mealId,
        message: "Meal saved successfully",
      });
    } catch (error) {
      console.error("Save meal error:", error);
      res.status(500).json({ error: "Failed to save meal" });
    }
  }
);

// Get nutrition history with analytics
app.get("/api/nutrition-history", authenticateToken, async (req, res) => {
  try {
    const { date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM food_entries 
      WHERE user_id = ?
    `;
    let params = [req.user.id];

    if (date) {
      query += ` AND DATE(created_at) = ?`;
      params.push(date);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, entries) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Get daily totals
      const dailyQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(calories) as total_calories,
          SUM(protein) as total_protein,
          SUM(carbs) as total_carbs,
          SUM(fat) as total_fat,
          COUNT(*) as items_count
        FROM food_entries 
        WHERE user_id = ?
        ${date ? "AND DATE(created_at) = ?" : ""}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      const dailyParams = date ? [req.user.id, date] : [req.user.id];

      db.all(dailyQuery, dailyParams, (err, dailyStats) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          success: true,
          data: entries,
          daily_stats: dailyStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            has_more: entries.length === parseInt(limit),
          },
        });
      });
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to get nutrition history" });
  }
});

// User correction for AI learning (Cal AI learning feature)
app.post(
  "/api/user-correction",
  authenticateToken,
  [
    body("original_analysis").isObject(),
    body("corrected_values").isObject(),
    body("confidence").optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { original_analysis, corrected_values, confidence } = req.body;

      db.run(
        `INSERT INTO ai_corrections 
      (user_id, food_name, original_calories, corrected_calories, original_protein, corrected_protein, 
       original_carbs, corrected_carbs, original_fat, corrected_fat, correction_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          corrected_values.name,
          original_analysis.calories,
          corrected_values.calories,
          original_analysis.protein,
          corrected_values.protein,
          original_analysis.carbs,
          corrected_values.carbs,
          original_analysis.fat,
          corrected_values.fat,
          "user_feedback",
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to save correction" });
          }

          res.json({
            success: true,
            message:
              "Thank you for the correction! This helps improve our AI accuracy.",
            correction_id: this.lastID,
          });
        }
      );
    } catch (error) {
      console.error("Correction error:", error);
      res.status(500).json({ error: "Failed to save correction" });
    }
  }
);

// =============================================================================
// HEALTH INTEGRATION ROUTES (Cal AI Health App Integration)
// =============================================================================

// Save health metrics (weight, blood pressure, etc.)
app.post(
  "/api/health-metrics",
  authenticateToken,
  [
    body("metric_type").isIn([
      "weight",
      "blood_pressure",
      "heart_rate",
      "steps",
      "sleep",
      "water_intake",
    ]),
    body("value").isNumeric(),
    body("unit").isLength({ min: 1, max: 10 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { metric_type, value, unit, source = "manual" } = req.body;

      db.run(
        `INSERT INTO health_metrics (user_id, metric_type, value, unit, source) 
      VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, metric_type, value, unit, source],
        function (err) {
          if (err) {
            return res
              .status(500)
              .json({ error: "Failed to save health metric" });
          }

          res.json({
            success: true,
            message: "Health metric saved successfully",
            metric_id: this.lastID,
          });
        }
      );
    } catch (error) {
      console.error("Health metrics error:", error);
      res.status(500).json({ error: "Failed to save health metrics" });
    }
  }
);

// Get health metrics
app.get("/api/health-metrics", authenticateToken, async (req, res) => {
  try {
    const { metric_type, days = 30 } = req.query;

    let query = `
      SELECT * FROM health_metrics 
      WHERE user_id = ? 
      AND recorded_at >= DATE('now', '-${parseInt(days)} days')
    `;
    let params = [req.user.id];

    if (metric_type) {
      query += ` AND metric_type = ?`;
      params.push(metric_type);
    }

    query += ` ORDER BY recorded_at DESC`;

    db.all(query, params, (err, metrics) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        success: true,
        data: metrics,
        summary: {
          total_entries: metrics.length,
          date_range: `${days} days`,
          available_metrics: [...new Set(metrics.map((m) => m.metric_type))],
        },
      });
    });
  } catch (error) {
    console.error("Get health metrics error:", error);
    res.status(500).json({ error: "Failed to get health metrics" });
  }
});

// =============================================================================
// NUTRITION GOALS ROUTES
// =============================================================================

// Get nutrition goals
app.get("/api/nutrition-goals", authenticateToken, async (req, res) => {
  try {
    db.get(
      "SELECT * FROM nutrition_goals WHERE user_id = ?",
      [req.user.id],
      (err, goals) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (!goals) {
          // Create default goals
          const defaultGoals = {
            calories_goal: 2000,
            protein_goal: 150,
            carbs_goal: 250,
            fat_goal: 67,
            activity_level: "moderate",
            goal_type: "maintain",
          };

          db.run(
            `INSERT INTO nutrition_goals 
          (user_id, calories_goal, protein_goal, carbs_goal, fat_goal, activity_level, goal_type) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.id,
              defaultGoals.calories_goal,
              defaultGoals.protein_goal,
              defaultGoals.carbs_goal,
              defaultGoals.fat_goal,
              defaultGoals.activity_level,
              defaultGoals.goal_type,
            ],
            function (err) {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed to create default goals" });
              }

              res.json({
                success: true,
                goals: { ...defaultGoals, id: this.lastID },
              });
            }
          );
        } else {
          res.json({
            success: true,
            goals: goals,
          });
        }
      }
    );
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Failed to get nutrition goals" });
  }
});

// Update nutrition goals
app.put(
  "/api/nutrition-goals",
  authenticateToken,
  [
    body("goals").isObject(),
    body("goals.calories").optional().isFloat({ min: 800, max: 5000 }),
    body("goals.protein").optional().isFloat({ min: 10, max: 500 }),
    body("goals.carbs").optional().isFloat({ min: 50, max: 1000 }),
    body("goals.fat").optional().isFloat({ min: 20, max: 300 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { goals } = req.body;

      db.run(
        `UPDATE nutrition_goals SET 
      calories_goal = COALESCE(?, calories_goal),
      protein_goal = COALESCE(?, protein_goal),
      carbs_goal = COALESCE(?, carbs_goal),
      fat_goal = COALESCE(?, fat_goal),
      activity_level = COALESCE(?, activity_level),
      goal_type = COALESCE(?, goal_type),
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
        [
          goals.calories,
          goals.protein,
          goals.carbs,
          goals.fat,
          goals.activity_level,
          goals.goal_type,
          req.user.id,
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to update goals" });
          }

          res.json({
            success: true,
            message: "Nutrition goals updated successfully",
          });
        }
      );
    } catch (error) {
      console.error("Update goals error:", error);
      res.status(500).json({ error: "Failed to update nutrition goals" });
    }
  }
);

// =============================================================================
// ANALYTICS & INSIGHTS ROUTES (Cal AI Premium Features)
// =============================================================================

// Get nutrition insights and analytics
app.get("/api/nutrition-insights", authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get recent nutrition data
    const nutritionQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(calories) as daily_calories,
        SUM(protein) as daily_protein,
        SUM(carbs) as daily_carbs,
        SUM(fat) as daily_fat,
        COUNT(*) as items_count
      FROM food_entries 
      WHERE user_id = ? 
      AND created_at >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    db.all(nutritionQuery, [req.user.id], (err, nutritionData) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      // Get goals for comparison
      db.get(
        "SELECT * FROM nutrition_goals WHERE user_id = ?",
        [req.user.id],
        (err, goals) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          // Calculate insights
          const insights = {
            average_daily_calories:
              nutritionData.reduce((sum, day) => sum + day.daily_calories, 0) /
                nutritionData.length || 0,
            goal_adherence: goals
              ? {
                  calories:
                    nutritionData.length > 0
                      ? nutritionData.reduce(
                          (sum, day) => sum + day.daily_calories,
                          0
                        ) /
                        nutritionData.length /
                        goals.calories_goal
                      : 0,
                  protein:
                    nutritionData.length > 0
                      ? nutritionData.reduce(
                          (sum, day) => sum + day.daily_protein,
                          0
                        ) /
                        nutritionData.length /
                        goals.protein_goal
                      : 0,
                }
              : null,
            trends: {
              direction:
                nutritionData.length >= 2
                  ? nutritionData[0].daily_calories >
                    nutritionData[nutritionData.length - 1].daily_calories
                    ? "increasing"
                    : "decreasing"
                  : "stable",
              consistency:
                nutritionData.length > 0
                  ? nutritionData.length / parseInt(days)
                  : 0,
            },
            recommendations: [],
          };

          // Add recommendations based on data
          if (insights.average_daily_calories < goals?.calories_goal * 0.8) {
            insights.recommendations.push(
              "Consider increasing calorie intake to meet your goals"
            );
          }
          if (insights.goal_adherence?.protein < 0.8) {
            insights.recommendations.push(
              "Try to include more protein sources in your meals"
            );
          }

          res.json({
            success: true,
            insights: insights,
            nutrition_data: nutritionData,
            period: `${days} days`,
          });
        }
      );
    });
  } catch (error) {
    console.error("Insights error:", error);
    res.status(500).json({ error: "Failed to get nutrition insights" });
  }
});

// =============================================================================
// STATIC ROUTES
// =============================================================================

// Serve main app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cal-ai-clone.html"));
});

// API documentation
app.get("/api/docs", (req, res) => {
  res.json({
    name: "FoodTracker AI Pro - Cal AI Clone",
    version: "1.0.0",
    description: "Professional food tracking with AI analysis",
    endpoints: {
      authentication: ["POST /api/register", "POST /api/login"],
      food_analysis: [
        "POST /api/analyze-image",
        "POST /api/analyze-barcode",
        "POST /api/analyze-text",
      ],
      nutrition_tracking: [
        "POST /api/save-meal",
        "GET /api/nutrition-history",
        "POST /api/user-correction",
      ],
      health_integration: [
        "POST /api/health-metrics",
        "GET /api/health-metrics",
      ],
      goals_analytics: [
        "GET /api/nutrition-goals",
        "PUT /api/nutrition-goals",
        "GET /api/nutrition-insights",
      ],
    },
    features: [
      "AI-powered food recognition",
      "Barcode scanning",
      "Text description analysis",
      "Health metrics integration",
      "Nutrition goal tracking",
      "Advanced analytics",
      "User learning corrections",
    ],
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum 10MB allowed." });
    }
  }

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 FoodTracker AI Pro (Cal AI Clone) running on port ${PORT}`);
  console.log(`📱 Main app: http://localhost:${PORT}`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log("");
  console.log("🔥 Features available:");
  console.log("   📸 AI Food Image Analysis");
  console.log("   📊 Barcode Scanning");
  console.log("   📝 Text Description Analysis");
  console.log("   💪 Health Metrics Integration");
  console.log("   🎯 Smart Nutrition Goals");
  console.log("   📈 Advanced Analytics & Insights");
  console.log("   🧠 Machine Learning Corrections");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("📊 Database connection closed.");
    }
    server.close(() => {
      console.log("🔥 Server closed. Goodbye!");
      process.exit(0);
    });
  });
});

module.exports = app;
