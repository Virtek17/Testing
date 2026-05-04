// Функции администратора

class AdminPanel {
  constructor() {
    this.currentEditingTest = null;
    this.currentEditingQuestion = null;
  }

  showTestsList() {
    const content = document.getElementById("admin-content");

    if (app.tests.length === 0) {
      content.innerHTML = `
        <div class="text-center" style="padding: 40px; color: #999;">
          <p style="font-size: 16px;">Тестов еще не создано</p>
          <p style="font-size: 14px; margin-top: 10px;">Нажмите кнопку "Создать новый тест" чтобы начать</p>
        </div>
      `;
      return;
    }

    let html = '<div class="tests-grid">';

    app.tests.forEach((test) => {
      const responseCount = test.responses ? test.responses.length : 0;
      html += `
        <div class="test-card">
          <h3>${this.escapeHtml(test.title)}</h3>
          <p>${this.escapeHtml(test.description)}</p>
          <p style="color: #999; font-size: 12px;">
            Вопросов: ${test.questions.length} | Ответов: ${responseCount}
          </p>
          <div class="test-card-actions">
            <button class="btn-primary btn-small" onclick="admin.editTest('${test.id}')">✏️ Редактировать</button>
            <button class="btn-secondary btn-small" onclick="admin.shareTest('${test.id}')">📤 Поделиться</button>
            <button class="btn-danger btn-small" onclick="admin.deleteTest('${test.id}')">🗑️ Удалить</button>
          </div>
        </div>
      `;
    });

    html += "</div>";
    content.innerHTML = html;
  }

  showCreateTestForm() {
    this.currentEditingTest = null;
    this.showTestForm();
  }

  showTestForm() {
    const test = this.currentEditingTest
      ? app.tests.find((t) => t.id === this.currentEditingTest)
      : null;

    const content = document.getElementById("admin-content");
    content.innerHTML = `
      <div style="max-width: 900px;">
        <h3>${test ? "Редактировать тест" : "Создать новый тест"}</h3>
        
        <div class="form-group">
          <label>Название теста</label>
          <input type="text" id="testTitle" value="${test ? this.escapeHtml(test.title) : ""}" placeholder="Введите название теста">
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea id="testDescription" placeholder="Введите описание теста">${test ? this.escapeHtml(test.description) : ""}</textarea>
        </div>

        <div style="margin-bottom: 30px;">
          <h4 style="margin-bottom: 15px;">Вопросы</h4>
          <div id="questions-container">
            ${test ? test.questions.map((q, idx) => this.getQuestionEditorHTML(q, idx)).join("") : ""}
          </div>
          <button class="btn-secondary" onclick="admin.addQuestion()">+ Добавить вопрос</button>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn-success" onclick="admin.saveTest()">💾 Сохранить тест</button>
          <button class="btn-primary" onclick="admin.showTestsList()">← Назад</button>
        </div>
      </div>
    `;

    if (!test) {
      this.addQuestion();
    }
  }

  getQuestionEditorHTML(question, index) {
    return `
      <div class="question-editor" data-question-index="${index}">
        <div class="question-header">
          <h4>Вопрос ${index + 1}</h4>
          <button class="btn-danger btn-small" onclick="admin.removeQuestion(${index})">Удалить</button>
        </div>

        <div class="form-group">
          <label>Текст вопроса</label>
          <textarea class="question-text-input" placeholder="Введите текст вопроса">${this.escapeHtml(question.text)}</textarea>
        </div>

        <div class="form-group">
          <label>Изображение (опционально)</label>
          <input type="file" class="question-image-input" accept="image/*" data-question-index="${index}">
          ${question.image ? `<img src="${question.image}" class="image-preview" alt="Preview">` : ""}
        </div>

        <div class="form-group">
          <label>Тип ответов</label>
          <select class="question-type-select" data-question-index="${index}">
            <option value="single" ${question.type === "single" ? "selected" : ""}>Один правильный ответ</option>
            <option value="multiple" ${question.type === "multiple" ? "selected" : ""}>Несколько правильных ответов</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="margin-bottom: 10px;">Варианты ответов</label>
          <div class="answers-container" data-question-index="${index}">
            ${question.answers.map((answer, ansIdx) => this.getAnswerOptionHTML(answer, index, ansIdx)).join("")}
          </div>
          <button class="btn-secondary btn-small" onclick="admin.addAnswer(${index})">+ Добавить ответ</button>
        </div>
      </div>
    `;
  }

  getAnswerOptionHTML(answer, questionIndex, answerIndex) {
    const isCorrect = answer.correct ? "checked" : "";
    return `
      <div class="answer-option" data-answer-index="${answerIndex}">
        <input type="checkbox" class="answer-correct" ${isCorrect} data-question-index="${questionIndex}" data-answer-index="${answerIndex}">
        <div class="answer-option-content">
          <input type="text" class="answer-text" value="${this.escapeHtml(answer.text)}" placeholder="Введите вариант ответа" data-question-index="${questionIndex}" data-answer-index="${answerIndex}">
        </div>
        <button class="btn-danger btn-small" onclick="admin.removeAnswer(${questionIndex}, ${answerIndex})">✕</button>
      </div>
    `;
  }

  addQuestion() {
    const container = document.getElementById("questions-container");
    const newQuestion = {
      text: "",
      type: "single",
      answers: [
        { text: "", correct: false },
        { text: "", correct: false },
      ],
      image: null,
    };

    const index = container.children.length;
    const html = this.getQuestionEditorHTML(newQuestion, index);
    container.insertAdjacentHTML("beforeend", html);

    // Добавляем обработчик для загрузки изображения
    const imageInput = container
      .querySelector(`[data-question-index="${index}"]`)
      .querySelector(".question-image-input");
    imageInput.addEventListener("change", (e) =>
      this.handleImageUpload(e, index),
    );
  }

  removeQuestion(index) {
    const container = document.getElementById("questions-container");
    const editors = container.querySelectorAll(".question-editor");
    if (editors[index]) {
      editors[index].remove();
    }
  }

  addAnswer(questionIndex) {
    const container = document.getElementById("questions-container");
    const editors = container.querySelectorAll(".question-editor");
    const answersContainer =
      editors[questionIndex].querySelector(".answers-container");

    const newAnswer = { text: "", correct: false };
    const answerIndex = answersContainer.children.length;
    const html = this.getAnswerOptionHTML(
      newAnswer,
      questionIndex,
      answerIndex,
    );
    answersContainer.insertAdjacentHTML("beforeend", html);
  }

  removeAnswer(questionIndex, answerIndex) {
    const container = document.getElementById("questions-container");
    const editors = container.querySelectorAll(".question-editor");
    const answersContainer =
      editors[questionIndex].querySelector(".answers-container");
    const answers = answersContainer.querySelectorAll(".answer-option");
    if (answers[answerIndex]) {
      answers[answerIndex].remove();
    }
  }

  handleImageUpload(event, questionIndex) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      const container = document.getElementById("questions-container");
      const editors = container.querySelectorAll(".question-editor");
      const preview = editors[questionIndex].querySelector(".image-preview");

      if (preview) {
        preview.src = imageData;
      } else {
        const img = document.createElement("img");
        img.src = imageData;
        img.className = "image-preview";
        img.alt = "Preview";
        editors[questionIndex]
          .querySelector(".question-image-input")
          .parentElement.appendChild(img);
      }

      // Сохраняем изображение в памяти (будет сохранено при сохранении теста)
      if (!this.imageCache) this.imageCache = {};
      this.imageCache[questionIndex] = imageData;
    };
    reader.readAsDataURL(file);
  }

  saveTest() {
    const title = document.getElementById("testTitle").value.trim();
    const description = document.getElementById("testDescription").value.trim();

    if (!title) {
      app.showMessage("Пожалуйста, введите название теста", "error");
      return;
    }

    const container = document.getElementById("questions-container");
    const editors = container.querySelectorAll(".question-editor");
    const questions = [];

    editors.forEach((editor, idx) => {
      const text = editor.querySelector(".question-text-input").value.trim();
      const type = editor.querySelector(".question-type-select").value;
      const answersContainer = editor.querySelector(".answers-container");
      const answerElements =
        answersContainer.querySelectorAll(".answer-option");

      const answers = [];
      answerElements.forEach((ansEl, ansIdx) => {
        const answerText = ansEl.querySelector(".answer-text").value.trim();
        const isCorrect = ansEl.querySelector(".answer-correct").checked;

        if (answerText) {
          answers.push({
            text: answerText,
            correct: isCorrect,
          });
        }
      });

      if (text && answers.length > 0) {
        const question = {
          text,
          type,
          answers,
          image:
            this.imageCache && this.imageCache[idx]
              ? this.imageCache[idx]
              : null,
        };
        questions.push(question);
      }
    });

    if (questions.length === 0) {
      app.showMessage(
        "Пожалуйста, добавьте хотя бы один вопрос с ответами",
        "error",
      );
      return;
    }

    if (this.currentEditingTest) {
      // Редактирование существующего теста
      const test = app.tests.find((t) => t.id === this.currentEditingTest);
      test.title = title;
      test.description = description;
      test.questions = questions;
    } else {
      // Создание нового теста
      const newTest = {
        id: app.generateId(),
        title,
        description,
        questions,
        createdAt: new Date().toISOString(),
        responses: [],
      };
      app.tests.push(newTest);
    }

    app.saveToStorage("tests", app.tests);
    this.imageCache = {};
    app.showMessage("Тест успешно сохранен!", "success");
    this.showTestsList();
  }

  editTest(testId) {
    this.currentEditingTest = testId;
    this.showTestForm();
  }

  deleteTest(testId) {
    if (confirm("Вы уверены, что хотите удалить этот тест?")) {
      app.tests = app.tests.filter((t) => t.id !== testId);
      app.saveToStorage("tests", app.tests);
      app.showMessage("Тест удален", "success");
      this.showTestsList();
    }
  }

  shareTest(testId) {
    const test = app.tests.find((t) => t.id === testId);
    if (!test) return;

    const shareData = {
      id: test.id,
      title: test.title,
      description: test.description,
      questions: test.questions,
    };

    const shareLink = `${window.location.origin}${window.location.pathname}?test=${btoa(JSON.stringify(shareData))}`;

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Поделиться тестом</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="form-group">
          <label>Ссылка для отправки:</label>
          <input type="text" value="${shareLink}" readonly style="cursor: copy;" onclick="this.select(); document.execCommand('copy'); alert('Ссылка скопирована!')">
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 15px;">
          Отправьте эту ссылку другим людям, чтобы они могли пройти тест.
        </p>
        <button class="btn-primary" onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 20px;">Закрыть</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  showResponsesView() {
    const content = document.getElementById("admin-content");

    if (app.tests.length === 0) {
      content.innerHTML = `
        <div class="text-center" style="padding: 40px; color: #999;">
          <p>Тестов еще не создано</p>
        </div>
      `;
      return;
    }

    let html = `
      <h3>Результаты тестов</h3>
      <div style="margin-top: 20px;">
    `;

    app.tests.forEach((test) => {
      const responses = test.responses || [];
      html += `
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h4>${this.escapeHtml(test.title)}</h4>
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Всего ответов: ${responses.length}</p>
          ${
            responses.length > 0
              ? `
            <table class="responses-table">
              <thead>
                <tr>
                  <th>Имя участника</th>
                  <th>Правильных ответов</th>
                  <th>Процент</th>
                  <th>Дата</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                ${responses
                  .map(
                    (resp) => `
                  <tr>
                    <td>${this.escapeHtml(resp.userName)}</td>
                    <td>${resp.correctCount}/${resp.totalCount}</td>
                    <td>${Math.round((resp.correctCount / resp.totalCount) * 100)}%</td>
                    <td>${new Date(resp.date).toLocaleDateString("ru-RU")}</td>
                    <td>
                      <button class="btn-primary btn-small" onclick="admin.viewResponseDetails('${test.id}', '${resp.id}')">Просмотреть</button>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `<p style="color: #999;">Нет ответов</p>`
          }
        </div>
      `;
    });

    html += "</div>";
    content.innerHTML = html;
  }

  viewResponseDetails(testId, responseId) {
    const test = app.tests.find((t) => t.id === testId);
    const response = test.responses.find((r) => r.id === responseId);

    if (!test || !response) return;

    const modal = document.createElement("div");
    modal.className = "modal active";

    let detailsHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${this.escapeHtml(response.userName)} - ${this.escapeHtml(test.title)}</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
          <p><strong>Результат:</strong> ${response.correctCount}/${response.totalCount} (${Math.round((response.correctCount / response.totalCount) * 100)}%)</p>
          <p><strong>Дата:</strong> ${new Date(response.date).toLocaleString("ru-RU")}</p>
        </div>
    `;

    response.answers.forEach((answer, idx) => {
      const question = test.questions[idx];
      const isCorrect = answer.correct;

      detailsHTML += `
        <div class="result-question ${isCorrect ? "correct" : "incorrect"}">
          <div class="result-question-text">
            ${idx + 1}. ${this.escapeHtml(question.text)}
          </div>
          <div class="result-answer user-answer">
            <span class="result-answer-label">Ответ пользователя:</span>
            ${
              Array.isArray(answer.selected)
                ? answer.selected
                    .map(
                      (idx) =>
                        `<div>• ${this.escapeHtml(question.answers[idx].text)}</div>`,
                    )
                    .join("")
                : `<div>• ${this.escapeHtml(question.answers[answer.selected].text)}</div>`
            }
          </div>
          <div class="result-answer correct">
            <span class="result-answer-label">✓ Правильный ответ:</span>
            ${question.answers
              .map((ans, idx) =>
                ans.correct ? `<div>• ${this.escapeHtml(ans.text)}</div>` : "",
              )
              .join("")}
          </div>
        </div>
      `;
    });

    detailsHTML += `
      <button class="btn-primary" onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 20px;">Закрыть</button>
    </div>
    `;

    modal.innerHTML = detailsHTML;
    document.body.appendChild(modal);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

const admin = new AdminPanel();
