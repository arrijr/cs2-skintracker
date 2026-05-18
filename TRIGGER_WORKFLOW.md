# 🚀 Claude Code Prompt: Trigger GitHub Actions

Gib diesen Prompt Claude Code:

```
Trigger den GitHub Actions Workflow "price-updater.yml" im Repository "arrijr/cs2-skintracker" auf der Branch "main" mithilfe des GitHub MCP Servers.

Was zu tun ist:
1. Nutze den GitHub MCP Tool "github_trigger_workflow" mit:
   - workflow_id: "price-updater.yml"
   - ref: "main"
   
2. Warte bis der Workflow startet
3. Gib mir die Workflow-ID und einen Link zur Überwachung
4. Zeige den Status (pending, in_progress, oder completed)

WICHTIG: Nutze NICHT die GitHub Token manual - nutze den GitHub MCP Server der in .claude/settings.json registriert ist!
```

---

Das sollte automatisch funktionieren weil:
✅ GitHub MCP Server ist in Claude Code registriert (.claude/settings.json)
✅ GITHUB_TOKEN ist in backend/.env gespeichert
✅ Claude Code kann MCPs direkt nutzen

**Ergebnis**: Workflow läuft automatisch ohne dass du einen Token manuel eingeben musst! 🎯
