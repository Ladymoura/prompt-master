import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Status } from '../types'

const MODEL = 'sonnet'
const status = atom({ plugin: 'prompt-master', key: 'status' } as const, 'idle' as Status)

type Vraag = { vraag: string; kop: string; opties: string[] }

const VRAGEN_SYSTEEM = `Je beoordeelt een ruwe prompt die iemand aan een AI wil geven.
Bepaal welke van deze vier zaken ONTBREKEN of onduidelijk zijn: doel, publiek, toon, lengte.
Stel alleen vragen over wat echt ontbreekt, maximaal 3, belangrijkste eerst. Niets onduidelijk? Geef een lege lijst.
Schrijf de vragen in de taal van de prompt. Elke vraag eindigt op een vraagteken.
Geef per vraag 2 tot 4 korte, concrete antwoordopties (max. 5 woorden per optie) die bij déze prompt passen.
"kop" is één woord (max. 12 tekens): Doel, Publiek, Toon of Lengte.
Antwoord met ALLEEN geldige JSON, zonder uitleg of codeblok:
{"vragen":[{"vraag":"...?","kop":"Doel","opties":["...","..."]}]}`

const HERSCHRIJF_SYSTEEM = `Je herschrijft een ruwe prompt tot een sterke, complete prompt.
Gebruik exact deze vier kopjes, in deze volgorde, elk op een eigen regel gevolgd door de inhoud:
Rol:
Taak:
Context:
Formaat:
Regels:
- Schrijf in de taal van de ruwe prompt.
- Verwerk de antwoorden van de gebruiker (doel, publiek, toon, lengte) concreet in Context en Formaat.
- Verzin geen feiten die niet in de prompt of antwoorden staan. Ontbreekt iets essentieels, zet dan [vul in: ...].
- Geen inleiding, geen afsluiting, geen markdown-codeblok. Alleen de herschreven prompt.`

function parseVragen(text: string): Vraag[] {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return []
  try {
    const data = JSON.parse(text.slice(start, end + 1)) as { vragen?: unknown }
    if (!Array.isArray(data.vragen)) return []
    return data.vragen
      .filter(
        (v): v is Vraag =>
          typeof v === 'object' && v !== null &&
          typeof (v as Vraag).vraag === 'string' &&
          Array.isArray((v as Vraag).opties),
      )
      .slice(0, 3)
      .map(v => ({
        vraag: v.vraag.trim().endsWith('?') ? v.vraag.trim() : `${v.vraag.trim()}?`,
        kop: String(v.kop ?? 'Vraag').slice(0, 12),
        opties: v.opties.map(String).filter(Boolean).slice(0, 4),
      }))
  } catch {
    return []
  }
}

async function run($: EngineInterface): Promise<string> {
  if ((await read($, status)) !== 'idle') return 'Prompt Master is al bezig.'

  const { text } = await $.prompt.read()
  const ruw = text.trim()
  if (!ruw) {
    $.ui.toast('Typ eerst een ruwe prompt in het invoerveld.')
    return 'Geen prompt gevonden.'
  }

  try {
    // 1. Welke vragen zijn nodig? (max. 3)
    await update($, status, () => 'vragen' as Status)
    const analyse = await $.model.complete({
      model: MODEL,
      system: VRAGEN_SYSTEEM,
      prompt: `Ruwe prompt:\n"""\n${ruw}\n"""`,
      maxTokens: 800,
      effort: 'low',
      timeoutMs: 60000,
    })
    const vragen = analyse.isAnswered ? parseVragen(analyse.text) : []

    // 2. Vragen stellen in de eigen vraagdialoog van Claude
    const antwoorden: string[] = []
    for (const v of vragen) {
      const opties = v.opties.length >= 2 ? v.opties : ['Kies zelf', 'Maakt niet uit']
      let antwoord: string
      try {
        antwoord = await $.ui.ask(v.vraag, { options: opties, header: v.kop })
      } catch {
        $.ui.toast('Prompt Master afgebroken. Je prompt blijft ongewijzigd.')
        return 'Afgebroken.'
      }
      antwoorden.push(`${v.kop}: ${v.vraag} -> ${antwoord}`)
    }

    // 3. Herschrijven naar Rol, Taak, Context, Formaat
    await update($, status, () => 'schrijven' as Status)
    const herschreven = await $.model.complete({
      model: MODEL,
      system: HERSCHRIJF_SYSTEEM,
      prompt:
        `Ruwe prompt:\n"""\n${ruw}\n"""\n\n` +
        (antwoorden.length
          ? `Antwoorden van de gebruiker:\n${antwoorden.join('\n')}`
          : 'De gebruiker kreeg geen vragen: de prompt was al duidelijk.'),
      maxTokens: 2000,
      timeoutMs: 120000,
    })

    if (!herschreven.isAnswered) {
      $.ui.toast(`Herschrijven mislukt (${herschreven.reason}). Je prompt blijft ongewijzigd.`)
      return 'Mislukt.'
    }

    // 4. In het invoerveld zetten, origineel eronder bewaard. NIET verzenden.
    const resultaat = `${herschreven.text.trim()}\n\n---\nOriginele prompt:\n${ruw}`
    const gevuld = await $.prompt.fill({ text: resultaat, mode: 'replace' })
    if (!gevuld.isFilled) {
      $.ui.toast('Kon het invoerveld niet vullen.')
      return resultaat
    }
    $.ui.toast('Klaar. Check je prompt en verzend zelf.')
    return 'Prompt herschreven en in het invoerveld gezet.'
  } finally {
    await update($, status, () => 'idle' as Status)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'prompt-master',
      description: 'Herschrijf de prompt in het invoerveld naar Rol, Taak, Context, Formaat',
    })
    return next(e)
  })

  on('command.run', { command: 'prompt-master' }, async $ => {
    void run($)
    return { text: 'Prompt Master gestart.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const nu = await read($, status)

    return (
      <Box>
        {nu === 'idle' ? (
          <Button key="prompt-master" label="✨ Prompt Master" onPress={() => void run($)} />
        ) : (
          <Text dimColor>
            ✨ Prompt Master {nu === 'vragen' ? 'leest je prompt…' : 'herschrijft…'}
          </Text>
        )}
      </Box>
    )
  })
}
