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

## Wat doet hij?

- **Help › Tutorials**: de leesversie (nl + en) via `api.help.registerArticles`, met
  `project://`-links naar het startproject en het eindresultaat, en `docs://`-links naar de uitleg
  (`uitleg-relaties`, `uitleg-kritiek-pad`, `uitleg-kalenders`, `uitleg-constraints`,
  `uitleg-dagen-en-uren`, `uitleg-werkregels`, `uitleg-nivelleren`).
- **Start › Tutorials › Tutorial 1 t/m 5**: start het begeleidingspaneel (`api.help.startGuide`).
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
  tutorial 2 t/m 5 werkt op dezelfde manier.

Leesversie en paneel komen uit dezelfde tekst in `main.js`. De extensielader kent één bestand
(`require()` geeft alleen `open-planner-studio`), dus `main.js` heeft duidelijke secties: het project en
de leesfuncties, tutorial 1, de logica van tutorial 2 en 3, die van tutorial 4 en 5, de vijf teksten
(`TEXT_1` t/m `TEXT_5`), de stappen en `onLoad`.

## Hoe elke tutorial begint

Elke tutorial start vanuit de stand van de vorige (`project://`-link in het artikel en in de eerste
stap; **Toon mij** op die stap opent hem als het project niet klopt):

- tutorial 1: leeg project (`start-tut-1`, alleen een overslaan-link; stap 1 doet de lezer zelf);
- tutorial 2: `na-tut-1`;
- tutorial 3: `na-tut-2`;
- tutorial 4: `na-tut-3`;
- tutorial 5: `na-tut-4`.

**Opnieuw** staat alleen bij stappen waarvoor de generator een beginstand levert:
tutorial 1 stap *De fasen* (`start-tut-1`), tutorial 2 stap *De eerste relatie* (`na-tut-1`), tutorial 3
stap *De bouwvak in de kalender* (`na-tut-2`) en stap *Een constraint* (`tussen-tut-3-bouwvak`),
tutorial 4 stap *De betonstort: 6 uur* (`na-tut-3`) en tutorial 5 stap *Vijf resources aanmaken*
(`na-tut-4`), *De metselaar op vier taken* (`tussen-tut-5-resources`), *De werkregel: Vast werk*
(`tussen-tut-5-toegewezen`) en *Nivelleren* (`tussen-tut-5-werkregel`).

## Wat de extensie-API niet kan (en wat dat voor tutorial 4 en 5 betekent)

`api.data` kan taken en relaties schrijven, maar geen kalender, instellingen, resources, toewijzingen,
werkregels of nivellering. Gevolgen:

- **Tutorial 4, stap *Urenplanning aanzetten*.** Urenplanning is een instelling van de app (niet van het
  document) en de API kent geen instellingen. De controle leest de bewaarde instelling,
  `localStorage['ops-enableHourPlanning']` (de `ops-<naam>`-sleutels uit `settingsRegistry.ts` van de app).
  In de app nagelopen: standaard is hij uit en ontbreekt de sleutel; elke route die Urenplanning aanzet
  (Instellingen, de melding *Urenplanning aanzetten*, het veld Duur) schrijft `true`, uitzetten `false`.
  Een ontbrekende sleutel is dus "nooit veranderd" óf "door de app hernoemd". **Vangnet**: staat de sleutel
  niet op `true` maar is sinds de vorige controle (of de start van tutorial 4) een ándere `ops-`-schakelaar
  op `true` gesprongen, dan gooit de controle met uitleg; de app meldt dat en de stap valt terug op *Klaar, volgende*. Zonder zo'n
  sprong blijft hij wachten, zodat de controle voor een gewone lezer betekenis houdt (in de app: openen van
  Instellingen en het tabblad Planning schrijft geen `ops-`-sleutel). Stond de hernoemde schakelaar al
  aan, dan springt hij pas bij uit- en weer aanzetten; de stap-tekst zegt dat ("Gaat het paneel dan niet
  verder, zet het vinkje uit en weer aan"). Geblokkeerde opslag laat de controle ook gooien. Er is geen Toon mij. De latere stappen zetten de uren wel klaar (`updateTask` met
  `durationUnit: 'hours'`).
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
- Tutorial 5 *histogram*: vanaf *tweede-stukadoor* (anker `properties-panel`) staat het paneel links, en op
  1366×768 bedekt het dan de resourcelijst onder de Gantt. Bovendien toont het histogram bij een geselecteerde
  taak alleen de resources van die taak, en het Stucwerk is na stap 6–7 nog geselecteerd. De tekst zegt daarom:
  eerst Esc, dan *Mobiele kraan* in de lijst of via *Resources › Histogram › Volgende* (in de app nagelopen:
  Esc heft de selectie op, drie keer Volgende geeft de kraan). Geen anker kan het paneel hier naar rechts
  zetten: het wijkt alleen uit voor een anker dat eronder ligt.

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

## `minAppVersion`: nog een placeholder

`minAppVersion` staat voorlopig op `2026.0.0`. **Bij de release zetten op de eerste app-versie met
extensiecontract 1.4** (release v2026.9.0 heeft contract 1.0.0), en pas daarna een catalogusentry
maken. Tot die tijd houdt `"apiVersion": "1.4"` oudere apps tegen: een host met een lagere
contract-minor weigert de extensie. Een hogere `minAppVersion` nu zou de extensie in de huidige
dev-build (ook 2026.9.0) weigeren.

## Projectbestanden

`projects/<taal>/start-tut-1.ifc`, `na-tut-1.ifc`, `na-tut-2.ifc`, `tussen-tut-3-bouwvak.ifc`,
`na-tut-3.ifc`, `na-tut-4.ifc`, `tussen-tut-5-resources.ifc`, `tussen-tut-5-toegewezen.ifc`,
`tussen-tut-5-werkregel.ifc` en `na-tut-5.ifc` zijn **gegenereerd**, niet met de hand gemaakt. Alle
standen komen uit de generator van de app. In een checkout van de app:

```bash
npm run gen:tutorial-project -- --out <map>
# kopieer daarna <map>/<taal>/start-tut-1.ifc, na-tut-1.ifc, na-tut-2.ifc, tussen-tut-3-bouwvak.ifc,
# na-tut-3.ifc, na-tut-4.ifc, tussen-tut-5-resources.ifc, tussen-tut-5-toegewezen.ifc,
# tussen-tut-5-werkregel.ifc en na-tut-5.ifc naar projects/<taal>/
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
