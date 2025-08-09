/**
 * Quiz Engine for Datorteknik
 * Reusable quiz system with accessibility support
 * 
 * Supported question types:
 * - mcq: Multiple choice (single answer)
 * - multi: Multiple select (multiple answers)
 * - numeric: Numeric input with tolerance
 * - step: Step-by-step guided questions
 * 
 * Features:
 * - Semantic markup with ARIA attributes
 * - Focus management and keyboard navigation
 * - Screen reader announcements
 * - localStorage state persistence
 * - Review and retry functionality
 * - Scoring and feedback
 */

class Quiz {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showScore: true,
      allowReview: true,
      allowRetry: true,
      saveState: true,
      ...options
    };
    
    this.questions = [];
    this.currentQuestion = 0;
    this.answers = {};
    this.completed = false;
    this.score = 0;
    
    this.storageKey = `quiz_${window.location.pathname}`;
    
    this.init();
  }
  
  init() {
    this.container.setAttribute('role', 'main');
    this.container.setAttribute('aria-label', 'Quiz');
    this.loadState();
  }
  
  /**
   * Load quiz from data or URL
   */
  static async load(containerSelector, dataOrUrl) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container ${containerSelector} not found`);
    }
    
    let data;
    if (typeof dataOrUrl === 'string') {
      try {
        const response = await fetch(dataOrUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      } catch (error) {
        console.error('Failed to load quiz:', error);
        container.innerHTML = '<div class="error" role="alert">Kunde inte ladda quiz. Försök igen senare.</div>';
        return null;
      }
    } else {
      data = dataOrUrl;
    }
    
    const quiz = new Quiz(container, data.options);
    quiz.questions = data.questions || [];
    quiz.render();
    return quiz;
  }
  
  /**
   * Static render method for convenience
   */
  static render(containerSelector, dataOrUrl) {
    return Quiz.load(containerSelector, dataOrUrl);
  }
  
  render() {
    if (this.questions.length === 0) {
      this.container.innerHTML = '<div class="info">Inga frågor tillgängliga.</div>';
      return;
    }
    
    this.container.innerHTML = this.getQuizHtml();
    this.bindEvents();
    this.updateProgress();
    this.announceLiveRegion('Quiz laddad');
  }
  
  getQuizHtml() {
    const progressPercent = this.completed ? 100 : (this.currentQuestion / this.questions.length) * 100;
    
    return `
      <div class="quiz-container">
        <div class="quiz-header">
          <div class="progress-bar" role="progressbar" 
               aria-valuenow="${progressPercent}" 
               aria-valuemin="0" 
               aria-valuemax="100"
               aria-label="Quiz framsteg">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="quiz-info">
            <span class="question-counter">
              Fråga ${this.currentQuestion + 1} av ${this.questions.length}
            </span>
            ${this.completed && this.options.showScore ? 
              `<span class="score">Resultat: ${this.score}/${this.questions.length}</span>` : ''}
          </div>
        </div>
        
        <div class="quiz-content">
          ${this.completed ? this.getReviewHtml() : this.getQuestionHtml()}
        </div>
        
        <div class="quiz-controls">
          ${this.getControlsHtml()}
        </div>
        
        <div class="quiz-live-region" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
  }
  
  getQuestionHtml() {
    const question = this.questions[this.currentQuestion];
    if (!question) return '<div class="error">Fråga saknas</div>';
    
    const questionId = `question-${this.currentQuestion}`;
    
    return `
      <div class="question" role="group" aria-labelledby="${questionId}-title">
        <h3 id="${questionId}-title" class="question-title">${question.text}</h3>
        ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
        
        <div class="question-input" role="group" aria-labelledby="${questionId}-title">
          ${this.getInputHtml(question, questionId)}
        </div>
        
        ${this.answers[this.currentQuestion] !== undefined ? this.getFeedbackHtml(question) : ''}
      </div>
    `;
  }
  
  getInputHtml(question, questionId) {
    const answerId = this.answers[this.currentQuestion];
    
    switch (question.type) {
      case 'mcq':
        return question.options.map((option, index) => `
          <label class="option mcq-option">
            <input type="radio" 
                   name="${questionId}" 
                   value="${index}"
                   ${answerId === index ? 'checked' : ''}
                   aria-describedby="${questionId}-feedback">
            <span class="option-text">${option.text}</span>
          </label>
        `).join('');
        
      case 'multi':
        const selectedOptions = answerId || [];
        return question.options.map((option, index) => `
          <label class="option multi-option">
            <input type="checkbox" 
                   name="${questionId}" 
                   value="${index}"
                   ${selectedOptions.includes(index) ? 'checked' : ''}
                   aria-describedby="${questionId}-feedback">
            <span class="option-text">${option.text}</span>
          </label>
        `).join('');
        
      case 'numeric':
        return `
          <label class="numeric-input">
            <span class="input-label">Ditt svar:</span>
            <input type="number" 
                   name="${questionId}"
                   value="${answerId !== undefined ? answerId : ''}"
                   step="any"
                   aria-describedby="${questionId}-feedback ${questionId}-hint"
                   placeholder="Ange numeriskt värde">
          </label>
          ${question.hint ? `<div id="${questionId}-hint" class="input-hint">${question.hint}</div>` : ''}
        `;
        
      case 'step':
        return `
          <div class="step-question">
            <div class="step-content">${question.step_content || ''}</div>
            <label class="step-input">
              <span class="input-label">${question.step_prompt || 'Nästa steg:'}</span>
              <input type="text" 
                     name="${questionId}"
                     value="${answerId !== undefined ? answerId : ''}"
                     aria-describedby="${questionId}-feedback"
                     placeholder="${question.placeholder || ''}">
            </label>
          </div>
        `;
        
      default:
        return '<div class="error">Okänd frågetyp</div>';
    }
  }
  
  getFeedbackHtml(question) {
    const questionId = `question-${this.currentQuestion}`;
    const userAnswer = this.answers[this.currentQuestion];
    const isCorrect = this.checkAnswer(question, userAnswer);
    
    let feedbackText = '';
    let explanation = '';
    
    if (question.type === 'mcq') {
      const selectedOption = question.options[userAnswer];
      if (selectedOption && selectedOption.explanation) {
        explanation = selectedOption.explanation;
      }
    } else if (question.explanation) {
      explanation = question.explanation;
    }
    
    if (isCorrect) {
      feedbackText = '✓ Rätt svar!';
    } else {
      feedbackText = '✗ Fel svar.';
      if (question.type === 'mcq' || question.type === 'multi') {
        const correctAnswers = question.correct;
        const correctOptions = Array.isArray(correctAnswers) 
          ? correctAnswers.map(i => question.options[i].text)
          : [question.options[correctAnswers].text];
        feedbackText += ` Rätt svar: ${correctOptions.join(', ')}`;
      } else if (question.type === 'numeric') {
        feedbackText += ` Rätt svar: ${question.correct}`;
      }
    }
    
    return `
      <div id="${questionId}-feedback" 
           class="feedback ${isCorrect ? 'correct' : 'incorrect'}"
           role="status"
           aria-live="polite">
        <div class="feedback-result">${feedbackText}</div>
        ${explanation ? `<div class="feedback-explanation">${explanation}</div>` : ''}
      </div>
    `;
  }
  
  getReviewHtml() {
    const results = this.questions.map((question, index) => {
      const userAnswer = this.answers[index];
      const isCorrect = userAnswer !== undefined ? this.checkAnswer(question, userAnswer) : false;
      
      return `
        <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
          <h4 class="review-question">
            ${index + 1}. ${question.text}
            <span class="review-status" aria-label="${isCorrect ? 'Rätt' : 'Fel'} svar">
              ${isCorrect ? '✓' : '✗'}
            </span>
          </h4>
          <div class="review-answer">
            Ditt svar: ${this.formatUserAnswer(question, userAnswer)}
          </div>
          ${!isCorrect ? `<div class="review-correct">Rätt svar: ${this.formatCorrectAnswer(question)}</div>` : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div class="quiz-review" role="region" aria-label="Quiz genomgång">
        <h3>Quiz genomgång</h3>
        <div class="review-summary">
          Du fick ${this.score} av ${this.questions.length} rätt (${Math.round((this.score / this.questions.length) * 100)}%)
        </div>
        <div class="review-questions">
          ${results}
        </div>
      </div>
    `;
  }
  
  getControlsHtml() {
    if (this.completed) {
      return `
        ${this.options.allowRetry ? '<button type="button" class="btn retry-btn">Försök igen</button>' : ''}
        <button type="button" class="btn review-btn">Tillbaka till början</button>
      `;
    }
    
    const hasAnswer = this.answers[this.currentQuestion] !== undefined;
    const canPrev = this.currentQuestion > 0;
    const canNext = this.currentQuestion < this.questions.length - 1;
    const isLast = this.currentQuestion === this.questions.length - 1;
    
    return `
      ${canPrev ? '<button type="button" class="btn prev-btn">Föregående</button>' : ''}
      ${hasAnswer ? 
        (isLast ? 
          '<button type="button" class="btn submit-btn">Slutför quiz</button>' :
          '<button type="button" class="btn next-btn">Nästa</button>'
        ) : ''
      }
      <button type="button" class="btn answer-btn">${hasAnswer ? 'Ändra svar' : 'Svara'}</button>
    `;
  }
  
  bindEvents() {
    // Answer input events
    this.container.addEventListener('change', (e) => {
      if (e.target.matches('input[type="radio"], input[type="checkbox"], input[type="number"], input[type="text"]')) {
        this.handleAnswer(e);
      }
    });
    
    // Button events
    this.container.addEventListener('click', (e) => {
      if (e.target.matches('.next-btn')) {
        this.nextQuestion();
      } else if (e.target.matches('.prev-btn')) {
        this.prevQuestion();
      } else if (e.target.matches('.submit-btn')) {
        this.submitQuiz();
      } else if (e.target.matches('.retry-btn')) {
        this.retry();
      } else if (e.target.matches('.review-btn')) {
        this.goToStart();
      } else if (e.target.matches('.answer-btn')) {
        this.focusAnswerInput();
      }
    });
    
    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('.btn')) {
        e.target.click();
      }
    });
  }
  
  handleAnswer(e) {
    const question = this.questions[this.currentQuestion];
    let answer;
    
    if (question.type === 'mcq') {
      answer = parseInt(e.target.value);
    } else if (question.type === 'multi') {
      const checkboxes = this.container.querySelectorAll(`input[name="${e.target.name}"]:checked`);
      answer = Array.from(checkboxes).map(cb => parseInt(cb.value));
    } else if (question.type === 'numeric') {
      answer = parseFloat(e.target.value);
    } else if (question.type === 'step') {
      answer = e.target.value.trim();
    }
    
    this.answers[this.currentQuestion] = answer;
    this.saveState();
    this.updateControls();
    this.updateFeedback();
    
    this.announceLiveRegion('Svar registrerat');
  }
  
  checkAnswer(question, userAnswer) {
    if (userAnswer === undefined || userAnswer === null) return false;
    
    switch (question.type) {
      case 'mcq':
        return userAnswer === question.correct;
        
      case 'multi':
        const correct = Array.isArray(question.correct) ? question.correct : [question.correct];
        const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        return correct.length === user.length && 
               correct.every(c => user.includes(c));
        
      case 'numeric':
        const tolerance = question.tolerance || 0.01;
        return Math.abs(userAnswer - question.correct) <= tolerance;
        
      case 'step':
        const expectedAnswers = Array.isArray(question.correct) ? question.correct : [question.correct];
        return expectedAnswers.some(expected => 
          userAnswer.toLowerCase().trim() === expected.toLowerCase().trim()
        );
        
      default:
        return false;
    }
  }
  
  formatUserAnswer(question, answer) {
    if (answer === undefined) return 'Inget svar';
    
    switch (question.type) {
      case 'mcq':
        return question.options[answer]?.text || 'Ogiltigt svar';
        
      case 'multi':
        const selected = Array.isArray(answer) ? answer : [answer];
        return selected.map(i => question.options[i]?.text).filter(Boolean).join(', ') || 'Inget svar';
        
      case 'numeric':
      case 'step':
        return String(answer);
        
      default:
        return String(answer);
    }
  }
  
  formatCorrectAnswer(question) {
    switch (question.type) {
      case 'mcq':
        return question.options[question.correct]?.text || 'Okänt';
        
      case 'multi':
        const correct = Array.isArray(question.correct) ? question.correct : [question.correct];
        return correct.map(i => question.options[i]?.text).filter(Boolean).join(', ');
        
      case 'numeric':
      case 'step':
        return Array.isArray(question.correct) ? question.correct.join(' eller ') : String(question.correct);
        
      default:
        return String(question.correct);
    }
  }
  
  nextQuestion() {
    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
      this.render();
      this.focusQuestion();
      this.announceLiveRegion(`Fråga ${this.currentQuestion + 1} av ${this.questions.length}`);
    }
  }
  
  prevQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.render();
      this.focusQuestion();
      this.announceLiveRegion(`Fråga ${this.currentQuestion + 1} av ${this.questions.length}`);
    }
  }
  
  submitQuiz() {
    this.completed = true;
    this.calculateScore();
    this.render();
    this.focusReview();
    this.announceLiveRegion(`Quiz slutförd. Du fick ${this.score} av ${this.questions.length} rätt.`);
  }
  
  retry() {
    this.answers = {};
    this.currentQuestion = 0;
    this.completed = false;
    this.score = 0;
    this.saveState();
    this.render();
    this.focusQuestion();
    this.announceLiveRegion('Quiz återställd');
  }
  
  goToStart() {
    this.currentQuestion = 0;
    this.completed = false;
    this.render();
    this.focusQuestion();
    this.announceLiveRegion('Tillbaka till första frågan');
  }
  
  calculateScore() {
    this.score = this.questions.reduce((score, question, index) => {
      const userAnswer = this.answers[index];
      return score + (this.checkAnswer(question, userAnswer) ? 1 : 0);
    }, 0);
  }
  
  updateProgress() {
    const progressBar = this.container.querySelector('.progress-bar');
    const progressFill = this.container.querySelector('.progress-fill');
    const counter = this.container.querySelector('.question-counter');
    
    if (progressBar && progressFill) {
      const percent = this.completed ? 100 : (this.currentQuestion / this.questions.length) * 100;
      progressBar.setAttribute('aria-valuenow', percent);
      progressFill.style.width = percent + '%';
    }
    
    if (counter) {
      counter.textContent = `Fråga ${this.currentQuestion + 1} av ${this.questions.length}`;
    }
  }
  
  updateControls() {
    const controlsContainer = this.container.querySelector('.quiz-controls');
    if (controlsContainer) {
      controlsContainer.innerHTML = this.getControlsHtml();
    }
  }
  
  updateFeedback() {
    const questionContainer = this.container.querySelector('.question');
    if (questionContainer) {
      const existingFeedback = questionContainer.querySelector('.feedback');
      const question = this.questions[this.currentQuestion];
      
      if (this.answers[this.currentQuestion] !== undefined) {
        const feedbackHtml = this.getFeedbackHtml(question);
        if (existingFeedback) {
          existingFeedback.outerHTML = feedbackHtml;
        } else {
          questionContainer.insertAdjacentHTML('beforeend', feedbackHtml);
        }
      } else if (existingFeedback) {
        existingFeedback.remove();
      }
    }
  }
  
  focusQuestion() {
    const questionTitle = this.container.querySelector('.question-title');
    if (questionTitle) {
      questionTitle.focus();
    }
  }
  
  focusReview() {
    const reviewTitle = this.container.querySelector('.quiz-review h3');
    if (reviewTitle) {
      reviewTitle.focus();
    }
  }
  
  focusAnswerInput() {
    const firstInput = this.container.querySelector('.question-input input');
    if (firstInput) {
      firstInput.focus();
    }
  }
  
  announceLiveRegion(message) {
    const liveRegion = this.container.querySelector('.quiz-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }
  
  saveState() {
    if (!this.options.saveState) return;
    
    const state = {
      currentQuestion: this.currentQuestion,
      answers: this.answers,
      completed: this.completed,
      score: this.score
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save quiz state:', error);
    }
  }
  
  loadState() {
    if (!this.options.saveState) return;
    
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        this.currentQuestion = state.currentQuestion || 0;
        this.answers = state.answers || {};
        this.completed = state.completed || false;
        this.score = state.score || 0;
      }
    } catch (error) {
      console.warn('Could not load quiz state:', error);
    }
  }
}

// Export for module systems and global access
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Quiz;
} else {
  window.Quiz = Quiz;
}