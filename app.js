// Главное приложение для управления тестами

class TestApp {
  constructor() {
    this.tests = this.loadFromStorage("tests") || [];
    this.responses = this.loadFromStorage("responses") || [];
    this.currentUser = null;
    this.currentRole = null;
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  // Хранилище данных
  loadFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  }

  saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Рендеринг главной страницы
  render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>📝 Система тестирования</h1>
          <div class="nav-buttons">
            <button class="btn-primary" onclick="app.goHome()">Главная</button>
            ${this.currentRole ? `<button class="btn-secondary" onclick="app.logout()">Выход</button>` : ""}
          </div>
        </header>
        <div class="main-content">
          ${this.getViewHTML()}
        </div>
      </div>
    `;
  }

  getViewHTML() {
    if (!this.currentRole) {
      return this.getHomeView();
    }

    if (this.currentRole === "admin") {
      return this.getAdminView();
    }

    if (this.currentRole === "user") {
      return this.getUserView();
    }
  }

  getHomeView() {
    return `
      <div class="home-view">
        <h2>Добро пожаловать!</h2>
        <p style="color: #666; margin-bottom: 30px; font-size: 16px;">Выберите вашу роль:</p>
        <div class="role-buttons">
          <div class="role-card" onclick="app.selectRole('admin')">
            <h3>👨‍💼 Администратор</h3>
            <p>Создавайте и управляйте тестами, просматривайте результаты</p>
          </div>
          <div class="role-card" onclick="app.selectRole('user')">
            <h3>👤 Пользователь</h3>
            <p>Проходите тесты и просматривайте свои результаты</p>
          </div>
        </div>
      </div>
    `;
  }

  getAdminView() {
    return `
      <div class="admin-view">
        <h2>Панель администратора</h2>
        <div class="admin-controls">
          <button class="btn-primary" onclick="admin.showCreateTestForm()">+ Создать новый тест</button>
          <button class="btn-secondary" onclick="admin.showResponsesView()">📊 Просмотреть результаты</button>
        </div>
        <div id="admin-content"></div>
      </div>
    `;
  }

  getUserView() {
    return `
      <div class="user-view">
        <h2>Доступные тесты</h2>
        <div id="user-content"></div>
      </div>
    `;
  }

  selectRole(role) {
    this.currentRole = role;
    if (role === "admin") {
      this.currentUser = "Admin";
    }
    this.render();
    if (role === "admin") {
      admin.showTestsList();
    } else {
      user.showTestsList();
    }
  }

  goHome() {
    this.currentRole = null;
    this.currentUser = null;
    this.render();
  }

  logout() {
    this.goHome();
  }

  setupEventListeners() {
    // Обработчики событий будут добавлены в admin.js и user.js
  }

  // Утилиты
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showMessage(message, type = "info") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;

    const content = document.querySelector(".main-content");
    content.insertBefore(messageDiv, content.firstChild);

    setTimeout(() => messageDiv.remove(), 3000);
  }

  // Экспорт тестов (для отправки)
  exportTest(testId) {
    const test = this.tests.find((t) => t.id === testId);
    if (!test) return null;

    return {
      id: test.id,
      title: test.title,
      description: test.description,
      questions: test.questions,
    };
  }

  // Импорт тестов (для получения)
  importTest(testData) {
    const newTest = {
      ...testData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      responses: [],
    };
    this.tests.push(newTest);
    this.saveToStorage("tests", this.tests);
    return newTest;
  }
}

// Инициализация приложения
const app = new TestApp();
