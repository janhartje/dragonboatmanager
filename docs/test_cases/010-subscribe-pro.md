# Test Case: Pro Subscription mit Stripe Testdaten

**ID**: TC-010
**Description**: Verifiziert, dass ein Benutzer ein PRO-Abonnement mit Stripe-Testdaten abschließen kann.
**Pre-conditions**:
- Die Anwendung läuft lokal.
- Der Testbenutzer ist angemeldet (test@drachenbootmanager.de / testuser123).
- Ein Team existiert.
- Stripe ist im Testmodus konfiguriert.

**Steps**:
1. Navigiere zu `/test-login` und melde dich als Testbenutzer an.
2. Wähle ein Team aus der Team-Liste.
3. Klicke auf den Tab "Subscription" (oder navigiere zu `/app/teams/[team-id]?tab=subscription`).
4. Klicke auf "Upgrade to PRO" oder den entsprechenden Upgrade-Button.
5. Wähle einen Abrechnungszeitraum (Monatlich oder Jährlich).
6. Gib die folgenden Stripe-Testkartendaten ein:
   - **E-Mail**: `test@drachenbootmanager.de`
   - **Kartennummer**: `4242 4242 4242 4242`
   - **Ablaufdatum**: `12/26`
   - **CVC**: `123`
   - **Name auf der Karte**: `Test User`
   - **Land**: `Deutschland`
   - **Adresszeile 1**: `Pariser Platz 1`
   - **Stadt**: `Berlin`
   - **PLZ**: `10117`
7. Bestätige die Zahlung durch Klick auf den "Abonnieren" Button.
8. Warte auf die Weiterleitung zurück zur Anwendung.

**Expected Result**:
- Die Zahlung wird erfolgreich verarbeitet.
- Der Benutzer wird zur Subscription-Seite zurückgeleitet.
- Das Team zeigt nun den PRO-Status an.
- Die PRO-Features sind für das Team freigeschaltet (z.B. unbegrenzte Mitglieder, kein Wasserzeichen beim Export).

**Stripe Test Cards Reference**:
| Szenario | Kartennummer |
|---|---|
| Erfolgreiche Zahlung | `4242 4242 4242 4242` |
| Karte abgelehnt | `4000 0000 0000 0002` |
| 3D Secure erforderlich | `4000 0000 0000 3220` |
