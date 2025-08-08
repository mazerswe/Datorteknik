class BaseConverter {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentSource = null;
    }

    initializeElements() {
        this.decimalInput = document.getElementById('decimal-input');
        this.binaryInput = document.getElementById('binary-input');
        this.hexInput = document.getElementById('hex-input');
        this.bitWidthSelect = document.getElementById('bit-width');
        this.twosComplementCheckbox = document.getElementById('twos-complement');
        this.clearBtn = document.getElementById('clear-btn');
        
        this.resultDecimal = document.getElementById('result-decimal');
        this.resultBinary = document.getElementById('result-binary');
        this.resultHex = document.getElementById('result-hex');
        this.stepExplanation = document.getElementById('step-explanation');
    }

    attachEventListeners() {
        this.decimalInput.addEventListener('input', () => this.handleInput('decimal'));
        this.binaryInput.addEventListener('input', () => this.handleInput('binary'));
        this.hexInput.addEventListener('input', () => this.handleInput('hex'));
        
        this.bitWidthSelect.addEventListener('change', () => this.updateConversion());
        this.twosComplementCheckbox.addEventListener('change', () => this.updateConversion());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleInput(source) {
        this.currentSource = source;
        this.updateConversion();
    }

    updateConversion() {
        if (!this.currentSource) return;

        try {
            let value;
            let isValid = true;

            // Clear error states
            this.clearErrorStates();

            switch (this.currentSource) {
                case 'decimal':
                    value = this.decimalInput.value.trim();
                    if (value === '') {
                        this.clearResults();
                        return;
                    }
                    isValid = this.validateDecimal(value);
                    if (isValid) {
                        this.convertFromDecimal(parseInt(value, 10));
                    }
                    break;
                    
                case 'binary':
                    value = this.binaryInput.value.trim();
                    if (value === '') {
                        this.clearResults();
                        return;
                    }
                    isValid = this.validateBinary(value);
                    if (isValid) {
                        this.convertFromBinary(value);
                    }
                    break;
                    
                case 'hex':
                    value = this.hexInput.value.trim();
                    if (value === '') {
                        this.clearResults();
                        return;
                    }
                    isValid = this.validateHex(value);
                    if (isValid) {
                        this.convertFromHex(value);
                    }
                    break;
            }

            if (!isValid) {
                this.setErrorState(this.currentSource);
                this.clearResults();
            }
        } catch (error) {
            this.setErrorState(this.currentSource);
            this.clearResults();
        }
    }

    validateDecimal(value) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return false;
        
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const isTwosComplement = this.twosComplementCheckbox.checked;
        
        if (isTwosComplement) {
            const min = -(Math.pow(2, bitWidth - 1));
            const max = Math.pow(2, bitWidth - 1) - 1;
            return num >= min && num <= max;
        } else {
            const max = Math.pow(2, bitWidth) - 1;
            return num >= 0 && num <= max;
        }
    }

    validateBinary(value) {
        if (!/^[01]+$/.test(value)) return false;
        const bitWidth = parseInt(this.bitWidthSelect.value);
        return value.length <= bitWidth;
    }

    validateHex(value) {
        if (!/^[0-9A-Fa-f]+$/.test(value)) return false;
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const maxHexDigits = bitWidth / 4;
        return value.length <= maxHexDigits;
    }

    convertFromDecimal(decimal) {
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const isTwosComplement = this.twosComplementCheckbox.checked;
        
        let binary, hex;
        
        if (isTwosComplement && decimal < 0) {
            // Two's complement conversion for negative numbers
            const positive = Math.abs(decimal);
            const maxValue = Math.pow(2, bitWidth);
            const twosComplement = maxValue - positive;
            binary = twosComplement.toString(2).padStart(bitWidth, '0');
            hex = twosComplement.toString(16).toUpperCase().padStart(bitWidth / 4, '0');
        } else {
            binary = decimal.toString(2).padStart(bitWidth, '0');
            hex = decimal.toString(16).toUpperCase().padStart(bitWidth / 4, '0');
        }

        this.updateResults(decimal, binary, hex);
        this.generateExplanation('decimal', decimal, binary, hex);
    }

    convertFromBinary(binary) {
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const isTwosComplement = this.twosComplementCheckbox.checked;
        
        // Pad with zeros to match bit width
        const paddedBinary = binary.padStart(bitWidth, '0');
        
        let decimal;
        
        if (isTwosComplement && paddedBinary[0] === '1') {
            // Negative number in two's complement
            const maxValue = Math.pow(2, bitWidth);
            decimal = parseInt(paddedBinary, 2) - maxValue;
        } else {
            decimal = parseInt(paddedBinary, 2);
        }
        
        const hex = parseInt(paddedBinary, 2).toString(16).toUpperCase().padStart(bitWidth / 4, '0');

        this.updateResults(decimal, paddedBinary, hex);
        this.generateExplanation('binary', decimal, paddedBinary, hex);
    }

    convertFromHex(hex) {
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const isTwosComplement = this.twosComplementCheckbox.checked;
        
        // Pad with zeros to match bit width
        const paddedHex = hex.toUpperCase().padStart(bitWidth / 4, '0');
        const decimal = parseInt(paddedHex, 16);
        
        let adjustedDecimal = decimal;
        
        if (isTwosComplement && decimal >= Math.pow(2, bitWidth - 1)) {
            // Negative number in two's complement
            adjustedDecimal = decimal - Math.pow(2, bitWidth);
        }
        
        const binary = decimal.toString(2).padStart(bitWidth, '0');

        this.updateResults(adjustedDecimal, binary, paddedHex);
        this.generateExplanation('hex', adjustedDecimal, binary, paddedHex);
    }

    updateResults(decimal, binary, hex) {
        this.resultDecimal.textContent = decimal;
        this.resultBinary.textContent = this.formatBinary(binary);
        this.resultHex.textContent = '0x' + hex;
        
        // Update other inputs
        if (this.currentSource !== 'decimal') {
            this.decimalInput.value = decimal;
        }
        if (this.currentSource !== 'binary') {
            this.binaryInput.value = binary;
        }
        if (this.currentSource !== 'hex') {
            this.hexInput.value = hex;
        }
        
        this.setSuccessStates();
    }

    formatBinary(binary) {
        // Add spaces every 4 bits for better readability
        return binary.replace(/(.{4})/g, '$1 ').trim();
    }

    generateExplanation(source, decimal, binary, hex) {
        const bitWidth = parseInt(this.bitWidthSelect.value);
        const isTwosComplement = this.twosComplementCheckbox.checked;
        
        let explanation = '';
        
        switch (source) {
            case 'decimal':
                explanation = this.explainDecimalConversion(decimal, binary, hex, bitWidth, isTwosComplement);
                break;
            case 'binary':
                explanation = this.explainBinaryConversion(binary, decimal, hex, bitWidth, isTwosComplement);
                break;
            case 'hex':
                explanation = this.explainHexConversion(hex, decimal, binary, bitWidth, isTwosComplement);
                break;
        }
        
        this.stepExplanation.innerHTML = explanation;
    }

    explainDecimalConversion(decimal, binary, hex, bitWidth, isTwosComplement) {
        let explanation = `<h4>Konvertering från decimal (${decimal})</h4>`;
        
        if (isTwosComplement && decimal < 0) {
            explanation += `
                <p>Negativa tal i tvåkomplement:</p>
                <div class="step">
                    <strong>Steg 1:</strong> Hitta det positiva talet: ${Math.abs(decimal)}
                </div>
                <div class="step">
                    <strong>Steg 2:</strong> Konvertera till binärt: ${Math.abs(decimal).toString(2)}
                </div>
                <div class="step">
                    <strong>Steg 3:</strong> Vänd alla bitar (bitvis NOT): ${this.invertBits(Math.abs(decimal).toString(2).padStart(bitWidth, '0'))}
                </div>
                <div class="step">
                    <strong>Steg 4:</strong> Lägg till 1: ${binary}
                </div>
                <p>Detta ger tvåkomplementrepresentationen för ${decimal}.</p>
            `;
        } else {
            explanation += `
                <div class="step">
                    <strong>Till binärt:</strong> Dela upprepade gånger med 2 och läs resterna bakifrån
                </div>
                ${this.generateDivisionSteps(decimal, 2)}
                <div class="step">
                    <strong>Resultat:</strong> ${binary} (utfyllt till ${bitWidth} bitar)
                </div>
            `;
        }
        
        explanation += `
            <div class="step">
                <strong>Till hexadecimal:</strong> Gruppera binära siffror i grupper om 4 och konvertera varje grupp
            </div>
            ${this.generateBinaryToHexSteps(binary)}
            <div class="step">
                <strong>Resultat:</strong> 0x${hex}
            </div>
        `;
        
        return explanation;
    }

    explainBinaryConversion(binary, decimal, hex, bitWidth, isTwosComplement) {
        let explanation = `<h4>Konvertering från binärt (${binary})</h4>`;
        
        if (isTwosComplement && binary[0] === '1') {
            explanation += `
                <p>Första biten är 1, vilket indikerar ett negativt tal i tvåkomplement:</p>
                <div class="step">
                    <strong>Steg 1:</strong> Vänd alla bitar: ${this.invertBits(binary)}
                </div>
                <div class="step">
                    <strong>Steg 2:</strong> Lägg till 1: ${this.addOneToBinary(this.invertBits(binary))}
                </div>
                <div class="step">
                    <strong>Steg 3:</strong> Konvertera till decimal och gör negativ: ${decimal}
                </div>
            `;
        } else {
            explanation += `
                <div class="step">
                    <strong>Till decimal:</strong> Beräkna positionsvärden (potenser av 2)
                </div>
                ${this.generatePositionalValues(binary)}
                <div class="step">
                    <strong>Summa:</strong> ${decimal}
                </div>
            `;
        }
        
        explanation += `
            <div class="step">
                <strong>Till hexadecimal:</strong> Gruppera i grupper om 4 bitar
            </div>
            ${this.generateBinaryToHexSteps(binary)}
            <div class="step">
                <strong>Resultat:</strong> 0x${hex}
            </div>
        `;
        
        return explanation;
    }

    explainHexConversion(hex, decimal, binary, bitWidth, isTwosComplement) {
        let explanation = `<h4>Konvertering från hexadecimal (0x${hex})</h4>`;
        
        explanation += `
            <div class="step">
                <strong>Till binärt:</strong> Konvertera varje hexadecimal siffra till 4 binära bitar
            </div>
            ${this.generateHexToBinarySteps(hex)}
            <div class="step">
                <strong>Resultat:</strong> ${binary}
            </div>
            
            <div class="step">
                <strong>Till decimal:</strong> Beräkna positionsvärden
            </div>
            ${this.generateHexPositionalValues(hex)}
            <div class="step">
                <strong>Summa:</strong> ${decimal}
            </div>
        `;
        
        return explanation;
    }

    generateDivisionSteps(num, base) {
        let steps = '';
        let current = num;
        let remainders = [];
        
        while (current > 0) {
            const remainder = current % base;
            remainders.unshift(remainder);
            steps += `<div class="step">${current} ÷ ${base} = ${Math.floor(current / base)} rest ${remainder}</div>`;
            current = Math.floor(current / base);
        }
        
        return steps;
    }

    generatePositionalValues(binary) {
        let steps = '';
        let sum = 0;
        const bits = binary.split('').reverse();
        
        for (let i = 0; i < bits.length; i++) {
            if (bits[i] === '1') {
                const value = Math.pow(2, i);
                sum += value;
                steps += `<div class="step">Position ${i}: ${bits[i]} × 2^${i} = ${value}</div>`;
            }
        }
        
        return steps;
    }

    generateBinaryToHexSteps(binary) {
        let steps = '';
        const groups = [];
        
        // Group into 4-bit chunks from right to left
        for (let i = binary.length; i > 0; i -= 4) {
            const start = Math.max(0, i - 4);
            groups.unshift(binary.slice(start, i));
        }
        
        groups.forEach(group => {
            const padded = group.padStart(4, '0');
            const hexValue = parseInt(padded, 2).toString(16).toUpperCase();
            steps += `<div class="step">${padded} = ${hexValue}</div>`;
        });
        
        return steps;
    }

    generateHexToBinarySteps(hex) {
        let steps = '';
        
        for (let char of hex) {
            const decimal = parseInt(char, 16);
            const binary = decimal.toString(2).padStart(4, '0');
            steps += `<div class="step">${char} = ${binary}</div>`;
        }
        
        return steps;
    }

    generateHexPositionalValues(hex) {
        let steps = '';
        const chars = hex.split('').reverse();
        
        for (let i = 0; i < chars.length; i++) {
            const value = parseInt(chars[i], 16) * Math.pow(16, i);
            steps += `<div class="step">Position ${i}: ${chars[i]} × 16^${i} = ${value}</div>`;
        }
        
        return steps;
    }

    invertBits(binary) {
        return binary.split('').map(bit => bit === '0' ? '1' : '0').join('');
    }

    addOneToBinary(binary) {
        let result = '';
        let carry = 1;
        
        for (let i = binary.length - 1; i >= 0; i--) {
            const sum = parseInt(binary[i]) + carry;
            result = (sum % 2) + result;
            carry = Math.floor(sum / 2);
        }
        
        return result;
    }

    setErrorState(source) {
        const input = source === 'decimal' ? this.decimalInput : 
                     source === 'binary' ? this.binaryInput : this.hexInput;
        input.classList.add('error');
        input.classList.remove('success');
    }

    setSuccessStates() {
        [this.decimalInput, this.binaryInput, this.hexInput].forEach(input => {
            input.classList.remove('error');
            input.classList.add('success');
        });
    }

    clearErrorStates() {
        [this.decimalInput, this.binaryInput, this.hexInput].forEach(input => {
            input.classList.remove('error', 'success');
        });
    }

    clearResults() {
        this.resultDecimal.textContent = '-';
        this.resultBinary.textContent = '-';
        this.resultHex.textContent = '-';
        this.stepExplanation.innerHTML = '<p>Ange ett värde i något av fälten ovan för att se steg-för-steg förklaring av konverteringen.</p>';
    }

    clearAll() {
        this.decimalInput.value = '';
        this.binaryInput.value = '';
        this.hexInput.value = '';
        this.currentSource = null;
        this.clearErrorStates();
        this.clearResults();
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BaseConverter();
});