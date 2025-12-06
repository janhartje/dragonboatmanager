# Drachenboot Manager

![App Icon](/public/icons/logo-192.png)

## 📖 Über das Projekt

Der **Drachenboot Manager** ist eine Progressive Web App (PWA) zur Verwaltung von Drachenboot-Teams. Sie ermöglicht Trainern und Teamkapitänen die effiziente Planung von Trainings und Regatten sowie die optimale Besetzung des Bootes unter Berücksichtigung von Gewichtsverteilung und individuellen Fähigkeiten.

### ✨ Features

*   **Multi-Team Management**: Verwalten mehrerer Teams mit einfachem Wechsel zwischen Teams.
*   **User Accounts**: Benutzer-Authentifizierung (Login) und Verknüpfung von Paddlern mit Benutzerkonten.
*   **Team Management**: Verwalten von Mitgliedern inkl. Gewicht und Fähigkeiten (Links, Rechts, Trommel, Steuer).
*   **Terminplanung**: Erstellen von Trainings und Regatten mit Zu-/Absage-Funktion.
*   **Magic KI**: Automatischer Algorithmus zur optimalen Bootsbesetzung (Balance & Trimm).
*   **Boots-Visualisierung**: Interaktive Drag & Drop (bzw. Click & Assign) Oberfläche für das Drachenboot.
*   **Statistiken**: Echtzeit-Berechnung von Gesamtgewicht, Balance (Links/Rechts) und Trimm (Bug/Heck).
*   **Offline-First**: Dank PWA-Technologie und PostgreSQL auch ohne Internet nutzbar (nach initialer Synchronisation).
*   **Internationalisierung**: Verfügbar in Deutsch und Englisch (automatische Erkennung).
*   **Dark Mode**: Automatische Anpassung an das System-Theme.
*   **Hilfe & Support**: Integriertes Hilfe-Center mit Anleitungen, FAQs und direktem Kontakt zum Entwickler.
*   **Erweiterte Mitgliederverwaltung**: Status-Tracking (Ausstehend), einfache Rollenvergabe und Verwaltungsoptionen.

### 🔒 Rollen & Berechtigungen

*   **Captain**: Voller Zugriff. Kann Teams erstellen/löschen, Einstellungen ändern, Mitglieder verwalten (einladen/entfernen/befördern) und Termine planen. Alle schreibenden API-Endpunkte sind serverseitig geschützt.
*   **Paddler**: Eingeschränkter Zugriff. Kann nur das eigene Profil (Gewicht, Seite, Skills) bearbeiten und Zu/Absagen für Termine geben. Kein Zugriff auf Teameinstellungen. Schreibzugriffe auf fremde Daten werden blockiert.

## 🛠 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State Management**: React Context API (`DrachenbootContext`, `LanguageContext`)
*   **Drag & Drop**: [@dnd-kit](https://dndkit.com/) (Modern, lightweight DnD library)
*   **Export**: `html-to-image` für hochauflösenden Bild-Export der Aufstellung (unterstützt moderne CSS-Features)

## 📂 Projektstruktur

```
src/
├── app/                 # Next.js App Router Pages (TSX)
│   ├── layout.tsx       # Root Layout & Providers
│   ├── page.tsx         # Landing Page
│   ├── app/             # Main Application
│   │   ├── page.tsx     # Team View
│   │   ├── planner/     # Planner View Route
│   │   └── teams/       # Team Management Pages
│   └── api/             # API Routes (Prisma)
├── components/
│   ├── drachenboot/     # Domain-spezifische Komponenten (TeamView, PlannerView)
│   └── ui/              # Wiederverwendbare UI-Komponenten (Buttons, Modals, etc.)
├── context/             # Global State (Daten, Sprache, Tour)
├── locales/             # Übersetzungsdateien (de.json, en.json)
├── types/               # TypeScript Definitionen (index.ts)
└── utils/               # Hilfsfunktionen (Algorithmus)
prisma/
└── schema.prisma        # Prisma Schema (Datenmodell)
```

## 🚀 Getting Started

### Voraussetzungen

*   Node.js 18.17+
*   npm oder yarn

### Konfiguration

Erstelle eine `.env` Datei im Hauptverzeichnis (siehe `.env.example`):

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@localhost:5432/drachenboot?schema=public"
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

3.  Datenbank aufsetzen:
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

4.  Development Server starten:
    ```bash
    npm run dev
    ```

5.  App öffnen: [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

Die App kann als Progressive Web App (PWA) installiert werden:

1. Öffne die App im Browser (Chrome, Edge, Safari)
2. Navigiere zur App-Seite (`/app`)
3. Klicke auf den **"App installieren"** Button im Header
4. Bestätige die Installation
5. Die App wird als eigenständige Anwendung auf deinem Gerät installiert

**Vorteile der PWA-Installation:**
- Direkter Zugriff vom Home-Screen/Desktop
- Schnellere Ladezeiten durch Caching
- Offline-Funktionalität
- Native App-Erfahrung ohne App Store

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

*   [API Documentation (OpenAPI)](http://localhost:3000/docs) - Interactive Swagger UI
*   [OpenAPI Specification](public/openapi.json)
*   [Data Model](DATA_MODEL.md) - Detaillierte Erklärung der Datenbankstruktur

## 👨‍💻 Development Guidelines

### Localization
Neue Features müssen vollständig lokalisiert werden. Bitte aktualisiere immer beide Sprachdateien:
*   `src/locales/de.json`
*   `src/locales/en.json`

### Testing
Jedes neue Feature und jeder Bugfix sollte von Tests begleitet werden.
*   **Logik**: Unit Tests in `src/utils/__tests__`
*   **UI**: Component Tests in `src/components/**/__tests__`

### E-Mail System
Wir nutzen **Resend** und **React Email** für den Versand von transaktionalen E-Mails.

*   **Templates**: Zu finden in `src/emails/templates`.
*   **Komponenten**: Wiederverwendbare E-Mail-Komponenten in `src/emails/components`.
*   **Layout**: Neue Templates immer mit `<EmailLayout>` umschließen, um ein einheitliches Branding und den rechtlichen Footer sicherzustellen.
*   **i18n**: Alle Templates unterstützen Deutsch und Englisch via `lang` Prop (`'de'` | `'en'`).
*   **Versand**: Nutze die Helper-Funktion `src/lib/email.ts`.
*   **Logging**: Alle E-Mails werden in der `SentEmail`-Tabelle gespeichert (inkl. Status, Fehler, Props).

#### Entwicklung & Testing
Du kannst E-Mail-Templates lokal im Browser entwickeln und testen, ohne sie versenden zu müssen:

```bash
npm run email
```

Dies startet einen lokalen Server unter `http://localhost:3010`, auf dem du alle Templates live sehen und bearbeiten kannst. Änderungen am Code werden sofort reflektiert.

Benötigte Node.js Version: **18+** (nutze `nvm use`, falls nötig).

## 🧠 Key Concepts

*   **Team**: Eine Gruppe mit eigenem Kader und Terminkalender. Mehrere Teams können parallel verwaltet werden.
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
