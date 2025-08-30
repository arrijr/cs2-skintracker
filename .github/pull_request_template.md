Title
=====

Kurz und prägnant (feat/fix/docs...).

Summary
-------

* Was wurde geändert?
* Warum (Problem / Ziel)?
* Wie (kurze Lösungsskizze)?

Type
----

* [ ] feat
* [ ] fix
* [ ] docs
* [ ] chore
* [ ] refactor
* [ ] perf
* [ ] test
* [ ] build/ci

Breaking Changes
----------------

* [ ] Nein
* [ ] Ja — Migrations/Notizen unten erläutern

Docs Checklist (must pass)
--------------------------

Bitte **anhaken**, was du aktualisiert hast (gemäß `.cursor/rules/cursorrules.mdc`):

* [ ] `/docs/CHANGELOG.md` (Datum, Scope, Files)
* [ ] `/docs/ARCHITECTURE.md` (Flows/Mermaid bei Bedarf)
* [ ] `/docs/API.md` (Endpoints, Params, Request/Response, Fehler)
* [ ] `/docs/DATA_MODEL.md` (Prisma/DB Felder, Relationen, Constraints)
* [ ] `/docs/DECISIONS.md` (ADR bei wichtigen Entscheidungen)
* [ ] `/docs/TROUBLESHOOTING.md` (Symptom → Ursache → Fix → Prävention)
* [ ] `/docs/features/<feature>.md` (neue/angepasste Features)
* [ ] README env-Keys/Config aktualisiert (falls neu/ändert)
* [ ] Markdown-Stil: **Setext-Überschriften** + `*`-Listen, Codefences mit Sprache

Testing
-------

* Manuell: Schritte, erwartetes Ergebnis
* Optional: Unit/E2E kurz erwähnen
* Regressionsrisiken / Edge Cases

Screenshots / Logs
------------------

(Falls relevant – UI Vorher/Nachher, Konsolen-/Server-Logs, Mermaids)

Migration / Rollout Notes
-------------------------

* ENV-Keys neu/ändern?
* Migrations/Seeds?
* Feature Flags (Default, Canary, Rollback)?
* Cron/Jobs betroffen?

Linked Issues
-------------

Closes #123, relates to #456