const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your_super_secret_jwt_key_here_change_in_production";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Инициализация базы данных
const db = new sqlite3.Database("users.db");

// Создание таблицы пользователей
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Токен доступа не предоставлен" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
    req.user = user;
    next();
  });
};

// Маршрут регистрации
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Валидация входных данных
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Пароль должен содержать минимум 6 символов" });
    }

    // Проверка на существование пользователя
    db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: "Ошибка базы данных" });
        }

        if (row) {
          return res
            .status(400)
            .json({
              error: "Пользователь с таким именем или email уже существует",
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        db.run(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ error: "Ошибка при создании пользователя" });
            }

            // Создание JWT токена
            const token = jwt.sign(
              { id: this.lastID, username: username },
              JWT_SECRET,
              { expiresIn: "24h" }
            );

            res.status(201).json({
              message: "Пользователь успешно зарегистрирован",
              token: token,
              user: {
                id: this.lastID,
                username: username,
                email: email,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Маршрут авторизации
app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Имя пользователя и пароль обязательны" });
    }

    // Поиск пользователя
    db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: "Ошибка базы данных" });
        }

        if (!user) {
          return res.status(400).json({ error: "Неверные учетные данные" });
        }

        // Проверка пароля
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(400).json({ error: "Неверные учетные данные" });
        }

        // Создание JWT токена
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          message: "Успешная авторизация",
          token: token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Защищенный маршрут для получения профиля пользователя
app.get("/api/profile", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, username, email, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Ошибка базы данных" });
      }

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      res.json({ user });
    }
  );
});

// Маршрут для получения всех пользователей (только для демонстрации)
app.get("/api/users", authenticateToken, (req, res) => {
  db.all("SELECT id, username, email, created_at FROM users", (err, users) => {
    if (err) {
      return res.status(500).json({ error: "Ошибка базы данных" });
    }

    res.json({ users });
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} в браузере`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("База данных закрыта.");
    process.exit(0);
  });
});
