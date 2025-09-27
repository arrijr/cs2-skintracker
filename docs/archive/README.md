CS2 Skin Price Tracker — Documentation
======================================

Overview
--------
This folder contains all project-related documentation.  
Always update the relevant documents when implementing a new feature, refactor, or bugfix.  
Documentation must be **up-to-date and complete**, so both developers and Cursor know the current system state.

Structure
---------
* **CHANGELOG.md**  
  * Tracks all changes (date, scope, files affected).  
  * Must be updated for every feature/refactor/bugfix.  

* **ARCHITECTURE.md**  
  * Describes the overall system design, data flows, and dependencies.  
  * Use Mermaid diagrams where possible.  
  * Update when flows, layers, or background jobs change.  

* **API.md**  
  * Lists all API endpoints with request/response examples and error cases.  
  * Update when endpoints, DTOs, or error codes change.  

* **DATA_MODEL.md**  
  * Describes the Prisma schema and database structure.  
  * Update whenever fields, relations, or constraints change.  

* **DECISIONS.md**  
  * Records architectural decisions (ADR).  
  * Update whenever a key decision or feature flag is introduced.  

* **TROUBLESHOOTING.md**  
  * Known issues with symptoms, causes, fixes, and prevention.  
  * Update whenever recurring or notable bugs are found.  

* **features/**  
  * Dedicated docs for specific features (e.g., `enhanced-skins-filters.md`).  
  * Update/create when adding or extending features.  

* **think/**  
  * Deep-dive notes for complex problems.  
  * Use format: `YYYY-MM-DD-<slug>.md`.  

* **archive/**  
  * Old drafts and outdated documents.  
  * Do not delete — move here when replacing docs.  

Documentation Rules
-------------------
* Format: Markdown only (no PDFs/DOCX).  
* Language: English.  
* Currency: `$`.  
* Style: Setext headings, `*` lists, fenced code blocks with language.  
* Links: Relative repo links only.  
* Line width: max ~100 chars.  
* No emojis (except in root README for marketing).  

Update Triggers
---------------
* **New/changed endpoint** → `/docs/API.md`  
* **Prisma/schema change** → `/docs/DATA_MODEL.md` + `/docs/CHANGELOG.md`  
* **New cron/data flow** → `/docs/ARCHITECTURE.md` (Mermaid diagram)  
* **New ENV key/flag** → `/docs/DECISIONS.md` + README + `/docs/API.md` if public  
* **Recurring bug** → `/docs/TROUBLESHOOTING.md`  
* **New feature** → `/docs/features/`  

Checklist Before Merge
----------------------
* CHANGELOG updated  
* Related docs updated (ARCHITECTURE/API/DATA_MODEL/DECISIONS/TROUBLESHOOTING)  
* Feature doc created/updated if applicable  
* ENV keys documented in README + API.md  
* Examples/test cases added  
