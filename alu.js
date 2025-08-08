/**
 * 8-bit ALU (Arithmetic Logic Unit) Implementation
 * Performs logical, arithmetic, and shift operations on 8-bit values
 */
class ALU8Bit {
    constructor() {
        this.result = 0;
        this.flags = {
            zero: false,    // Z flag - result is zero
            carry: false,   // C flag - carry out from bit 7
            negative: false, // N flag - result is negative (bit 7 set)
            overflow: false  // V flag - signed overflow occurred
        };
    }

    /**
     * Convert number to 8-bit value
     */
    to8Bit(value) {
        return value & 0xFF;
    }

    /**
     * Convert number to binary string representation
     */
    toBinary(value) {
        return value.toString(2).padStart(8, '0');
    }

    /**
     * Update flags based on result and operation
     */
    updateFlags(result, operandA = 0, operandB = 0, operation = '') {
        // Clear all flags first
        this.flags.zero = false;
        this.flags.carry = false;
        this.flags.negative = false;
        this.flags.overflow = false;

        // Zero flag: set if result is zero (all operations)
        this.flags.zero = (result & 0xFF) === 0;

        // Negative flag: set if bit 7 is set (all operations)
        this.flags.negative = (result & 0x80) !== 0;

        // Handle flags based on operation type
        if (operation === 'and' || operation === 'or' || operation === 'xor' || operation === 'not') {
            // Logical operations: only Zero and Negative flags are typically affected
            // Carry and Overflow are cleared
            this.flags.carry = false;
            this.flags.overflow = false;
        } else if (operation === 'add') {
            // Addition: set carry if result exceeds 8 bits
            this.flags.carry = result > 0xFF;
            // Overflow: set if both operands have same sign but result has different sign
            const signA = (operandA & 0x80) !== 0;
            const signB = (operandB & 0x80) !== 0;
            const signResult = (result & 0x80) !== 0;
            this.flags.overflow = (signA === signB) && (signA !== signResult);
        } else if (operation === 'sub') {
            // Subtraction: set carry if result is negative (borrow occurred)
            this.flags.carry = result < 0;
            // Overflow: set if operands have different signs and result sign matches subtrahend
            const signA = (operandA & 0x80) !== 0;
            const signB = (operandB & 0x80) !== 0;
            const signResult = (result & 0x80) !== 0;
            this.flags.overflow = (signA !== signB) && (signA !== signResult);
        } else if (operation === 'shl') {
            // Shift left: carry gets the bit that was shifted out
            this.flags.carry = (operandA & 0x80) !== 0;
            this.flags.overflow = false; // Not typically set for shifts
        } else if (operation === 'shr') {
            // Shift right: carry gets the bit that was shifted out
            this.flags.carry = (operandA & 0x01) !== 0;
            this.flags.overflow = false; // Not typically set for shifts
        }

        this.result = this.to8Bit(result);
    }

    /**
     * Logical AND operation
     */
    and(a, b) {
        const result = a & b;
        this.updateFlags(result, a, b, 'and');
        return this.result;
    }

    /**
     * Logical OR operation
     */
    or(a, b) {
        const result = a | b;
        this.updateFlags(result, a, b, 'or');
        return this.result;
    }

    /**
     * Logical XOR operation
     */
    xor(a, b) {
        const result = a ^ b;
        this.updateFlags(result, a, b, 'xor');
        return this.result;
    }

    /**
     * Logical NOT operation (complement)
     */
    not(a) {
        const result = ~a;
        this.updateFlags(result, a, 0, 'not');
        return this.result;
    }

    /**
     * Addition operation
     */
    add(a, b) {
        const result = a + b;
        this.updateFlags(result, a, b, 'add');
        return this.result;
    }

    /**
     * Subtraction operation
     */
    sub(a, b) {
        const result = a - b;
        this.updateFlags(result, a, b, 'sub');
        return this.result;
    }

    /**
     * Increment operation
     */
    inc(a) {
        const result = a + 1;
        this.updateFlags(result, a, 1, 'add');
        return this.result;
    }

    /**
     * Decrement operation
     */
    dec(a) {
        const result = a - 1;
        this.updateFlags(result, a, 1, 'sub');
        return this.result;
    }

    /**
     * Shift left operation
     */
    shl(a) {
        const result = a << 1;
        this.updateFlags(result, a, 0, 'shl');
        return this.result;
    }

    /**
     * Shift right operation
     */
    shr(a) {
        const result = a >> 1;
        this.updateFlags(result, a, 0, 'shr');
        return this.result;
    }

    /**
     * Get current flags state
     */
    getFlags() {
        return { ...this.flags };
    }

    /**
     * Get current result
     */
    getResult() {
        return this.result;
    }
}