// Функции пользователя

class UserPanel {
  constructor() {
    this.currentTestId = null;
    this.currentAnswers = {};
    this.userName = null;
  }

  showTestsList() {
    const content = document.getElementById("user-content");

    // Проверяем URL для импортированного теста
    const urlParams = new URLSearchParams(window.location.search);
    const testParam = urlParams.get("test");

    if (testParam) {
      try {
        const importedTest = JSON.parse(atob(testParam));
        this.handleImportedTest(importedTest);
        return;
      } catch (e) {
        console.error("Ошибка при импорте теста:", e);
      }
    }

    if (app.tests.length === 0) {
      content.innerHTML = `
        <div class="text-center" style="padding: 40px; color: #999;">
          <p style="font-size: 16px;">Доступных тестов нет</p>
          <p style="font-size: 14px; margin-top: 10px;">Попросите администратора отправить вам ссылку на тест</p>
        </div>
      `;
      return;
    }

    let html = '<div class="tests-grid">';

    app.tests.forEach((test) => {
      html += `
        <div class="test-card">
          <h3>${this.escapeHtml(test.title)}</h3>
          <p>${this.escapeHtml(test.description)}</p>
          <p style="color: #999; font-size: 12px;">Вопросов: ${test.questions.length}</p>
          <div class="test-card-actions">
            <button class="btn-primary btn-small" onclick="user.startTest('${test.id}')">▶️ Начать тест</button>
            <button class="btn-secondary btn-small" onclick="user.showMyResults('${test.id}')">📊 Мои результаты</button>
          </div>
        </div>
      `;
    });

    html += "</div>";
    content.innerHTML = html;
  }

  handleImportedTest(importedTest) {
    const content = document.getElementById("user-content");

    // Проверяем, есть ли уже такой тест
    let test = app.tests.find((t) => t.id === importedTest.id);

    if (!test) {
      // Добавляем импортированный тест
      test = {
        ...importedTest,
        responses: [],
      };
      app.tests.push(test);
      app.saveToStorage("tests", app.tests);
    }

    content.innerHTML = `
      <div class="test-header">
        <h2>${this.escapeHtml(test.title)}</h2>
        <p>${this.escapeHtml(test.description)}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <button class="btn-primary" onclick="user.startTest('${test.id}')">▶️ Начать тест</button>
        <button class="btn-secondary" onclick="user.showTestsList()" style="margin-left: 10px;">← Назад</button>
      </div>
    `;
  }

  startTest(testId) {
    const test = app.tests.find((t) => t.id === testId);
    if (!test) return;

    this.currentTestId = testId;
    this.currentAnswers = {};

    // Запрашиваем имя пользователя
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Начало теста</h3>
        </div>
        <div class="form-group">
          <label>Пожалуйста, введите ваше имя:</label>
          <input type="text" id="userName" placeholder="Ваше имя" autofocus>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-success" onclick="user.proceedWithTest()">Начать</button>
          <button class="btn-primary" onclick="this.closest('.modal').remove(); user.showTestsList()">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  proceedWithTest() {
    const nameInput = document.getElementById("userName");
    const name = nameInput.value.trim();

    if (!name) {
      alert("Пожалуйста, введите ваше имя");
      return;
    }

    this.userName = name;
    document.querySelector(".modal").remove();
    this.showTestQuestion(0);
  }

  showTestQuestion(questionIndex) {
    const test = app.tests.find((t) => t.id === this.currentTestId);
    if (!test) return;

    const question = test.questions[questionIndex];
    const content = document.getElementById("user-content");

    let html = `
      <div class="test-taker">
        <div class="test-header">
          <h2>${this.escapeHtml(test.title)}</h2>
          <p>Вопрос ${questionIndex + 1} из ${test.questions.length}</p>
          <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-top: 10px; overflow: hidden;">
            <div style="background: #667eea; height: 100%; width: ${((questionIndex + 1) / test.questions.length) * 100}%; transition: width 0.3s;"></div>
          </div>
        </div>

        <div class="question-container">
          <div class="question-number">Вопрос ${questionIndex + 1}</div>
          <div class="question-text">${this.escapeHtml(question.text)}</div>
          
          ${question.image ? `<img src="${question.image}" class="question-image" alt="Question image">` : ""}

          <div class="options-container" id="options-container">
            ${question.answers
              .map(
                (answer, idx) => `
              <label class="option" onclick="user.selectAnswer(${questionIndex}, ${idx}, '${question.type}')">
                <input type="${question.type === "single" ? "radio" : "checkbox"}" 
                       name="answer-${questionIndex}" 
                       value="${idx}"
                       ${
                         this.currentAnswers[questionIndex] &&
                         (Array.isArray(this.currentAnswers[questionIndex])
                           ? this.currentAnswers[questionIndex].includes(idx)
                           : this.currentAnswers[questionIndex] === idx)
                           ? "checked"
                           : ""
                       }>
                <span>${this.escapeHtml(answer.text)}</span>
              </label>
            `,
              )
              .join("")}
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 30px; justify-content: space-between;">
          <button class="btn-primary" onclick="user.previousQuestion(${questionIndex})" ${questionIndex === 0 ? "disabled" : ""}>
            ← Предыдущий
          </button>
          <button class="btn-secondary" onclick="user.showTestsList()">Выход</button>
          ${
            questionIndex === test.questions.length - 1
              ? `<button class="btn-success" onclick="user.submitTest()">✓ Завершить тест</button>`
              : `<button class="btn-primary" onclick="user.nextQuestion(${questionIndex})">Следующий →</button>`
          }
        </div>
      </div>
    `;

    content.innerHTML = html;
  }

  selectAnswer(questionIndex, answerIndex, type) {
    if (type === "single") {
      this.currentAnswers[questionIndex] = answerIndex;
    } else {
      if (!this.currentAnswers[questionIndex]) {
        this.currentAnswers[questionIndex] = [];
      }

      const selected = this.currentAnswers[questionIndex];
      const idx = selected.indexOf(answerIndex);

      if (idx > -1) {
        selected.splice(idx, 1);
      } else {
        selected.push(answerIndex);
      }
    }
  }

  nextQuestion(currentIndex) {
    const test = app.tests.find((t) => t.id === this.currentTestId);
    if (currentIndex < test.questions.length - 1) {
      this.showTestQuestion(currentIndex + 1);
    }
  }

  previousQuestion(currentIndex) {
    if (currentIndex > 0) {
      this.showTestQuestion(currentIndex - 1);
    }
  }

  submitTest() {
    const test = app.tests.find((t) => t.id === this.currentTestId);
    if (!test) return;

    // Проверяем ответы
    let correctCount = 0;
    const answers = [];

    test.questions.forEach((question, idx) => {
      const userAnswer = this.currentAnswers[idx];
      const correctAnswers = question.answers
        .map((ans, ansIdx) => (ans.correct ? ansIdx : -1))
        .filter((idx) => idx !== -1);

      let isCorrect = false;

      if (question.type === "single") {
        isCorrect =
          correctAnswers.length === 1 && correctAnswers[0] === userAnswer;
      } else {
        const userAnswerArray = Array.isArray(userAnswer)
          ? userAnswer.sort()
          : [];
        isCorrect =
          JSON.stringify(userAnswerArray) ===
          JSON.stringify(correctAnswers.sort());
      }

      if (isCorrect) {
        correctCount++;
      }

      answers.push({
        selected:
          userAnswer !== undefined
            ? userAnswer
            : question.type === "multiple"
              ? []
              : -1,
        correct: isCorrect,
      });
    });

    // Сохраняем результат
    const response = {
      id: app.generateId(),
      userName: this.userName,
      correctCount,
      totalCount: test.questions.length,
      answers,
      date: new Date().toISOString(),
    };

    if (!test.responses) {
      test.responses = [];
    }
    test.responses.push(response);
    app.saveToStorage("tests", app.tests);

    // Показываем результаты
    this.showResults(test, response);
  }

  showResults(test, response) {
    const content = document.getElementById("user-content");
    const percentage = Math.round(
      (response.correctCount / response.totalCount) * 100,
    );

    let html = `
      <div class="results-container">
        <div class="results-header">
          <h2>${this.escapeHtml(test.title)}</h2>
          <div class="score-display">${response.correctCount}/${response.totalCount}</div>
          <div class="score-percentage">${percentage}%</div>
        </div>

        <div style="margin-top: 30px;">
    `;

    response.answers.forEach((answer, idx) => {
      const question = test.questions[idx];
      const correctAnswers = question.answers
        .map((ans, ansIdx) => (ans.correct ? ansIdx : -1))
        .filter((i) => i !== -1);

      let isCorrect = false;
      if (question.type === "single") {
        isCorrect =
          correctAnswers.length === 1 && correctAnswers[0] === answer.selected;
      } else {
        const userAnswerArray = Array.isArray(answer.selected)
          ? answer.selected.sort()
          : [];
        isCorrect =
          JSON.stringify(userAnswerArray) ===
          JSON.stringify(correctAnswers.sort());
      }

      html += `
        <div class="result-question ${isCorrect ? "correct" : "incorrect"}">
          <div class="result-question-text">
            ${idx + 1}. ${this.escapeHtml(question.text)}
          </div>
          
          <div class="result-answer user-answer">
            <span class="result-answer-label">Ваш ответ:</span>
            ${
              Array.isArray(answer.selected)
                ? answer.selected.length > 0
                  ? answer.selected
                      .map(
                        (i) =>
                          `<div>• ${this.escapeHtml(question.answers[i].text)}</div>`,
                      )
                      .join("")
                  : '<div style="color: #999;">Ответ не выбран</div>'
                : answer.selected >= 0
                  ? `<div>• ${this.escapeHtml(question.answers[answer.selected].text)}</div>`
                  : '<div style="color: #999;">Ответ не выбран</div>'
            }
          </div>

          <div class="result-answer correct">
            <span class="result-answer-label">✓ Правильный ответ:</span>
            ${question.answers
              .map((ans, ansIdx) =>
                ans.correct ? `<div>• ${this.escapeHtml(ans.text)}</div>` : "",
              )
              .join("")}
          </div>
        </div>
      `;
    });

    html += `
        </div>

        <div style="display: flex; gap: 10px; margin-top: 30px; justify-content: center;">
          <button class="btn-primary" onclick="user.showTestsList()">← Вернуться к тестам</button>
          <button class="btn-secondary" onclick="user.downloadResults('${test.id}', '${response.id}')">📥 Скачать результаты</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
  }

  showMyResults(testId) {
    const test = app.tests.find((t) => t.id === testId);
    if (!test || !test.responses || test.responses.length === 0) {
      alert("У вас нет результатов для этого теста");
      return;
    }

    const content = document.getElementById("user-content");

    let html = `
      <div style="max-width: 900px;">
        <h3>Мои результаты - ${this.escapeHtml(test.title)}</h3>
        <table class="responses-table" style="margin-top: 20px;">
          <thead>
            <tr>
              <th>Дата прохождения</th>
              <th>Результат</th>
              <th>Процент</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
    `;

    test.responses.forEach((response) => {
      const percentage = Math.round(
        (response.correctCount / response.totalCount) * 100,
      );
      html += `
        <tr>
          <td>${new Date(response.date).toLocaleString("ru-RU")}</td>
          <td>${response.correctCount}/${response.totalCount}</td>
          <td>${percentage}%</td>
          <td>
            <button class="btn-primary btn-small" onclick="user.viewResult('${testId}', '${response.id}')">Просмотреть</button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <button class="btn-primary" onclick="user.showTestsList()" style="margin-top: 20px;">← Назад</button>
      </div>
    `;

    content.innerHTML = html;
  }

  viewResult(testId, responseId) {
    const test = app.tests.find((t) => t.id === testId);
    const response = test.responses.find((r) => r.id === responseId);

    if (!test || !response) return;

    const content = document.getElementById("user-content");
    const percentage = Math.round(
      (response.correctCount / response.totalCount) * 100,
    );

    let html = `
      <div class="results-container">
        <div class="results-header">
          <h2>${this.escapeHtml(test.title)}</h2>
          <div class="score-display">${response.correctCount}/${response.totalCount}</div>
          <div class="score-percentage">${percentage}%</div>
          <p style="margin-top: 15px; opacity: 0.9;">Дата: ${new Date(response.date).toLocaleString("ru-RU")}</p>
        </div>

        <div style="margin-top: 30px;">
    `;

    response.answers.forEach((answer, idx) => {
      const question = test.questions[idx];
      const correctAnswers = question.answers
        .map((ans, ansIdx) => (ans.correct ? ansIdx : -1))
        .filter((i) => i !== -1);

      let isCorrect = false;
      if (question.type === "single") {
        isCorrect =
          correctAnswers.length === 1 && correctAnswers[0] === answer.selected;
      } else {
        const userAnswerArray = Array.isArray(answer.selected)
          ? answer.selected.sort()
          : [];
        isCorrect =
          JSON.stringify(userAnswerArray) ===
          JSON.stringify(correctAnswers.sort());
      }

      html += `
        <div class="result-question ${isCorrect ? "correct" : "incorrect"}">
          <div class="result-question-text">
            ${idx + 1}. ${this.escapeHtml(question.text)}
          </div>
          
          <div class="result-answer user-answer">
            <span class="result-answer-label">Ваш ответ:</span>
            ${
              Array.isArray(answer.selected)
                ? answer.selected.length > 0
                  ? answer.selected
                      .map(
                        (i) =>
                          `<div>• ${this.escapeHtml(question.answers[i].text)}</div>`,
                      )
                      .join("")
                  : '<div style="color: #999;">Ответ не выбран</div>'
                : answer.selected >= 0
                  ? `<div>• ${this.escapeHtml(question.answers[answer.selected].text)}</div>`
                  : '<div style="color: #999;">Ответ не выбран</div>'
            }
          </div>

          <div class="result-answer correct">
            <span class="result-answer-label">✓ Правильный ответ:</span>
            ${question.answers
              .map((ans, ansIdx) =>
                ans.correct ? `<div>• ${this.escapeHtml(ans.text)}</div>` : "",
              )
              .join("")}
          </div>
        </div>
      `;
    });

    html += `
        </div>

        <div style="display: flex; gap: 10px; margin-top: 30px; justify-content: center;">
          <button class="btn-primary" onclick="user.showMyResults('${testId}')">← Назад к результатам</button>
          <button class="btn-secondary" onclick="user.downloadResults('${testId}', '${responseId}')">📥 Скачать результаты</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
  }

  downloadResults(testId, responseId) {
    const test = app.tests.find((t) => t.id === testId);
    const response = test.responses.find((r) => r.id === responseId);

    if (!test || !response) return;

    const percentage = Math.round(
      (response.correctCount / response.totalCount) * 100,
    );

    let content = `РЕЗУЛЬТАТЫ ТЕСТА\n`;
    content += `${"=".repeat(50)}\n\n`;
    content += `Тест: ${test.title}\n`;
    content += `Участник: ${response.userName}\n`;
    content += `Дата: ${new Date(response.date).toLocaleString("ru-RU")}\n`;
    content += `Результат: ${response.correctCount}/${response.totalCount} (${percentage}%)\n\n`;
    content += `${"=".repeat(50)}\n\n`;

    response.answers.forEach((answer, idx) => {
      const question = test.questions[idx];
      const correctAnswers = question.answers
        .map((ans, ansIdx) => (ans.correct ? ansIdx : -1))
        .filter((i) => i !== -1);

      let isCorrect = false;
      if (question.type === "single") {
        isCorrect =
          correctAnswers.length === 1 && correctAnswers[0] === answer.selected;
      } else {
        const userAnswerArray = Array.isArray(answer.selected)
          ? answer.selected.sort()
          : [];
        isCorrect =
          JSON.stringify(userAnswerArray) ===
          JSON.stringify(correctAnswers.sort());
      }

      content += `Вопрос ${idx + 1}: ${question.text}\n`;
      content += `Статус: ${isCorrect ? "✓ ПРАВИЛЬНО" : "✗ НЕПРАВИЛЬНО"}\n`;

      if (Array.isArray(answer.selected)) {
        content += `Ваш ответ: ${answer.selected.length > 0 ? answer.selected.map((i) => question.answers[i].text).join(", ") : "Не выбран"}\n`;
      } else {
        content += `Ваш ответ: ${answer.selected >= 0 ? question.answers[answer.selected].text : "Не выбран"}\n`;
      }

      content += `Правильный ответ: ${question.answers
        .filter((ans) => ans.correct)
        .map((ans) => ans.text)
        .join(", ")}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `результаты_${response.userName}_${new Date().getTime()}.txt`;
    link.click();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

const user = new UserPanel();
