# MCP Server Guide für Drachenboot Manager

## Was ist MCP?

Das **Model Context Protocol (MCP)** ist ein offener Standard, der es AI-Assistenten wie Claude Desktop ermöglicht, mit externen Datenquellen und Tools zu interagieren. Der Drachenboot Manager MCP Server stellt eine API bereit, die es AI-Assistenten erlaubt, auf deine Team-Daten zuzugreifen und diese zu verwalten.

## Features

Der M CP Server bietet folgende Funktionen:

### Verfügbare Tools

| Tool | Beschreibung | Parameter |
|------|--------------|-----------|
| `list_teams` | Liste alle Teams auf | - |
| `get_team` | Team-Details abrufen | `teamId` |
| `list_paddlers` | Paddler eines Teams auflisten | `teamId` |
| `create_paddler` | Neuen Paddler anlegen | `teamId`, `name`, `weight`, `skills[]`, `isGuest` |
| `list_events` | Events eines Teams auflisten | `teamId`, `limit` |
| `get_assignments` | Bootsbesetzung für Event abrufen | `eventId` |
| `set_attendance` | Anmeldung/Status setzen | `eventId`, `paddlerId`, `status` (yes/no/maybe) |
| `update_assignment` | Bootsplatz belegen/leeren (Hinweis: Beim Verschieben erst alten Platz leeren!) | `eventId`, `seatId`, `paddlerId`, `isCanister` |
| `add_guest` | Gast zu Event hinzufügen | `eventId`, `name`, `weight` |
| `remove_guest` | Gast von Event entfernen | `eventId`, `guestId` |
| `create_event` | Neues Event erstellen | `teamId`, `title`, `date`, `type`, `boatSize` |
| `update_event` | Event bearbeiten | `eventId`, `title`, `date`, `comment`, `type`, `boatSize` |
| `delete_event` | Event löschen | `eventId` |
| `delete_attendance` | Anmeldung löschen (Reset) | `eventId`, `paddlerId` |
| `delete_assignment_seat` | Sitzplatz leeren | `eventId`, `seatId` |
| `add_canister` | Kanister hinzufügen (25kg) | `eventId` (Hinweis: Zur Optimierung, vorzugsweise hinten) |
| `remove_canister` | Kanister entfernen | `eventId`, `canisterId` |
| `save_seating_plan` | Komplette Bootsbesetzung speichern | `eventId`, `assignments` (Map: SeatID -> PaddlerID) |

## Voraussetzungen

- **PRO Subscription**: Der MCP Server ist nur für Teams mit PRO oder ENTERPRISE Plan verfügbar
- **Node.js 24+**: Für die Ausführung des MCP Servers
- **Claude Desktop** (empfohlen): Für die einfachste Integration

## Installation & Setup

### Schritt 1: API Key generieren

1. Melde dich im Drachenboot Manager an
2. Navigiere zu deinem Team → **Settings** → **API Access**
3. Klicke auf "**Generate New Key**"
4. Gib deinem Key einen aussagekräftigen Namen (z.B. "Claude Desktop")
5. **Kopiere den generierten Schlüssel sofort** - er wird nur einmal angezeigt!

> ⚠️ **Wichtig**: Bewahre deinen API Key sicher auf. Behandle ihn wie ein Passwort!

### Schritt 2: Claude Desktop konfigurieren

Der MCP Server wird über einen **HTTP Endpoint** angesprochen, was ideal für Cloud-Deployments (z.B. Vercel) ist.

1. Öffne die Claude Desktop Konfigurationsdatei:
   ```bash
   # macOS
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Linux
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. Füge folgende Konfiguration hinzu:
   ```json
   {
     "mcpServers": {
       "drachenboot": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/http-client", "https://drachenbootmanager.app/api/mcp"],
         "env": {
           "DRACHENBOOT_API_KEY": "dbm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

3. Ersetze `https://drachenbootmanager.app` durch deine App-URL, falls abweichend (z.B. `http://localhost:3000` für lokale Entwicklung).
4. Ersetze `dbm_live_xxx...` mit deinem generierten API Key.
5. Starte Claude Desktop neu.

### Lokale Entwicklung

Wenn du die Anwendung lokal entwickelst (localhost:3000), verwende einfach die lokale URL in der Konfiguration:

```json
{
  "mcpServers": {
    "drachenboot": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/http-client", "http://localhost:3000/api/mcp"],
      "env": {
        "DRACHENBOOT_API_KEY": "Füge hier deinen generierten Key ein"
      }
    }
  }
}
```json
{
  "mcpServers": {
    "drachenboot": {
      "command": "/Users/xxxxx/.nvm/versions/node/v25.2.1/bin/npx",
      "args": [
        "-y",
        "@mcpwizard/sse-bridge",
        "http://localhost:3000/api/mcp",
        "--header",
        "X-API-KEY:dbm_live_xxxxxxxxxxxxxx"
      ],
      "env": {
        "PATH": "/Users/xxxxx/.nvm/versions/node/v25.2.1/bin:/usr/local/bin:/usr/bin:/bin"
      }
    }
  }
}
```

### Integration mit Gemini (Antigravity)

Für die Nutzung mit dem Gemini Agent oder Antigravity kann eine `settings.json` im Ordner `.gemini/` im Root-Verzeichnis des Projekts erstellt werden.

1. Erstelle die Datei `.gemini/settings.json`:
   ```json
   {
     "mcpServers": {
       "drachenboot": {
         "url": "http://localhost:3000/api/mcp",
         "headers": {
           "X-API-KEY": "dbm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

> [!WARNING]
> **API Key Sicherheit & Environment Variablen**
> 
> Standardmäßige JSON-Konfigurationsdateien unterstützen **keine** Environment-Variablen (wie `${ENV_VAR}`).
> Da der API Key im Klartext in der Datei steht, **muss** der Ordner `.gemini/` in deiner `.gitignore` Datei eingetragen werden, um versehentliches Committen des Keys zu verhindern.
>
> Füge dies zu `.gitignore` hinzu:
> ```
> .gemini/
> ```


## Verwendung

### Beispiel-Prompts für Claude Desktop

Sobald der MCP Server konfiguriert ist, kannst du Claude Desktop folgende Fragen stellen:

#### Team-Informationen abrufen

```
Welche Teams habe ich im Drachenboot Manager?
```

```
Zeige mir Details zu meinem Team
```

#### Paddler verwalten

```
Liste alle Paddler in meinem Team auf
```

```
Erstelle einen neuen Paddler namens "Max Mustermann" mit 80kg Gewicht
```

```
Füge einen Paddler hinzu: Anna Schmidt, 65kg, Skills: links, rechts, Trommel
```

#### Events abrufen

```
Zeige mir die nächsten 10 Events meines Teams
```

```
Welche Events haben wir diese Woche?
```

#### Bootsbesetzung & Anmeldung

```
Zeige mir die Bootsbesetzung für Event XYZ
```

```
Melde Max Mustermann für das nächste Training an (Status: ja)
```

```
Setze Anna auf Platz 1 links im Boot für das Event am Sonntag
```

## Sicherheit

### Best Practices

- **Teile deinen API Key niemals** mit anderen Personen
- **Speichere den Key sicher** (z.B. in einem Passwort-Manager)
- **Widerrufe alte Keys**, die du nicht mehr benötigst
- **Erstelle separate Keys** für verschiedene Anwendungen

### API Key widerrufen

Falls dein API Key kompromittiert wurde:

1. Gehe zu **Team Settings** → **API Access**
2. Klicke auf das **Trash-Icon** neben dem betroffenen Key
3. Bestätige die Wiederrufung
4. Generiere bei Bedarf einen neuen Key

## Fehlerbehebung

### "Invalid API key" Fehler

- Überprüfe, ob der API Key korrekt in `claude_desktop_config.json` eingetragen wurde
- Stelle sicher, dass der Key nicht widerrufen wurde
- Überprüfe, ob das Team noch PRO Status hat

### MCP Server startet nicht

- Überprüfe, ob Node.js 24+ installiert ist: `node --version`
- Stelle sicher, dass die`DRACHENBOOT_API_KEY` Umgebungsvariable gesetzt ist
- Schaue in die Claude Desktop Logs: `~/Library/Logs/Claude/` (macOS)

### Tools werden nicht angezeigt

- Starte Claude Desktop komplett neu (auch Hintergrundprozesse beenden)
- Überprüfe die `claude_desktop_config.json` auf Syntax-Fehler
- Validiere JSON mit einem Online-Tool wie jsonlint.com

## Limits

- **API Keys pro Team**: Unbegrenzt
- **Rate Limiting**: Derzeit keine Limits (wird möglicherweise später eingeführt)
- **Daten-Zugriff**: Nur auf eigene Team-Daten

## Support

Bei Problemen oder Fragen:

- **GitHub Issues**: [github.com/janhartje/drachenbootplan/issues](https://github.com/janhartje/drachenbootplan/issues)
- **Email**: support@drachenbootmanager.de
- **Dokumentation**: [Siehe README.md](../README.md)

## Changelog

### v1.0.0 (2026-01-02)

- Initial Release
- Grundlegende CRUD-Operationen für Teams, Paddlers, Events
- API Key Authentifizierung
- Claude Desktop Integration
- **Neu**: Gäste-Management, Event-Updates und Bulk-Assignments

## Roadmap

Geplante Features (siehe [GitHub Issue #94](https://github.com/janhartje/drachenbootplan/issues/94)):

- [ ] OAuth2 Authentifizierung
- [ ] Granulare Berechtigungen (Scopes)
- [x] Schreibzugriffe für Events und Assignments
- [x] Bulk-Operationen
- [ ] Webhooks für Echtzeit-Updates
