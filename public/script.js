// Глобальные переменные
let currentUser = null;
let authToken = localStorage.getItem("authToken");

// Проверка авторизации при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  if (authToken) {
    checkAuthStatus();
  }
});

// Функции переключения между формами
function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.querySelectorAll(".tab-btn")[0].classList.add("active");
  document.querySelectorAll(".tab-btn")[1].classList.remove("active");
  hideMessage();
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  document.querySelectorAll(".tab-btn")[0].classList.remove("active");
  document.querySelectorAll(".tab-btn")[1].classList.add("active");
  hideMessage();
}

// Функция авторизации
async function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem("authToken", authToken);

      showMessage(data.message, "success");
      setTimeout(() => {
        showUserPanel();
      }, 1000);
    } else {
      showMessage(data.error, "error");
    }
  } catch (error) {
    showMessage("Ошибка подключения к серверу", "error");
  }
}

// Функция регистрации
async function register(event) {
  event.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Проверка совпадения паролей
  if (password !== confirmPassword) {
    showMessage("Пароли не совпадают", "error");
    return;
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem("authToken", authToken);

      showMessage(data.message, "success");
      setTimeout(() => {
        showUserPanel();
      }, 1000);
    } else {
      showMessage(data.error, "error");
    }
  } catch (error) {
    showMessage("Ошибка подключения к серверу", "error");
  }
}

// Функция проверки статуса авторизации
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showUserPanel();
    } else {
      logout();
    }
  } catch (error) {
    logout();
  }
}

// Функция выхода
function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("authToken");

  // Скрыть панель пользователя и показать формы авторизации
  document.getElementById("userPanel").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");

  // Сбросить активную вкладку
  document.querySelectorAll(".tab-btn")[0].classList.add("active");
  document.querySelectorAll(".tab-btn")[1].classList.remove("active");

  // Очистить формы
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  document.getElementById("registerUsername").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
  document.getElementById("confirmPassword").value = "";

  hideMessage();
  showMessage("Вы успешно вышли из системы", "success");
}

// Функция отображения панели пользователя
function showUserPanel() {
  // Скрыть формы авторизации
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");

  // Показать панель пользователя
  document.getElementById("userPanel").classList.remove("hidden");

  // Заполнить информацию о пользователе
  const userDetails = document.getElementById("userDetails");
  userDetails.innerHTML = `
        <h3>Информация о пользователе</h3>
        <p><strong>ID:</strong> ${currentUser.id}</p>
        <p><strong>Имя пользователя:</strong> ${currentUser.username}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Дата регистрации:</strong> ${new Date(
          currentUser.created_at
        ).toLocaleString("ru-RU")}</p>
    `;
}

// Функция загрузки списка пользователей
async function loadUsers() {
  try {
    const response = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      displayUsers(data.users);
    } else {
      showMessage("Ошибка при загрузке пользователей", "error");
    }
  } catch (error) {
    showMessage("Ошибка подключения к серверу", "error");
  }
}

// Функция отображения списка пользователей
function displayUsers(users) {
  const usersList = document.getElementById("usersList");

  if (users.length === 0) {
    usersList.innerHTML = "<p>Пользователи не найдены</p>";
    usersList.classList.remove("hidden");
    return;
  }

  let usersHTML = "<h3>Зарегистрированные пользователи</h3>";

  users.forEach((user) => {
    usersHTML += `
            <div class="user-item">
                <h4>${user.username}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Дата регистрации:</strong> ${new Date(
                  user.created_at
                ).toLocaleString("ru-RU")}</p>
            </div>
        `;
  });

  usersList.innerHTML = usersHTML;
  usersList.classList.remove("hidden");
}

// Функция отображения сообщений
function showMessage(text, type) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
  messageElement.classList.remove("hidden");

  // Автоматически скрыть сообщение через 5 секунд
  setTimeout(() => {
    hideMessage();
  }, 5000);
}

// Функция скрытия сообщений
function hideMessage() {
  const messageElement = document.getElementById("message");
  messageElement.classList.add("hidden");
}

// Обработка ошибок сети
window.addEventListener("online", function () {
  showMessage("Соединение восстановлено", "success");
});

window.addEventListener("offline", function () {
  showMessage("Отсутствует подключение к интернету", "error");
});
