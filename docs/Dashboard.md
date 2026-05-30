# Vault-Dashboard 📊

Auto-generierte Übersichten via **Dataview**. Zurück zum [[00-Index|Vault-Home]].

> ⚠️ Braucht das **Dataview**-Plugin (siehe [[CONVENTIONS#5 Dataview installieren einmalig manuell]]).
> Ohne Plugin erscheinen die Blöcke unten als Roh-Code — alles andere im Vault funktioniert trotzdem.

## Zuletzt geänderte Docs
```dataview
TABLE WITHOUT ID file.link AS "Dokument", file.folder AS "Ordner", dateformat(file.mtime, "yyyy-MM-dd") AS "Geändert"
FROM "docs"
WHERE file.name != "Dashboard"
SORT file.mtime DESC
LIMIT 20
```

## Docs pro Ordner
```dataview
TABLE WITHOUT ID rows.file.folder AS "Ordner", length(rows) AS "Anzahl"
FROM "docs"
GROUP BY file.folder
SORT length(rows) DESC
```

## Specs & Pläne (datiert)
```dataview
TABLE WITHOUT ID file.link AS "Dokument", file.folder AS "Ordner"
FROM "docs/superpowers/specs" OR "docs/superpowers/plans"
SORT file.name DESC
LIMIT 25
```

## Offene Punkte (Tech-Debt)
Manuell gepflegt — siehe [[06-Tech-Debt]] und die offenen Checklisten in
[[2026-05-20-ceo-checklist]].
