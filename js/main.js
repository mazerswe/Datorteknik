// JavaScript for Datorteknik course functionality

document.addEventListener('DOMContentLoaded', function() {
    // Set active navigation item
    setActiveNavItem();
    
    // Initialize component embedding functionality
    initializeComponentEmbeds();
    
    // Initialize exercise interactions
    initializeExercises();
});

function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop() || 
            currentPath.includes(link.getAttribute('href').replace('.html', ''))) {
            link.classList.add('active');
        }
    });
}

function initializeComponentEmbeds() {
    const componentEmbeds = document.querySelectorAll('.component-embed');
    
    componentEmbeds.forEach(embed => {
        embed.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Simulate component loading
            if (this.classList.contains('active')) {
                this.innerHTML = '<p>Komponent laddad! Interaktivt innehåll visas här.</p>';
            } else {
                this.innerHTML = '<p>Klicka för att ladda komponent</p>';
            }
        });
    });
}

function initializeExercises() {
    // Initialize exercise answer checking
    const exerciseButtons = document.querySelectorAll('.exercise-check');
    
    exerciseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const exercise = this.closest('.exercise-container');
            const inputs = exercise.querySelectorAll('input[type="text"], select');
            
            // Simple validation - in a real course, this would be more sophisticated
            let allCorrect = true;
            inputs.forEach(input => {
                if (input.value.trim() === '') {
                    allCorrect = false;
                    input.style.borderColor = '#e74c3c';
                } else {
                    input.style.borderColor = '#27ae60';
                }
            });
            
            // Show feedback
            let feedback = exercise.querySelector('.exercise-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'exercise-feedback';
                exercise.appendChild(feedback);
            }
            
            if (allCorrect) {
                feedback.innerHTML = '<p style="color: #27ae60;">✓ Bra jobbat! Alla fält är ifyllda.</p>';
            } else {
                feedback.innerHTML = '<p style="color: #e74c3c;">✗ Fyll i alla fält för att slutföra övningen.</p>';
            }
        });
    });
}

// Utility function for component embedding
function embedComponent(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    switch(type) {
        case 'binary-converter':
            container.innerHTML = `
                <div style="padding: 1rem; background: white; border-radius: 4px;">
                    <h4>Binär-konverterare</h4>
                    <input type="number" id="decimal-input" placeholder="Decimalt tal">
                    <button onclick="convertToBinary()">Konvertera</button>
                    <p id="binary-result"></p>
                </div>
            `;
            break;
        case 'logic-gate':
            container.innerHTML = `
                <div style="padding: 1rem; background: white; border-radius: 4px;">
                    <h4>Logisk grind-simulator</h4>
                    <p>A: <input type="checkbox" id="input-a"> B: <input type="checkbox" id="input-b"></p>
                    <select id="gate-type">
                        <option value="and">AND</option>
                        <option value="or">OR</option>
                        <option value="not">NOT</option>
                    </select>
                    <button onclick="calculateLogic()">Beräkna</button>
                    <p id="logic-result"></p>
                </div>
            `;
            break;
    }
}

function convertToBinary() {
    const decimal = document.getElementById('decimal-input').value;
    const result = document.getElementById('binary-result');
    if (decimal) {
        result.textContent = `Binärt: ${parseInt(decimal).toString(2)}`;
    }
}

function calculateLogic() {
    const a = document.getElementById('input-a').checked;
    const b = document.getElementById('input-b').checked;
    const gate = document.getElementById('gate-type').value;
    const result = document.getElementById('logic-result');
    
    let output;
    switch(gate) {
        case 'and': output = a && b; break;
        case 'or': output = a || b; break;
        case 'not': output = !a; break;
    }
    
    result.textContent = `Resultat: ${output ? '1' : '0'}`;
}