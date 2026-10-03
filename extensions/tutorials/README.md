# Tutorials

Interactieve tutorials voor **Open Planner Studio** (extensie-API 1.4, permissies `help`, `ribbon`,
`events`). Eén doorlopend project, *Aanbouw woning* / *House extension*; nu beschikbaar:

1. *Je eerste planning* (`tut-1-eerste-planning`): project, fasen, taken, mijlpalen, Bereken.
2. *Relaties en het kritieke pad* (`tut-2-relaties-kritiek-pad`): relaties en lag, Bereken (F5), kritiek
   pad en speling lezen.
3. *De kalender en datumafspraken* (`tut-3-kalender`): de bouwvak in de projectkalender, een constraint
   en een deadline.
4. *Plannen in uren* (`tut-4-uren`): urenplanning aanzetten, de betonstort en twee kraaninzetten in uren,
   en zien hoe de app dagen en uren door elkaar rekent.
5. *Resources en nivelleren* (`tut-5-resources`): vijf resources aanmaken en toewijzen, de werkregel van
   het stucwerk, het histogram, overbezetting en nivelleren.
6. *Voortgang en afwijking* (`tut-6-uitvoering`): baseline opslaan, statusdatum zetten, voortgang in de
   tabel invullen, rekenen en de afwijking lezen (Gantt en tabelkolom).
7. *Rapporteren en delen* (`tut-7-rapport`): de rapporten Variance en Voortgangsrapport, papier, PDF en
   *Bestand › Exporteren*.

## Wat doet hij?

- **Help › Tutorials**: de leesversie (nl + en) via `api.help.registerArticles`, met
  `project://`-links naar het startproject en het eindresultaat, en `docs://`-links naar de uitleg
  (`uitleg-relaties`, `uitleg-kritiek-pad`, `uitleg-kalenders`, `uitleg-constraints`,
  `uitleg-dagen-en-uren`, `uitleg-werkregels`, `uitleg-nivelleren`).
- **Start › Tutorials › Tutorial 1 t/m 7**: start het begeleidingspaneel (`api.help.startGuide`).
  Een Help-artikel kan zelf geen begeleiding starten; daarom een lintknop per tutorial.
- Per stap een controle op de documenttoestand, een anker naar de juiste knop, **Toon mij**
  (cumulatief: zet ook ontbrekende eerdere stappen klaar) en waar de generator een tussenstand levert
  **Opnieuw**.
- Stappen die rekenen (Bereken, en de stappen van tutorial 3 en 4) herkennen een berekening van precies de
  huidige planning via `host:schedule-calculated` (permissie `events`); de vingerafdruk dekt taken
  (duur in dagen of uren, constraint, deadline, werkregel, nivelleervertraging), toewijzingen (resource en
  inzet), relaties (soort, lag) en kalender (werkdagen, vrije dagen).
- **Op verzoek van de app**: zegt de gebruiker na de eerste voltooide rondleiding "Ja" op de
  tutorialvraag, dan zendt de app `host:tutorial-requested` met
  `{ extensionId: 'tutorials', tutorialId: 'tut-1-eerste-planning' }` (pas als deze extensie actief
  is, ook direct na installeren). De extensie start dan tutorial 1, via dezelfde route als de
  lintknop — synchroon, want de app kijkt meteen daarna of er een begeleiding loopt. Een verzoek voor
  tutorial 2 t/m 7 werkt op dezelfde manier.

Leesversie en paneel komen uit dezelfde tekst in `main.js`. De extensielader kent één bestand
(`require()` geeft alleen `open-planner-studio`), dus `main.js` heeft duidelijke secties: het project en
de leesfuncties, tutorial 1, de logica van tutorial 2 en 3, die van tutorial 4 en 5, de teksten
`TEXT_1` t/m `TEXT_5`, de stappen van tutorial 1 t/m 5, één blok voor tutorial 6 en 7 (logica, `TEXT_6`,
`TEXT_7` en hun stappen) en `onLoad`.

## Hoe elke tutorial begint

Elke tutorial start vanuit de stand van de vorige (`project://`-link in het artikel en in de eerste
stap; **Toon mij** op die stap opent hem als het project niet klopt):

- tutorial 1: leeg project (`start-tut-1`, alleen een overslaan-link; stap 1 doet de lezer zelf);
- tutorial 2: `na-tut-1`;
- tutorial 3: `na-tut-2`;
- tutorial 4: `na-tut-3`;
- tutorial 5: `na-tut-4`;
- tutorial 6: `na-tut-5`;
- tutorial 7: `na-tut-6`.

**Opnieuw** staat alleen bij stappen waarvoor de generator een beginstand levert:
tutorial 1 stap *De fasen* (`start-tut-1`), tutorial 2 stap *De eerste relatie* (`na-tut-1`), tutorial 3
stap *De bouwvak in de kalender* (`na-tut-2`) en stap *Een constraint* (`tussen-tut-3-bouwvak`),
tutorial 4 stap *De betonstort: 6 uur* (`na-tut-3`) en tutorial 5 stap *Vijf resources aanmaken*
(`na-tut-4`), *De metselaar op vier taken* (`tussen-tut-5-resources`), *De werkregel: Vast werk*
(`tussen-tut-5-toegewezen`) en *Nivelleren* (`tussen-tut-5-werkregel`), en tutorial 6 stap *Een baseline
opslaan* (`na-tut-5`). Tutorial 7 heeft geen Opnieuw: het verandert het project niet.

## Wat de extensie-API niet kan (en wat dat voor tutorial 4 en 5 betekent)

`api.data` kan taken en relaties schrijven, maar geen kalender, instellingen, resources, toewijzingen,
werkregels of nivellering. Gevolgen:

- **Tutorial 4, stap *Urenplanning aanzetten*.** Urenplanning is een instelling van de app (niet van het
  document) en de API kent geen instellingen. De controle leest de bewaarde instelling,
  `localStorage['ops-enableHourPlanning']` (de `ops-<naam>`-sleutels uit `settingsRegistry.ts` van de app);
  geblokkeerde opslag laat de controle gooien, waarna de begeleiding terugvalt op *Klaar, volgende*. Er is
  geen Toon mij. De latere stappen zetten de uren wel klaar (`updateTask` met `durationUnit: 'hours'`).
- **Tutorial 5.** Resources, toewijzingen en `workRule` zijn te lezen (`getResources`, `getAssignments`,
  `task.workRule`) en dus te controleren, maar niet te schrijven. **Toon mij** opent daarom per stap, als
  het geopende project de stap nog niet heeft, een stand van de generator waarin hij gedaan is (als nieuw
  tabblad); staat de stap er al, dan laat Toon mij het project met rust:

  | Stap | Toon mij opent | Opnieuw laadt |
  |---|---|---|
  | 1 *Het startpunt* | `na-tut-4` | – |
  | 2 *Vijf resources aanmaken* | `tussen-tut-5-resources` | `na-tut-4` |
  | 3 *De metselaar op vier taken* | `tussen-tut-5-toegewezen` (alle twaalf) | `tussen-tut-5-resources` |
  | 4 *De timmerploeg en de kraan* | `tussen-tut-5-toegewezen` (alle twaalf) | – |
  | 5 *De stukadoor en het beton* | `tussen-tut-5-toegewezen` | – |
  | 6 *De werkregel: Vast werk* | `tussen-tut-5-werkregel` (ook stap 7 en 8) | `tussen-tut-5-toegewezen` |
  | 7 *Een tweede stukadoor* | `tussen-tut-5-werkregel` (ook stap 8) | – |
  | 8 *Rekenen* | `tussen-tut-5-werkregel`, nivellering eruit, herberekenen | – |
  | 9 *Het histogram* | idem | – |
  | 10 *Overbezetting* | idem | – |
  | 11 *Nivelleren* | `na-tut-5`, herberekenen | `tussen-tut-5-werkregel` |

  Waarom zo:
  - De generator heeft geen stand per toewijsgroep. Stap 3–5 delen dus één stand, die met álle twaalf
    toewijzingen; de stap-tekst zegt dat Toon mij ook de volgende stap(pen) al doet. Liever één eerlijke
    stand dan een die de extensie half zou moeten nabouwen (dat kan ze niet).
  - Er is geen stand met Vast werk en nog één stukadoor. Toon mij op stap 6 opent daarom de stand met
    ook de tweede stukadoor, berekend; de tekst zegt het.
  - Opnieuw staat alleen waar de generator precies de beginstand van de stap levert, bij de eerste stap die
    vanuit die stand het document verandert. Niet bij stap 4, 5 en 7 (geen stand met een deel van de
    toewijzingen of met Vast werk en één stukadoor), niet bij *Rekenen* (de meegeleverde stand is al
    berekend, de stap zou meteen gedaan zijn) en niet bij histogram en overbezetting (die veranderen het
    document niet).
  - Stap 8–10 gebruikten eerst `na-tut-5` met de nivellering eruit (`levelingDelay: 0`, herberekenen). Dat
    levert dezelfde feiten op als `tussen-tut-5-werkregel` (nagerekend in de app-motor: datums, speling,
    kritiek pad, 46 werkdagen, toewijzingen en overbezette dagen, nl en en); de omweg is vervangen.
    Een nivellering in het eigen project (wie vanaf stap 11 terug gaat) haalt Toon mij er nog steeds uit.
  - De histogramstappen en de overbezettingsstap hebben geen controle (het histogram openen en een melding
    aanklikken laat niets achter in het document): *Klaar, volgende*.

## Tutorial 6 en 7: wat de API wel en niet kan

Gecontroleerd in de app-code (`src/extensions/extTypes.ts`, `extensionApi.ts`) en in de draaiende app:

- **Een baseline is niet te lezen en niet te schrijven.** `api.data` kent geen baselines, ook geen
  host-event. De stap *Een baseline opslaan* heeft dus geen controle (*Klaar, volgende*) en geen Toon mij.
- **De statusdatum is te lezen** (`getProject().statusDate`) **maar niet te schrijven**: controle ja, Toon
  mij nee.
- **Voortgang is te lezen** (`time.completion`, `time.actualStart`, `time.actualFinish`), dus elke
  invoerstap heeft een controle. Schrijven kan alleen met `updateTask`, de ruwe veldschrijfroute zonder de
  regels van de app (percentage ↔ werkelijke datums ↔ status, de startvraag, het weigeren van een datum
  na de statusdatum). Daarop bouwt Toon mij niet: hij opent alleen een stand van de generator.
- **Een urentaak heeft kloktijden.** De stort (`Fundering storten`, 6 u) heeft in `na-tut-6` een werkelijke
  start `2027-06-21T07:00` en een werkelijk einde `2027-06-21T14:00`; de lezer typt `21-06-2027 07:00` en
  `21-06-2027 14:00` in de tabel. Alleen de datum geeft een andere uitkomst (vroege start 18-06T16:00,
  speling 1 in plaats van 0,25): de controle eist de kloktijd.
- **`scheduleSignature` dekt geen voortgang.** Zonder tweede vingerafdruk (`progressSignature`: statusdatum,
  percentage en werkelijke datums van de bladtaken) zou een berekening van vóór de invoer (bijvoorbeeld de
  laatste van tutorial 5) de stap *Rekenen* al groen maken. `progressCalculated` eist beide.
- **De tabelkolommen, het gekozen rapport, het papier, de PDF en het exportvenster zijn niet te lezen** en
  laten niets achter in het document: *Klaar, volgende*. Overwogen en afgewezen: `localStorage['ops-reportSettings']`
  lezen voor de rapportkeuze (zoals tutorial 4 de urenplanning leest). Een eerder bewaarde keuze zou de stap
  dan meteen groen maken.

Per stap (alle controles zijn in de doorloop op 1600×950 en 1366×768, nl en en, op het goede moment groen
geworden):

| Stap | Controle | Toon mij | Opnieuw | Anker |
|---|---|---|---|---|
| T6 1 *Het startpunt* | project na tutorial 5 | opent `na-tut-5` | – | – |
| T6 2 *Een baseline opslaan* | geen (niet leesbaar) | – | `na-tut-5` | `ribbon-group:planning:baselines` |
| T6 3 *De statusdatum* | `statusDate` = 2027-06-28 | – | – | `ribbon-group:planning:baselines` |
| T6 4 *De voorbereiding is klaar* | vier taken 100 % met de juiste datums | – | – | `ribbon:table:tableColumns` |
| T6 5 *Het ontgraven liep uit* | ontgraven 11–15 jun, 100 % | – | – | `ribbon-tab:table` |
| T6 6 *De wapening, de keuring en de stort* | drie taken, stort met kloktijd | – | – | `ribbon-tab:table` |
| T6 7 *Het funderingsmetselwerk loopt* | start 25 jun, 50 %, geen einde | – | – | `ribbon-tab:table` |
| T6 8 *Rekenen* | alles ingevuld én berekend na die invoer | `na-tut-6` of alleen berekenen | – | `ribbon:table:calc` |
| T6 9 *De afwijking in de Gantt* | geen | idem | – | `ribbon-tab:start` |
| T6 10 *De afwijking in cijfers* | geen | idem | – | `ribbon:table:tableColumns` |
| T7 1 *Het startpunt* | project na tutorial 6 | opent `na-tut-6`, berekent | – | – |
| T7 2 t/m 7 | geen | – | – | `ribbon-tab:report`, `report-panel` (4×), `ribbon-tab:file` |

Toon mij vanaf *Rekenen* opent `na-tut-6` alleen als het geopende project de voortgang niet heeft; staat
alles erin maar is het niet berekend, dan berekent Toon mij alleen (nagelopen).

**Gewenste extra standen uit de app-generator** (geen van allen bestaat nu), alle zonder berekening, dus
zoals de lezer ze heeft vóór Bereken: `tussen-tut-6-baseline` (`na-tut-5` + baseline *Basisplanning*),
`tussen-tut-6-statusdatum` (+ statusdatum 28 juni), `tussen-tut-6-voorbereiding`, `tussen-tut-6-ontgraven`,
`tussen-tut-6-fundering` en `tussen-tut-6-metselwerk` (+ de voortgang tot en met die groep). Daarmee kunnen
Toon mij en Opnieuw ook de stappen 3 t/m 7 van tutorial 6 doen. Voor tutorial 7 is geen extra stand nodig.

## Ankers en de plek van het begeleidingspaneel

Het begeleidingspaneel staat rechtsonder en is hoog zodra de uitleg zichtbaar is. Gecontroleerd op 1600×950 en
1366×768:

- Stappen in Eigenschappen hebben geen anker (het paneel zou naar links uitwijken over de takenlijst), behalve
  waar je links niets aanklikt: tutorial 3 *deadline-krap* en tutorial 5 *tweede-stukadoor* (blok
  Toewijzingen onderaan Eigenschappen) wijzen `properties-panel` aan.
- Tutorial 2 *uitloop* wijst `ribbon-tab:table` aan en niet `properties-panel`: op 1366×768 bedekt het paneel
  links dan de tabelrij en de kolom Duur waar je in klikt.
- Voor lintitems die een eigen component renderen (de keuzelijst *Toewijzen*, de indicator *Overallocatie*)
  wijst tutorial 5 de lintgroep aan (`ribbon-group:resources:resourceAssignment`,
  `ribbon-group:resources:overallocationIndicator`). Het item-anker raakt kwijt zodra er een extensie met
  lintknoppen actief is en de taakselectie wisselt; de markering viel dan terug op de linttab.

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
  aug), omdat de vijfde wachtdag van de dekvloer in de bouwvak valt. Met `5ed` op die lag begint het
  tegelwerk ma 23 aug.
- **`na-tut-3`**: `tussen-tut-3-bouwvak` + SNET 14 jul op *Kozijnen plaatsen* (was vr 9 jul) +
  deadline vr 10 sep op de oplevering. Oplevering wo 1 sep, *8 taken, 48 werkdagen*; Start bouw t/m
  Dakbedekking 3 werkdagen speling, Buitenspouwblad 5. Deadline 10 sep: gehaald met 7 werkdagen marge.
  Wat-als deadline vr 27 aug: *1 deadline(s) overschreden*, *21 taken*, oplevering blijft 1 sep,
  totale speling −3 dagen.
- **`na-tut-4`**: `na-tut-3` + urenplanning aan en drie taken in uren (gepind in
  `check-tutorial-project.ts`). Fundering storten (6 u) vr 18 jun 07:00–14:00, Kanaalplaatvloer leggen (5 u)
  ma 28 jun 07:00–12:00, Dakelementen plaatsen (6 u) di 6 jul 07:00–14:00 (werkdag 07:00–12:00 en
  13:00–16:00, 8 netto-uren). Oplevering blijft wo 1 sep, *8 taken, 48 werkdagen*. Totale speling stort en
  dakelementen 3,25 dagen, vloer 3,375 (de tabel toont 3,38d): de dagtaken eromheen hebben 3, het verschil
  zijn de uren (2, 2 en 3) die een dagtaak niet gebruikt. Wat-als dakelementen 12 u: di 6 jul 07:00 t/m wo 7
  jul 11:00, Dakbedekking do 8 – vr 9 jul (was wo 7 – do 8), speling dakelementen 2,5 dagen, binnenspouwblad
  en dakbedekking 2 werkdagen; oplevering en *8 taken, 48 werkdagen* blijven.
- **`tussen-tut-5-resources`**: `na-tut-4` + de vijf resources (Timmerploeg Ploeg 1, Metselaar Arbeid 1,
  Mobiele kraan Materieel 1, Stukadoor Onderaannemer 2, Beton Materiaal 50 m³), geen toewijzingen. Planning
  gelijk aan `na-tut-4`: oplevering wo 1 sep, *8 taken, 48 werkdagen*.
- **`tussen-tut-5-toegewezen`**: + de twaalf toewijzingen (beton 8 m³/dag op de stort), berekend. Oplevering
  nog wo 1 sep, *8 taken, 48 werkdagen*; Stucwerk 4 werkdagen (vr 23 – wo 28 jul) met 1 stukadoor; de
  metselaar al 5 dagen overbezet (29 jun – 5 jul).
- **`tussen-tut-5-werkregel`**: + Stucwerk op Vast werk met twee stukadoors, berekend: Stucwerk vr 23 – ma 26
  jul (2 werkdagen), oplevering ma 30 aug, *8 taken, 46 werkdagen*, de metselaar 5 dagen overbezet (29 jun –
  5 jul). Dit is de stand vóór het nivelleren.
- **`na-tut-5`**: `na-tut-4` + vijf resources, twaalf toewijzingen, Stucwerk op Vast werk met twee
  stukadoors (4 → 2 werkdagen, vr 23 – ma 26 jul) en genivelleerd. Vóór het nivelleren: oplevering ma 30
  aug, *8 taken, 46 werkdagen*, de metselaar 5 dagen overbezet (29 jun – 5 jul); in het histogram staat de
  kraan op 28 jun en 6 jul voor 0,625 en 0,75 eenheid (5 en 6 van de 8 uur) en het beton op 18 jun voor 6
  m³. Na het nivelleren: buitenspouwblad nivelleervertraging 5 (di 6 – di 13 jul), niemand overbezet,
  oplevering ma 30 aug, *17 taken, 46 werkdagen*.
- **`na-tut-6`**: `na-tut-5` + baseline *Basisplanning* (`Baseline` in de en-variant; oplevering ma 30 aug),
  statusdatum ma 28 jun 2027 en voortgang: Start bouw 7 jun, Bouwplaats 7–8 jun, Tuin 9 jun, Uitzetten 10 jun,
  Funderingssleuf ontgraven 11–15 jun (3 in plaats van 2 werkdagen), Wapening 16–18 jun, Inspectie 18 jun,
  Fundering storten ma 21 jun 07:00–14:00, Funderingsmetselwerk gestart vr 25 jun op 50 %. Statusbalk
  *Kritiek pad: 10 taken, 47 werkdagen*, *Einde: 31-08-2027*: oplevering di 31 aug, 1 werkdag later dan de
  baseline (30 aug). Kritiek: Funderingsmetselwerk, Buitenspouwblad, Kozijnen, Achtergevel doorbreken,
  Installaties, Stucwerk, Dekvloer, Tegelwerk, Opleverpunten, Oplevering; de acht voltooide taken zijn
  niet kritiek. Fase Voorbereiding 100 %, Fundering 81 % (6,75 van 8,375 werkdagen gewicht). Funderingsmetselwerk
  25–28 jun (restwerk 1 werkdag op de statusdatum), Kanaalplaatvloer di 29 jun (was 28 jun). Zonder
  voortgang, alleen met statusdatum en Bereken: alles wat niet begonnen is schuift naar 28 jun, oplevering 20
  sep, *1 deadline(s) overschreden*.
  Variance (alle bladtaken): 19 *Later*, 0 *Eerder*, 4 *Op schema*, *Projecteinde: +1 werkdagen*; ontgraven
  start 0 / einde +1, alle taken daarna +1 / +1. Voortgangsrapport: statusdatum 28-06-2027, periode
  29-05-2027 – 28-06-2027, vooruitblik t/m 29-07-2027, baseline-einde 30-08-2027, prognose-einde 31-08-2027,
  Δ einde +1, gepland 28,7 % (12,375 van 43,125 werkdagen), werkelijk 25 % (10,75; 24,9 %), 8 / 23
  voltooid, 1 in uitvoering, 14 niet gestart. PDF (A4 liggend): `<project>-voortgang.pdf` 3 pagina's,
  `<project>-afwijkingen.pdf` 1 pagina; een export (XML, CSV, …) meldt in de browser *Opgeslagen als download*.
  De PDF van het Voortgangsrapport heeft dezelfde cijfers als het scherm (tekst uit de PDF gelezen).
- **`na-tut-7`**: gelijk aan `na-tut-6` (een rapport is geen projectdata); bestand byte-gelijk.

## `minAppVersion`: nog een placeholder

`minAppVersion` staat voorlopig op `2026.0.0`. **Bij de release zetten op de eerste app-versie met
extensiecontract 1.4** (release v2026.9.0 heeft contract 1.0.0), en pas daarna een catalogusentry
maken. Tot die tijd houdt `"apiVersion": "1.4"` oudere apps tegen: een host met een lagere
contract-minor weigert de extensie. Een hogere `minAppVersion` nu zou de extensie in de huidige
dev-build (ook 2026.9.0) weigeren.

## Projectbestanden

`projects/<taal>/start-tut-1.ifc`, `na-tut-1.ifc`, `na-tut-2.ifc`, `tussen-tut-3-bouwvak.ifc`,
`na-tut-3.ifc`, `na-tut-4.ifc`, `tussen-tut-5-resources.ifc`, `tussen-tut-5-toegewezen.ifc`,
`tussen-tut-5-werkregel.ifc`, `na-tut-5.ifc`, `na-tut-6.ifc` en `na-tut-7.ifc` zijn **gegenereerd**, niet met de hand gemaakt. Alle
standen komen uit de generator van de app. In een checkout van de app:

```bash
npm run gen:tutorial-project -- --out <map>
# kopieer daarna <map>/<taal>/start-tut-1.ifc, na-tut-1.ifc, na-tut-2.ifc, tussen-tut-3-bouwvak.ifc,
# na-tut-3.ifc, na-tut-4.ifc, tussen-tut-5-resources.ifc, tussen-tut-5-toegewezen.ifc,
# tussen-tut-5-werkregel.ifc, na-tut-5.ifc, na-tut-6.ifc en na-tut-7.ifc naar projects/<taal>/
```

`tussen-tut-3-bouwvak` is `na-tut-2` plus de bouwvak in de kalender. De extensie-API kan de kalender
niet wijzigen, dus **Toon mij** op de bouwvakstap opent dit project (als nieuw tabblad) in plaats van de
kalender aan te passen; **Opnieuw** op de constraintstap laadt hem als beginstand van die stap.

De drie `tussen-tut-5-*`-standen (app-generator, branch `claude/tutorial-tussenstanden-tut5`) zijn er
om dezelfde reden: de API kan geen resources, toewijzingen of werkregels schrijven. De andere bestanden in
`projects/` zijn niet opnieuw gegenereerd; ze verschillen van de huidige generatoruitvoer alleen in
GUIDs, tijdstempels en (bij `start-tut-1` en `na-tut-1`) de schrijfversie en de STEP-codering van een
gedachtestreepje.

## ZIP maken

```bash
zip -X tutorials-1.2.0.zip manifest.json main.js projects/nl/*.ifc projects/en/*.ifc
git add -f tutorials-1.2.0.zip
```

Installeren om te testen: Bestand › Extensies › **ZIP** › kies `tutorials-1.2.0.zip`.
