---
description: Entwicklungsrichtlinien für neue Features mit Testfall-Anforderungen
---

# Feature Development Workflow

Dieser Workflow definiert die Anforderungen für die Entwicklung neuer Features, insbesondere für größere Features.

## 1. Definition "Großes Feature"

Ein Feature gilt als "groß", wenn mindestens eines der folgenden Kriterien zutrifft:
- Es umfasst **mehr als 3 Dateien** oder **mehr als 200 Zeilen Code**
- Es führt einen **neuen User Flow** oder eine **neue Hauptfunktionalität** ein
- Es beeinflusst **kritische Geschäftslogik** (z.B. Zahlungen, Datenimport/export, Authentifizierung)
- Es verändert **bestehende User Journeys** signifikant

## 2. Anforderung: Testfälle erstellen

### Verpflichtung
Für jedes große Feature **MÜSSEN** Testfälle im Verzeichnis `docs/test_cases/` erstellt werden.

### Warum?
- Testfälle ermöglichen **automatisiertes Testing** durch Antigravity mit dem Browser Tool
- Sie dienen als **lebende Dokumentation** der Feature-Funktionalität
- Sie stellen **Reproduzierbarkeit** von Bugs und Regressionstests sicher

### Was muss dokumentiert werden?
Erstelle mindestens einen Testfall, der:
- Den **Happy Path** (Normalfall) des Features abdeckt
- **Edge Cases** und Fehlerfälle berücksichtigt (falls relevant)
- **Pre-conditions** klar definiert (z.B. benötigte Testdaten, Benutzerrollen)

## 3. Workflow für Feature-Entwicklung

### Schritt 1: Planung
- Analysiere die Feature-Anforderungen
- Bestimme, ob es sich um ein "großes Feature" handelt
- Plane die Implementierung

### Schritt 2: Testfall-Erstellung (für große Features)
**Bevor** du mit der Implementierung beginnst oder **parallel dazu**:

1. Erstelle eine neue Testfall-Datei in `docs/test_cases/`
   - Naming: `[Nummer]-[feature-name].md` (z.B. `015-export-without-watermark.md`)
   - Nutze die nächste verfügbare 3-stellige Nummer

2. Verwende das Standard-Format:
```markdown
# Test Case: [Feature-Name]

**ID**: TC-[Nummer]
**Description**: [Kurze Beschreibung des Features]
**Pre-conditions**:
- [Vorbedingung 1, z.B. "User ist eingeloggt"]
- [Vorbedingung 2, z.B. "Team hat PRO-Status"]

**Steps**:
1. [Schritt 1, z.B. "Navigiere zu /planner"]
2. [Schritt 2, z.B. "Klicke auf 'Export' Button"]
3. [Schritt 3, z.B. "Wähle PNG-Format"]
...

**Expected Result**:
- [Erwartetes Ergebnis 1]
- [Erwartetes Ergebnis 2]
```

3. Bei Bedarf: Erstelle Test-Daten (z.B. CSV-Dateien) im selben Verzeichnis

### Schritt 3: Implementierung
- Implementiere das Feature
- Halte den Testfall im Hinterkopf und stelle sicher, dass die Implementierung testbar ist

### Schritt 4: Verification
- Führe den Testfall manuell oder mit Antigravity aus
- Aktualisiere den Testfall bei Bedarf, falls sich während der Implementierung Details geändert haben

## 4. Testfälle für kleine Features (optional)

Für kleinere Features ist die Erstellung von Testfällen **nicht verpflichtend**, aber **empfohlen**, wenn:
- Das Feature besonders fehleranfällig sein könnte
- Es sich um eine kritische Funktion handelt
- Es später häufig getestet werden muss

## 5. Antigravity Testing

Die erstellten Testfälle können durch Antigravity automatisiert getestet werden:
- **Befehl**: Führe den `/testing` Workflow aus
- **Tool**: Antigravity nutzt das Browser Tool zur Ausführung
- **Reporting**: Gefundene Bugs werden automatisch als GitHub Issues mit den Labels `bug` und `automatisch erfasst` erstellt

## Beispiele großer Features

✅ **Benötigen Testfälle**:
- CSV Import für Paddler
- Stripe Pro-Subscription Flow
- Event-Planung und Export
- Neue Authentifizierungsmethoden

❌ **Benötigen keine Testfälle**:
- Kleine UI-Anpassungen (z.B. Button-Farbe ändern)
- Typo-Fixes in Texten
- Code-Refactoring ohne funktionale Änderungen
- Dependency-Updates
