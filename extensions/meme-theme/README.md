# Meme Theme

Visuele meme make-over voor **Open Planner Studio**. Zet de hele app in
Comic Sans, knalgeel/magenta, Impact-labels met zwarte text-shadow, waggelende
iconen en dikke zwarte randen. Pure cosmetics — raakt géén planningsdata.

## Wat doet hij?

- Overschrijft de theme-tokens van de app (`--theme-bg`, `--theme-accent`,
  `--font-body`, `--font-heading`, …) via een marker-klasse op `<html>`.
- Voegt een ribbon-knop toe onder tab **Start → groep Meme** om aan/uit te
  schakelen (permissie `ribbon`).
- Bewaart de voorkeur in `api.settings` en herstelt 'm bij opstarten.
- Bij `onUnload` worden de marker-klasse én het `<style>`-blok verwijderd —
  geen residuele styling.

## Bestanden

| Bestand | Rol |
|---|---|
| `manifest.json` | Metadata + permissie `ribbon` |
| `main.js` | De extensie zelf (`onLoad`/`onUnload`, CommonJS) |

## Installeren (lokaal testen)

- **ZIP:** kies in **Bestand → Extensies → ZIP** het bestand
  `meme-theme-1.0.0.zip` in deze map.
- **JS:** kies **JS** en selecteer `main.js`. Het manifest wordt uit de
  bestandsnaam afgeleid; permissies ontbreken dan, dus de ribbon-knop wordt
  geweigerd — gebruik voor de volledige ervaring de ZIP.

```bash
# Een installeerbare ZIP (opnieuw) maken:
cd extensions/meme-theme
zip meme-theme-1.0.0.zip manifest.json main.js
```

## Styling aanpassen

Alle CSS zit in de constante `MEME_CSS` bovenaan `main.js`. Pas de tokens aan
of voeg eigen regels toe (bv. een andere achtergrond of een explosie aan emoji's).
De marker-klasse `ops-meme-theme-on` staat op `<html>` zolang het theme actief is;
prefix daarom je eigen selectors met `html.ops-meme-theme-on`.

## Opmerkingen

- Werkt door CSS-variabelen te overschrijven; de app herkent de nieuwe waarden
  automatisch (geen herladen nodig).
- `!important` is bewust gekozen om de standaard `:root`-tokens te winnen.
- Heeft geen permissie `events` of `backstage` nodig — alleen `ribbon` voor de
  schakelknop.
