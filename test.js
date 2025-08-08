/**
 * Test suite for 8-bit ALU
 * Run this in browser console or Node.js to validate ALU operations
 */

// Test runner function
function runTests() {
    console.log('🧪 Starting 8-bit ALU Tests...\n');
    
    const alu = new ALU8Bit();
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(description, testFunction) {
        testsTotal++;
        try {
            testFunction();
            console.log(`✅ ${description}`);
            testsPassed++;
        } catch (error) {
            console.error(`❌ ${description}: ${error.message}`);
        }
    }
    
    function assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
        }
    }
    
    function assertFlags(actualFlags, expectedFlags, message = '') {
        for (const flag in expectedFlags) {
            if (actualFlags[flag] !== expectedFlags[flag]) {
                throw new Error(`Flag ${flag}: expected ${expectedFlags[flag]}, got ${actualFlags[flag]}. ${message}`);
            }
        }
    }
    
    // Test logical operations
    console.log('🔧 Testing Logical Operations:');
    
    test('AND operation: 42 & 15 = 10', () => {
        const result = alu.and(42, 15); // 00101010 & 00001111 = 00001010
        assertEqual(result, 10);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('OR operation: 42 | 15 = 47', () => {
        const result = alu.or(42, 15); // 00101010 | 00001111 = 00101111
        assertEqual(result, 47);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('XOR operation: 42 ^ 15 = 37', () => {
        const result = alu.xor(42, 15); // 00101010 ^ 00001111 = 00100101
        assertEqual(result, 37);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('NOT operation: ~42 = 213', () => {
        const result = alu.not(42); // ~00101010 = 11010101 (213 in 8-bit)
        assertEqual(result, 213);
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: false, overflow: false });
    });
    
    test('Zero flag test: 42 & 0 = 0', () => {
        const result = alu.and(42, 0);
        assertEqual(result, 0);
        assertFlags(alu.getFlags(), { zero: true, negative: false, carry: false, overflow: false });
    });
    
    // Test arithmetic operations
    console.log('\n➕ Testing Arithmetic Operations:');
    
    test('ADD operation: 100 + 50 = 150', () => {
        const result = alu.add(100, 50);
        assertEqual(result, 150);
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: false, overflow: true });
    });
    
    test('ADD with carry: 200 + 100 = 44 (with carry)', () => {
        const result = alu.add(200, 100);
        assertEqual(result, 44); // 300 & 0xFF = 44
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: true, overflow: false });
    });
    
    test('SUB operation: 100 - 30 = 70', () => {
        const result = alu.sub(100, 30);
        assertEqual(result, 70);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('SUB with underflow: 30 - 100 = 186', () => {
        const result = alu.sub(30, 100);
        assertEqual(result, 186); // -70 & 0xFF = 186
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: true, overflow: false });
    });
    
    test('INC operation: 42 + 1 = 43', () => {
        const result = alu.inc(42);
        assertEqual(result, 43);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('INC overflow: 255 + 1 = 0 (with carry)', () => {
        const result = alu.inc(255);
        assertEqual(result, 0);
        assertFlags(alu.getFlags(), { zero: true, negative: false, carry: true, overflow: false });
    });
    
    test('DEC operation: 42 - 1 = 41', () => {
        const result = alu.dec(42);
        assertEqual(result, 41);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('DEC underflow: 0 - 1 = 255 (with carry)', () => {
        const result = alu.dec(0);
        assertEqual(result, 255);
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: true, overflow: false });
    });
    
    // Test shift operations
    console.log('\n⬅️ Testing Shift Operations:');
    
    test('SHL operation: 42 << 1 = 84', () => {
        const result = alu.shl(42); // 00101010 << 1 = 01010100
        assertEqual(result, 84);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('SHL with carry: 200 << 1 = 144 (with carry)', () => {
        const result = alu.shl(200); // 11001000 << 1 = 10010000, carry = 1
        assertEqual(result, 144);
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: true, overflow: false });
    });
    
    test('SHR operation: 42 >> 1 = 21', () => {
        const result = alu.shr(42); // 00101010 >> 1 = 00010101
        assertEqual(result, 21);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: false, overflow: false });
    });
    
    test('SHR with carry: 43 >> 1 = 21 (with carry)', () => {
        const result = alu.shr(43); // 00101011 >> 1 = 00010101, carry = 1
        assertEqual(result, 21);
        assertFlags(alu.getFlags(), { zero: false, negative: false, carry: true, overflow: false });
    });
    
    test('SHR to zero: 1 >> 1 = 0 (with carry)', () => {
        const result = alu.shr(1);
        assertEqual(result, 0);
        assertFlags(alu.getFlags(), { zero: true, negative: false, carry: true, overflow: false });
    });
    
    // Test edge cases
    console.log('\n🎯 Testing Edge Cases:');
    
    test('Maximum value operations: 255 & 255 = 255', () => {
        const result = alu.and(255, 255);
        assertEqual(result, 255);
        assertFlags(alu.getFlags(), { zero: false, negative: true, carry: false, overflow: false });
    });
    
    test('Zero operations: 0 | 0 = 0', () => {
        const result = alu.or(0, 0);
        assertEqual(result, 0);
        assertFlags(alu.getFlags(), { zero: true, negative: false, carry: false, overflow: false });
    });
    
    // Summary
    console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed! ALU implementation is working correctly.');
        return true;
    } else {
        console.log('🚨 Some tests failed. Please check the implementation.');
        return false;
    }
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('Running ALU tests...');
            runTests();
        }, 1000);
    });
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}