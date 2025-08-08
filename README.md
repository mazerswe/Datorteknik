# Datorteknik

En interaktiv 8-bitars ALU (Aritmetisk-Logisk Enhet) implementerad i JavaScript.

## Funktioner

### ALU-operationer
- **Logiska operationer**: AND, OR, XOR, NOT
- **Aritmetiska operationer**: ADD, SUB, INC, DEC
- **Skiftoperationer**: SHL (shift left), SHR (shift right)

### Flaggor
- **Z (Zero)**: Sätts när resultatet är noll
- **C (Carry)**: Sätts vid aritmetisk overflow/underflow eller bit som skiftas ut
- **N (Negative)**: Sätts när bit 7 i resultatet är satt
- **V (Overflow)**: Sätts vid signed overflow i aritmetiska operationer

## Användning

1. Öppna `index.html` i en webbläsare
2. Ange värden för Operand A och B (0-255)
3. Klicka på önskad operation
4. Se resultatet och aktiverade flaggor

## Testning

Öppna `test.html` för att köra den automatiska testsviten som validerar alla ALU-operationer och flaggor.

## Teknisk information

- Alla operationer arbetar med 8-bit värden (0-255)
- Binär representation visas för alla värden
- Flaggor uppdateras automatiskt baserat på operationsresultat
- Implementerad enligt standard ALU-beteende för flaggor
