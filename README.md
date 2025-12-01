# Drachenboot Manager

![App Icon](/public/icons/logo-192.png)

## 📖 Über das Projekt

Der **Drachenboot Manager** ist eine Progressive Web App (PWA) zur Verwaltung von Drachenboot-Teams. Sie ermöglicht Trainern und Teamkapitänen die effiziente Planung von Trainings und Regatten sowie die optimale Besetzung des Bootes unter Berücksichtigung von Gewichtsverteilung und individuellen Fähigkeiten.

### ✨ Features

*   **Team Management**: Verwalten von Mitgliedern inkl. Gewicht und Fähigkeiten (Links, Rechts, Trommel, Steuer).
*   **Terminplanung**: Erstellen von Trainings und Regatten mit Zu-/Absage-Funktion.
*   **Magic KI**: Automatischer Algorithmus zur optimalen Bootsbesetzung (Balance & Trimm).
*   **Boots-Visualisierung**: Interaktive Drag & Drop (bzw. Click & Assign) Oberfläche für das Drachenboot.
*   **Statistiken**: Echtzeit-Berechnung von Gesamtgewicht, Balance (Links/Rechts) und Trimm (Bug/Heck).
*   **Offline-First**: Dank PWA-Technologie und LocalStorage auch ohne Internet nutzbar.
*   **Internationalisierung**: Verfügbar in Deutsch und Englisch (automatische Erkennung).
*   **Dark Mode**: Automatische Anpassung an das System-Theme.

## 🛠 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State Management**: React Context API (`DrachenbootContext`, `LanguageContext`)
*   **Persistence**: LocalStorage (via `src/utils/storage.ts`)
*   **Export**: `html2canvas` für Bild-Export der Aufstellung

## 📂 Projektstruktur

```
src/
├── app/                 # Next.js App Router Pages (TSX)
│   ├── layout.tsx       # Root Layout & Providers
│   ├── page.tsx         # Home / Team View
│   └── planner/         # Planner View Route
├── components/
│   ├── drachenboot/     # Domain-spezifische Komponenten (TeamView, PlannerView)
│   └── ui/              # Wiederverwendbare UI-Komponenten (Buttons, Modals, etc.)
├── context/             # Global State (Daten, Sprache, Tour)
├── locales/             # Übersetzungsdateien (de.json, en.json)
├── types/               # TypeScript Definitionen (index.ts)
└── utils/               # Hilfsfunktionen (Storage, Algorithmus)
```

## 🚀 Getting Started

### Voraussetzungen

*   Node.js 18.17+
*   npm oder yarn

### Konfiguration

Erstelle eine `.env` Datei im Hauptverzeichnis (siehe `.env.example`):

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### Installation

1.  Repository klonen:
    ```bash
    git clone <repo-url>
    cd drachenbootplan
    ```

2.  Abhängigkeiten installieren:
    ```bash
    npm install
    ```

3.  Development Server starten:
    ```bash
    npm run dev
    ```

4.  App öffnen: [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

Das Projekt verwendet **Jest** und **React Testing Library** für Unit- und Integrationstests.

### Tests ausführen

```bash
npm test
```

### CI/CD

Tests werden automatisch bei jedem Push und Pull Request auf den `main` Branch via **GitHub Actions** ausgeführt.

- **Unit Tests**: `src/utils/__tests__` (Algorithmus-Logik)
- **Component Tests**: `src/components/**/__tests__` (UI-Komponenten wie `SeatBox`, `Stats`, `Header`)

## 📚 Documentation

*   [API Documentation](docs/API.md)

## 👨‍💻 Development Guidelines

### Localization
Neue Features müssen vollständig lokalisiert werden. Bitte aktualisiere immer beide Sprachdateien:
*   `src/locales/de.json`
*   `src/locales/en.json`

### Testing
Jedes neue Feature und jeder Bugfix sollte von Tests begleitet werden.
*   **Logik**: Unit Tests in `src/utils/__tests__`
*   **UI**: Component Tests in `src/components/**/__tests__`

## 🧠 Key Concepts

*   **Paddler**: Ein Teammitglied mit Eigenschaften wie Gewicht und bevorzugter Seite.
*   **Event**: Ein Training oder eine Regatta mit einer Liste von `attendance` (Zu/Absagen).
*   **Assignment**: Die Zuordnung eines Paddlers zu einem Sitzplatz (`row-1-left`, `drummer`, etc.) für ein spezifisches Event.
*   **Canister**: Ein Platzhalter-Objekt (25kg), das wie ein Paddler behandelt wird, um Lücken zu füllen oder Gewicht auszugleichen.

## 🤝 Contributing

Verbesserungsvorschläge und Pull Requests sind willkommen! Bitte achte auf sauberen Code und aktualisiere Tests/Doku bei Änderungen.

## 📄 License

**Proprietary / All Rights Reserved**

Copyright (c) 2025 Jan Hartje.
Dieses Projekt ist urheberrechtlich geschützt. Jegliche kommerzielle Nutzung, Vervielfältigung oder Verbreitung ohne ausdrückliche schriftliche Genehmigung ist untersagt.

---
Made with ❤️ in Hannover.
