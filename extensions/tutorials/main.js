/**
 * Tutorials voor Open Planner Studio — tutorial 1 "Je eerste planning" (contract 1.4.0, permissie `help`).
 *
 * Wat deze extensie doet:
 *   • api.help.registerArticles(...)  → de leesversie van de tutorial in Help › Tutorials;
 *   • api.ui.addRibbonButton(...)     → Start › Tutorials › "Tutorial 1" start de begeleiding
 *                                       (permissie "ribbon"; een Help-artikel kan zelf geen begeleiding
 *                                       starten, alleen een `project://`-bestand openen);
 *   • api.help.startGuide(...)        → het begeleidingspaneel, met per stap een controle op de
 *                                       documenttoestand, "Toon mij" en waar zinvol "Opnieuw";
 *   • api.events.on(...)              → de laatste stap (Bereken) herkent een berekening via
 *                                       `host:schedule-calculated` (permissie "events").
 *
 * Leesversie en paneel gebruiken DEZELFDE tekst: elke stap heeft een titel, een opdracht en een uitleg
 * ("wat je nu ziet, en waarom"); het artikel en de paneelstappen worden hieronder uit die ene bron
 * samengesteld.
 *
 * De projectbestanden in `projects/<taal>/` zijn GEGENEREERD, niet met de hand gemaakt: in een
 * checkout van de app `npm run gen:tutorial-project -- --out <map>` en daarna `start-tut-1.ifc` en
 * `na-tut-1.ifc` per taal hierheen kopiëren. De getallen in de tekst (7 juni 2027, 14 juni,
 * Buitenspouwblad metselen als enige kritieke taak) komen uit stand `na-tut-1` van die generator.
 */

const sdk = require('open-planner-studio');

// ── Het project ──────────────────────────────────────────────────────────────────────────────

const START_DATE = '2027-06-07';
const PROJECT_NAME = { nl: 'Aanbouw woning', en: 'House extension' };

/** Asset-pad van een meegeleverde stand (`start-tut-1`, `na-tut-1`) in de gegeven taal. */
const projectAsset = (lang, stand) => `projects/${lang}/${stand}.ifc`;

/**
 * De WBS van tutorial 1, gelijk aan `scripts/tutorial-project.ts` in de app (stand na-tut-1).
 * `days` = duur in werkdagen; `milestone` = soort mijlpaal zoals het lint hem maakt
 * (Mijlpaal › Startmijlpaal / Eindmijlpaal / Inspectiemoment (verplicht)).
 */
const PHASES = [
  {
    key: 'voorbereiding',
    name: { nl: 'Voorbereiding', en: 'Preparation' },
    items: [
      { name: { nl: 'Start bouw', en: 'Start of construction' }, milestone: 'START' },
      { name: { nl: 'Bouwplaats inrichten', en: 'Set up site' }, days: 2 },
      { name: { nl: 'Tuin en bestrating verwijderen', en: 'Clear garden and paving' }, days: 1 },
      { name: { nl: 'Aanbouw uitzetten', en: 'Set out the extension' }, days: 1 },
    ],
  },
  {
    key: 'fundering',
    name: { nl: 'Fundering', en: 'Foundations' },
    items: [
      { name: { nl: 'Funderingssleuf ontgraven', en: 'Excavate foundation trench' }, days: 2 },
      { name: { nl: 'Wapening en bekisting fundering', en: 'Foundation formwork and reinforcement' }, days: 3 },
      { name: { nl: 'Inspectie wapening', en: 'Reinforcement inspection' }, milestone: 'FINISH', mandatory: true },
      { name: { nl: 'Fundering storten', en: 'Pour foundation' }, days: 1 },
      { name: { nl: 'Funderingsmetselwerk', en: 'Foundation brickwork' }, days: 2 },
      { name: { nl: 'Kanaalplaatvloer leggen', en: 'Lay hollow-core floor' }, days: 1 },
    ],
  },
  {
    key: 'ruwbouw',
    name: { nl: 'Ruwbouw', en: 'Shell' },
    items: [
      { name: { nl: 'Binnenspouwblad metselen', en: 'Build inner cavity leaf' }, days: 5 },
      { name: { nl: 'Buitenspouwblad metselen', en: 'Build outer cavity leaf' }, days: 6 },
      { name: { nl: 'Dakelementen plaatsen', en: 'Place roof elements' }, days: 1 },
      { name: { nl: 'Dakbedekking aanbrengen', en: 'Apply roofing' }, days: 2 },
      { name: { nl: 'Kozijnen plaatsen', en: 'Install window frames' }, days: 2 },
      { name: { nl: 'Achtergevel doorbreken', en: 'Break through rear wall' }, days: 2 },
    ],
  },
  {
    key: 'afbouw',
    name: { nl: 'Afbouw', en: 'Finishing' },
    items: [
      { name: { nl: 'Installaties aanleggen', en: 'Install building services' }, days: 3 },
      { name: { nl: 'Stucwerk', en: 'Plastering' }, days: 4 },
      { name: { nl: 'Dekvloer aanbrengen', en: 'Lay floor screed' }, days: 1 },
      { name: { nl: 'Tegelwerk', en: 'Tiling' }, days: 3 },
      { name: { nl: 'Schilderwerk', en: 'Painting' }, days: 3 },
      { name: { nl: 'Opleverpunten en schoonmaken', en: 'Snagging and cleaning' }, days: 1 },
      { name: { nl: 'Oplevering', en: 'Handover' }, milestone: 'FINISH' },
    ],
  },
];
const PHASE = Object.fromEntries(PHASES.map(p => [p.key, p]));
const START_MILESTONE = PHASE.voorbereiding.items[0];

// ── Lezen van de documenttoestand ────────────────────────────────────────────────────────────

/** Namen vergelijken zonder op hoofdletters of extra spaties te struikelen. */
const norm = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLocaleLowerCase();
/** Heet `named` (taak of project) zoals `names` in het Nederlands óf het Engels? Een taalwissel
 *  halverwege de tutorial laat het project in de oude taal staan; beide tellen dus. */
const hasName = (named, names) => {
  const n = norm(named && named.name);
  return n === norm(names.nl) || n === norm(names.en);
};

function isTutorialProject(api) {
  const p = api.data.getProject();
  return hasName(p, PROJECT_NAME) && String(p.startDate || '').slice(0, 10) === START_DATE;
}

/** Taal van het geopende project (de taaknamen die Toon mij toevoegt, moeten daarbij passen). */
function projectLang(api) {
  return norm(api.data.getProject().name) === norm(PROJECT_NAME.en) ? 'en' : 'nl';
}

/** Taal van de app zoals het paneel hem kiest: `nl` bij een Nederlandse interface, anders `en`. */
function uiLang() {
  try {
    return document.documentElement.lang === 'nl' ? 'nl' : 'en';
  } catch {
    return 'en';
  }
}

const findPhase = (tasks, phase) => tasks.find(t => !t.parentId && hasName(t, phase.name));

/** Heeft de taak de vorm uit de tutorial (mijlpaal van de juiste soort, of de juiste duur)? */
function itemOk(task, item) {
  if (item.milestone) {
    return task.isMilestone === true && task.milestoneKind === item.milestone
      && (!item.mandatory || task.mandatory === true);
  }
  return task.isMilestone !== true && task.time.durationUnit !== 'hours'
    && Math.abs(task.time.scheduleDuration - item.days) < 1e-9;
}

/** Staan de vier fasen op het hoogste niveau, in deze volgorde? */
function phasesDone(api) {
  const tasks = api.data.getTasks();
  const found = PHASES.map(p => findPhase(tasks, p));
  if (found.some(t => !t)) return false;
  // Volgorde via de WBS-nummers (automatisch genummerd in een nieuw project). Zonder bruikbare
  // nummers (vrije WBS) is aanwezigheid genoeg.
  const nums = found.map(t => Number(t.wbsCode));
  if (nums.every(n => Number.isFinite(n))) return nums.every((n, i) => i === 0 || n > nums[i - 1]);
  return true;
}

/** Staat de startmijlpaal (ergens) in het project? */
function startMilestoneAdded(api) {
  return api.data.getTasks().some(t => hasName(t, START_MILESTONE.name) && itemOk(t, START_MILESTONE));
}

/** Hangt de startmijlpaal onder de fase Voorbereiding? */
function startMilestoneIndented(api) {
  const tasks = api.data.getTasks();
  const phase = findPhase(tasks, PHASE.voorbereiding);
  return !!phase && tasks.some(t => t.parentId === phase.id && hasName(t, START_MILESTONE.name) && itemOk(t, START_MILESTONE));
}

/** Heeft de fase alle taken uit de tutorial, met de juiste vorm en in de juiste volgorde? Extra
 *  taken tellen niet mee: die kan Toon mij niet weghalen, dus ze mogen de stap niet blokkeren. */
function phaseDone(api, phase) {
  const tasks = api.data.getTasks();
  const parent = findPhase(tasks, phase);
  if (!parent) return false;
  let last = -1;
  for (const item of phase.items) {
    const task = tasks.find(t => t.parentId === parent.id && hasName(t, item.name));
    if (!task || !itemOk(task, item)) return false;
    const index = parent.childIds.indexOf(task.id);
    if (index <= last) return false;
    last = index;
  }
  return true;
}

// ── Toon mij: de stap (en wat eraan voorafgaat) klaarzetten ──────────────────────────────────
//
// Cumulatief en herhaalbaar: elke `prepare` zorgt ook voor de stappen ervóór, en doet niets wat al
// klopt. Zo werkt Toon mij ook als de gebruiker een stap oversloeg of in een ander project zat.

async function ensureProject(api) {
  if (!isTutorialProject(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'start-tut-1'));
}

function newItemInput(item, lang, parentId) {
  if (item.milestone) {
    return {
      name: item.name[lang],
      parentId,
      isMilestone: true,
      milestoneKind: item.milestone,
      // Zoals het lint: Start-/Eindmijlpaal = Overig, Inspectiemoment = Aanwezigheid + Verplicht.
      taskType: item.mandatory ? 'ATTENDANCE' : 'USERDEFINED',
      ...(item.mandatory ? { mandatory: true } : {}),
      time: sdk.factory.createTaskTime(START_DATE, 0),
    };
  }
  return { name: item.name[lang], parentId, time: sdk.factory.createTaskTime(START_DATE, item.days) };
}

function ensurePhases(api) {
  const lang = projectLang(api);
  api.data.batch(() => {
    for (const phase of PHASES) {
      if (!findPhase(api.data.getTasks(), phase)) {
        api.data.addTask({ name: phase.name[lang], time: sdk.factory.createTaskTime(START_DATE, 5) });
      }
    }
  });
}

/** Zet de taken van één fase goed: ontbrekende toevoegen, verkeerd geplaatste verhuizen, duur of
 *  mijlpaalsoort rechtzetten en tot slot de volgorde herstellen. */
function ensurePhaseItems(api, phase) {
  const lang = projectLang(api);
  api.data.batch(() => {
    const parent = findPhase(api.data.getTasks(), phase);
    if (!parent) return;
    for (const item of phase.items) {
      const task = api.data.getTasks().find(t => hasName(t, item.name));
      if (!task) {
        api.data.addTask(newItemInput(item, lang, parent.id));
        continue;
      }
      const patch = {};
      if (task.parentId !== parent.id) patch.parentId = parent.id;
      if (!itemOk(task, item)) {
        Object.assign(patch, item.milestone
          ? { isMilestone: true, milestoneKind: item.milestone, ...(item.mandatory ? { mandatory: true } : {}), time: { scheduleDuration: 0 } }
          : { isMilestone: false, time: { scheduleDuration: item.days, durationUnit: 'days' } });
      }
      if (Object.keys(patch).length > 0) api.data.updateTask(task.id, patch);
    }
    if (!phaseDone(api, phase)) {
      // Volgorde herstellen: elke taak even naar het hoogste niveau en weer terug, in de volgorde van
      // de tutorial; een verplaatsing zet de taak achteraan bij zijn nieuwe ouder.
      for (const item of phase.items) {
        const task = api.data.getTasks().find(t => t.parentId === parent.id && hasName(t, item.name));
        if (!task) continue;
        api.data.updateTask(task.id, { parentId: null });
        api.data.updateTask(task.id, { parentId: parent.id });
      }
    }
  });
}

/** Stap 3 (mijlpaal) en 4 (inspringen) samen: Toon mij hangt de mijlpaal meteen onder de fase. De
 *  API kent geen "invoegen onder de selectie", dus los op het hoogste niveau zou hij onderaan landen. */
function ensureStartMilestone(api) {
  const lang = projectLang(api);
  api.data.batch(() => {
    const parent = findPhase(api.data.getTasks(), PHASE.voorbereiding);
    if (!parent) return;
    const task = api.data.getTasks().find(t => hasName(t, START_MILESTONE.name));
    if (!task) api.data.addTask(newItemInput(START_MILESTONE, lang, parent.id));
    else if (task.parentId !== parent.id || !itemOk(task, START_MILESTONE)) {
      api.data.updateTask(task.id, {
        parentId: parent.id, isMilestone: true, milestoneKind: 'START', time: { scheduleDuration: 0 },
      });
    }
  });
}

async function prepareUpTo(api, stepKey) {
  await ensureProject(api);
  ensurePhases(api);
  if (stepKey === 'fasen') return;
  ensureStartMilestone(api);
  if (stepKey === 'mijlpaal' || stepKey === 'inspringen') return;
  for (const phase of PHASES) {
    ensurePhaseItems(api, phase);
    if (phase.key === stepKey) return;
  }
}

// ── Stap Bereken: herkend aan een berekening van precies deze planning ─────────────────────────

/** Vingerafdruk van wat de berekening beïnvloedt (niet van de rekenuitkomst zelf). */
function scheduleSignature(api) {
  const tasks = api.data.getTasks().map(t => [
    t.id, t.parentId || '', t.isMilestone ? 1 : 0, t.milestoneKind || '', t.time.scheduleDuration, t.time.durationUnit || '',
  ]);
  return JSON.stringify([api.data.getProject().id, api.data.getSequences().length, tasks]);
}
let calculatedSignature = null;

// ── De tekst: één bron voor Help-artikel en paneel ───────────────────────────────────────────

const TEXT = {
  nl: {
    title: 'Je eerste planning',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Je eerste planning',
      '## Wat je bouwt',
      'Je maakt de planning voor een aanbouw: een uitbouw van 4 bij 5 meter aan de achtergevel van een eengezinswoning. Dat project loopt door alle zeven tutorials heen. In deze eerste tutorial zet je het geraamte neer: een nieuw project, vier fasen, twintig taken met een duur en drie mijlpalen.',
      'Aan het eind staan alle taken in hun fase en heeft de app voor het eerst gerekend. Je ziet dan meteen waarom een lijst taken nog geen planning is: zonder relaties begint alles op dezelfde dag.',
      '## Uitgangspunt',
      'Dit is de eerste tutorial. Je hebt alleen Open Planner Studio nodig; je begint met een leeg project.',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 1*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar.',
      'Wil je het venster van stap 1 overslaan? [Open dan het startproject](project://projects/nl/start-tut-1.ifc). Dat is hetzelfde lege project.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een project begint met een startdatum en een kalender.** Zonder relaties begint elke taak op de startdatum, en de kalender bepaalt welke dagen werkdagen zijn.',
      '- **Fasen maak je met inspringen.** Een fase wordt dan een samenvattingstaak: begin en einde volgen uit zijn taken, dus je ziet per fase hoe lang hij duurt.',
      '- **Een mijlpaal is een moment zonder duur.** Hij markeert iets waar het werk op wacht: de start, een keuring, de oplevering.',
      '- **Standaard reken je zelf, met Bereken (F5).** Pas daarna kloppen de balken; tot die tijd meldt de statusbalk dat de planning verouderd is.',
      '- **Zonder relaties is een planning een lijst.** Alles begint tegelijk en de langste taak bepaalt het einde. Daarom leg je in tutorial 2 de volgorde vast.',
      'Waarom je een project zo opdeelt, en hoe fijn, lees je in [Goed plannen](docs://gids-goed-plannen#de-opdeling-fasen-werkpakketten-taken).',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-1.ifc).',
    ],
    steps: {
      'nieuw-project': {
        title: 'Een nieuw project',
        task: [
          'Klik op *Start › Bestand › Nieuw*. Vul in het venster **Nieuw project** in:',
          '- **Projectnaam**: `Aanbouw woning`\n- **Startdatum**: `07-06-2027`, maandag 7 juni 2027\n- **Land**: Nederland, en bij **Bouwvak**: Geen',
          'Klik op **Aanmaken**.',
        ],
        explain: [
          'Bovenaan staat nu een tabblad Aanbouw woning, met een lege takenlijst.',
          'De startdatum is het anker van je planning. Zolang een taak geen voorganger heeft, begint hij op deze dag. Kies hem dus bewust: de dag dat de aannemer op de bouwplaats begint.',
          'Met Nederland krijgt het project een kalender met de Nederlandse feestdagen van 2026 tot en met 2030. In het venster stond onder Bouwvak de regel *36 feestdagen, 2026–2030*; klap je die open, dan zie je welke dagen het zijn. Op die dagen wordt niet gewerkt, dus de app telt ze niet als werkdag. De bouwvak laat je nog weg. Die zet je in tutorial 3 zelf in de kalender, zodat je ziet wat hij met de einddatum doet.',
        ],
      },
      fasen: {
        title: 'De fasen',
        task: [
          'Klik op *Start › Taken › Taak*. Er verschijnt een nieuwe taak, en rechts in **Eigenschappen** is de naam al geselecteerd. Typ `Voorbereiding` en druk op Enter.',
          'Doe hetzelfde voor `Fundering`, `Ruwbouw` en `Afbouw`. Een nieuwe taak komt steeds onder de geselecteerde taak, dus de fasen staan vanzelf op volgorde.',
        ],
        explain: [
          'De tijdbalk is naar juni 2027 gesprongen, naar je eerste taak. In de takenlijst staan vier regels met de WBS-nummers 1 tot en met 4. WBS staat voor *work breakdown structure*: de opdeling van het werk. Elke fase heeft nu nog een balk van 5 dagen, de standaardduur van een nieuwe taak.',
          'Waarom eerst fasen? Twintig taken overzie je nog wel, driehonderd niet. Met fasen zie je per fase wanneer hij begint en eindigt, en je klapt weg wat je even niet nodig hebt. Zo meteen zet je de taken ín de fasen; dan telt die 5 dagen niet meer.',
        ],
      },
      mijlpaal: {
        title: 'Een mijlpaal',
        task: [
          'Klik in de takenlijst op **Voorbereiding**. Klik dan op *Start › Taken › Mijlpaal* en kies **Startmijlpaal**. Typ `Start bouw` en druk op Enter.',
        ],
        explain: [
          'Start bouw staat direct onder Voorbereiding, maar op hetzelfde niveau: hij kreeg WBS-nummer 2, en Fundering schoof door naar 3. In de Gantt is hij een ruit, en zijn duur is 0.',
          'Een mijlpaal is een moment, geen werk. Hij kost geen tijd, maar er hangt wel iets van af: hier het moment dat de aannemer begint. Een startmijlpaal hoort bij het begin van een werkdag, een eindmijlpaal bij het einde ervan.',
        ],
      },
      inspringen: {
        title: 'Inspringen',
        task: [
          'Start bouw hoort bij de voorbereiding. Laat hem geselecteerd en klik op *Planning › Structuur › Inspringen*.',
          'Met het toetsenbord gaat het sneller: klik op de regel in de takenlijst en druk op Alt+Shift+→.',
        ],
        explain: [
          'Start bouw heeft nu WBS-nummer 1.1 en staat ingesprongen onder Voorbereiding; Fundering is weer 2. Voorbereiding is vetgedrukt en heeft een pijltje om hem in te klappen.',
          'Voorbereiding is een *samenvattingstaak* geworden: een fase die zelf geen werk heeft, maar zijn begin en einde haalt uit de taken eronder. Daarom vul je bij een fase nooit zelf een duur in.',
        ],
      },
      voorbereiding: {
        title: 'De taken van de voorbereiding',
        task: [
          'Start bouw is nog geselecteerd. Klik op *Start › Taken › Taak*, typ de naam en druk op Enter. Klik daarna in **Eigenschappen** in het veld **Duur**, typ het aantal werkdagen en druk op Enter. Doe dat voor deze drie taken, in deze volgorde:',
          '- `Bouwplaats inrichten`, 2 werkdagen: hekken, keet en bouwstroom neerzetten.\n- `Tuin en bestrating verwijderen`, 1 werkdag: ruimte maken voor de aanbouw.\n- `Aanbouw uitzetten`, 1 werkdag: de maten van de aanbouw op de grond zetten.',
          'Tik je iets verkeerd, dan draait *Start › Bewerken › Ongedaan* (Ctrl+Z) je laatste handeling terug.',
        ],
        explain: [
          'De drie taken staan in Voorbereiding, als 1.2 tot en met 1.4. Inspringen hoefde niet meer: een nieuwe taak komt op hetzelfde niveau als de taak die geselecteerd was.',
          'Kijk naar de balk van Bouwplaats inrichten: die is nog 5 dagen lang, terwijl de duur 2 is. Onderaan in de statusbalk staat *Verouderd — herbereken (F5)*. Open Planner Studio rekent niet bij elke wijziging opnieuw; dat doe jij, met Bereken. Zo blijft de planning stil liggen terwijl je hem opbouwt. In de laatste stap reken je. (Staat de instelling *Automatisch berekenen* aan, dan rekent de app na elke wijziging zelf en zie je deze melding niet.)',
        ],
      },
      fundering: {
        title: 'De fundering',
        task: [
          'Klik in de takenlijst op **Fundering** en voeg met *Start › Taken › Taak* de eerste taak toe. Die komt naast de fase te staan, dus spring hem in, zoals in stap 4. Daarna gaat het zoals in stap 5:',
          '- `Funderingssleuf ontgraven`, 2 werkdagen.\n- `Wapening en bekisting fundering`, 3 werkdagen.\n- `Inspectie wapening`: een keuring, dus een mijlpaal. Kies *Start › Taken › Mijlpaal › Inspectiemoment (verplicht)*.\n- `Fundering storten`, 1 werkdag.\n- `Funderingsmetselwerk`, 2 werkdagen.\n- `Kanaalplaatvloer leggen`, 1 werkdag.',
        ],
        explain: [
          'Fundering heeft nu zes regels, 2.1 tot en met 2.6. Selecteer Inspectie wapening: in **Eigenschappen** is hij een eindmijlpaal met een vinkje bij **Verplicht (contractueel)**.',
          'Een keuring kost geen werk, maar het werk wacht erop: pas na de goedkeuring gaat het beton erin. Daarom is het een mijlpaal. Het vinkje Verplicht markeert hem als contractueel moment. Het bewaakt geen datum: dat doe je met een deadline, en die leer je in tutorial 3.',
        ],
      },
      ruwbouw: {
        title: 'De ruwbouw',
        task: [
          'Klik op **Ruwbouw**, voeg de eerste taak toe en spring hem in. Vul de fase daarna aan:',
          '- `Binnenspouwblad metselen`, 5 werkdagen.\n- `Buitenspouwblad metselen`, 6 werkdagen.\n- `Dakelementen plaatsen`, 1 werkdag.\n- `Dakbedekking aanbrengen`, 2 werkdagen.\n- `Kozijnen plaatsen`, 2 werkdagen.\n- `Achtergevel doorbreken`, 2 werkdagen.',
        ],
        explain: [
          'Ruwbouw heeft nu zes taken, 3.1 tot en met 3.6.',
          'De spouwmuur staat er als twee taken: het binnenblad draagt, het buitenblad is de gevel. Het zijn twee klussen met een eigen duur: het buitenblad kost hier een dag meer. Wat je apart wilt volgen, zet je als aparte taak in de planning.',
        ],
      },
      afbouw: {
        title: 'De afbouw en de oplevering',
        task: [
          'Klik op **Afbouw**, voeg de eerste taak toe en spring hem in. Vul de fase daarna aan:',
          '- `Installaties aanleggen`, 3 werkdagen.\n- `Stucwerk`, 4 werkdagen.\n- `Dekvloer aanbrengen`, 1 werkdag.\n- `Tegelwerk`, 3 werkdagen.\n- `Schilderwerk`, 3 werkdagen.\n- `Opleverpunten en schoonmaken`, 1 werkdag.\n- `Oplevering`: het eindpunt, dus een mijlpaal. Kies *Start › Taken › Mijlpaal › Eindmijlpaal*.',
        ],
        explain: [
          'De WBS is compleet: vier fasen, twintig taken en drie mijlpalen. Onderaan in de statusbalk staat *Taken: 23* en *Mijlpalen: 3*: de twintig taken plus de drie mijlpalen. De fasen telt de app niet mee.',
          'Oplevering is een eindmijlpaal: het moment dat het laatste werk klaar is en de aanbouw wordt overgedragen. Die datum wil de opdrachtgever weten, en die ga je in de volgende tutorials steeds scherper krijgen.',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Klik op *Start › Planning › Bereken*, of druk op F5.',
        ],
        explain: [
          'De melding Verouderd is weg en de balken kloppen: Bouwplaats inrichten is 2 dagen lang, en elke fase loopt van het vroegste begin tot het laatste einde van zijn taken.',
          'Maar kijk waar alles begint: elke taak start op maandag 7 juni 2027, de startdatum van het project. De app weet nog niet dat je eerst moet ontgraven voordat je kunt storten. Het einde van de planning is daardoor het einde van de langste taak: Buitenspouwblad metselen, 6 werkdagen, klaar op maandag 14 juni. Het weekend telt niet mee. De statusbalk zegt het ook: *Kritiek pad: 1 taak, 6 werkdagen* en *Einde: 14-06-2027*.',
          'Buitenspouwblad metselen is rood: hij is kritiek, want loopt hij uit, dan schuift het einde mee. Achter de andere taken loopt een groene band. Dat is hun speling: zo ver kunnen ze uitlopen voordat het einde verschuift.',
          'En de Oplevering staat op 7 juni, de eerste dag. Dat klopt natuurlijk niet. In tutorial 2 leg je relaties tussen de taken; dan krijg je een echte einddatum.',
        ],
      },
    },
  },
  en: {
    title: 'Your first schedule',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Your first schedule',
      '## What you build',
      'You make the schedule for a house extension: a 4 by 5 metre extension at the rear of a family home. That project runs through all seven tutorials. In this first tutorial you set up the skeleton: a new project, four phases, twenty tasks with a duration and three milestones.',
      'At the end every task sits in its phase and the app has calculated for the first time. You will see straight away why a list of tasks is not yet a schedule: without relationships everything starts on the same day.',
      '## Starting point',
      'This is the first tutorial. All you need is Open Planner Studio; you start with an empty project.',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 1* on the ribbon. A panel appears at the bottom right with one task at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you.',
      'Want to skip the window of step 1? [Open the starting project](project://projects/en/start-tut-1.ifc) instead. It is the same empty project.',
    ],
    outro: [
      '## What you have learned',
      '- **A project starts with a start date and a calendar.** Without relationships every task starts on the start date, and the calendar decides which days are working days.',
      '- **You make phases by indenting.** A phase then becomes a summary task: its start and finish follow from its tasks, so you can see per phase how long it takes.',
      '- **A milestone is a moment without duration.** It marks something the work waits for: the start, an inspection, the handover.',
      '- **By default you calculate yourself, with Calculate (F5).** Only then are the bars right; until then the status bar says the schedule is out of date.',
      '- **Without relationships a schedule is a list.** Everything starts at once and the longest task sets the finish. That is why you fix the order in tutorial 2.',
      'Why you break a project down like this, and how finely, is explained in [Planning well](docs://gids-goed-plannen#the-breakdown-phases-work-packages-tasks).',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-1.ifc).',
    ],
    steps: {
      'nieuw-project': {
        title: 'A new project',
        task: [
          'Click *Home › File › New*. In the **New project** window, fill in:',
          '- **Project Name**: `House extension`\n- **Start Date**: `07-06-2027` (day, month, year), Monday 7 June 2027\n- **Country**: Netherlands, and for **Construction holiday**: None',
          'Click **Create**.',
        ],
        explain: [
          'At the top there is now a tab called House extension, with an empty task list.',
          'The start date is the anchor of your schedule. As long as a task has no predecessor, it starts on this day. So choose it deliberately: the day the contractor starts on site.',
          'With the Netherlands, the project gets a calendar with the Dutch public holidays from 2026 up to and including 2030. Below Construction holiday, the window showed the line *36 holidays, 2026–2030*; expand it to see which days they are. Nobody works on those days, so the app does not count them as working days. Leave out the construction holiday for now. You add it to the calendar yourself in tutorial 3, so you can see what it does to the finish date.',
        ],
      },
      fasen: {
        title: 'The phases',
        task: [
          'Click *Home › Tasks › Task*. A new task appears, and on the right in **Properties** its name is already selected. Type `Preparation` and press Enter.',
          'Do the same for `Foundations`, `Shell` and `Finishing`. A new task always goes below the selected task, so the phases end up in order by themselves.',
        ],
        explain: [
          'The timeline has jumped to June 2027, to your first task. The task list shows four rows with the WBS numbers 1 to 4. WBS stands for *work breakdown structure*: how the work is divided up. For now each phase has a bar of 5 days, the default duration of a new task.',
          'Why phases first? You can keep track of twenty tasks, but not of three hundred. With phases you see per phase when it starts and finishes, and you collapse what you do not need for a while. In a moment you put the tasks inside the phases; then those 5 days no longer count.',
        ],
      },
      mijlpaal: {
        title: 'A milestone',
        task: [
          'Click **Preparation** in the task list. Then click *Home › Tasks › Milestone* and choose **Start milestone**. Type `Start of construction` and press Enter.',
        ],
        explain: [
          'Start of construction sits directly below Preparation, but at the same level: it got WBS number 2, and Foundations moved on to 3. In the Gantt it is a diamond, and its duration is 0.',
          'A milestone is a moment, not work. It takes no time, but something depends on it: here the moment the contractor starts. A start milestone belongs to the start of a working day, a finish milestone to its end.',
        ],
      },
      inspringen: {
        title: 'Indenting',
        task: [
          'Start of construction belongs to the preparation. Keep it selected and click *Planning › Structure › Indent*.',
          'The keyboard is faster: click the row in the task list and press Alt+Shift+→.',
        ],
        explain: [
          'Start of construction now has WBS number 1.1 and is indented below Preparation; Foundations is 2 again. Preparation is in bold and has an arrow to collapse it.',
          'Preparation has become a *summary task*: a phase that has no work of its own, but takes its start and finish from the tasks below it. That is why you never enter a duration for a phase yourself.',
        ],
      },
      voorbereiding: {
        title: 'The preparation tasks',
        task: [
          'Start of construction is still selected. Click *Home › Tasks › Task*, type the name and press Enter. Then click the **Duration** field in **Properties**, type the number of working days and press Enter. Do this for these three tasks, in this order:',
          '- `Set up site`, 2 working days: fences, site hut and site power.\n- `Clear garden and paving`, 1 working day: making room for the extension.\n- `Set out the extension`, 1 working day: marking the extension out on the ground.',
          'Made a typo? *Home › Edit › Undo* (Ctrl+Z) reverses your last action.',
        ],
        explain: [
          'The three tasks are in Preparation, as 1.2 to 1.4. No indenting needed this time: a new task goes on the same level as the task that was selected.',
          'Look at the bar of Set up site: it is still 5 days long, while the duration is 2. At the bottom, the status bar says *Out of date — recalculate (F5)*. Open Planner Studio does not recalculate after every change; you do that, with Calculate. That way the schedule stays still while you build it. You calculate in the last step. (If the setting *Calculate automatically* is on, the app recalculates after every change by itself and you will not see this message.)',
        ],
      },
      fundering: {
        title: 'The foundations',
        task: [
          'Click **Foundations** in the task list and add the first task with *Home › Tasks › Task*. It lands next to the phase, so indent it, as in step 4. After that it goes as in step 5:',
          '- `Excavate foundation trench`, 2 working days.\n- `Foundation formwork and reinforcement`, 3 working days.\n- `Reinforcement inspection`: an inspection, so a milestone. Choose *Home › Tasks › Milestone › Inspection point (mandatory)*.\n- `Pour foundation`, 1 working day.\n- `Foundation brickwork`, 2 working days.\n- `Lay hollow-core floor`, 1 working day.',
        ],
        explain: [
          'Foundations now has six rows, 2.1 to 2.6. Select Reinforcement inspection: in **Properties** it is a finish milestone with a tick at **Mandatory (contractual)**.',
          'An inspection takes no work, but the work waits for it: only after approval does the concrete go in. That is why it is a milestone. The Mandatory tick marks it as a contractual moment. It does not guard a date: you do that with a deadline, which you learn in tutorial 3.',
        ],
      },
      ruwbouw: {
        title: 'The shell',
        task: [
          'Click **Shell**, add the first task and indent it. Then fill in the phase:',
          '- `Build inner cavity leaf`, 5 working days.\n- `Build outer cavity leaf`, 6 working days.\n- `Place roof elements`, 1 working day.\n- `Apply roofing`, 2 working days.\n- `Install window frames`, 2 working days.\n- `Break through rear wall`, 2 working days.',
        ],
        explain: [
          'Shell now has six tasks, 3.1 to 3.6.',
          'The cavity wall is there as two tasks: the inner leaf carries the load, the outer leaf is the facade. They are two jobs with their own duration: here the outer leaf takes one day longer. Whatever you want to track separately, you put in the schedule as a separate task.',
        ],
      },
      afbouw: {
        title: 'Finishing and handover',
        task: [
          'Click **Finishing**, add the first task and indent it. Then fill in the phase:',
          '- `Install building services`, 3 working days.\n- `Plastering`, 4 working days.\n- `Lay floor screed`, 1 working day.\n- `Tiling`, 3 working days.\n- `Painting`, 3 working days.\n- `Snagging and cleaning`, 1 working day.\n- `Handover`: the end point, so a milestone. Choose *Home › Tasks › Milestone › Finish milestone*.',
        ],
        explain: [
          'The WBS is complete: four phases, twenty tasks and three milestones. At the bottom, the status bar says *Tasks: 23* and *Milestones: 3*: the twenty tasks plus the three milestones. The app does not count the phases.',
          'Handover is a finish milestone: the moment the last work is done and the extension is handed over. That is the date the client wants to know, and over the next tutorials you will pin it down ever more precisely.',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Click *Home › Schedule › Calculate*, or press F5.',
        ],
        explain: [
          'The out-of-date message is gone and the bars are right: Set up site is 2 days long, and each phase runs from the earliest start to the latest finish of its tasks.',
          'But look where everything starts: every task starts on Monday 7 June 2027, the start date of the project. The app does not know yet that you have to excavate before you can pour. So the end of the schedule is the end of the longest task: Build outer cavity leaf, 6 working days, finished on Monday 14 June. The weekend does not count. The status bar says so too: *Critical path: 1 task, 6 work days* and *End: 14-06-2027*.',
          'Build outer cavity leaf is red: it is critical, because if it runs late, the finish moves with it. Behind the other tasks runs a green band. That is their float: how far they can run late before the finish moves.',
          'And Handover sits on 7 June, the first day. That is obviously wrong. In tutorial 2 you add relationships between the tasks; then you get a real finish date.',
        ],
      },
    },
  },
};

// ── De stappen: tekst + anker + controle + Toon mij + Opnieuw ─────────────────────────────────

const STEP_ORDER = [
  'nieuw-project', 'fasen', 'mijlpaal', 'inspringen', 'voorbereiding', 'fundering', 'ruwbouw', 'afbouw', 'berekenen',
];

/** Stapdefinitie zonder tekst. `reset` = de stand waarmee Opnieuw de stap opnieuw begint. */
const STEP_LOGIC = {
  'nieuw-project': {
    anchor: 'ribbon:start:new',
    check: isTutorialProject,
    prepare: ensureProject,
  },
  fasen: {
    anchor: 'ribbon:start:addTask',
    check: phasesDone,
    prepare: api => prepareUpTo(api, 'fasen'),
    reset: 'start-tut-1',
  },
  mijlpaal: {
    anchor: 'ribbon:start:milestone',
    check: startMilestoneAdded,
    prepare: api => prepareUpTo(api, 'mijlpaal'),
  },
  inspringen: {
    anchor: 'ribbon:planning:indent',
    check: startMilestoneIndented,
    prepare: api => prepareUpTo(api, 'inspringen'),
  },
  voorbereiding: {
    anchor: 'ribbon:start:addTask',
    check: api => phaseDone(api, PHASE.voorbereiding),
    prepare: api => prepareUpTo(api, 'voorbereiding'),
  },
  fundering: {
    anchor: 'ribbon:start:addTask',
    check: api => phaseDone(api, PHASE.fundering),
    prepare: api => prepareUpTo(api, 'fundering'),
  },
  ruwbouw: {
    anchor: 'ribbon:start:addTask',
    check: api => phaseDone(api, PHASE.ruwbouw),
    prepare: api => prepareUpTo(api, 'ruwbouw'),
  },
  afbouw: {
    anchor: 'ribbon:start:addTask',
    check: api => phaseDone(api, PHASE.afbouw),
    prepare: api => prepareUpTo(api, 'afbouw'),
  },
  berekenen: {
    anchor: 'ribbon:start:calc',
    check: api => calculatedSignature !== null && calculatedSignature === scheduleSignature(api)
      && isTutorialProject(api) && PHASES.every(p => phaseDone(api, p)),
    prepare: async (api) => {
      await prepareUpTo(api, 'afbouw');
      api.data.recalculate();
    },
  },
};

const para = lines => lines.join('\n\n');

/** Paneeltekst van een stap: titel + opdracht, `---`, uitleg. */
function stepBody(lang, key) {
  const t = TEXT[lang];
  const s = t.steps[key];
  return `**${s.title}**\n\n${para(s.task)}\n\n---\n\n${t.whatLabel}\n\n${para(s.explain)}`;
}

/** Leesversie: dezelfde stappen, als artikel. */
function articleBody(lang) {
  const t = TEXT[lang];
  const stepWord = lang === 'nl' ? 'Stap' : 'Step';
  const steps = STEP_ORDER.map((key, i) => {
    const s = t.steps[key];
    return `## ${stepWord} ${i + 1} — ${s.title}\n\n${para(s.task)}\n\n${t.whatLabel}\n\n${para(s.explain)}`;
  });
  return [para(t.intro), ...steps, para(t.outro)].join('\n\n');
}

function buildGuide() {
  const lang = uiLang();
  return {
    id: 'tut-1-eerste-planning',
    title: { nl: TEXT.nl.title, en: TEXT.en.title },
    steps: STEP_ORDER.map((key) => {
      const logic = STEP_LOGIC[key];
      return {
        id: key,
        body: { nl: stepBody('nl', key), en: stepBody('en', key) },
        anchor: logic.anchor,
        check: logic.check,
        prepare: logic.prepare,
        ...(logic.reset ? { resetAsset: projectAsset(lang, logic.reset) } : {}),
      };
    }),
  };
}

module.exports = {
  onLoad(api) {
    api.help.registerArticles([{
      id: 'tut-1-eerste-planning',
      kind: 'tutorial',
      order: 1,
      title: { nl: TEXT.nl.title, en: TEXT.en.title },
      body: { nl: articleBody('nl'), en: articleBody('en') },
    }]);

    // "Tutorial" en "Tutorials" zijn in het Nederlands en het Engels hetzelfde woord; het label van
    // een extensieknop is één tekst en vertaalt niet mee met de app.
    api.ui.addRibbonButton({
      tab: 'start',
      group: 'Tutorials',
      label: 'Tutorial 1',
      icon: "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 10 12 5 2 10l10 5 10-5z'/><path d='M6 12v5c3 3 9 3 12 0v-5'/></svg>",
      onClick: () => api.help.startGuide(buildGuide()),
    });

    api.events.on(sdk.hostEvents.scheduleCalculated, (data) => {
      calculatedSignature = data && data.hasError ? null : scheduleSignature(api);
    });
  },

  onUnload() {
    // De host ruimt artikelen, knop, begeleiding en event-abonnement zelf op.
    calculatedSignature = null;
  },
};
