class BinaryAdder extends HTMLElement {
    constructor() {
        super();
        this.operandA = 0;
        this.operandB = 0;
        this.operation = 'add'; // 'add' or 'sub'
        this.mode = 'unsigned'; // 'unsigned' or 'twos-complement'
        this.result = 0;
        this.flags = { Z: false, N: false, C: false, V: false };
        this.steps = [];
    }

    connectedCallback() {
        this.innerHTML = this.getTemplate();
        this.setupEventListeners();
        // Initialize operands from input values
        this.operandA = parseInt(this.querySelector('#operand-a').value) || 0;
        this.operandB = parseInt(this.querySelector('#operand-b').value) || 0;
        this.calculate();
    }

    getTemplate() {
        return `
            <div class="binary-adder">
                <div class="input-section">
                    <div class="input-group">
                        <label for="operand-a">Operand A (decimal):</label>
                        <input type="number" id="operand-a" value="5" min="0" max="255">
                        <div class="bit-display" id="bits-a"></div>
                    </div>
                    <div class="input-group">
                        <label for="operand-b">Operand B (decimal):</label>
                        <input type="number" id="operand-b" value="3" min="0" max="255">
                        <div class="bit-display" id="bits-b"></div>
                    </div>
                </div>

                <div class="operation-section">
                    <button id="add-btn" class="active">Addition (+)</button>
                    <button id="sub-btn">Subtraktion (-)</button>
                </div>

                <div class="mode-section">
                    <label>
                        <input type="radio" name="mode" value="unsigned" checked>
                        Unsigned (0-255)
                    </label>
                    <label>
                        <input type="radio" name="mode" value="twos-complement">
                        Tvåkomplement (-128 till 127)
                    </label>
                </div>

                <div class="result-section">
                    <div class="result-display">
                        <div>Resultat: <span id="result-decimal">8</span> (decimal)</div>
                        <div class="bit-display" id="result-bits"></div>
                    </div>
                    
                    <div class="flags-display">
                        <div class="flag" id="flag-z">Z (Zero)</div>
                        <div class="flag" id="flag-n">N (Negative)</div>
                        <div class="flag" id="flag-c">C (Carry)</div>
                        <div class="flag" id="flag-v">V (Overflow)</div>
                    </div>
                </div>

                <div class="steps-section">
                    <h3>Bitvisa steg:</h3>
                    <div id="calculation-steps"></div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Input listeners
        this.querySelector('#operand-a').addEventListener('input', (e) => {
            this.operandA = parseInt(e.target.value) || 0;
            this.updateInputConstraints();
            this.calculate();
        });

        this.querySelector('#operand-b').addEventListener('input', (e) => {
            this.operandB = parseInt(e.target.value) || 0;
            this.updateInputConstraints();
            this.calculate();
        });

        // Operation buttons
        this.querySelector('#add-btn').addEventListener('click', () => {
            this.operation = 'add';
            this.updateOperationButtons();
            this.calculate();
        });

        this.querySelector('#sub-btn').addEventListener('click', () => {
            this.operation = 'sub';
            this.updateOperationButtons();
            this.calculate();
        });

        // Mode radio buttons
        this.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mode = e.target.value;
                this.updateInputConstraints();
                this.calculate();
            });
        });
    }

    updateInputConstraints() {
        const inputA = this.querySelector('#operand-a');
        const inputB = this.querySelector('#operand-b');
        
        if (this.mode === 'unsigned') {
            inputA.min = '0';
            inputA.max = '255';
            inputB.min = '0';
            inputB.max = '255';
        } else {
            inputA.min = '-128';
            inputA.max = '127';
            inputB.min = '-128';
            inputB.max = '127';
        }
        
        // Constrain current values
        this.operandA = Math.max(parseInt(inputA.min), Math.min(parseInt(inputA.max), this.operandA));
        this.operandB = Math.max(parseInt(inputB.min), Math.min(parseInt(inputB.max), this.operandB));
        
        inputA.value = this.operandA;
        inputB.value = this.operandB;
    }

    updateOperationButtons() {
        this.querySelector('#add-btn').classList.toggle('active', this.operation === 'add');
        this.querySelector('#sub-btn').classList.toggle('active', this.operation === 'sub');
    }

    toBinary(value, bits = 8) {
        if (this.mode === 'unsigned') {
            return (value >>> 0).toString(2).padStart(bits, '0');
        } else {
            // Two's complement
            if (value < 0) {
                return ((1 << bits) + value).toString(2).padStart(bits, '0');
            } else {
                return value.toString(2).padStart(bits, '0');
            }
        }
    }

    fromBinary(binaryStr) {
        if (this.mode === 'unsigned') {
            return parseInt(binaryStr, 2);
        } else {
            // Two's complement
            const value = parseInt(binaryStr, 2);
            const maxValue = 1 << (binaryStr.length - 1);
            return value >= maxValue ? value - (1 << binaryStr.length) : value;
        }
    }

    calculate() {
        this.steps = [];
        
        // Convert operands to 8-bit representation
        const bitsA = this.toBinary(this.operandA);
        const bitsB = this.toBinary(this.operandB);
        
        let resultBits;
        let carry = 0;
        
        if (this.operation === 'add') {
            const result = this.addBinary(bitsA, bitsB);
            resultBits = result.bits;
            carry = result.carry;
        } else {
            // Subtraction: A - B = A + (-B) = A + (two's complement of B)
            const negB = this.twosComplement(bitsB);
            const result = this.addBinary(bitsA, negB);
            resultBits = result.bits;
            carry = result.carry;
        }

        // Calculate result value
        this.result = this.fromBinary(resultBits);
        
        // Update flags
        this.updateFlags(resultBits, carry);
        
        // Update display
        this.updateDisplay();
    }

    addBinary(bitsA, bitsB) {
        const steps = [];
        let carry = 0;
        let resultBits = '';
        
        // Add step showing the operands
        if (this.operation === 'add') {
            steps.push(`Addition: ${this.operandA} + ${this.operandB}`);
        } else {
            steps.push(`Subtraktion: ${this.operandA} - ${this.operandB}`);
            steps.push(`Omvandlar till: ${this.operandA} + (-${this.operandB})`);
            steps.push(`Tvåkomplement av ${this.operandB}: ${bitsB}`);
        }
        
        steps.push(`Operand A: ${bitsA}`);
        steps.push(`Operand B: ${bitsB}`);
        steps.push('');
        steps.push('Bitvis addition från höger till vänster:');
        
        // Perform binary addition bit by bit (right to left)
        for (let i = 7; i >= 0; i--) {
            const bitA = parseInt(bitsA[i]);
            const bitB = parseInt(bitsB[i]);
            const sum = bitA + bitB + carry;
            const resultBit = sum % 2;
            const newCarry = Math.floor(sum / 2);
            
            resultBits = resultBit + resultBits;
            
            // Add step for this bit position
            const position = 7 - i;
            steps.push(`Bit ${position}: ${bitA} + ${bitB} + ${carry}(carry) = ${sum} → bit=${resultBit}, carry=${newCarry}`);
            
            carry = newCarry;
        }
        
        if (carry > 0) {
            steps.push(`Slutlig carry: ${carry}`);
        }
        
        this.steps = steps;
        
        return { bits: resultBits, carry: carry };
    }

    twosComplement(bits) {
        // Invert all bits
        let inverted = '';
        for (let i = 0; i < bits.length; i++) {
            inverted += bits[i] === '0' ? '1' : '0';
        }
        
        // Add 1
        let carry = 1;
        let result = '';
        for (let i = bits.length - 1; i >= 0; i--) {
            const sum = parseInt(inverted[i]) + carry;
            result = (sum % 2) + result;
            carry = Math.floor(sum / 2);
        }
        
        return result;
    }

    updateFlags(resultBits, carry) {
        // Z (Zero) flag: result is zero
        this.flags.Z = this.result === 0;
        
        // N (Negative) flag: most significant bit is 1 (for two's complement)
        this.flags.N = this.mode === 'twos-complement' && resultBits[0] === '1';
        
        // C (Carry) flag: carry out from the most significant bit
        this.flags.C = carry > 0;
        
        // V (Overflow) flag: signed overflow occurred
        if (this.mode === 'twos-complement') {
            const aSign = this.operandA < 0;
            const bSign = (this.operation === 'add') ? (this.operandB < 0) : (this.operandB >= 0);
            const resultSign = this.result < 0;
            
            // Overflow occurs when:
            // - Adding two positive numbers gives negative result
            // - Adding two negative numbers gives positive result
            this.flags.V = (aSign === bSign) && (aSign !== resultSign);
        } else {
            // For unsigned, overflow is same as carry
            this.flags.V = this.flags.C;
        }
    }

    updateDisplay() {
        // Update binary displays
        this.updateBitDisplay('#bits-a', this.toBinary(this.operandA));
        this.updateBitDisplay('#bits-b', this.toBinary(this.operandB));
        this.updateBitDisplay('#result-bits', this.toBinary(this.result), 'result');
        
        // Update result value
        this.querySelector('#result-decimal').textContent = this.result;
        
        // Update flags
        Object.keys(this.flags).forEach(flag => {
            const element = this.querySelector(`#flag-${flag.toLowerCase()}`);
            element.classList.toggle('active', this.flags[flag]);
        });
        
        // Update steps
        this.updateSteps();
    }

    updateBitDisplay(selector, bits, className = '') {
        const container = this.querySelector(selector);
        container.innerHTML = '';
        
        for (let i = 0; i < bits.length; i++) {
            const bitElement = document.createElement('div');
            bitElement.className = `bit ${className}`;
            bitElement.textContent = bits[i];
            container.appendChild(bitElement);
        }
    }

    updateSteps() {
        const stepsContainer = this.querySelector('#calculation-steps');
        stepsContainer.innerHTML = '';
        
        this.steps.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step';
            stepElement.textContent = step;
            stepsContainer.appendChild(stepElement);
        });
    }
}

// Register the custom element
customElements.define('binary-adder', BinaryAdder);