# Datorteknik

## Sanningstabell (Truth Table Generator)

En webbaserad sanningstabell-generator som stöder 2-4 variabler med automatisk generering av minterm-uttryck och kanonisk SOP (Sum of Products).

### Funktioner

- **2-4 Variabler**: Stöder sanningstabell för 2, 3 eller 4 variabler
- **Anpassningsbara variabelnamn**: Ändra variabelnamn från standard A, B, C, D
- **Interaktiv redigering**: Ändra sanningsvärden direkt i tabellen
- **Minterm-uttryck**: Automatisk generering av Σm()-notation
- **Kanonisk SOP**: Visar fullständiga Sum of Products-uttryck
- **Markering av mintermer**: Rader med output = 1 markeras visuellt

### Användning

1. Öppna `sanningstabell.html` i en webbläsare
2. Välj antal variabler (2-4)
3. Ange variabelnamn (valfritt)
4. Klicka "Generera sanningstabell"
5. Ange sanningsvärden för varje rad
6. Se resultat i form av minterm-uttryck och kanonisk SOP

### Exempel

**2 variabler (A, B):**
- Σm(1, 3) = A'B + AB

**3 variabler (A, B, C):**
- Σm(1, 5, 7) = A'B'C + AB'C + ABC
