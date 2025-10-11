# GitHub Secrets Setup - Schritt für Schritt

## 🎯 **Was sind GitHub Secrets?**

GitHub Secrets sind **verschlüsselte Umgebungsvariablen**, die du sicher in deinem Repository speichern kannst. Sie werden für sensible Daten wie API-Keys und Datenbank-Credentials verwendet.

---

## 📋 **Benötigte Secrets**

Für die Skin-Preis-Updates brauchst du **2 Secrets**:

1. **`DATABASE_URL`** - Deine Supabase/PostgreSQL Connection String
2. **`STEAMWEBAPI_KEY`** - Dein Steam WebAPI Key

---

## 🔐 **Setup-Anleitung**

### **Schritt 1: Repository öffnen**

1. Gehe zu: **https://github.com/arrijr/cs2-skintracker**
2. Stelle sicher, dass du eingeloggt bist

---

### **Schritt 2: Settings aufrufen**

1. Klicke oben in der Navigation auf **"Settings"** (Zahnrad-Symbol)
   ```
   [Code] [Issues] [Pull requests] [Actions] [Projects] [Wiki] [Security] [Insights] [Settings]
                                                                                            ↑
                                                                                     Hier klicken
   ```

2. Falls du "Settings" nicht siehst:
   - Du musst **Owner** oder **Admin** des Repositories sein
   - Prüfe deine Repository-Berechtigungen

---

### **Schritt 3: Secrets and Variables**

1. Im **linken Sidebar** (Settings-Menü):
   ```
   General
   Access
     ↓
   Security
     ├── Code security and analysis
     ├── Secrets and variables  ← Hier klicken
     │   ├── Actions           ← Dann hier
     │   ├── Codespaces
     │   └── Dependabot
     └── ...
   ```

2. Klicke auf **"Secrets and variables"**
3. Dann auf **"Actions"**

---

### **Schritt 4: DATABASE_URL hinzufügen**

1. **Klicke auf den grünen Button**: "New repository secret"

2. **Formular ausfüllen**:
   ```
   Name *
   ┌─────────────────────────────────────┐
   │ DATABASE_URL                        │
   └─────────────────────────────────────┘

   Secret *
   ┌─────────────────────────────────────┐
   │ postgresql://user:pass@host/db      │
   │                                     │
   └─────────────────────────────────────┘
   ```

3. **DATABASE_URL finden**:

   **Option A - Render Dashboard**:
   - Gehe zu: https://dashboard.render.com
   - Wähle deine Datenbank aus
   - Kopiere die "External Database URL"
   - Format: `postgresql://...`

   **Option B - Supabase Dashboard**:
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt
   - Settings → Database → Connection String
   - Wähle "URI" Format
   - **Wichtig**: Ersetze `[YOUR-PASSWORD]` mit deinem echten Passwort!

   **Option C - Aus deiner lokalen .env**:
   - Öffne `backend/.env` (falls vorhanden)
   - Suche die Zeile mit `DATABASE_URL=...`
   - Kopiere den Wert (ohne `DATABASE_URL=`)

4. **Secret hinzufügen**:
   - Klicke **"Add secret"** (grüner Button)
   - Du siehst jetzt: `DATABASE_URL` in der Liste

---

### **Schritt 5: STEAMWEBAPI_KEY hinzufügen**

1. **Klicke wieder auf**: "New repository secret"

2. **Formular ausfüllen**:
   ```
   Name *
   ┌─────────────────────────────────────┐
   │ STEAMWEBAPI_KEY                     │
   └─────────────────────────────────────┘

   Secret *
   ┌─────────────────────────────────────┐
   │ XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX    │
   │                                     │
   └─────────────────────────────────────┘
   ```

3. **STEAMWEBAPI_KEY finden**:

   **Option A - Steam Developer Portal**:
   - Gehe zu: https://steamcommunity.com/dev/apikey
   - Logge dich mit deinem Steam-Account ein
   - Falls kein Key vorhanden:
     - Domain Name: `cs2-skintracker.onrender.com`
     - Akzeptiere die Nutzungsbedingungen
     - Generiere den Key
   - Kopiere den 32-stelligen Key

   **Option B - Aus Render Dashboard**:
   - Gehe zu: https://dashboard.render.com
   - Wähle deinen Backend-Service
   - Environment → Environment Variables
   - Suche `STEAMWEBAPI_KEY`
   - Kopiere den Wert

   **Option C - Aus deiner lokalen .env**:
   - Öffne `backend/.env` (falls vorhanden)
   - Suche die Zeile mit `STEAMWEBAPI_KEY=...`
   - Kopiere den Wert

4. **Secret hinzufügen**:
   - Klicke **"Add secret"**
   - Du siehst jetzt beide Secrets in der Liste

---

### **Schritt 6: Secrets überprüfen**

Nach dem Setup solltest du Folgendes sehen:

```
Repository secrets (2)

Name                    Updated
──────────────────────────────────────────
DATABASE_URL            a few seconds ago
STEAMWEBAPI_KEY         a few seconds ago

Actions secrets are encrypted and...
```

**Wichtig**: Die Werte der Secrets werden **NIE** angezeigt (Sicherheit)!

---

## ✅ **Secrets testen**

### **Methode 1: Workflow manuell ausführen**

1. **Gehe zu Actions Tab**:
   - https://github.com/arrijr/cs2-skintracker/actions

2. **Wähle Workflow**:
   - Links im Sidebar: **"Update Skin Prices Daily"**

3. **Run workflow**:
   ```
   [Update Skin Prices Daily]  →  [Run workflow ▼]
                                         │
                                         ▼
   ┌────────────────────────────────────┐
   │ Use workflow from                  │
   │ Branch: feature/cursor-workflow ▼  │
   │                                    │
   │      [Run workflow] (grün)         │
   └────────────────────────────────────┘
   ```

4. **Status beobachten**:
   - Der Workflow erscheint in der Liste mit gelbem Punkt ⚫ (läuft)
   - Nach 5-10 Minuten: ✅ Grüner Haken (erfolgreich) oder ❌ Roter X (Fehler)

5. **Logs prüfen**:
   - Klicke auf den Workflow-Run
   - Klicke auf den Job "update-prices"
   - Expandiere die Steps:
     - "Install dependencies"
     - "Generate Prisma Client"
     - "Run Price Update Script" ← Hier siehst du die Logs

---

### **Methode 2: Admin-Panel verwenden**

1. **Öffne das Admin-Panel**:
   - https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app/admin/update-prices

2. **Test mit einzelnem Skin**:
   - Gib Skin-ID ein: `19829`
   - Klicke "Update Skin"
   - Beobachte die Logs
   - Bei Erfolg: Grüner Log-Eintrag

3. **Preis prüfen**:
   - Öffne: https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app/skins/19829
   - Preis sollte jetzt ca. 26€ zeigen (statt 0,06€)

---

## 🔧 **Troubleshooting**

### **Problem: "Settings" Tab nicht sichtbar**

**Lösung**:
- Du brauchst **Admin-Rechte** für das Repository
- Prüfe: Settings → Manage access → Deine Rolle
- Falls nicht Admin: Bitte Repository-Owner um Zugriff

---

### **Problem: Workflow schlägt fehl mit "DATABASE_URL not found"**

**Lösung**:
1. Prüfe Secret-Name: Muss **exakt** `DATABASE_URL` heißen (Groß-/Kleinschreibung!)
2. Prüfe Secret-Wert:
   - Beginnt mit `postgresql://`?
   - Enthält User, Password, Host, Database?
   - Keine Leerzeichen am Anfang/Ende?

**Test lokal**:
```bash
cd backend
node -e "console.log(require('pg').Client({ connectionString: 'DEINE_URL' }))"
```

---

### **Problem: Workflow schlägt fehl mit "STEAM_API_KEY not found"**

**Achtung**: Der Key heißt im Code unterschiedlich!
- **GitHub Secret**: `STEAMWEBAPI_KEY`
- **Im Script**: Wird zu `STEAMWEBAPI_KEY` gemappt

**Lösung**:
1. Prüfe Secret-Name: Muss **exakt** `STEAMWEBAPI_KEY` heißen
2. Prüfe Secret-Wert:
   - 32 Zeichen lang?
   - Nur Buchstaben und Zahlen (A-Z, 0-9)?
   - Keine Leerzeichen?

---

### **Problem: "Resource not accessible by integration"**

**Lösung**:
- Prüfe GitHub Actions Permissions:
- Settings → Actions → General → Workflow permissions
- Wähle: "Read and write permissions"
- Speichern

---

### **Problem: Workflow läuft nicht automatisch**

**Lösung**:
1. Prüfe Branch:
   - Workflows müssen im `main` Branch sein
   - Falls noch in `feature/cursor-workflow`: Merge zuerst

2. Prüfe Cron-Syntax:
   - `0 2 * * *` = Täglich 02:00 UTC
   - Erste Ausführung: Am nächsten Tag um 02:00 UTC

3. Repository-Status:
   - Darf nicht archiviert sein
   - Actions müssen aktiviert sein

---

## 📱 **Benachrichtigungen einrichten**

Optional: E-Mail-Benachrichtigungen bei Workflow-Fehlern

1. **GitHub Settings** (dein Profil, nicht Repository):
   - https://github.com/settings/notifications

2. **Actions**:
   - ☑️ "Send notifications for failed workflows"
   - ☑️ "Include failed runs in email"

3. **E-Mail bestätigen**:
   - Prüfe Posteingang für Bestätigungs-E-Mail

---

## 🎉 **Fertig!**

Nach erfolgreicher Einrichtung:

- ✅ Secrets sind konfiguriert
- ✅ Workflows laufen täglich automatisch (02:00, 03:00, 03:30 UTC)
- ✅ Admin-Panel ist verfügbar für manuelle Updates
- ✅ Preise werden aktuell gehalten

**Nächste automatische Ausführung**:
- Morgen um 02:00 UTC (= 03:00/04:00 deutsche Zeit)

**Manueller Update**:
- Jederzeit via GitHub Actions oder Admin-Panel möglich

---

## 🔗 **Hilfreiche Links**

- **GitHub Actions Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Steam API Key**: https://steamcommunity.com/dev/apikey
- **Render Dashboard**: https://dashboard.render.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **System Status**: `docs/SYSTEM_STATUS.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

