/**
 * Datorteknik Quiz Engine
 * Reusable quiz system with accessibility and multiple question types
 */

class QuizEngine {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = {
      storageKey: 'datorteknik-quiz',
      showProgress: true,
      allowRetry: true,
      shuffleQuestions: false,
      ...options
    };
    
    this.questions = [];
    this.currentIndex = 0;
    this.answers = {};
    this.score = 0;
    this.completed = false;
    this.reviewMode = false;
    
    this.init();
  }
  
  init() {
    if (!this.container) {
      console.error('Quiz container not found');
      return;
    }
    
    this.container.className = 'quiz-container';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Kunskapskontroll');
    
    this.loadState();
  }
  
  async loadQuestions(questionsUrl) {
    try {
      const response = await fetch(questionsUrl);
      const data = await response.json();
      this.questions = data.questions || [];
      
      if (this.options.shuffleQuestions) {
        this.shuffleArray(this.questions);
      }
      
      this.render();
      this.announceToScreenReader('Quiz laddad med ' + this.questions.length + ' frågor');
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.container.innerHTML = '<div class="quiz-error">Kunde inte ladda frågorna. Försök igen senare.</div>';
    }
  }
  
  render() {
    if (this.questions.length === 0) return;
    
    this.container.innerHTML = `
      <div class="quiz-header">
        <h2>Kunskapskontroll</h2>
        ${this.options.showProgress ? this.renderProgress() : ''}
      </div>
      <div class="quiz-content">
        ${this.completed ? this.renderResults() : this.renderQuestion()}
      </div>
      <div class="quiz-controls">
        ${this.renderControls()}
      </div>
      <div aria-live="polite" aria-atomic="true" class="sr-only" id="quiz-announcements"></div>
    `;
    
    this.bindEvents();
  }
  
  renderProgress() {
    if (this.completed) {
      return `<div class="quiz-progress">Slutfört: ${this.score}/${this.questions.length} rätt</div>`;
    }
    
    return `
      <div class="quiz-progress">
        Fråga ${this.currentIndex + 1} av ${this.questions.length}
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((this.currentIndex + 1) / this.questions.length) * 100}%"></div>
        </div>
      </div>
    `;
  }
  
  renderQuestion() {
    const question = this.questions[this.currentIndex];
    if (!question) return '';
    
    return `
      <div class="quiz-question" role="group" aria-labelledby="question-text">
        <h3 id="question-text">${question.text}</h3>
        ${this.renderQuestionContent(question)}
        ${this.reviewMode && this.answers[this.currentIndex] !== undefined ? this.renderFeedback(question) : ''}
      </div>
    `;
  }
  
  renderQuestionContent(question) {
    switch (question.type) {
      case 'mcq':
        return this.renderMultipleChoice(question, false);
      case 'multi':
        return this.renderMultipleChoice(question, true);
      case 'numeric':
        return this.renderNumeric(question);
      case 'step':
        return this.renderStepSequence(question);
      default:
        return '<div class="quiz-error">Okänd frågetyp</div>';
    }
  }
  
  renderMultipleChoice(question, multiple = false) {
    const inputType = multiple ? 'checkbox' : 'radio';
    const name = `q${this.currentIndex}`;
    const savedAnswer = this.answers[this.currentIndex];
    
    return `
      <fieldset class="quiz-options">
        <legend class="sr-only">${multiple ? 'Välj ett eller flera alternativ' : 'Välj ett alternativ'}</legend>
        ${question.options.map((option, index) => {
          const id = `${name}_${index}`;
          const isChecked = multiple 
            ? Array.isArray(savedAnswer) && savedAnswer.includes(index)
            : savedAnswer === index;
            
          return `
            <div class="quiz-option">
              <input type="${inputType}" id="${id}" name="${name}" value="${index}" 
                     ${isChecked ? 'checked' : ''} ${this.reviewMode ? 'disabled' : ''}>
              <label for="${id}">${option}</label>
            </div>
          `;
        }).join('')}
      </fieldset>
    `;
  }
  
  renderNumeric(question) {
    const savedAnswer = this.answers[this.currentIndex];
    
    return `
      <div class="quiz-numeric">
        <label for="numeric-input">Ditt svar:</label>
        <input type="number" id="numeric-input" value="${savedAnswer || ''}" 
               step="any" ${this.reviewMode ? 'disabled' : ''}>
        ${question.unit ? `<span class="unit">${question.unit}</span>` : ''}
      </div>
    `;
  }
  
  renderStepSequence(question) {
    const savedAnswer = this.answers[this.currentIndex] || [];
    
    return `
      <div class="quiz-steps">
        <p>Ordna stegen i rätt ordning:</p>
        <div class="step-items" role="listbox" aria-label="Steg att ordna">
          ${question.steps.map((step, index) => `
            <div class="step-item" role="option" tabindex="0" data-step="${index}"
                 aria-selected="${savedAnswer.includes(index) ? 'true' : 'false'}">
              ${step}
            </div>
          `).join('')}
        </div>
        <div class="step-sequence">
          <p>Din ordning:</p>
          <ol id="step-sequence" aria-label="Vald ordning"></ol>
        </div>
      </div>
    `;
  }
  
  renderFeedback(question) {
    const userAnswer = this.answers[this.currentIndex];
    const isCorrect = this.isAnswerCorrect(question, userAnswer);
    
    return `
      <div class="quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <div class="feedback-header">
          ${isCorrect ? '✓ Rätt svar!' : '✗ Fel svar'}
        </div>
        <div class="feedback-explanation">
          ${question.explanation || ''}
        </div>
        ${!isCorrect && question.correctAnswer ? `
          <div class="correct-answer">
            Rätt svar: ${this.formatCorrectAnswer(question)}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  renderControls() {
    if (this.completed) {
      return `
        ${this.options.allowRetry ? '<button class="btn secondary" onclick="quizEngine.restart()">Starta om</button>' : ''}
        <button class="btn" onclick="quizEngine.toggleReviewMode()">${this.reviewMode ? 'Avsluta granskning' : 'Granska svar'}</button>
      `;
    }
    
    return `
      <button class="btn secondary" onclick="quizEngine.previousQuestion()" 
              ${this.currentIndex === 0 ? 'disabled' : ''}>Föregående</button>
      <button class="btn" onclick="quizEngine.nextQuestion()">
        ${this.currentIndex === this.questions.length - 1 ? 'Slutför' : 'Nästa'}
      </button>
    `;
  }
  
  renderResults() {
    const percentage = Math.round((this.score / this.questions.length) * 100);
    let grade = '';
    
    if (percentage >= 90) grade = 'Utmärkt!';
    else if (percentage >= 75) grade = 'Bra jobbat!';
    else if (percentage >= 50) grade = 'Godkänt';
    else grade = 'Behöver förbättras';
    
    return `
      <div class="quiz-results">
        <h3>Resultat</h3>
        <div class="score-display">
          <div class="score-circle">
            <span class="score-percentage">${percentage}%</span>
            <span class="score-details">${this.score}/${this.questions.length}</span>
          </div>
        </div>
        <div class="grade">${grade}</div>
        <div class="score-breakdown">
          ${this.questions.map((q, i) => `
            <div class="question-result ${this.isAnswerCorrect(q, this.answers[i]) ? 'correct' : 'incorrect'}">
              Fråga ${i + 1}: ${this.isAnswerCorrect(q, this.answers[i]) ? '✓' : '✗'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    // Handle answer selection
    this.container.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => this.saveAnswer());
    });
    
    this.container.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => this.saveAnswer());
    });
    
    // Handle step sequence
    this.container.querySelectorAll('.step-item').forEach(item => {
      item.addEventListener('click', () => this.handleStepClick(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleStepClick(item);
        }
      });
    });
  }
  
  saveAnswer() {
    const question = this.questions[this.currentIndex];
    let answer;
    
    switch (question.type) {
      case 'mcq':
        const radio = this.container.querySelector('input[type="radio"]:checked');
        answer = radio ? parseInt(radio.value) : undefined;
        break;
        
      case 'multi':
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]:checked');
        answer = Array.from(checkboxes).map(cb => parseInt(cb.value));
        break;
        
      case 'numeric':
        const numInput = this.container.querySelector('input[type="number"]');
        answer = numInput ? parseFloat(numInput.value) : undefined;
        break;
        
      case 'step':
        // Answer is managed by handleStepClick
        return;
    }
    
    this.answers[this.currentIndex] = answer;
    this.saveState();
  }
  
  handleStepClick(item) {
    if (this.reviewMode) return;
    
    const stepIndex = parseInt(item.dataset.step);
    const currentAnswer = this.answers[this.currentIndex] || [];
    
    const existingIndex = currentAnswer.indexOf(stepIndex);
    if (existingIndex > -1) {
      currentAnswer.splice(existingIndex, 1);
    } else {
      currentAnswer.push(stepIndex);
    }
    
    this.answers[this.currentIndex] = currentAnswer;
    this.updateStepSequence(currentAnswer);
    this.saveState();
  }
  
  updateStepSequence(sequence) {
    const sequenceElement = this.container.querySelector('#step-sequence');
    if (!sequenceElement) return;
    
    const question = this.questions[this.currentIndex];
    sequenceElement.innerHTML = sequence.map((stepIndex, order) => 
      `<li>${question.steps[stepIndex]}</li>`
    ).join('');
    
    // Update aria-selected states
    this.container.querySelectorAll('.step-item').forEach(item => {
      const stepIndex = parseInt(item.dataset.step);
      item.setAttribute('aria-selected', sequence.includes(stepIndex) ? 'true' : 'false');
    });
  }
  
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.render();
      this.announceToScreenReader(`Fråga ${this.currentIndex + 1} av ${this.questions.length}`);
    } else {
      this.completeQuiz();
    }
    
    this.saveState();
  }
  
  previousQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.render();
      this.announceToScreenReader(`Fråga ${this.currentIndex + 1} av ${this.questions.length}`);
    }
    
    this.saveState();
  }
  
  completeQuiz() {
    this.calculateScore();
    this.completed = true;
    this.render();
    this.announceToScreenReader(`Quiz slutförd. Du fick ${this.score} av ${this.questions.length} rätt.`);
    this.saveState();
  }
  
  calculateScore() {
    this.score = 0;
    this.questions.forEach((question, index) => {
      if (this.isAnswerCorrect(question, this.answers[index])) {
        this.score++;
      }
    });
  }
  
  isAnswerCorrect(question, userAnswer) {
    if (userAnswer === undefined || userAnswer === null) return false;
    
    switch (question.type) {
      case 'mcq':
        return userAnswer === question.correctAnswer;
        
      case 'multi':
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) return false;
        return userAnswer.length === question.correctAnswer.length &&
               userAnswer.every(answer => question.correctAnswer.includes(answer));
               
      case 'numeric':
        const tolerance = question.tolerance || 0.01;
        return Math.abs(userAnswer - question.correctAnswer) <= tolerance;
        
      case 'step':
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) return false;
        return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
        
      default:
        return false;
    }
  }
  
  formatCorrectAnswer(question) {
    switch (question.type) {
      case 'mcq':
        return question.options[question.correctAnswer];
        
      case 'multi':
        return question.correctAnswer.map(index => question.options[index]).join(', ');
        
      case 'numeric':
        return `${question.correctAnswer}${question.unit || ''}`;
        
      case 'step':
        return question.correctAnswer.map(index => question.steps[index]).join(' → ');
        
      default:
        return 'Okänt format';
    }
  }
  
  toggleReviewMode() {
    this.reviewMode = !this.reviewMode;
    if (this.reviewMode) {
      this.currentIndex = 0;
    }
    this.render();
    this.announceToScreenReader(this.reviewMode ? 'Granskningsläge aktiverat' : 'Granskningsläge avslutat');
  }
  
  restart() {
    this.currentIndex = 0;
    this.answers = {};
    this.score = 0;
    this.completed = false;
    this.reviewMode = false;
    
    if (this.options.shuffleQuestions) {
      this.shuffleArray(this.questions);
    }
    
    this.render();
    this.clearState();
    this.announceToScreenReader('Quiz omstartad');
  }
  
  saveState() {
    if (!this.options.storageKey) return;
    
    const state = {
      currentIndex: this.currentIndex,
      answers: this.answers,
      score: this.score,
      completed: this.completed,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save quiz state:', error);
    }
  }
  
  loadState() {
    if (!this.options.storageKey) return;
    
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (!saved) return;
      
      const state = JSON.parse(saved);
      
      // Check if state is recent (within 24 hours)
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
        this.clearState();
        return;
      }
      
      this.currentIndex = state.currentIndex || 0;
      this.answers = state.answers || {};
      this.score = state.score || 0;
      this.completed = state.completed || false;
    } catch (error) {
      console.warn('Could not load quiz state:', error);
    }
  }
  
  clearState() {
    if (!this.options.storageKey) return;
    
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (error) {
      console.warn('Could not clear quiz state:', error);
    }
  }
  
  announceToScreenReader(message) {
    const announcer = document.getElementById('quiz-announcements');
    if (announcer) {
      announcer.textContent = message;
    }
  }
  
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

// Global variable for backward compatibility
let quizEngine;