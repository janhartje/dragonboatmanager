---
description: Wie man Datenbank-Schema-Änderungen durchführt
---
// turbo-all
# Datenbank-Schema-Migrationen

In diesem Projekt müssen alle Änderungen am Prisma-Schema über das Migrationssystem von Prisma abgewickelt werden. `prisma db push` darf **niemals** direkt auf die Datenbank angewendet werden, da dies die Migrationshistorie korrumpiert.

### Schritte für eine Schema-Änderung:

1. Modifiziere die `prisma/schema.prisma` Datei.
2. Führe den folgenden Befehl aus, um eine Migrationsdatei zu generieren und anzuwenden:
   ```bash
   npx prisma migrate dev --name name_der_aenderung
   ```
3. Überprüfe, ob die neue Migrationsdatei im Ordner `prisma/migrations/` erstellt wurde.
4. Generiere den Prisma Client neu:
   ```bash
   npx prisma generate
   ```

**WICHTIG:** Beachte zusätzlich die allgemeinen [Entwicklungs-Standards](file:///Users/janhartje/drachenbootplan/.agent/workflows/development.md) bezüglich der Aktualisierung von `DATA_MODEL.md`, `openapi.json`, `README.md` und dem Changelog.

### Was tun bei Drift?
Wenn die Datenbank und die Historie nicht mehr synchron sind (Drift), muss die Datenbank zurückgesetzt werden (Achtung: Datenverlust!):
```bash
npx prisma migrate reset
```
Danach sollte das Seeding-Skript ausgeführt werden, um Testdaten wiederherzustellen:
```bash
npm run seed
```
