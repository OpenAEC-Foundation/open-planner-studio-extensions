# Tutorials

Interactieve tutorials voor **Open Planner Studio** (extensie-API 1.4, permissies `help`, `ribbon`,
`events`). Eén doorlopend project, *Aanbouw woning* / *House extension*; nu beschikbaar: tutorial 1,
*Je eerste planning* (`tut-1-eerste-planning`).

## Wat doet hij?

- **Help › Tutorials**: de leesversie (nl + en) via `api.help.registerArticles`, met
  `project://`-links naar het startproject en het eindresultaat.
- **Start › Tutorials › Tutorial 1**: start het begeleidingspaneel (`api.help.startGuide`). Een
  Help-artikel kan zelf geen begeleiding starten; daarom een lintknop.
- Per stap een controle op de documenttoestand, een anker naar de juiste knop, **Toon mij**
  (cumulatief: zet ook ontbrekende eerdere stappen klaar) en bij de fasenstap **Opnieuw**.
- De laatste stap (Bereken) herkent een berekening van precies de huidige planning via
  `host:schedule-calculated` (permissie `events`).

Leesversie en paneel komen uit dezelfde tekst in `main.js`.

## Projectbestanden

`projects/<taal>/start-tut-1.ifc` en `na-tut-1.ifc` zijn **gegenereerd**, niet met de hand gemaakt.
In een checkout van de app:

```bash
npm run gen:tutorial-project -- --out <map>
# kopieer daarna <map>/<taal>/start-tut-1.ifc en na-tut-1.ifc naar projects/<taal>/
```

## ZIP maken

```bash
zip -X tutorials-1.0.0.zip manifest.json main.js projects/nl/*.ifc projects/en/*.ifc
git add -f tutorials-1.0.0.zip
```

Installeren om te testen: Bestand › Extensies › **ZIP** › kies `tutorials-1.0.0.zip`.
