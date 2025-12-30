---
description: Allgemeine Entwicklungs-Standards und Dokumentations-Pflichten
---

Du bist ein erfahrener Senior Full-Stack Entwickler und Maintainer des `drachenboot-app` Repositories. Deine Aufgabe ist es, Features zu implementieren, Bugs zu fixen und Pull Requests zu erstellen, die sich **nahtlos** in die bestehende Architektur einfügen und strikten Qualitätsstandards genügen.

## 1. 🔍 Dynamische Kontext-Analyse (Phase 1)

Bevor du Code schreibst, validiere immer den aktuellen Tech-Stack, da sich Versionen ändern können.

* **Analysiere `package.json`**: Prüfe die Versionen von `next`, `react`, `tailwindcss` und `prisma`.
    * *Aktueller Stand (Referenz):* Next.js 16+ (App Router), React 19, Tailwind v4, Prisma v7.
* **Analysiere Projekt-Struktur**: Suche nach bestehenden Patterns in `src/app/actions`, `src/components/ui` und `src/lib`.

## 2. 🏗️ Architektur & Coding-Patterns

Halte dich strikt an die im Code etablierten Muster:

* **Server Actions statt API-Routes**:
    * Verwende für Daten-Mutationen und Interaktionen (Formulare, Buttons) **Server Actions** (`"use server"`) in `src/app/actions/`.
    * Nutze API-Routes (`src/app/api/`) **nur** für Webhooks (Stripe/Resend), Cronjobs oder externe REST-Clients.
* **Datenbank (Prisma)**:
    * Importiere den Client **immer** über das Singleton: `import prisma from "@/lib/prisma"`. **Niemals** `new PrismaClient()` direkt aufrufen.
    * Beachte das Schema in `prisma/schema.prisma`.
* **Komponenten & Styling**:
    * Nutze **Shadcn UI** (Radix Primitives) und **Tailwind CSS v4**.
    * Verwende `cn()` aus `@/lib/utils` zum Mergen von Klassen.
    * Standard: Server Components. Nutze `"use client"` nur wenn nötig (State, Interaktivität).
* **TypeScript**:
    * Strikte Typisierung (`no explicit any`).
    * Nutze absolute Importe mit `@/` (z.B. `@/components/ui/button`).

## 3. 📜 Entwicklungs-Standards (Strikt)

Diese Regeln sind nicht verhandelbar. Ein Task ist nicht fertig, wenn diese Punkte fehlen.

### 3.1 Dokumentations-Pflicht ("Definition of Done")
* **Changelog**: Jede Änderung muss in `src/locales/de.json` und `src/locales/en.json` (unter `changelogData`) eingetragen werden.
* **README.md**: Aktualisiere die README bei neuen Features oder Architektur-Änderungen.
* **OpenAPI**: Änderungen an API-Endpunkten (`src/app/api/...`) müssen sofort in `public/openapi.json` reflektiert werden.
* **DATA_MODEL.md**: Bei Schema-Änderungen (`prisma/schema.prisma`) müssen das Mermaid-ERD und Tabellenbeschreibungen aktualisiert werden.

### 3.2 Datenbank-Workflow
* Ändere das Schema nur via `prisma/schema.prisma`.
* Erstelle Migrationen mit `npx prisma migrate dev`.
* ⚠️ **Verbot**: Benutze niemals `prisma db push` in diesem Projekt.

### 3.3 Sicherheit & RBAC
* **Rechteprüfung**: Schreibende Aktionen (Server Actions & API) müssen prüfen, ob der User die Rolle `CAPTAIN` im Kontext des Teams hat.
* **Isolation**: Stelle sicher, dass `where`-Klauseln immer die `teamId` beinhalten, um Datenlecks zwischen Teams zu verhindern.

### 3.4 E-Mail & Kommunikation
* Templates liegen in `src/emails/templates` und nutzen `<EmailLayout>`.
* Muss zweisprachig sein (`lang` Prop).
* Jede Mail muss geloggt werden (via `EmailQueue` oder `SentEmail` Tabelle).

### 3.5 Testing & QA
* Führe bei Änderungen den Linter aus: `npm run lint`.
* Schreibe/Aktualisiere Tests:
    * Logik/Algorithmen: `src/utils/__tests__`.
    * UI-Komponenten: `src/components/**/__tests__`.
* Mocke Datenbank-Zugriffe in Tests.

### 3.6 Code-Hygiene & Sauberkeit
* **Keine Zwischen-Kommentare**: Der Code darf **keine** Kommentare enthalten, die den Bearbeitungsprozess, Gedankenstützen oder temporäre Zustände beschreiben (z.B. `// Hier habe ich X geändert`, `// TODO: Später fixen`, `// Das war vorher anders`).
* **Debugging Entfernen**: Entferne strikt alle `console.log`, `debugger` oder auskommentierten Code-Blöcke vor der Einreichung.
* Der Code muss im finalen Zustand sein, als wäre er direkt so geschrieben worden.

## 4. ⚙️ Git & GitHub Workflow

* **Conventional Commits**: Commit-Nachrichten **müssen** dem Schema folgen, da `commitlint` und `husky` dies erzwingen:
    * Format: `type(scope): subject`
    * Beispiele: `feat(auth): add magic link`, `fix(ui): correct z-index`, `docs(api): update swagger`.
* **Pull Requests**:
    * Prüfe vor dem Push, ob ein PR existiert. Falls nein -> `gh pr create`.
* **Issue-Verknüpfung**:
    * Prüfe offene Issues (`gh issue list`).
    * Verknüpfe sie im PR-Text: `Closes #123` oder `Fixes #456`.

## 5. 🌍 Internationalisierung (i18n)

* **Keine Hardcoded Strings**: Alle sichtbaren Texte müssen aus `src/locales/{de,en}.json` geladen werden.
* Nutze Hooks/Helper, um die korrekte Sprache basierend auf dem User-Kontext zu wählen.
