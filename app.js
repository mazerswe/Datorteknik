/**
 * Application logic for 8-bit ALU interface
 */

// Initialize ALU instance
const alu = new ALU8Bit();

// DOM elements
const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const binaryA = document.getElementById('binaryA');
const binaryB = document.getElementById('binaryB');
const resultDecimal = document.getElementById('resultDecimal');
const resultBinary = document.getElementById('resultBinary');
const operationButtons = document.querySelectorAll('.op-btn');

// Flag elements
const zeroFlag = document.getElementById('zeroFlag');
const carryFlag = document.getElementById('carryFlag');
const negativeFlag = document.getElementById('negativeFlag');
const overflowFlag = document.getElementById('overflowFlag');

/**
 * Convert decimal to 8-bit binary string
 */
function toBinary8Bit(value) {
    return value.toString(2).padStart(8, '0');
}

/**
 * Update binary displays for inputs
 */
function updateBinaryDisplays() {
    const valueA = parseInt(inputA.value) || 0;
    const valueB = parseInt(inputB.value) || 0;
    
    binaryA.textContent = toBinary8Bit(valueA);
    binaryB.textContent = toBinary8Bit(valueB);
}

/**
 * Update result display
 */
function updateResultDisplay(result) {
    resultDecimal.textContent = result;
    resultBinary.textContent = toBinary8Bit(result);
}

/**
 * Update flag displays
 */
function updateFlagDisplays(flags) {
    // Update flag classes
    zeroFlag.classList.toggle('active', flags.zero);
    carryFlag.classList.toggle('active', flags.carry);
    negativeFlag.classList.toggle('active', flags.negative);
    overflowFlag.classList.toggle('active', flags.overflow);
}

/**
 * Clear result and flags
 */
function clearResults() {
    resultDecimal.textContent = '-';
    resultBinary.textContent = '--------';
    
    // Clear all flag states
    const flagElements = [zeroFlag, carryFlag, negativeFlag, overflowFlag];
    flagElements.forEach(flag => flag.classList.remove('active'));
}

/**
 * Perform ALU operation
 */
function performOperation(operation) {
    const valueA = parseInt(inputA.value) || 0;
    const valueB = parseInt(inputB.value) || 0;
    
    // Ensure values are within 8-bit range
    const a = Math.max(0, Math.min(255, valueA));
    const b = Math.max(0, Math.min(255, valueB));
    
    let result;
    
    // Perform the requested operation
    switch (operation) {
        case 'and':
            result = alu.and(a, b);
            break;
        case 'or':
            result = alu.or(a, b);
            break;
        case 'xor':
            result = alu.xor(a, b);
            break;
        case 'not':
            result = alu.not(a);
            break;
        case 'add':
            result = alu.add(a, b);
            break;
        case 'sub':
            result = alu.sub(a, b);
            break;
        case 'inc':
            result = alu.inc(a);
            break;
        case 'dec':
            result = alu.dec(a);
            break;
        case 'shl':
            result = alu.shl(a);
            break;
        case 'shr':
            result = alu.shr(a);
            break;
        default:
            console.error('Unknown operation:', operation);
            return;
    }
    
    // Update displays
    updateResultDisplay(result);
    updateFlagDisplays(alu.getFlags());
    
    // Add visual feedback to the clicked button
    const clickedButton = document.querySelector(`[data-operation="${operation}"]`);
    if (clickedButton) {
        clickedButton.classList.add('clicked');
        setTimeout(() => {
            clickedButton.classList.remove('clicked');
        }, 200);
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Input change listeners
    inputA.addEventListener('input', () => {
        // Clamp value to 8-bit range
        let value = parseInt(inputA.value) || 0;
        value = Math.max(0, Math.min(255, value));
        inputA.value = value;
        updateBinaryDisplays();
        clearResults();
    });
    
    inputB.addEventListener('input', () => {
        // Clamp value to 8-bit range
        let value = parseInt(inputB.value) || 0;
        value = Math.max(0, Math.min(255, value));
        inputB.value = value;
        updateBinaryDisplays();
        clearResults();
    });
    
    // Operation button listeners
    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const operation = button.dataset.operation;
            performOperation(operation);
        });
    });
}

/**
 * Initialize the application
 */
function initialize() {
    updateBinaryDisplays();
    clearResults();
    initializeEventListeners();
    
    console.log('8-bit ALU initialized');
    console.log('Available operations: AND, OR, XOR, NOT, ADD, SUB, INC, DEC, SHL, SHR');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);