# Tutorials

Interactieve tutorials voor **Open Planner Studio** (extensie-API 1.4, permissies `help`, `ribbon`,
`events`). Eén doorlopend project, *Aanbouw woning* / *House extension*; nu beschikbaar:

1. *Je eerste planning* (`tut-1-eerste-planning`): project, fasen, taken, mijlpalen, Bereken.
2. *Relaties en het kritieke pad* (`tut-2-relaties-kritiek-pad`): relaties en lag, Bereken (F5), kritiek
   pad en speling lezen.
3. *De kalender en datumafspraken* (`tut-3-kalender`): de bouwvak in de projectkalender, een constraint
   en een deadline.

## Wat doet hij?

- **Help › Tutorials**: de leesversie (nl + en) via `api.help.registerArticles`, met
  `project://`-links naar het startproject en het eindresultaat, en `docs://`-links naar de uitleg
  (`uitleg-relaties`, `uitleg-kritiek-pad`, `uitleg-kalenders`, `uitleg-constraints`).
- **Start › Tutorials › Tutorial 1 / 2 / 3**: start het begeleidingspaneel (`api.help.startGuide`).
  Een Help-artikel kan zelf geen begeleiding starten; daarom een lintknop per tutorial.
- Per stap een controle op de documenttoestand, een anker naar de juiste knop, **Toon mij**
  (cumulatief: zet ook ontbrekende eerdere stappen klaar) en waar de generator een tussenstand levert
  **Opnieuw**.
- Stappen die rekenen (Bereken, en de stappen van tutorial 3) herkennen een berekening van precies de
  huidige planning via `host:schedule-calculated` (permissie `events`); de vingerafdruk dekt taken
  (duur, constraint, deadline), relaties (soort, lag) en kalender (werkdagen, vrije dagen).
- **Op verzoek van de app**: zegt de gebruiker na de eerste voltooide rondleiding "Ja" op de
  tutorialvraag, dan zendt de app `host:tutorial-requested` met
  `{ extensionId: 'tutorials', tutorialId: 'tut-1-eerste-planning' }` (pas als deze extensie actief
  is, ook direct na installeren). De extensie start dan tutorial 1, via dezelfde route als de
  lintknop — synchroon, want de app kijkt meteen daarna of er een begeleiding loopt. Een verzoek voor
  tutorial 2 of 3 werkt op dezelfde manier.

Leesversie en paneel komen uit dezelfde tekst in `main.js`. De extensielader kent één bestand
(`require()` geeft alleen `open-planner-studio`), dus `main.js` heeft duidelijke secties: het project en
de leesfuncties, tutorial 1, de logica van tutorial 2 en 3, de drie teksten (`TEXT_1`, `TEXT_2`,
`TEXT_3`), de stappen en `onLoad`.

## Hoe elke tutorial begint

Elke tutorial start vanuit de stand van de vorige (`project://`-link in het artikel en in de eerste
stap; **Toon mij** op die stap opent hem als het project niet klopt):

- tutorial 1: leeg project (`start-tut-1`, alleen een overslaan-link; stap 1 doet de lezer zelf);
- tutorial 2: `na-tut-1`;
- tutorial 3: `na-tut-2`.

**Opnieuw** staat alleen bij stappen waarvoor de generator een beginstand levert:
tutorial 1 stap *De fasen* (`start-tut-1`), tutorial 2 stap *De eerste relatie* (`na-tut-1`) en
tutorial 3 stap *De bouwvak in de kalender* (`na-tut-2`) en stap *Een constraint* (`tussen-tut-3-bouwvak`).

## De getallen in de tekst

Alle getallen komen uit de gegenereerde standen (en zijn in de draaiende app nagelopen). Wijzigt de
motor ze, dan wordt `tests/planning/check-tutorial-project.ts` in de app rood; pas dan hier de tekst aan.

- **`na-tut-1`**: zonder relaties begint alles op ma 7 juni 2027; laatste einde ma 14 juni
  (*Buitenspouwblad metselen*, 6 werkdagen, de enige kritieke taak). Oplevering staat op 7 juni.
- **`na-tut-2`**: 24 relaties, twee met lag (storten → funderingsmetselwerk +3, dekvloer → tegelwerk
  +5). Oplevering vr 6 aug 2027; statusbalk *Kritiek pad: 21 taken, 45 werkdagen*. Buitenspouwblad heeft
  2 werkdagen speling, Schilderwerk 6. Met 9 werkdagen metselen: oplevering ma 9 aug, *19 taken, 46
  werkdagen*; het binnenspouwblad, de dakelementen en de dakbedekking krijgen 1 werkdag speling.
- **`tussen-tut-3-bouwvak`**: `na-tut-2` + bouwvak Midden (ma 2 t/m vr 20 aug 2027). Oplevering vr 27
  aug, *21 taken, 45 werkdagen* (de bouwvak telt niet als werkdag); Tegelwerk begint di 24 aug (was 3
  aug), omdat de vijfde wachtdag van de dekvloer in de bouwvak valt.
- **`na-tut-3`**: `tussen-tut-3-bouwvak` + SNET 14 jul op *Kozijnen plaatsen* (was vr 9 jul) +
  deadline vr 10 sep op de oplevering. Oplevering wo 1 sep, *8 taken, 48 werkdagen*; Start bouw t/m
  Dakbedekking 3 werkdagen speling, Buitenspouwblad 5. Deadline 10 sep: gehaald met 7 werkdagen marge.
  Wat-als deadline vr 27 aug: *1 deadline(s) overschreden*, *21 taken*, oplevering blijft 1 sep,
  totale speling −3 dagen.

## `minAppVersion`: nog een placeholder

`minAppVersion` staat voorlopig op `2026.0.0`. **Bij de release zetten op de eerste app-versie met
extensiecontract 1.4** (release v2026.9.0 heeft contract 1.0.0), en pas daarna een catalogusentry
maken. Tot die tijd houdt `"apiVersion": "1.4"` oudere apps tegen: een host met een lagere
contract-minor weigert de extensie. Een hogere `minAppVersion` nu zou de extensie in de huidige
dev-build (ook 2026.9.0) weigeren.

## Projectbestanden

`projects/<taal>/start-tut-1.ifc`, `na-tut-1.ifc`, `na-tut-2.ifc`, `tussen-tut-3-bouwvak.ifc` en
`na-tut-3.ifc` zijn **gegenereerd**, niet met de hand gemaakt. Alle standen komen uit de generator van de
app. In een checkout van de app:

```bash
npm run gen:tutorial-project -- --out <map>
# kopieer daarna <map>/<taal>/start-tut-1.ifc, na-tut-1.ifc, na-tut-2.ifc, tussen-tut-3-bouwvak.ifc en
# na-tut-3.ifc naar projects/<taal>/
```

`tussen-tut-3-bouwvak` is `na-tut-2` plus de bouwvak in de kalender. De extensie-API kan de kalender
niet wijzigen, dus **Toon mij** op de bouwvakstap opent dit project (als nieuw tabblad) in plaats van de
kalender aan te passen; **Opnieuw** op de constraintstap laadt hem als beginstand van die stap.

## ZIP maken

```bash
zip -X tutorials-1.1.0.zip manifest.json main.js projects/nl/*.ifc projects/en/*.ifc
git add -f tutorials-1.1.0.zip
```

Installeren om te testen: Bestand › Extensies › **ZIP** › kies `tutorials-1.1.0.zip`.
