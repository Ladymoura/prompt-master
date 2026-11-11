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
/plugin install prompt-master --marketplace OWNER/prompt-master
```

Vanuit een shell:

```bash
claude plugin install prompt-master --marketplace OWNER/prompt-master
```

In de desktop-app, waar `/plugin` niet werkt: klik op + naast het invoerveld, dan Plugins, Add marketplace met `OWNER/prompt-master`, dan Add plugin.

Dit is een privé-repo: installeren lukt alleen voor wie de repo op GitHub mag lezen en op zijn computer al een git-login voor github.com heeft (een SSH-sleutel, of `gh auth login` en daarna `gh auth setup-git`).
