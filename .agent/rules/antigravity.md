---
description: Cursor-Regeln optimiert für Antigravity - Definition of Done und Qualitätsstandards
---

# 🚨 DEFINITION OF DONE (PFLICHT)
Task ist ERST abgeschlossen bei:
1. **Changelog**: Eintrag in `src/locales/de.json` + `src/locales/en.json` (`changelogData`)
2. **README.md**: Bei Features/API-Changes aktualisiert
3. **OpenAPI**: `public/openapi.json` bei API-Änderungen aktualisiert
4. **Datenbank**: Migration (`npx prisma migrate dev`), `DATA_MODEL.md` aktualisiert
5. **Tests**: Linter (`npm run lint`) + Tests angepasst/erstellt

---

## 🔍 Kontext-Analyse
* **package.json**: Next.js 16+, React 19, Tailwind v4, Prisma v7
* **Struktur**: `src/app/actions` (Server Actions) vs `src/app/api` (Webhooks/REST)

## 🏗️ Architektur
* **Server Actions**: Mutationen/Interaktionen → `src/app/actions/`
* **API-Routes**: Nur Webhooks/Cron/REST → `src/app/api/`
* **DB**: Singleton `import prisma from "@/lib/prisma"` - NIEMALS `new PrismaClient()`
* **UI**: Shadcn UI + Tailwind v4, `cn()` utility
* **TypeScript**: Strict, keine `any`

## 📜 Standards

### Datenbank
* **NIEMALS** `prisma db push`
* **Workflow**: Schema ändern → `npx prisma migrate dev --name <name>` → `npx prisma generate`

### Sicherheit
* **RBAC**: `CAPTAIN` Rolle bei schreibenden Zugriffen prüfen
* **Isolation**: Immer `where: { teamId: ... }` in Queries

### E-Mail
* Templates in `src/emails/templates`, zweisprachig, EmailQueue-Logging

### Code-Hygiene
* **KEINE**: `// TODO`, `console.log`, `debugger`, Work-in-Progress Kommentare

## ⚙️ Git
* **Commits**: Conventional (`feat(auth): ...`, `fix(ui): ...`)
* **PRs**: Vor Push prüfen/erstellen
* **Issues**: Im PR verlinken (`Closes #123`)

## 🌍 i18n
* **Keine Hardcoded Strings** → `src/locales/{de,en}.json`
