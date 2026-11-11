# Prompt Master

Een Claude Code-mod die je ruwe prompt omzet in een sterke prompt. Boven het invoerveld staat de knop **✨ Prompt Master** (of typ `/prompt-master`). Bij een klik:

1. leest hij de prompt in je invoerveld;
2. stelt hij maximaal drie vragen over doel, publiek, toon en lengte, alleen over wat nog ontbreekt;
3. herschrijft hij je prompt in de structuur **Rol, Taak, Context, Formaat**;
4. zet hij het resultaat in het invoerveld, met je originele prompt eronder. Er wordt niets verzonden: jij checkt en verstuurt zelf.

Hij gebruikt twee modelcalls per klik (Sonnet) en verzint geen feiten: ontbreekt iets, dan staat er `[vul in: ...]`.

## Installeren

In een Claude Code-terminal, bij de prompt:

```
/plugin install prompt-master --marketplace Ladymoura/prompt-master
```

Vanuit een shell:

```bash
claude plugin install prompt-master --marketplace Ladymoura/prompt-master
```

In de desktop-app, waar `/plugin` niet werkt: klik op + naast het invoerveld, dan Plugins, Add marketplace met `Ladymoura/prompt-master`, dan Add plugin.

## In de gewone Claude-chat

De map `chat-skill/prompt-master/` bevat dezelfde werkwijze als skill voor claude.ai. Een skill voegt geen knop toe: je zegt "Prompt Master:" met je ruwe prompt, beantwoordt max. 3 vragen en krijgt de herschreven prompt in een codeblok om te kopiëren.

Installeren: zip de map `chat-skill/prompt-master` (de map zelf, met `SKILL.md` erin) en upload die zip in claude.ai bij Instellingen, onder Skills ("Upload skill"). Code execution moet aanstaan.

## Automatisch in Claude Code-cloudsessies

Zet in de setup-script van je cloudomgeving:

```bash
claude plugin marketplace add Ladymoura/prompt-master || true
claude plugin install prompt-master@prompt-master --scope user || true
```
