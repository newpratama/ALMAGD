# ALMAGD WEBSITE PLAN — README

**Project:** ALMAGD (المجد) Hospitality — Corporate Promotional & Informational Website
**Phase:** Research, Strategy, UX/UI Specification & Implementation Planning
**Status:** PLANNING COMPLETE — IMPLEMENTATION NOT STARTED (see [PROJECT-STATUS.md](./PROJECT-STATUS.md))
**Planning date:** 2026-10-06

## What this pack is

A complete specification package that lets an AI coding model build the ALMAGD website **without re-researching or redesigning**. It contains research evidence, verified facts, decisions, content, UX, design system, SEO, analytics, technical architecture, QA, and an atomic task plan.

## Portfolio

```
ALMAGD  (masterbrand · "The ALMAGD Collection")
├── New Pratama Villa   → villas / per-room stays · Tugu Selatan, Cisarua
├── Villa NJD           → hotel-style villa rooms · Tugu Utara, Cisarua
└── NJD Cafe            → cafe & restaurant · location NEEDS_CONFIRMATION
```

## Read order

| Who | Read |
|---|---|
| **Owner / management** | [FINAL-READINESS-REPORT.md](./FINAL-READINESS-REPORT.md) → [QUESTIONS-FOR-MANAGEMENT.md](../02-RESEARCH/QUESTIONS-FOR-MANAGEMENT.md) → [MASTER-DECISIONS.md](./MASTER-DECISIONS.md) |
| **Designer** | MASTER-DECISIONS → 03-BRAND → 08-DESIGN → 09-MEDIA |
| **Coding model** | [IMPLEMENTATION-CONTEXT.md](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md) → [AI-CODING-GUIDE.md](../15-AI-HANDOFF/AI-CODING-GUIDE.md) → task from [TASK-BREAKDOWN.md](../14-IMPLEMENTATION-PLANNING/TASK-BREAKDOWN.md) |
| **Photographer** | [PHOTO-SHOT-LIST.md](../09-MEDIA/PHOTO-SHOT-LIST.md), [PHOTOGRAPHY-DIRECTION.md](../03-BRAND/PHOTOGRAPHY-DIRECTION.md) |

## Single Sources of Truth

| Topic | File |
|---|---|
| Sources | [02-RESEARCH/SOURCE-REGISTRY.md](../02-RESEARCH/SOURCE-REGISTRY.md) |
| Facts & data | [02-RESEARCH/DATA-AUDIT.md](../02-RESEARCH/DATA-AUDIT.md) |
| Decisions | [00-MASTER/MASTER-DECISIONS.md](./MASTER-DECISIONS.md) |
| Page structure | [04-INFORMATION-ARCHITECTURE/SITEMAP.md](../04-INFORMATION-ARCHITECTURE/SITEMAP.md) |
| Design system | [08-DESIGN/DESIGN-SYSTEM.md](../08-DESIGN/DESIGN-SYSTEM.md) |
| Content structure | [05-CONTENT/CONTENT-MODEL.md](../05-CONTENT/CONTENT-MODEL.md) |
| SEO | [10-SEO/SEO-STRATEGY.md](../10-SEO/SEO-STRATEGY.md) |
| Technology | [12-TECHNICAL-PLANNING/RECOMMENDED-ARCHITECTURE.md](../12-TECHNICAL-PLANNING/RECOMMENDED-ARCHITECTURE.md) |
| Execution | [14-IMPLEMENTATION-PLANNING/IMPLEMENTATION-ROADMAP.md](../14-IMPLEMENTATION-PLANNING/IMPLEMENTATION-ROADMAP.md) |
| Coder brief | [15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md](../15-AI-HANDOFF/IMPLEMENTATION-CONTEXT.md) |

Conflict rule: **MASTER-DECISIONS > DATA-AUDIT > SITEMAP > all other files.**

## Conventions

- Data status labels: `USER_CONFIRMED`, `USER_PROVIDED`, `OFFICIAL_SOURCE`, `VERIFIED`, `VERIFIED_MULTIPLE_SOURCES`, `PUBLIC_SOURCE_ONLY`, `NEEDS_CONFIRMATION`, `CONFLICT`, `SUSPICIOUS`, `MISSING`, `SOURCE_NOT_ACCESSIBLE`.
- IDs: `SRC-*` sources · `F-*` facts · `C-*` conflicts · `MD-*` missing data · `DEC-*` decisions · `T-*` tasks.
- Priority: `P0` launch-mandatory · `P1` soon after launch · `P2` future.
- `PLACEHOLDER` = content slot waiting for owner data. Never shipped to production.

## Full index
See [MASTER-INDEX.md](./MASTER-INDEX.md).
