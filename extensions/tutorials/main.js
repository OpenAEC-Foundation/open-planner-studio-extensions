/**
 * Tutorials voor Open Planner Studio — tutorial 1 "Je eerste planning", tutorial 2 "Relaties en het
 * kritieke pad" en tutorial 3 "De kalender en datumafspraken" (contract 1.4.0, permissies `help`,
 * `ribbon` en `events`).
 *
 * Wat deze extensie doet:
 *   • api.help.registerArticles(...)  → de leesversies van de tutorials in Help › Tutorials;
 *   • api.ui.addRibbonButton(...)     → Start › Tutorials › "Tutorial 1", "Tutorial 2", "Tutorial 3"
 *                                       starten de begeleiding (permissie "ribbon"; een Help-artikel
 *                                       kan zelf geen begeleiding starten, alleen een `project://`-
 *                                       bestand openen);
 *   • api.help.startGuide(...)        → het begeleidingspaneel, met per stap een controle op de
 *                                       documenttoestand, "Toon mij" en waar zinvol "Opnieuw";
 *   • api.events.on(...)              → stappen die rekenen herkennen een berekening via
 *                                       `host:schedule-calculated` (permissie "events"), en
 *                                       `host:tutorial-requested` start een tutorial wanneer de app
 *                                       erom vraagt ("Ja" op de tutorialvraag na de eerste
 *                                       voltooide rondleiding).
 *
 * Leesversie en paneel gebruiken DEZELFDE tekst: elke stap heeft een titel, een opdracht en een uitleg
 * ("wat je nu ziet, en waarom"); het artikel en de paneelstappen worden hieronder uit die ene bron
 * samengesteld. De extensielader kent één bestand (`require()` geeft alleen `open-planner-studio`
 * terug), dus dit bestand heeft duidelijke secties: het project en het lezen van de documenttoestand;
 * tutorial 1 (Toon mij); de logica van tutorial 2 en 3; de drie teksten; de stappen en `onLoad`.
 *
 * De projectbestanden in `projects/<taal>/` zijn GEGENEREERD, niet met de hand gemaakt: in een
 * checkout van de app `npm run gen:tutorial-project -- --out <map>` en daarna `start-tut-1.ifc`,
 * `na-tut-1.ifc`, `na-tut-2.ifc`, `tussen-tut-3-bouwvak.ifc` en `na-tut-3.ifc` per taal hierheen kopiëren. De getallen in de tekst
 * komen uit die standen (zie README.md voor de tabel): tutorial 1 uit `na-tut-1` (7 juni 2027, 14 juni,
 * Buitenspouwblad metselen als enige kritieke taak), tutorial 2 uit `na-tut-2` (6 augustus 2027, 21
 * taken, 45 werkdagen, 2 werkdagen speling), tutorial 3 uit `tussen-tut-3-bouwvak` (27 augustus 2027)
 * en `na-tut-3` (1 september 2027, 8 taken, 48 werkdagen).
 */

const sdk = require('open-planner-studio');

/** Het id uit `manifest.json`: een host-verzoek voor een andere extensie negeren we. */
const EXTENSION_ID = 'tutorials';
/** Id van tutorial 1: het Help-artikel én de begeleiding. */
const TUTORIAL_1_ID = 'tut-1-eerste-planning';
/** Id van tutorial 2. */
const TUTORIAL_2_ID = 'tut-2-relaties-kritiek-pad';
/** Id van tutorial 3. */
const TUTORIAL_3_ID = 'tut-3-kalender';

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
      { key: 'msStart', name: { nl: 'Start bouw', en: 'Start of construction' }, milestone: 'START' },
      { key: 'site', name: { nl: 'Bouwplaats inrichten', en: 'Set up site' }, days: 2 },
      { key: 'garden', name: { nl: 'Tuin en bestrating verwijderen', en: 'Clear garden and paving' }, days: 1 },
      { key: 'setout', name: { nl: 'Aanbouw uitzetten', en: 'Set out the extension' }, days: 1 },
    ],
  },
  {
    key: 'fundering',
    name: { nl: 'Fundering', en: 'Foundations' },
    items: [
      { key: 'excavate', name: { nl: 'Funderingssleuf ontgraven', en: 'Excavate foundation trench' }, days: 2 },
      { key: 'rebar', name: { nl: 'Wapening en bekisting fundering', en: 'Foundation formwork and reinforcement' }, days: 3 },
      { key: 'inspection', name: { nl: 'Inspectie wapening', en: 'Reinforcement inspection' }, milestone: 'FINISH', mandatory: true },
      { key: 'pour', name: { nl: 'Fundering storten', en: 'Pour foundation' }, days: 1 },
      { key: 'foundBrick', name: { nl: 'Funderingsmetselwerk', en: 'Foundation brickwork' }, days: 2 },
      { key: 'floor', name: { nl: 'Kanaalplaatvloer leggen', en: 'Lay hollow-core floor' }, days: 1 },
    ],
  },
  {
    key: 'ruwbouw',
    name: { nl: 'Ruwbouw', en: 'Shell' },
    items: [
      { key: 'innerLeaf', name: { nl: 'Binnenspouwblad metselen', en: 'Build inner cavity leaf' }, days: 5 },
      { key: 'outerLeaf', name: { nl: 'Buitenspouwblad metselen', en: 'Build outer cavity leaf' }, days: 6 },
      { key: 'roofElements', name: { nl: 'Dakelementen plaatsen', en: 'Place roof elements' }, days: 1 },
      { key: 'roofing', name: { nl: 'Dakbedekking aanbrengen', en: 'Apply roofing' }, days: 2 },
      { key: 'frames', name: { nl: 'Kozijnen plaatsen', en: 'Install window frames' }, days: 2 },
      { key: 'breakThrough', name: { nl: 'Achtergevel doorbreken', en: 'Break through rear wall' }, days: 2 },
    ],
  },
  {
    key: 'afbouw',
    name: { nl: 'Afbouw', en: 'Finishing' },
    items: [
      { key: 'services', name: { nl: 'Installaties aanleggen', en: 'Install building services' }, days: 3 },
      { key: 'plaster', name: { nl: 'Stucwerk', en: 'Plastering' }, days: 4 },
      { key: 'screed', name: { nl: 'Dekvloer aanbrengen', en: 'Lay floor screed' }, days: 1 },
      { key: 'tiling', name: { nl: 'Tegelwerk', en: 'Tiling' }, days: 3 },
      { key: 'painting', name: { nl: 'Schilderwerk', en: 'Painting' }, days: 3 },
      { key: 'cleaning', name: { nl: 'Opleverpunten en schoonmaken', en: 'Snagging and cleaning' }, days: 1 },
      { key: 'msHandover', name: { nl: 'Oplevering', en: 'Handover' }, milestone: 'FINISH' },
    ],
  },
];
const PHASE = Object.fromEntries(PHASES.map(p => [p.key, p]));
const START_MILESTONE = PHASE.voorbereiding.items[0];
/** Alle taken (uit alle fasen) op sleutel, voor de relaties van tutorial 2. */
const ITEM = Object.fromEntries(PHASES.flatMap(p => p.items.map(item => [item.key, item])));

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

/** Staan de vier fasen op het hoogste niveau? Alleen aanwezigheid: de volgorde van fasen kan Toon
 *  mij via de API niet herstellen, en een check die hij niet kan halen zou de stap laten vastlopen. */
function phasesDone(api) {
  const tasks = api.data.getTasks();
  return PHASES.every(p => !!findPhase(tasks, p));
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

// ── Tutorial 1, Toon mij: de stap (en wat eraan voorafgaat) klaarzetten ──────────────────────
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
  // Zoals met de hand: de knop Taak maakt een taak van 5 dagen, daarna typt de lezer de duur. Tot
  // Bereken blijft de balk dus 5 dagen lang; Toon mij geeft hetzelfde beeld als de uitleg beschrijft.
  return {
    name: item.name[lang],
    parentId,
    time: { ...sdk.factory.createTaskTime(START_DATE, 5), scheduleDuration: item.days },
  };
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

// ── Bereken herkennen: een berekening van precies deze planning (alle tutorials) ─────────────

/** Vingerafdruk van wat de berekening beïnvloedt (niet van de rekenuitkomst zelf): de taken (duur,
 *  constraint, deadline), de relaties (soort en lag) en de kalender (werkdagen en vrije dagen). */
function scheduleSignature(api) {
  const tasks = api.data.getTasks().map(t => [
    t.id, t.parentId || '', t.isMilestone ? 1 : 0, t.milestoneKind || '', t.time.scheduleDuration, t.time.durationUnit || '',
    t.constraint ? [t.constraint.type, t.constraint.date || '', t.constraint.hard ? 1 : 0] : '', t.deadline || '',
  ]);
  const sequences = api.data.getSequences().map(s => [
    s.predecessorId, s.successorId, s.type, s.lagDays, s.lagMinutes === undefined ? '' : s.lagMinutes, s.lagUnit || '',
    s.lagPercent === undefined ? '' : s.lagPercent,
  ]);
  const calendar = api.data.getCalendar();
  return JSON.stringify([
    api.data.getProject().id, sequences, tasks,
    [calendar.workDays, calendar.holidays.map(h => [h.startDate, h.endDate])],
  ]);
}
let calculatedSignature = null;

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TUTORIAL 2 EN 3 — de logica: relaties, kalender en datumafspraken
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// Beide tutorials werken op het project van tutorial 1 (`na-tut-1`, later `na-tut-2`). De getallen in
// de tekst (6 augustus 2027, 21 taken, 45 werkdagen, 27 augustus, 1 september, …) komen uit de standen
// `na-tut-2`, `tussen-tut-3-bouwvak` en `na-tut-3` van de generator (zie README).

// ── De relaties van tutorial 2 ───────────────────────────────────────────────────────────────

/** Eén Eind-Start-relatie tussen twee taken (sleutels uit PHASES), met een lag in werkdagen. Gelijk
 *  aan `LINKS` in `scripts/tutorial-project.ts` van de app. */
const link = (pred, succ, lag = 0) => ({ pred, succ, lag });

/** De relaties per stap van tutorial 2, in de volgorde waarin de lezer ze legt. */
const LINK_GROUPS = {
  eerste: [link('msStart', 'site')],
  tekenen: [link('site', 'garden'), link('garden', 'setout')],
  fundering: [
    link('setout', 'excavate'), link('excavate', 'rebar'), link('rebar', 'inspection'), link('inspection', 'pour'),
  ],
  lag: [link('pour', 'foundBrick', 3)], // beton laten uitharden
  ruwbouw: [
    link('foundBrick', 'floor'), link('floor', 'innerLeaf'), link('floor', 'outerLeaf'),
    link('innerLeaf', 'roofElements'), link('roofElements', 'roofing'), link('roofing', 'frames'),
    link('outerLeaf', 'frames'), link('frames', 'breakThrough'),
  ],
  afbouw: [
    link('breakThrough', 'services'), link('services', 'plaster'), link('plaster', 'screed'),
    link('plaster', 'painting'), link('screed', 'tiling', 5), // dekvloer laten drogen
    link('tiling', 'cleaning'), link('painting', 'cleaning'), link('cleaning', 'msHandover'),
  ],
};
const LINK_ORDER = ['eerste', 'tekenen', 'fundering', 'lag', 'ruwbouw', 'afbouw'];
/** Alle relaties t/m en met groep `group`. */
const linksUpTo = group => LINK_ORDER.slice(0, LINK_ORDER.indexOf(group) + 1).flatMap(g => LINK_GROUPS[g]);
const ALL_LINKS = linksUpTo('afbouw');

/** De duur van het buitenspouwblad in de what-if van tutorial 2: gewoon 6 werkdagen, en 9 als het uitloopt. */
const OUTER_LEAF_DAYS = { normal: 6, late: 9 };

const taskByKey = (api, key, tasks = api.data.getTasks()) => tasks.find(t => hasName(t, ITEM[key].name));

/** Is dit precies de relatie uit de tutorial: Eind-Start met de gevraagde lag in werkdagen? */
const linkMatches = (s, l) => s.type === 'FINISH_START' && s.lagDays === l.lag
  && (!s.lagUnit || s.lagUnit === 'WORKTIME') && (s.lagPercent === undefined || s.lagPercent === null)
  && (s.lagMinutes === undefined || s.lagMinutes === null);

/** Bestaat de relatie `l` (tussen dit paar taken) precies zoals bedoeld? */
function hasLink(api, l, tasks = api.data.getTasks(), seqs = api.data.getSequences()) {
  const a = taskByKey(api, l.pred, tasks);
  const b = taskByKey(api, l.succ, tasks);
  return !!a && !!b && seqs.some(s => s.predecessorId === a.id && s.successorId === b.id && linkMatches(s, l));
}

/** Staan alle relaties uit `links` er, zoals bedoeld? Extra relaties tellen niet mee: die kan Toon mij
 *  niet weghalen (de API kent geen relatie verwijderen), dus ze mogen een stap niet blokkeren. */
function linksDone(api, links) {
  const tasks = api.data.getTasks();
  const seqs = api.data.getSequences();
  return links.every(l => hasLink(api, l, tasks, seqs));
}

/** Bestaat er al een relatie tussen een paar uit `links`, maar anders dan bedoeld: een verkeerde soort
 *  of lag, of omgekeerd (opvolger → voorganger; die zou met de gewenste relatie een kring geven)? Zo'n
 *  relatie kan Toon mij niet corrigeren: de API kent geen relatie wijzigen of verwijderen. */
function linksConflict(api, links) {
  const tasks = api.data.getTasks();
  const seqs = api.data.getSequences();
  return links.some((l) => {
    const a = taskByKey(api, l.pred, tasks);
    const b = taskByKey(api, l.succ, tasks);
    if (!a || !b) return false;
    return seqs.some(s => (s.predecessorId === a.id && s.successorId === b.id && !linkMatches(s, l))
      || (s.predecessorId === b.id && s.successorId === a.id));
  });
}

/** Staan alle taken van tutorial 1 (op naam) in het project? Duur en vorm tellen hier niet: in de
 *  what-if van tutorial 2 verandert de duur van het buitenspouwblad, en dat is geen reden om het
 *  project af te keuren. */
const tasksPresent = api => isTutorialProject(api)
  && Object.keys(ITEM).every(key => !!taskByKey(api, key));

/** Berekend? De laatste berekening (`host:schedule-calculated`) is er een van precies deze planning. */
const isCalculated = api => calculatedSignature !== null && calculatedSignature === scheduleSignature(api);

/** Toon mij: leg de relaties t/m `group` (en het project waar ze bij horen) klaar. Cumulatief en
 *  herhaalbaar: wat er al goed staat, blijft. Kan een bestaande relatie niet kloppen (andere soort of
 *  lag) of ontbreekt het project, dan begint Toon mij opnieuw vanaf het resultaat van tutorial 1, als
 *  nieuw document, en legt daar alles neer. */
async function ensureLinks(api, group) {
  const links = linksUpTo(group);
  const addMissing = () => api.data.batch(() => {
    const tasks = api.data.getTasks();
    const seqs = api.data.getSequences();
    for (const l of links) {
      if (hasLink(api, l, tasks, seqs)) continue;
      // `addSequence` geeft `null` als de app de relatie weigert (kring, dubbel).
      api.data.addSequence({
        predecessorId: taskByKey(api, l.pred, tasks).id,
        successorId: taskByKey(api, l.succ, tasks).id,
        type: 'FINISH_START',
        lagDays: l.lag,
      });
    }
  });
  const fresh = () => api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-1'));
  if (!tasksPresent(api) || linksConflict(api, links)) await fresh();
  addMissing();
  // Weigerde de app er één (bijvoorbeeld een kring via een omgekeerde relatie die hierboven niet als
  // conflict herkend werd), begin dan alsnog opnieuw vanaf het resultaat van de vorige tutorial.
  if (!linksDone(api, links)) {
    await fresh();
    addMissing();
  }
}

const outerLeafDays = api => {
  const t = taskByKey(api, 'outerLeaf');
  return t && t.time.durationUnit !== 'hours' ? t.time.scheduleDuration : null;
};

function setOuterLeafDays(api, days) {
  const t = taskByKey(api, 'outerLeaf');
  if (t && outerLeafDays(api) !== days) {
    api.data.updateTask(t.id, { time: { scheduleDuration: days, durationUnit: 'days' } });
  }
}

/** Tutorial 2, stap 8: alle relaties, het buitenspouwblad op 6 werkdagen en berekend. */
const networkCalculated = api => linksDone(api, ALL_LINKS) && outerLeafDays(api) === OUTER_LEAF_DAYS.normal && isCalculated(api);

// ── De datumafspraken van tutorial 3 ──────────────────────────────────────────────────────────

/** Bouwvakregio Midden 2027: maandag 2 t/m vrijdag 20 augustus (advies van Bouwend Nederland). */
const BOUWVAK = { start: '2027-08-02', end: '2027-08-20' };
/** De constraint: de kozijnen worden pas op woensdag 14 juli geleverd (Start niet eerder dan). */
const CONSTRAINT = { task: 'frames', type: 'SNET', date: '2027-07-14' };
/** De deadline op de oplevering: eerst haalbaar (vr 10 september), dan te krap (vr 27 augustus). */
const DEADLINE = { task: 'msHandover', ok: '2027-09-10', tight: '2027-08-27' };

const dayOf = iso => String(iso || '').slice(0, 10);

/** Staat de bouwvak (Midden 2027) in de projectkalender? */
const hasBouwvak = api => api.data.getCalendar().holidays
  .some(h => dayOf(h.startDate) === BOUWVAK.start && dayOf(h.endDate) === BOUWVAK.end);

/** De relaties van tutorial 2 én de bouwvak: het project zoals tutorial 3 het na stap 1 nodig heeft. */
const withBouwvak = api => tasksPresent(api) && linksDone(api, ALL_LINKS) && hasBouwvak(api);

const constraintSet = (api) => {
  const t = taskByKey(api, CONSTRAINT.task);
  return !!t && !!t.constraint && t.constraint.type === CONSTRAINT.type && !t.constraint.hard
    && dayOf(t.constraint.date) === CONSTRAINT.date;
};

const deadlineIs = (api, date) => {
  const t = taskByKey(api, DEADLINE.task);
  return !!t && dayOf(t.deadline) === date;
};

/** Toon mij, tutorial 3: het project mét bouwvak. De API kan de kalender niet wijzigen; daarom opent
 *  Toon mij het meegeleverde project waarin de bouwvak al staat (als nieuw document). */
async function ensureBouwvak(api) {
  if (withBouwvak(api)) return;
  await api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-3-bouwvak'));
}

async function ensureConstraint(api) {
  await ensureBouwvak(api);
  if (!constraintSet(api)) {
    api.data.updateTask(taskByKey(api, CONSTRAINT.task).id, { constraint: { type: CONSTRAINT.type, date: CONSTRAINT.date } });
  }
}

async function ensureDeadline(api, date) {
  await ensureConstraint(api);
  if (!deadlineIs(api, date)) api.data.updateTask(taskByKey(api, DEADLINE.task).id, { deadline: date });
}

/** De stand waarin een stap van tutorial 3 berekend is. */
const constraintCalculated = api => withBouwvak(api) && constraintSet(api) && isCalculated(api);
const deadlineCalculated = (api, date) => constraintCalculated(api) && deadlineIs(api, date);

// ── Tutorial 1: Je eerste planning — de tekst, één bron voor Help-artikel en paneel ────────────

const TEXT_1 = {
  nl: {
    title: 'Je eerste planning',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Je eerste planning',
      '## Wat je bouwt',
      'Je maakt de planning voor een aanbouw: een uitbouw van 4 bij 5 meter aan de achtergevel van een eengezinswoning. Dat project loopt door alle zeven tutorials heen. In deze eerste tutorial zet je het geraamte neer: een nieuw project, vier fasen, twintig taken met een duur en drie mijlpalen.',
      'Aan het eind staan alle taken in hun fase en heeft de app voor het eerst gerekend. Je ziet dan meteen waarom een lijst taken nog geen planning is: zonder relaties, de afspraken welke taak op welke wacht, begint alles op dezelfde dag.',
      '## Uitgangspunt',
      'Dit is de eerste tutorial. Je hebt alleen Open Planner Studio nodig; je begint met een leeg project.',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 1*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar.',
      'Wil je het venster van stap 1 overslaan? [Open dan het startproject](project://projects/nl/start-tut-1.ifc). Dat is hetzelfde project als na stap 1.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een project begint met een startdatum en een kalender.** Zonder relaties begint elke taak op de startdatum, en de kalender bepaalt welke dagen werkdagen zijn.',
      '- **Fasen maak je met inspringen.** Een fase wordt dan een samenvattingstaak: begin en einde volgen uit zijn taken, dus je ziet per fase hoe lang hij duurt.',
      '- **Een mijlpaal is een moment zonder duur.** Hij markeert iets waar het werk op wacht: de start, een keuring, de oplevering.',
      '- **Standaard reken je zelf, met Bereken (F5).** Pas daarna kloppen de balken; tot die tijd meldt de statusbalk dat de planning verouderd is.',
      '- **Zonder relaties is een planning een lijst.** Alles begint tegelijk en de langste taak bepaalt het einde. Daarom leg je in tutorial 2 de volgorde vast.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-1.ifc).',
    ],
    steps: {
      'nieuw-project': {
        title: 'Een nieuw project',
        task: [
          'Klik op *Start › Bestand › Nieuw*. Vul in het venster **Nieuw project** in:',
          '- **Projectnaam**: `Aanbouw woning`\n- **Startdatum**: `07-06-2027`, maandag 7 juni 2027\n- **Land**: Nederland, en bij **Bouwvak**: Geen',
          'Onder **Bouwvak** staat nu de regel *36 feestdagen, 2026–2030*; klap hem open als je wilt zien welke dagen het zijn.',
          'Klik op **Aanmaken**.',
        ],
        explain: [
          'Onder het lint staat nu een tabblad Aanbouw woning, met een lege takenlijst.',
          'De startdatum is het anker van je planning. Zolang een taak geen voorganger heeft, een taak die eerst klaar moet zijn, begint hij op deze dag. Kies hem dus bewust: de dag dat de aannemer op de bouwplaats begint.',
          'Met Nederland krijgt het project een kalender met de Nederlandse feestdagen: de 36 dagen uit die regel, van 2026 tot en met 2030. Op die dagen wordt niet gewerkt, dus de app telt ze niet als werkdag. De bouwvak laat je nog weg. Die zet je in tutorial 3 zelf in de kalender, zodat je ziet wat hij met de einddatum doet.',
        ],
      },
      fasen: {
        title: 'De fasen',
        task: [
          'Klik op *Start › Taken › Taak*. Er verschijnt een nieuwe taak, en rechts in **Eigenschappen** is de naam al geselecteerd. Typ `Voorbereiding` en druk op Enter.',
          'Doe hetzelfde voor `Fundering`, `Ruwbouw` en `Afbouw`. Een nieuwe taak komt steeds onder de geselecteerde taak, dus de fasen staan vanzelf op volgorde.',
        ],
        explain: [
          'In de takenlijst staan vier regels met de WBS-nummers 1 tot en met 4. WBS staat voor *work breakdown structure*: de opdeling van het werk. Rechts ernaast staat de Gantt: een tijdlijn met per taak een balk. Elke fase heeft daar nu nog een balk van 5 dagen, de standaardduur van een nieuwe taak. Na Taak is de Gantt naar juni 2027 gesprongen, naar je nieuwe taak. Gebruikte je Toon mij, klik dan een fase aan in de takenlijst; dan springt de Gantt erheen.',
          'Waarom eerst fasen? Twintig taken overzie je nog wel, driehonderd niet. Met fasen zie je per fase wanneer hij begint en eindigt, en je klapt weg wat je even niet nodig hebt. Zo meteen zet je de taken ín de fasen; dan telt die 5 dagen niet meer.',
        ],
      },
      mijlpaal: {
        title: 'Een mijlpaal',
        task: [
          'Klik in de takenlijst op **Voorbereiding**. Klik dan op *Start › Taken › Mijlpaal* en kies **Startmijlpaal**. Typ `Start bouw` en druk op Enter.',
        ],
        explain: [
          'Start bouw staat direct onder Voorbereiding, maar op hetzelfde niveau: hij kreeg WBS-nummer 2, en Fundering schoof door naar 3. In de Gantt is hij een ruit, en zijn duur is 0. (Gebruikte je **Toon mij**, dan staat Start bouw meteen ingesprongen als 1.1 en is stap 4 ook gedaan.)',
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
          'Kijk naar de balk van Bouwplaats inrichten: die is nog 5 dagen lang, terwijl de duur 2 is. Onderaan in de statusbalk staat *Verouderd — herbereken (F5)*. Open Planner Studio rekent niet bij elke wijziging opnieuw; dat doe jij, met Bereken. Zo blijft de planning stil liggen terwijl je hem opbouwt. In de laatste stap reken je.',
        ],
      },
      fundering: {
        title: 'De fundering',
        task: [
          'Klik in de takenlijst op **Fundering**. Klik op *Start › Taken › Taak*, typ de naam van de eerste taak en druk op Enter. De taak komt op hetzelfde niveau als de fase, direct eronder: spring hem in zoals in stap 4 en geef hem daarna zijn duur. De rest van de fase gaat zoals in stap 5:',
          '- `Funderingssleuf ontgraven`, 2 werkdagen: de sleuf graven waarin de fundering komt.\n- `Wapening en bekisting fundering`, 3 werkdagen: de bekisting zetten en het wapeningsstaal erin leggen.\n- `Inspectie wapening`: een keuring, dus een mijlpaal. Kies *Start › Taken › Mijlpaal › Inspectiemoment (verplicht)*.\n- `Fundering storten`, 1 werkdag: het beton in de bekisting storten.\n- `Funderingsmetselwerk`, 2 werkdagen: de fundering opmetselen tot vloerhoogte.\n- `Kanaalplaatvloer leggen`, 1 werkdag: de begane-grondvloer van betonnen kanaalplaten, die een kraan op zijn plaats legt.',
        ],
        explain: [
          'Fundering heeft nu zes regels, 2.1 tot en met 2.6. Selecteer Inspectie wapening: in **Eigenschappen** is hij een eindmijlpaal met een vinkje bij **Verplicht (contractueel)**.',
          'Een keuring kost geen werk, maar het werk wacht erop: pas na de goedkeuring gaat het beton erin. Daarom is het een mijlpaal. Het vinkje Verplicht markeert hem als contractueel moment. Het bewaakt geen datum: dat doe je met een deadline, en die leer je in tutorial 3.',
        ],
      },
      ruwbouw: {
        title: 'De ruwbouw',
        task: [
          'Klik op **Ruwbouw** en maak de eerste taak zoals bij de fundering: Taak, naam, inspringen, duur. Vul de fase daarna aan:',
          '- `Binnenspouwblad metselen`, 5 werkdagen: de dragende binnenmuur.\n- `Buitenspouwblad metselen`, 6 werkdagen: de gevel van metselwerk.\n- `Dakelementen plaatsen`, 1 werkdag: de kraan legt de geprefabriceerde dakelementen op de muren.\n- `Dakbedekking aanbrengen`, 2 werkdagen: het dak waterdicht maken.\n- `Kozijnen plaatsen`, 2 werkdagen: ramen en deuren erin, zodat de aanbouw dicht is.\n- `Achtergevel doorbreken`, 2 werkdagen: de bestaande achtergevel openmaken naar de aanbouw.',
        ],
        explain: [
          'Ruwbouw heeft nu zes taken, 3.1 tot en met 3.6.',
          'De spouwmuur staat er als twee taken: het binnenblad draagt, het buitenblad is de gevel. Het zijn twee klussen met een eigen duur: het buitenblad kost hier een dag meer. Wat je apart wilt volgen, zet je als aparte taak in de planning.',
        ],
      },
      afbouw: {
        title: 'De afbouw en de oplevering',
        task: [
          'Klik op **Afbouw** en maak de eerste taak zoals bij de fundering: Taak, naam, inspringen, duur. Vul de fase daarna aan:',
          '- `Installaties aanleggen`, 3 werkdagen: leidingen voor elektra, water en verwarming.\n- `Stucwerk`, 4 werkdagen: wanden en plafond glad afwerken.\n- `Dekvloer aanbrengen`, 1 werkdag: de afwerkvloer over de kanaalplaten.\n- `Tegelwerk`, 3 werkdagen: de tegels leggen.\n- `Schilderwerk`, 3 werkdagen: kozijnen en wanden schilderen.\n- `Opleverpunten en schoonmaken`, 1 werkdag: de laatste gebreken herstellen en de aanbouw schoon opleveren.\n- `Oplevering`: het eindpunt, dus een mijlpaal. Kies *Start › Taken › Mijlpaal › Eindmijlpaal*.',
        ],
        explain: [
          'De WBS is compleet: vier fasen, twintig taken en drie mijlpalen. Onderaan in de statusbalk staat *Taken: 23* en *Mijlpalen: 3*: de twintig taken plus de drie mijlpalen. De fasen telt de app niet mee.',
          'Oplevering is een eindmijlpaal: het moment dat het laatste werk klaar is en de aanbouw wordt overgedragen. Die datum wil de opdrachtgever weten, en die ga je in de volgende tutorials steeds scherper krijgen.',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Klik op *Start › Planning › Bereken*: de knop Bereken in de groep Planning op het tabblad Start. Of druk op F5.',
          '(Staat de instelling *Automatisch berekenen* aan, dan heeft de app al na elke wijziging gerekend en is deze stap al gedaan.)',
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
      'At the end every task sits in its phase and the app has calculated for the first time. You will see straight away why a list of tasks is not yet a schedule: without relationships, the agreements about which task waits for which, everything starts on the same day.',
      '## Starting point',
      'This is the first tutorial. All you need is Open Planner Studio; you start with an empty project.',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 1* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you.',
      'Want to skip the window of step 1? [Open the starting project](project://projects/en/start-tut-1.ifc) instead. It is the same project as after step 1.',
    ],
    outro: [
      '## What you have learned',
      '- **A project starts with a start date and a calendar.** Without relationships every task starts on the start date, and the calendar decides which days are working days.',
      '- **You make phases by indenting.** A phase then becomes a summary task: its start and finish follow from its tasks, so you can see per phase how long it takes.',
      '- **A milestone is a moment without duration.** It marks something the work waits for: the start, an inspection, the handover.',
      '- **By default you calculate yourself, with Calculate (F5).** Only then are the bars right; until then the status bar says the schedule is out of date.',
      '- **Without relationships a schedule is a list.** Everything starts at once and the longest task sets the finish. That is why you fix the order in tutorial 2.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-1.ifc).',
    ],
    steps: {
      'nieuw-project': {
        title: 'A new project',
        task: [
          'Click *Home › File › New*. In the **New project** window, fill in:',
          '- **Project Name**: `House extension`\n- **Start Date**: `07-06-2027` (day, month, year), Monday 7 June 2027\n- **Country**: Netherlands, and for **Construction holiday**: None',
          'Below **Construction holiday** you now see the line *36 holidays, 2026–2030*; expand it if you want to see which days they are.',
          'Click **Create**.',
        ],
        explain: [
          'Below the ribbon there is now a tab called House extension, with an empty task list.',
          'The start date is the anchor of your schedule. As long as a task has no predecessor, a task that has to finish first, it starts on this day. So choose it deliberately: the day the contractor starts on site.',
          'With the Netherlands, the project gets a calendar with the Dutch public holidays: the 36 days from that line, from 2026 up to and including 2030. Nobody works on those days, so the app does not count them as working days. Leave out the construction holiday for now: the Dutch building trade\'s summer break of three weeks, with dates that differ per region. You add it to the calendar yourself in tutorial 3, so you can see what it does to the finish date.',
        ],
      },
      fasen: {
        title: 'The phases',
        task: [
          'Click *Home › Tasks › Task*. A new task appears, and on the right in **Properties** its name is already selected. Type `Preparation` and press Enter.',
          'Do the same for `Foundations`, `Shell` and `Finishing`. A new task always goes below the selected task, so the phases end up in order by themselves.',
        ],
        explain: [
          'The task list shows four rows with the WBS numbers 1 to 4. WBS stands for *work breakdown structure*: how the work is divided up. Next to it is the Gantt: a timeline with a bar for each task. For now each phase has a bar of 5 days there, the default duration of a new task. After Task, the Gantt has jumped to June 2027, to your new task. If you used Show me, click a phase in the task list; the Gantt then jumps to it.',
          'Why phases first? You can keep track of twenty tasks, but not of three hundred. With phases you see per phase when it starts and finishes, and you collapse what you do not need for a while. In a moment you put the tasks inside the phases; then those 5 days no longer count.',
        ],
      },
      mijlpaal: {
        title: 'A milestone',
        task: [
          'Click **Preparation** in the task list. Then click *Home › Tasks › Milestone* and choose **Start milestone**. Type `Start of construction` and press Enter.',
        ],
        explain: [
          'Start of construction sits directly below Preparation, but at the same level: it got WBS number 2, and Foundations moved on to 3. In the Gantt it is a diamond, and its duration is 0. (If you used **Show me**, Start of construction is already indented as 1.1 and step 4 is done as well.)',
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
          'Look at the bar of Set up site: it is still 5 days long, while the duration is 2. At the bottom, the status bar says *Out of date — recalculate (F5)*. Open Planner Studio does not recalculate after every change; you do that, with Calculate. That way the schedule stays still while you build it. You calculate in the last step.',
        ],
      },
      fundering: {
        title: 'The foundations',
        task: [
          'Click **Foundations** in the task list. Click *Home › Tasks › Task*, type the name of the first task and press Enter. The task lands on the same level as the phase, directly below it: indent it as in step 4 and then give it its duration. The rest of the phase goes as in step 5:',
          '- `Excavate foundation trench`, 2 working days: digging the trench the foundation goes into.\n- `Foundation formwork and reinforcement`, 3 working days: setting up the formwork and placing the reinforcing steel in it.\n- `Reinforcement inspection`: an inspection, so a milestone. Choose *Home › Tasks › Milestone › Inspection point (mandatory)*.\n- `Pour foundation`, 1 working day: pouring the concrete into the formwork.\n- `Foundation brickwork`, 2 working days: bricking up the foundation to floor level.\n- `Lay hollow-core floor`, 1 working day: the ground floor of precast concrete hollow-core slabs, which a crane lifts into place.',
        ],
        explain: [
          'Foundations now has six rows, 2.1 to 2.6. Select Reinforcement inspection: in **Properties** it is a finish milestone with a tick at **Mandatory (contractual)**.',
          'An inspection takes no work, but the work waits for it: only after approval does the concrete go in. That is why it is a milestone. The Mandatory tick marks it as a contractual moment. It does not guard a date: you do that with a deadline, which you learn in tutorial 3.',
        ],
      },
      ruwbouw: {
        title: 'The shell',
        task: [
          'Click **Shell** and make the first task as for the foundations: Task, name, indent, duration. Then fill in the phase:',
          '- `Build inner cavity leaf`, 5 working days: the load-bearing inner wall.\n- `Build outer cavity leaf`, 6 working days: the brick facade.\n- `Place roof elements`, 1 working day: the crane places the prefabricated roof elements on the walls.\n- `Apply roofing`, 2 working days: making the roof watertight.\n- `Install window frames`, 2 working days: windows and doors in, so the extension is closed.\n- `Break through rear wall`, 2 working days: opening up the existing rear wall into the extension.',
        ],
        explain: [
          'Shell now has six tasks, 3.1 to 3.6.',
          'The cavity wall is there as two tasks: the inner leaf carries the load, the outer leaf is the facade. They are two jobs with their own duration: here the outer leaf takes one day longer. Whatever you want to track separately, you put in the schedule as a separate task.',
        ],
      },
      afbouw: {
        title: 'Finishing and handover',
        task: [
          'Click **Finishing** and make the first task as for the foundations: Task, name, indent, duration. Then fill in the phase:',
          '- `Install building services`, 3 working days: pipes and cables for electricity, water and heating.\n- `Plastering`, 4 working days: finishing walls and ceiling smooth.\n- `Lay floor screed`, 1 working day: the finishing floor over the hollow-core slabs.\n- `Tiling`, 3 working days: laying the tiles.\n- `Painting`, 3 working days: painting frames and walls.\n- `Snagging and cleaning`, 1 working day: fixing the last defects and handing over a clean extension.\n- `Handover`: the end point, so a milestone. Choose *Home › Tasks › Milestone › Finish milestone*.',
        ],
        explain: [
          'The WBS is complete: four phases, twenty tasks and three milestones. At the bottom, the status bar says *Tasks: 23* and *Milestones: 3*: the twenty tasks plus the three milestones. The app does not count the phases.',
          'Handover is a finish milestone: the moment the last work is done and the extension is handed over. That is the date the client wants to know, and over the next tutorials you will pin it down ever more precisely.',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Click *Home › Schedule › Calculate*: the Calculate button in the Schedule group on the Home tab. Or press F5.',
          '(If the setting *Calculate automatically* is on, the app has already calculated after every change and this step is already done.)',
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


// ── Tutorial 2: Relaties en het kritieke pad ─────────────────────────────────────────────────

const TEXT_2 = {
  nl: {
    title: 'Relaties en het kritieke pad',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Relaties en het kritieke pad',
      '## Wat je bouwt',
      'Je legt de volgorde van het werk vast in de planning van de aanbouw: 24 relaties tussen de taken, twee daarvan met wachttijd. Daarna reken je en lees je af waarom de oplevering op vrijdag 6 augustus 2027 staat, welke taken je in de gaten moet houden en welke taken ruimte hebben.',
      'Aan het eind heeft de planning een echte einddatum. Je hebt gezien dat een keten van 21 taken die datum bepaalt, dat het buitenspouwblad 2 werkdagen speling heeft en wat er gebeurt als hij toch uitloopt.',
      '## Uitgangspunt',
      'Je hebt tutorial 1 afgerond: het project *Aanbouw woning* met vier fasen, twintig taken en drie mijlpalen, nog zonder relaties. Heb je dat niet, [open dan het resultaat van tutorial 1](project://projects/nl/na-tut-1.ifc).',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 2*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar. **Opnieuw** in de eerste stap met handelingen laadt het resultaat van tutorial 1 opnieuw.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een relatie legt een volgorde vast: de opvolger wacht op zijn voorganger.** Zonder relaties begon elke taak op 7 juni en was de planning op 14 juni al klaar; met 24 relaties schuift het einde naar 6 augustus.',
      '- **Een lag is wachttijd, standaard geteld in werkdagen.** Het beton kreeg 3 werkdagen: het metselwerk begon op donderdag 24 juni in plaats van maandag 21 juni. Een lag in werkdagen slaat het weekend over; voor iets dat doorloopt, zoals uitharden, kies je kalenderdagen (`3ed`).',
      '- **Het kritieke pad is de langste keten van taken.** Elke taak erop bepaalt de einddatum: 21 taken, 45 werkdagen. Loopt er één een dag uit, dan schuift de oplevering een dag.',
      '- **Speling is de ruimte van een taak buiten het kritieke pad.** Het buitenspouwblad heeft 2 werkdagen speling omdat de keten binnenspouwblad, dakelementen en dakbedekking (8 werkdagen) 2 werkdagen langer duurt dan het buitenspouwblad (6); de kozijnen wachten op beide. Loopt hij meer dan 2 werkdagen uit, dan schuift de oplevering.',
      '- **Het kritieke pad staat niet vast.** Met 9 werkdagen metselen liep het kritieke pad ineens door het buitenspouwblad, niet meer door het binnenspouwblad. Reken daarom na elke wijziging opnieuw.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-2.ifc). De regels achter deze tutorial staan in [Relaties en lag](docs://uitleg-relaties) en [Kritiek pad en speling](docs://uitleg-kritiek-pad).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat zoals je het na tutorial 1 achterliet: vier fasen, twintig taken, drie mijlpalen. Heb je dat niet, [open dan het resultaat van tutorial 1](project://projects/nl/na-tut-1.ifc). Druk op F5 als de statusbalk *Verouderd — herbereken (F5)* meldt.',
        ],
        explain: [
          'Onderaan in de statusbalk staat *Einde: 14-06-2027* en *Kritiek pad: 1 taak, 6 werkdagen*. Klik je in de takenlijst op **Oplevering** (4.7), dan zie je dat ook de oplevering op 7 juni staat: dezelfde dag als Start bouw.',
          'Dat klopt niet met de werkelijkheid, en de app weet dat niet beter. Hij kent nog geen volgorde: geen enkele taak wacht op een andere, dus elke taak begint op de startdatum. Het einde van de planning is het einde van de langste taak, Buitenspouwblad metselen. Wat ontbreekt zijn de **relaties**: afspraken over welke taak op welke wacht.',
        ],
      },
      'eerste-relatie': {
        title: 'De eerste relatie',
        task: [
          'Klik in de takenlijst op **Start bouw** (1.1). Houd Ctrl (op een Mac ⌘) ingedrukt en klik op **Bouwplaats inrichten** (1.2). Klik op *Start › Taken › Relatie* en kies **Geselecteerde taken koppelen**.',
        ],
        explain: [
          'Onderin verschijnt de melding *Relatie aangemaakt: Start bouw → Bouwplaats inrichten*, en in de Gantt loopt een stippellijn van de ene balk naar de andere. Selecteer je Bouwplaats inrichten, dan staat in het paneel *Eigenschappen*, onder *Afhankelijkheden*, de voorganger 1.1 met type **FS** en een lag van 0d.',
          'Start bouw is nu de **voorganger** en Bouwplaats inrichten de **opvolger**. FS staat voor *Eind-Start*: de opvolger kan pas beginnen als de voorganger klaar is. Dat is de standaardrelatie en het type van alle relaties in dit project. De volgorde van je klikken telt: eerst de voorganger, dan de opvolger. Klik je andersom, dan wijst de relatie de verkeerde kant op.',
          'De balken staan nog stil. Onderaan meldt de statusbalk *Verouderd — herbereken (F5)*: een relatie verandert de datums pas als je rekent.',
        ],
      },
      'relaties-tekenen': {
        title: 'Relaties tekenen in de Gantt',
        task: [
          'Klik op *Start › Taken › Relatie* en kies **Relatie tekenen**. Boven de planning verschijnt de melding *Relatiemodus: sleep in de Gantt van de ene balk naar de andere om een relatie te leggen. Esc stopt.*',
          '- Sleep van de balk van **Bouwplaats inrichten** naar de balk van **Tuin en bestrating verwijderen**. Er verschijnt een klein venster **Type relatie** met FS en een vak voor de lag. Druk op Enter.\n- Sleep daarna van **Tuin en bestrating verwijderen** naar **Aanbouw uitzetten** en druk weer op Enter.',
          'Stop de relatiemodus met Esc.',
        ],
        explain: [
          'De drie balken zijn nu met stippellijnen aan elkaar gekoppeld: het einde van de ene loopt naar het begin van de volgende. Ook nu staat alles nog op zijn plek, en de statusbalk zegt nog steeds *Verouderd*.',
          'Relatiemodus blijft aan tot je stopt, dus je kunt rustig meer relaties na elkaar tekenen. Voor een korte keten is tekenen prettig, omdat je de balken voor je ziet. Voor de rest van het project gaat het in de tabel sneller.',
        ],
      },
      fundering: {
        title: 'De fundering, in de tabel',
        task: [
          'Ga naar het tabblad **Tabel**. Klik op de **+** rechts in de tabelkop (*Kolom toevoegen*), open het kopje **Relaties** en kies **Voorgangers**. De kolom Voorgangers staat nu rechts in de tabel.',
          'Klik in die kolom op de cel van **Funderingssleuf ontgraven** (2.1) en begin meteen te typen: `1.4 FS`. Druk op Enter. Dat betekent: voorganger is taak 1.4, Aanbouw uitzetten, met een Eind-Start-relatie. Zet altijd een spatie tussen het nummer en het type: zonder spatie herkent de app de invoer niet. Druk je eerst op Enter, dan opent een zoekvak waarin je de taak aanklikt en met Enter bevestigt; dat werkt ook, maar hier typ je gewoon. Enter brengt je naar de cel eronder, dus je kunt doortypen:',
          '- 2.1 Funderingssleuf ontgraven: `1.4 FS`\n- 2.2 Wapening en bekisting fundering: `2.1 FS`\n- 2.3 Inspectie wapening: `2.2 FS`\n- 2.4 Fundering storten: `2.3 FS`',
        ],
        explain: [
          'In de kolom Voorgangers staan de relaties als `1.4 FS`, `2.1 FS`, `2.2 FS` en `2.3 FS`. Het getal is het WBS-nummer van de voorganger. De relatie van 2.1 loopt over de fasegrens heen naar 1.4: relaties verbinden taken, geen fasen. Zo loopt de keten van de voorbereiding door in de fundering.',
          'Ook een mijlpaal hoort in de keten. Fundering storten wacht op Inspectie wapening, en die wacht op de wapening: pas na de goedkeuring gaat het beton erin. Een keuring kost geen tijd, maar het werk erna wacht erop. De planning is nog steeds verouderd, want je hebt niet gerekend.',
        ],
      },
      lag: {
        title: 'Wachttijd: een lag',
        task: [
          'Beton moet uitharden voordat de metselaar erop kan. Klik in de kolom Voorgangers op de cel van **Funderingsmetselwerk** (2.5) en typ `2.4 FS+3`. Druk op Enter. De `+3` is de **lag**: drie werkdagen wachttijd na het einde van de voorganger.',
          'Een lag telt standaard in werkdagen. Beton hardt ook in het weekend uit; wil je dat laten meetellen, dan typ je `3ed` (kalenderdagen), zie [Relaties en lag](docs://uitleg-relaties). Hier houden we het bij werkdagen.',
          'Druk daarna op F5, of klik op *Tabel › Planning › Bereken*.',
        ],
        explain: [
          'De cel toont `2.4 FS+3d`. De kolommen Start en Einde laten zien wat de relaties tot nu toe doen: Fundering storten staat op 18-06-2027, vrijdag. Funderingsmetselwerk begint op 24-06-2027, donderdag. Daartussen liggen drie werkdagen wachttijd: maandag 21, dinsdag 22 en woensdag 23 juni. Het weekend telt hier niet mee, want de lag staat in werkdagen; met `3ed` begon het metselwerk op dinsdag 22 juni.',
          'Zonder lag was het metselwerk op maandag 21 juni begonnen, kort na het storten van het beton. De taken waar je nog geen relatie aan hangt, zoals Kanaalplaatvloer leggen, staan nog steeds op 07-06-2027.',
        ],
      },
      ruwbouw: {
        title: 'De ruwbouw: twee ketens die samenkomen',
        task: [
          'Klik in de kolom Voorgangers op de cel van **Kanaalplaatvloer leggen** (2.6) en typ `2.5 FS`. Klik dan op de cel van **Binnenspouwblad metselen** (3.1) en typ van daaruit naar beneden:',
          '- 3.1 Binnenspouwblad metselen: `2.6 FS`\n- 3.2 Buitenspouwblad metselen: `2.6 FS`\n- 3.3 Dakelementen plaatsen: `3.1 FS`\n- 3.4 Dakbedekking aanbrengen: `3.3 FS`\n- 3.5 Kozijnen plaatsen: `3.4 FS; 3.2 FS`\n- 3.6 Achtergevel doorbreken: `3.5 FS`',
          'Bij 3.5 typ je twee voorgangers, gescheiden door een puntkomma. Wat je in een cel typt, vervangt alles wat er stond, dus typ altijd alle voorgangers van een taak mee.',
        ],
        explain: [
          'Na de vloer splitst het werk zich: het binnenspouwblad en het buitenspouwblad hangen allebei aan Kanaalplaatvloer leggen, dus ze kunnen tegelijk beginnen. De binnenkant loopt daarna door naar dakelementen en dakbedekking, de buitenkant is één klus.',
          'Kozijnen plaatsen wacht op beide ketens: de kozijnen kunnen er pas in als het dak dicht is én de gevel staat. De cel toont `3.4 FS; 3.2 FS`. Zo werkt een taak met meer voorgangers: hij wacht op de laatste die klaar is. Welke dat is, zie je zodra je rekent.',
        ],
      },
      afbouw: {
        title: 'De afbouw en de oplevering',
        task: [
          'Klik in de kolom Voorgangers op de cel van **Installaties aanleggen** (4.1) en typ van daaruit naar beneden:',
          '- 4.1 Installaties aanleggen: `3.6 FS`\n- 4.2 Stucwerk: `4.1 FS`\n- 4.3 Dekvloer aanbrengen: `4.2 FS`\n- 4.4 Tegelwerk: `4.3 FS+5`\n- 4.5 Schilderwerk: `4.2 FS`\n- 4.6 Opleverpunten en schoonmaken: `4.4 FS; 4.5 FS`\n- 4.7 Oplevering: `4.6 FS`',
          'De dekvloer moet vijf werkdagen drogen voordat je erop kunt tegelen: daarom de lag `+5` bij Tegelwerk.',
        ],
        explain: [
          'Het netwerk is compleet: 24 relaties, twee daarvan met een lag. Na het stucwerk splitst de afbouw zich weer: de dekvloer (met droogtijd en daarna het tegelwerk) en het schilderwerk kunnen naast elkaar lopen. Beide komen samen bij Opleverpunten en schoonmaken, en de oplevering wacht op de laatste taak.',
          'Ook nu is de planning verouderd: de balken laten nog de oude situatie zien. In de volgende stap reken je.',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Ga terug naar het tabblad **Start** en klik op *Start › Planning › Bereken*, of druk op F5. Zie je de hele planning niet, klik dan op *Beeld › Tijdschaal › Passend maken op project*.',
        ],
        explain: [
          'De taken staan nu achter elkaar in plaats van allemaal op 7 juni. Onderaan in de statusbalk staat *Einde: 06-08-2027* en *Kritiek pad: 21 taken, 45 werkdagen*. De oplevering staat op vrijdag 6 augustus 2027, in de negende week van het project.',
          'Waarom precies die datum? De app rekent voorwaarts: elke taak begint op de eerste werkdag na het einde van zijn voorgangers, en de lag telt mee. Heeft een taak meer voorgangers, dan wacht hij op de laatste. Het einde van de langste keten is het einde van het project. Die keten is het **kritieke pad**: alle taken die de einddatum bepalen. Loopt één van die 21 taken een dag uit, dan schuift de oplevering een dag.',
          'De balken van het kritieke pad zijn rood. Twee balken zijn dat niet: Buitenspouwblad metselen en Schilderwerk. Achter hun balk loopt een groene band: dat is hun speling, de ruimte die ze hebben voordat de oplevering schuift.',
        ],
      },
      uitloop: {
        title: 'Speling, en wat als het buitenspouwblad uitloopt',
        task: [
          'Ga naar het tabblad **Tabel**. Klik op de rij van **Buitenspouwblad metselen** (3.2). In het paneel *Eigenschappen* (scroll zo nodig omlaag) staat onder *CPM Resultaat*: *Vroegste einde* 06-07-2027 en *Laatste einde* 08-07-2027. Kijk ook naar de kolommen **Kritiek** en **Totale speling** (de korte koppen *Kri…* en *Tot…*): bijna elke taak is kritiek en heeft 0d speling, het buitenspouwblad heeft 2d en Schilderwerk (4.5) 6d. Bij Kozijnen plaatsen (3.5) staat in de kolom Voorgangers het bliksemsymbool bij `3.4 FS`.',
          'Test de speling van het buitenspouwblad. Klik in de kolom **Duur** op zijn cel, typ `9` en druk op Enter. Druk daarna op F5, of klik op *Tabel › Planning › Bereken*.',
        ],
        explain: [
          'Het buitenspouwblad had 2 werkdagen speling: 7 en 8 juli. Het dak (Binnenspouwblad 5 werkdagen, Dakelementen 1 en Dakbedekking 2, samen 8) duurt 2 werkdagen langer dan het buitenspouwblad (6), en de kozijnen wachten op allebei. Daarom stond het bliksemsymbool bij `3.4 FS`: de relatie met het dak is **bepalend**. Schilderwerk had 6 werkdagen speling, want het hoeft pas klaar te zijn als Opleverpunten en schoonmaken begint, en die wacht op het tegelwerk. Speling zegt dus niets over hoe belangrijk een taak is, alleen hoeveel tijd er nog over is. Meer daarover: [Kritiek pad en speling](docs://uitleg-kritiek-pad).',
          'Met 9 werkdagen is het buitenspouwblad klaar op vrijdag 9 juli: 3 werkdagen uitloop tegen 2 werkdagen speling. De oplevering schuift een werkdag, naar maandag 9 augustus. De statusbalk toont *Einde: 09-08-2027* en *Kritiek pad: 19 taken, 46 werkdagen*. Nu staat het bliksemsymbool bij `3.2 FS`: het buitenspouwblad is de bepalende voorganger geworden en het kritieke pad loopt door hem. Het binnenspouwblad, de dakelementen en de dakbedekking hebben 1 werkdag speling. Daarom reken je na elke wijziging opnieuw.',
        ],
      },
      terugzetten: {
        title: 'Terug naar 6 werkdagen',
        task: [
          'Zet in de kolom **Duur** de cel van Buitenspouwblad metselen terug op `6`, druk op Enter en druk op F5, of klik op *Tabel › Planning › Bereken*.',
        ],
        explain: [
          'Alles staat weer zoals bij het rekenen: *Einde: 06-08-2027*, *Kritiek pad: 21 taken, 45 werkdagen* en 2 werkdagen speling bij het buitenspouwblad.',
          'Dit is het resultaat van tutorial 2, en het beginpunt van tutorial 3: daarin komen de bouwvak en twee datumafspraken erbij.',
        ],
        panelOnly: [
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-2.ifc). Meer over de regels lees je in [Relaties en lag](docs://uitleg-relaties) en [Kritiek pad en speling](docs://uitleg-kritiek-pad).',
        ],
      },
    },
  },
  en: {
    title: 'Relationships and the critical path',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Relationships and the critical path',
      '## What you build',
      'You fix the order of the work in the schedule for the extension: 24 relationships between the tasks, two of them with waiting time. Then you calculate and read off why the handover is on Friday 6 August 2027, which tasks you need to watch and which tasks have room.',
      'At the end the schedule has a real finish date. You have seen that a chain of 21 tasks decides that date, that the outer cavity leaf has 2 working days of float and what happens if it runs late anyway.',
      '## Starting point',
      'You have finished tutorial 1: the project *House extension* with four phases, twenty tasks and three milestones, still without relationships. If you have not, [open the result of tutorial 1](project://projects/en/na-tut-1.ifc).',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 2* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you. **Start over** in the first step with actions reloads the result of tutorial 1.',
    ],
    outro: [
      '## What you have learned',
      '- **A relationship fixes an order: the successor waits for its predecessor.** Without relationships every task started on 7 June and the schedule was finished on 14 June; with 24 relationships the finish moves to 6 August.',
      '- **A lag is waiting time, by default counted in working days.** The concrete got 3 working days: the brickwork started on Thursday 24 June instead of Monday 21 June. A lag in working days skips the weekend; for something that carries on, such as curing, you choose calendar days (`3ed`).',
      '- **The critical path is the longest chain of tasks.** Every task on it decides the finish date: 21 tasks, 45 work days. If one of them runs a day late, the handover moves a day.',
      '- **Float is the room a task has outside the critical path.** The outer cavity leaf has 2 working days of float because the chain inner cavity leaf, roof elements and roofing (8 working days) takes 2 working days longer than the outer leaf (6); the window frames wait for both. If it runs more than 2 working days late, the handover moves.',
      '- **The critical path is not fixed.** With 9 working days of bricklaying the critical path suddenly ran through the outer leaf, no longer through the inner leaf. So recalculate after every change.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-2.ifc). The rules behind this tutorial are in [Relations and lag](docs://uitleg-relaties) and [Critical path and float](docs://uitleg-kritiek-pad).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open as you left it after tutorial 1: four phases, twenty tasks, three milestones. If not, [open the result of tutorial 1](project://projects/en/na-tut-1.ifc). Press F5 if the status bar says *Out of date — recalculate (F5)*.',
        ],
        explain: [
          'At the bottom the status bar says *End: 14-06-2027* and *Critical path: 1 task, 6 work days*. Click **Handover** (4.7) in the task list and you see that the handover is on 7 June too: the same day as Start of construction.',
          'That is not how it works in reality, and the app cannot know better. It does not know an order yet: no task waits for another, so every task starts on the start date. The end of the schedule is the end of the longest task, Build outer cavity leaf. What is missing are the **relationships**: agreements about which task waits for which.',
        ],
      },
      'eerste-relatie': {
        title: 'The first relationship',
        task: [
          'Click **Start of construction** (1.1) in the task list. Hold Ctrl (⌘ on a Mac) and click **Set up site** (1.2). Click *Home › Tasks › Link* and choose **Link selected tasks**.',
        ],
        explain: [
          'The message *Relation created: Start of construction → Set up site* appears at the bottom, and in the Gantt a dotted line runs from one bar to the other. Select Set up site and in the *Properties* panel, under *Dependencies*, you see the predecessor 1.1 with type **FS** and a lag of 0d.',
          'Start of construction is now the **predecessor** and Set up site the **successor**. FS stands for *finish-start*: the successor can only start when the predecessor has finished. It is the default relationship and the type of every relationship in this project. The order matters: you clicked the predecessor first, then the successor. The other way round, the relationship points the wrong way.',
          'The bars have not moved. The status bar says *Out of date — recalculate (F5)*: a relationship only changes the dates when you calculate.',
        ],
      },
      'relaties-tekenen': {
        title: 'Drawing relationships in the Gantt',
        task: [
          'Click *Home › Tasks › Link* and choose **Draw relation**. The message *Link mode: drag from one bar to another in the Gantt to create a relation. Press Esc to stop.* appears above the schedule.',
          '- Drag from the bar of **Set up site** to the bar of **Clear garden and paving**. A small **Relation type** window appears with FS and a box for the lag. Press Enter.\n- Then drag from **Clear garden and paving** to **Set out the extension** and press Enter again.',
          'Stop link mode with Esc.',
        ],
        explain: [
          'The three bars are now linked with dotted lines: the end of one runs to the start of the next. Everything is still in its place, and the status bar still says *Out of date*.',
          'Link mode stays on until you stop it, so you can draw several relationships in a row. For a short chain drawing is pleasant, because you see the bars in front of you. For the rest of the project the table is faster.',
        ],
      },
      fundering: {
        title: 'The foundations, in the table',
        task: [
          'Go to the **Table** tab. Click the **+** at the right of the table header (*Add column*), open the **Relations** heading and choose **Predecessors**. The Predecessors column is now at the right of the table.',
          'In that column, click the cell of **Excavate foundation trench** (2.1) and start typing right away: `1.4 FS`. Press Enter. That means: the predecessor is task 1.4, Set out the extension, with a finish-start relationship. Always put a space between the number and the type: without the space the app does not recognise the input. If you press Enter first, a search box opens in which you click the task and confirm with Enter; that works too, but here you simply type. Enter takes you to the cell below, so you can keep typing:',
          '- 2.1 Excavate foundation trench: `1.4 FS`\n- 2.2 Foundation formwork and reinforcement: `2.1 FS`\n- 2.3 Reinforcement inspection: `2.2 FS`\n- 2.4 Pour foundation: `2.3 FS`',
        ],
        explain: [
          'In the Predecessors column the relationships read `1.4 FS`, `2.1 FS`, `2.2 FS` and `2.3 FS`. The number is the WBS number of the predecessor. The relationship of 2.1 crosses the phase boundary to 1.4: relationships connect tasks, not phases. That is how the chain of the preparation continues into the foundations.',
          'A milestone belongs in the chain too. Pour foundation waits for Reinforcement inspection, and that waits for the reinforcement: only after approval does the concrete go in. An inspection takes no time, but the work after it waits for it. The schedule is still out of date, because you have not calculated.',
        ],
      },
      lag: {
        title: 'Waiting time: a lag',
        task: [
          'Concrete has to cure before the bricklayer can build on it. In the Predecessors column, click the cell of **Foundation brickwork** (2.5) and type `2.4 FS+3`. Press Enter. The `+3` is the **lag**: three working days of waiting time after the predecessor finishes.',
          'A lag counts in working days by default. Concrete also cures over the weekend; if you want that to count, you type `3ed` (calendar days), see [Relations and lag](docs://uitleg-relaties). Here we stick to working days.',
          'Then press F5, or click *Table › Schedule › Calculate*.',
        ],
        explain: [
          'The cell shows `2.4 FS+3d`. The Start and Finish columns show what the relationships do so far: Pour foundation is on 18-06-2027, a Friday. Foundation brickwork starts on 24-06-2027, a Thursday. In between are three working days of waiting time: Monday 21, Tuesday 22 and Wednesday 23 June. The weekend does not count here, because the lag is in working days; with `3ed` the brickwork would have started on Tuesday 22 June.',
          'Without the lag the brickwork would have started on Monday 21 June, right after the concrete was poured. The tasks you have not linked yet, such as Lay hollow-core floor, are still on 07-06-2027.',
        ],
      },
      ruwbouw: {
        title: 'The shell: two chains that meet',
        task: [
          'In the Predecessors column, click the cell of **Lay hollow-core floor** (2.6) and type `2.5 FS`. Then click the cell of **Build inner cavity leaf** (3.1) and type downwards from there:',
          '- 3.1 Build inner cavity leaf: `2.6 FS`\n- 3.2 Build outer cavity leaf: `2.6 FS`\n- 3.3 Place roof elements: `3.1 FS`\n- 3.4 Apply roofing: `3.3 FS`\n- 3.5 Install window frames: `3.4 FS; 3.2 FS`\n- 3.6 Break through rear wall: `3.5 FS`',
          'For 3.5 you type two predecessors, separated by a semicolon. What you type in a cell replaces everything that was there, so always type all predecessors of a task.',
        ],
        explain: [
          'After the floor the work splits: the inner and the outer leaf both hang on Lay hollow-core floor, so they can start at the same time. The inside continues to roof elements and roofing, the outside is a single job.',
          'Install window frames waits for both chains: the frames can only go in when the roof is closed and the facade is up. The cell shows `3.4 FS; 3.2 FS`. That is how a task with more than one predecessor works: it waits for the last one to finish. Which one that is, you see as soon as you calculate.',
        ],
      },
      afbouw: {
        title: 'Finishing and handover',
        task: [
          'In the Predecessors column, click the cell of **Install building services** (4.1) and type downwards from there:',
          '- 4.1 Install building services: `3.6 FS`\n- 4.2 Plastering: `4.1 FS`\n- 4.3 Lay floor screed: `4.2 FS`\n- 4.4 Tiling: `4.3 FS+5`\n- 4.5 Painting: `4.2 FS`\n- 4.6 Snagging and cleaning: `4.4 FS; 4.5 FS`\n- 4.7 Handover: `4.6 FS`',
          'The screed has to dry for five working days before you can tile on it: that is the lag `+5` at Tiling.',
        ],
        explain: [
          'The network is complete: 24 relationships, two of them with a lag. After the plastering the finishing splits again: the screed (with drying time, then the tiling) and the painting can run side by side. Both meet at Snagging and cleaning, and the handover waits for the last task.',
          'The schedule is out of date again: the bars still show the old situation. In the next step you calculate.',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Go back to the **Home** tab and click *Home › Schedule › Calculate*, or press F5. If you cannot see the whole schedule, click *View › Time Scale › Fit to project*.',
        ],
        explain: [
          'The tasks are now lined up one after another instead of all on 7 June. At the bottom the status bar says *End: 06-08-2027* and *Critical path: 21 tasks, 45 work days*. The handover is on Friday 6 August 2027, in the ninth week of the project.',
          'Why exactly that date? The app calculates forwards: every task starts on the first working day after its predecessors finish, and the lag counts. A task with more than one predecessor waits for the last one. The end of the longest chain is the end of the project. That chain is the **critical path**: all the tasks that decide the finish date. If one of those 21 tasks runs a day late, the handover moves a day.',
          'The bars of the critical path are red. Two bars are not: Build outer cavity leaf and Painting. A green band runs behind their bar: that is their float, the room they have before the handover moves.',
        ],
      },
      uitloop: {
        title: 'Float, and what if the outer leaf runs late',
        task: [
          'Go to the **Table** tab. Click the row of **Build outer cavity leaf** (3.2). In the *Properties* panel (scroll down if needed), under *CPM Result*, it says: *Early finish* 06-07-2027 and *Late finish* 08-07-2027. Also look at the **Critical** and **Total float** columns (the short headers *Cri…* and *Tot…*): nearly every task is critical and has 0d of float, the outer leaf has 2d and Painting (4.5) 6d. At Install window frames (3.5), the Predecessors column has the lightning-bolt symbol at `3.4 FS`.',
          'Test the float of the outer leaf. In the **Duration** column, click its cell, type `9` and press Enter. Then press F5, or click *Table › Schedule › Calculate*.',
        ],
        explain: [
          'The outer leaf had 2 working days of float: 7 and 8 July. The roof (Build inner cavity leaf 5 working days, Place roof elements 1 and Apply roofing 2, together 8) takes 2 working days longer than the outer leaf (6), and the window frames wait for both. That is why the lightning bolt was at `3.4 FS`: the relationship with the roof is **driving**. Painting had 6 working days of float, because it only has to be finished when Snagging and cleaning starts, and that waits for the tiling. So float says nothing about how important a task is, only how much time is left. More on that: [Critical path and float](docs://uitleg-kritiek-pad).',
          'With 9 working days the outer leaf is finished on Friday 9 July: 3 working days of overrun against 2 working days of float. The handover moves a working day, to Monday 9 August. The status bar shows *End: 09-08-2027* and *Critical path: 19 tasks, 46 work days*. Now the lightning bolt is at `3.2 FS`: the outer leaf has become the driving predecessor and the critical path runs through it. The inner leaf, the roof elements and the roofing have 1 working day of float. That is why you recalculate after every change.',
        ],
      },
      terugzetten: {
        title: 'Back to 6 working days',
        task: [
          'In the **Duration** column, set the cell of Build outer cavity leaf back to `6`, press Enter and press F5, or click *Table › Schedule › Calculate*.',
        ],
        explain: [
          'Everything is back as when you first calculated: *End: 06-08-2027*, *Critical path: 21 tasks, 45 work days* and 2 working days of float at the outer leaf.',
          'This is the result of tutorial 2, and the starting point of tutorial 3: in that one the construction holiday and two date agreements are added.',
        ],
        panelOnly: [
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-2.ifc). You can read more about the rules in [Relations and lag](docs://uitleg-relaties) and [Critical path and float](docs://uitleg-kritiek-pad).',
        ],
      },
    },
  },
};

// ── Tutorial 3: De kalender en datumafspraken ────────────────────────────────────────────────

const TEXT_3 = {
  nl: {
    title: 'De kalender en datumafspraken',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# De kalender en datumafspraken',
      '## Wat je bouwt',
      'In tutorial 2 kreeg de planning een oplevering op vrijdag 6 augustus 2027. Dat was nog te mooi: de bouwvak ontbrak. In deze tutorial zet je de bouwvak in de projectkalender en leg je twee datumafspraken vast: de kozijnen worden pas op 14 juli geleverd (een constraint) en de opdrachtgever wil de aanbouw uiterlijk op 10 september (een deadline).',
      'Bij elke stap zie je hoe de planning verschuift, en waarom. Aan het eind staat de oplevering op woensdag 1 september 2027, en heb je gezien wat een deadline doet als je hem wel en als je hem niet haalt.',
      '## Uitgangspunt',
      'Je hebt tutorial 2 afgerond: de planning met 24 relaties, berekend, met de oplevering op vrijdag 6 augustus 2027. Heb je dat niet, [open dan het resultaat van tutorial 2](project://projects/nl/na-tut-2.ifc).',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 3*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar. **Opnieuw** in de bouwvakstap laadt het resultaat van tutorial 2 opnieuw, en in de constraintstap dat resultaat mét de bouwvak erin.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **De kalender bepaalt welke dagen werkdagen zijn.** Een bouwvak telt niet mee. De vijfde wachtdag van de dekvloer viel erin, dus het tegelwerk begon drie weken later en de oplevering schoof van 6 naar 27 augustus.',
      '- **Een constraint is een datumgrens op één taak, naast de relaties.** Start niet eerder dan 14 juli hield de kozijnen 3 werkdagen tegen. Alles erna schoof mee: de oplevering ging van 27 augustus naar 1 september.',
      '- **Een constraint legt het kritieke pad soms opnieuw neer.** Het begon bij de kozijnen, en de taken ervoor kregen 3 werkdagen speling omdat het werk toch op de kozijnen moest wachten.',
      '- **Een deadline bewaakt en duwt niets.** Met 10 september haalde de oplevering hem met 7 werkdagen marge. Met 27 augustus bleef de oplevering staan op 1 september, en meldde de app dat je 3 werkdagen te laat bent.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-3.ifc). De regels achter deze tutorial staan in [Kalenders en werkdagen](docs://uitleg-kalenders) en [Constraints en deadlines](docs://uitleg-constraints).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat met de 24 relaties uit tutorial 2, berekend. Heb je dat niet, [open dan het resultaat van tutorial 2](project://projects/nl/na-tut-2.ifc). Kijk in de statusbalk.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 06-08-2027* en *Kritiek pad: 21 taken, 45 werkdagen*. De oplevering staat op vrijdag 6 augustus 2027.',
          'Alle datums komen uit één kalender: de projectkalender *Bouwkalender NL* die je in tutorial 1 bij het aanmaken kreeg. Werkdagen zijn maandag tot en met vrijdag, van 07:00 tot 16:00 met een uur pauze, dus 8 uur per dag. De Nederlandse feestdagen van 2026 tot en met 2030 zijn vrij. Een bouwvak zit er nog niet in.',
        ],
      },
      bouwvak: {
        title: 'De bouwvak in de kalender',
        task: [
          'Klik op *Planning › Kalender › Kalender*. Het venster **Kalenders** opent: links staat *Bouwkalender NL* met een ster, de projectkalender.',
          'Klik op **Feestdagen genereren…**. Laat **Land** op Nederland staan en kies bij **Bouwvak** voor **Midden**. De getallen hieronder horen bij die regio; koos je een andere, genereer dan opnieuw met Midden. Klik op **Genereren** en daarna op **Toepassen**.',
          '**Toon mij** opent hier het project met de bouwvak al erin, als nieuw tabblad. De kalender kan het paneel zelf niet aanpassen.',
        ],
        explain: [
          'In de Gantt is een grijs blok bijgekomen: *Bouwvak (Midden)*, van maandag 2 tot en met vrijdag 20 augustus 2027. Drie weken zonder werkdagen. Zie je het blok niet, klik dan op *Beeld › Tijdschaal › Passend maken op project*. Toepassen heeft de planning meteen opnieuw doorgerekend, dus de melding Verouderd blijft weg.',
          'De statusbalk zegt nu *Einde: 27-08-2027*: de oplevering staat drie weken later dan eerst. Het aantal werkdagen is hetzelfde gebleven, *Kritiek pad: 21 taken, 45 werkdagen*, want de bouwvak telt niet als werkdag.',
          'Waarom schuift de oplevering precies drie weken op, terwijl het meeste werk vóór de bouwvak valt? Kijk naar Tegelwerk. Dat wacht vijf werkdagen op de dekvloer, die maandag 26 juli klaar is. Dinsdag 27 tot en met vrijdag 30 juli zijn vier van die vijf wachtdagen. De vijfde zou maandag 2 augustus zijn, maar dat is bouwvak: die dag telt niet. De tegelzetter begint daarom pas op dinsdag 24 augustus in plaats van dinsdag 3 augustus, en alles daarna schuift mee. Het schilderwerk valt vóór de bouwvak en verandert niet. Een lag in werkdagen slaat de bouwvak over, ook als het om droogtijd gaat die in werkelijkheid doorloopt; daarvoor is `5ed` bedoeld (zie [Relaties en lag](docs://uitleg-relaties)).',
        ],
      },
      constraint: {
        title: 'Een constraint: de kozijnen komen later',
        task: [
          'De kozijnen worden pas op woensdag 14 juli 2027 geleverd. Klik in de takenlijst op **Kozijnen plaatsen** (3.5). Zoek in het paneel *Eigenschappen* (scroll zo nodig omlaag) het veld **Constraint** en kies **Start niet eerder dan (SNET)**. Typ bij **Constraint-datum** in de vakjes `14`, `07` en `2027` en druk op Enter.',
        ],
        explain: [
          'Bij de balk van Kozijnen plaatsen staat nu een blauw ruitje aan de startkant: de constraint. De balk zelf staat nog op vrijdag 9 juli en de statusbalk zegt weer *Verouderd — herbereken (F5)*.',
          'Een constraint werkt naast de relaties. De relaties zeggen dat de kozijnen pas kunnen beginnen als het dak dicht is en de gevel staat. Start niet eerder dan zegt: ook dan niet vóór 14 juli. Het is een ondergrens, net als een relatie: de kozijnen mogen later beginnen, niet eerder. Wat dat doet, zie je zodra je rekent.',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Druk op F5, of klik op *Start › Planning › Bereken*.',
        ],
        explain: [
          'Kozijnen plaatsen begint nu op woensdag 14 juli, drie werkdagen later dan de vrijdag 9 juli waarop de relaties het toelieten: vrijdag 9, maandag 12 en dinsdag 13 juli zijn wachtdagen. Alles wat op de kozijnen volgt, schuift drie werkdagen mee. Oplevering staat op woensdag 1 september 2027: *Einde: 01-09-2027*, drie werkdagen later dan 27 augustus.',
          'Het kritieke pad telt nu minder taken: *Kritiek pad: 8 taken, 48 werkdagen*. Die 48 werkdagen zijn de looptijd van het hele project, drie meer dan eerst. Het kritieke pad begint nu bij de constraint: van Kozijnen plaatsen tot en met de oplevering. De taken ervoor, van Start bouw tot en met Dakbedekking, zijn niet meer rood. Ze hebben 3 werkdagen speling, want de kozijnen wachten toch tot 14 juli. Buitenspouwblad heeft er nu 5.',
          'Schilderwerk duurt 3 werkdagen, maar loopt van 29 juli tot en met 23 augustus: de bouwvak ligt er middenin. Een feestdag of bouwvak midden in een taak telt niet mee; de taak loopt er gewoon overheen. Klik je op Schilderwerk, dan meldt het paneel *Eigenschappen* bij *Duur*: *⚠ Deze taak loopt over Bouwvak (Midden) — een vrije periode van 23 dagen (31-07-2027 t/m 22-08-2027).*',
        ],
      },
      deadline: {
        title: 'Een deadline: uiterlijk 10 september',
        task: [
          'De opdrachtgever wil de aanbouw uiterlijk op vrijdag 10 september 2027 opgeleverd hebben. Klik in de takenlijst op **Oplevering** (4.7). Typ in het paneel *Eigenschappen* (scroll zo nodig omlaag) bij **Deadline** in de vakjes `10`, `09` en `2027` en druk op Enter. Druk daarna op F5.',
        ],
        explain: [
          'Er verschuift niets: Oplevering blijft op woensdag 1 september en de statusbalk meldt geen overschreden deadline. Scroll in de Gantt naar de rij van Oplevering en een stukje naar rechts: op 10 september staat een groene pijl omlaag. Dat is de deadline, en hij is gehaald.',
          'Een deadline is een bovengrens voor het einde van een taak. Hij bewaakt, en duwt niets. Oplevering haalt hem met 7 werkdagen marge: donderdag 2, vrijdag 3, maandag 6, dinsdag 7, woensdag 8, donderdag 9 en vrijdag 10 september. De speling verandert niet: het kritieke pad blijft *8 taken, 48 werkdagen*. Zolang de datum ruim genoeg ligt, doet een deadline niets met de planning.',
        ],
      },
      'deadline-krap': {
        title: 'Een deadline die je niet haalt',
        task: [
          'Wat als de afspraak strakker is? Zet de deadline van **Oplevering** op vrijdag 27 augustus 2027, de datum waarop je zonder de constraint klaar was: typ `27`, `08` en `2027` en druk op Enter. Druk daarna op F5.',
        ],
        explain: [
          'De balken blijven waar ze staan: Oplevering blijft op woensdag 1 september. Maar bij Oplevering staat op 27 augustus nu een rode pijl omlaag, links van het ruitje (scroll in de Gantt zo nodig een stukje naar links), en de statusbalk meldt *1 deadline(s) overschreden*. Klik op die melding in de statusbalk: het paneel *Waarschuwingen* opent met *Deadline 27-08-2027 overschreden — vroegste einde 01-09-2027*.',
          'Selecteer je Oplevering, dan zie je onder *CPM Resultaat* een *Totale speling* van -3 dagen: op papier ben je 3 werkdagen te laat. Dat geldt voor de hele keten van Kozijnen plaatsen tot en met de oplevering. De taken daarvoor, van Start bouw tot en met Dakbedekking, hebben 0 dagen speling: ze zijn kritiek zonder marge. Alleen Buitenspouwblad (2 dagen) en Schilderwerk (3 dagen) zijn niet kritiek. Zo komt de statusbalk op *Kritiek pad: 21 taken*. De app verschuift niets om de datum te halen. Hij laat zien dat de afspraak niet past.',
          'Wil je de deadline halen, dan maak je de keten korter of de afspraak ruimer, bijvoorbeeld een eerdere levering van de kozijnen. Dat is een keuze voor de planner, niet voor de rekenmotor.',
        ],
      },
      terugzetten: {
        title: 'Terug naar 10 september',
        task: [
          'Zet de deadline van **Oplevering** terug op vrijdag 10 september 2027: typ `10`, `09` en `2027`, druk op Enter en druk op F5.',
        ],
        explain: [
          'Alles staat weer zoals na de eerste deadline: geen overschreden deadline, *Kritiek pad: 8 taken, 48 werkdagen* en *Einde: 01-09-2027*.',
          'Dit is het resultaat van tutorial 3: een planning met de bouwvak in de kalender, een constraint op de kozijnen en een deadline op de oplevering.',
        ],
        panelOnly: [
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-3.ifc). Meer over de regels lees je in [Kalenders en werkdagen](docs://uitleg-kalenders) en [Constraints en deadlines](docs://uitleg-constraints).',
        ],
      },
    },
  },
  en: {
    title: 'The calendar and date agreements',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# The calendar and date agreements',
      '## What you build',
      'In tutorial 2 the schedule got a handover on Friday 6 August 2027. That was too good to be true: the construction holiday was missing. In this tutorial you put the construction holiday in the project calendar and fix two date agreements: the window frames are only delivered on 14 July (a constraint) and the client wants the extension by 10 September at the latest (a deadline).',
      'At every step you see how the schedule shifts, and why. At the end the handover is on Wednesday 1 September 2027, and you have seen what a deadline does when you meet it and when you do not.',
      '## Starting point',
      'You have finished tutorial 2: the schedule with 24 relationships, calculated, with the handover on Friday 6 August 2027. If you have not, [open the result of tutorial 2](project://projects/en/na-tut-2.ifc).',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 3* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you. **Start over** in the construction holiday step reloads the result of tutorial 2, and in the constraint step that result with the construction holiday in it.',
    ],
    outro: [
      '## What you have learned',
      '- **The calendar decides which days are working days.** A construction holiday does not count. The fifth waiting day of the screed fell in it, so the tiling started three weeks later and the handover moved from 6 to 27 August.',
      '- **A constraint is a date limit on one task, next to the relationships.** Start no earlier than 14 July held the window frames back by 3 working days. Everything after them moved along: the handover went from 27 August to 1 September.',
      '- **A constraint sometimes lays the critical path down anew.** It started at the window frames, and the tasks before them got 3 working days of float because the work had to wait for the frames anyway.',
      '- **A deadline guards and pushes nothing.** With 10 September the handover met it with 7 working days to spare. With 27 August the handover stayed on 1 September, and the app reported that you are 3 working days late.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-3.ifc). The rules behind this tutorial are in [Calendars and working days](docs://uitleg-kalenders) and [Constraints and deadlines](docs://uitleg-constraints).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open with the 24 relationships from tutorial 2, calculated. If not, [open the result of tutorial 2](project://projects/en/na-tut-2.ifc). Look at the status bar.',
        ],
        explain: [
          'The status bar says *End: 06-08-2027* and *Critical path: 21 tasks, 45 work days*. The handover is on Friday 6 August 2027.',
          'All dates come from one calendar: the project calendar that you got when you created the project in tutorial 1. Working days are Monday to Friday, from 07:00 to 16:00 with an hour of break, so 8 hours a day. The Dutch public holidays from 2026 up to and including 2030 are days off. There is no construction holiday in it yet.',
        ],
      },
      bouwvak: {
        title: 'The construction holiday in the calendar',
        task: [
          'Click *Planning › Calendar › Calendar*. The **Calendars** window opens: on the left is the project calendar, marked with a star.',
          'Click **Generate holidays…**. Leave **Country** on the Netherlands and choose **Central** under **Construction holiday**. The numbers below belong to that region; if you chose another one, generate again with Central. Click **Generate** and then **Apply**.',
          '**Show me** opens the project with the construction holiday already in it, as a new tab. The guide cannot change the calendar itself.',
        ],
        explain: [
          'A grey block has appeared in the Gantt: *Bouwvak (Midden)* (the app uses the Dutch name), from Monday 2 to Friday 20 August 2027. Three weeks without working days. If you cannot see the block, click *View › Time Scale › Fit to project*. Apply has recalculated the schedule straight away, so the Out of date message stays away.',
          'The status bar now says *End: 27-08-2027*: the handover is three weeks later than before. The number of work days is the same, *Critical path: 21 tasks, 45 work days*, because the construction holiday does not count as a working day.',
          'Why does the handover move by exactly three weeks, when most of the work falls before the construction holiday? Look at Tiling. It waits five working days for the screed, which is finished on Monday 26 July. Tuesday 27 to Friday 30 July are four of those five waiting days. The fifth would be Monday 2 August, but that is construction holiday: that day does not count. So the tiler starts on Tuesday 24 August instead of Tuesday 3 August, and everything after that moves along. The painting falls before the construction holiday and does not change. A lag in working days skips the construction holiday, even when it is drying time that carries on in reality; that is what `5ed` is for (see [Relations and lag](docs://uitleg-relaties)).',
        ],
      },
      constraint: {
        title: 'A constraint: the window frames come later',
        task: [
          'The window frames are only delivered on Wednesday 14 July 2027. Click **Install window frames** (3.5) in the task list. In the *Properties* panel (scroll down if needed), find the **Constraint** field and choose **Start no earlier than (SNET)**. At **Constraint date** type `14`, `07` and `2027` in the boxes and press Enter.',
        ],
        explain: [
          'At the bar of Install window frames there is now a blue diamond at the start side: the constraint. The bar itself is still on Friday 9 July and the status bar says *Out of date — recalculate (F5)* again.',
          'A constraint works next to the relationships. The relationships say the frames can only start when the roof is closed and the facade is up. Start no earlier than says: not before 14 July either. It is a lower limit, just like a relationship: the frames may start later, not earlier. What that does, you see as soon as you calculate.',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Press F5, or click *Home › Schedule › Calculate*.',
        ],
        explain: [
          'Install window frames now starts on Wednesday 14 July, three working days later than the Friday 9 July the relationships allowed: Friday 9, Monday 12 and Tuesday 13 July are waiting days. Everything that follows the frames moves three working days along. The handover is on Wednesday 1 September 2027: *End: 01-09-2027*, three working days later than 27 August.',
          'The critical path now has fewer tasks: *Critical path: 8 tasks, 48 work days*. Those 48 work days are the duration of the whole project, three more than before. The critical path now starts at the constraint: from Install window frames up to and including the handover. The tasks before it, from Start of construction up to Apply roofing, are no longer red. They have 3 working days of float, because the frames wait until 14 July anyway. Build outer cavity leaf now has 5.',
          'Painting takes 3 working days, but runs from 29 July up to and including 23 August: the construction holiday is in the middle of it. A holiday or construction holiday in the middle of a task does not count; the task simply runs across it. Click Painting and the *Properties* panel says at *Duration*: *⚠ This task runs through Bouwvak (Midden) — a 23-day non-working period (31-07-2027 to 22-08-2027).*',
        ],
      },
      deadline: {
        title: 'A deadline: 10 September at the latest',
        task: [
          'The client wants the extension handed over by Friday 10 September 2027 at the latest. Click **Handover** (4.7) in the task list. In the *Properties* panel (scroll down if needed), type `10`, `09` and `2027` in the boxes at **Deadline** and press Enter. Then press F5.',
        ],
        explain: [
          'Nothing moves: Handover stays on Wednesday 1 September and the status bar reports no missed deadline. Scroll in the Gantt to the row of Handover and a little to the right: on 10 September there is a green arrow pointing down. That is the deadline, and it is met.',
          'A deadline is an upper limit for the finish of a task. It guards, and pushes nothing. Handover meets it with 7 working days to spare: Thursday 2, Friday 3, Monday 6, Tuesday 7, Wednesday 8, Thursday 9 and Friday 10 September. The float does not change: the critical path stays *8 tasks, 48 work days*. As long as the date is generous enough, a deadline does nothing to the schedule.',
        ],
      },
      'deadline-krap': {
        title: 'A deadline you do not meet',
        task: [
          'What if the agreement is tighter? Set the deadline of **Handover** to Friday 27 August 2027, the date you were finished on without the constraint: type `27`, `08` and `2027` and press Enter. Then press F5.',
        ],
        explain: [
          'The bars stay where they are: Handover stays on Wednesday 1 September. But at Handover there is now a red arrow pointing down on 27 August, to the left of the diamond (scroll the Gantt a little to the left if needed), and the status bar says *1 deadline(s) missed*. Click that message in the status bar: the *Warnings* panel opens with *Deadline 27-08-2027 missed — early finish 01-09-2027*.',
          'Select Handover and under *CPM Result* you see a *Total float* of -3 days: on paper you are 3 working days late. That goes for the whole chain from Install window frames up to and including the handover. The tasks before it, from Start of construction up to Apply roofing, have 0 days of float: they are critical without any margin. Only Build outer cavity leaf (2 days) and Painting (3 days) are not critical. That is how the status bar gets to *Critical path: 21 tasks*. The app moves nothing to meet the date. It shows you that the agreement does not fit.',
          'To meet the deadline you make the chain shorter or the agreement looser, for example an earlier delivery of the window frames. That is a choice for the planner, not for the calculation engine.',
        ],
      },
      terugzetten: {
        title: 'Back to 10 September',
        task: [
          'Set the deadline of **Handover** back to Friday 10 September 2027: type `10`, `09` and `2027`, press Enter and press F5.',
        ],
        explain: [
          'Everything is back as after the first deadline: no missed deadline, *Critical path: 8 tasks, 48 work days* and *End: 01-09-2027*.',
          'This is the result of tutorial 3: a schedule with the construction holiday in the calendar, a constraint on the window frames and a deadline on the handover.',
        ],
        panelOnly: [
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-3.ifc). You can read more about the rules in [Calendars and working days](docs://uitleg-kalenders) and [Constraints and deadlines](docs://uitleg-constraints).',
        ],
      },
    },
  },
};

// ── De stappen: tekst + anker + controle + Toon mij + Opnieuw ─────────────────────────────────

const STEP_ORDER_1 = [
  'nieuw-project', 'fasen', 'mijlpaal', 'inspringen', 'voorbereiding', 'fundering', 'ruwbouw', 'afbouw', 'berekenen',
];

/** Stapdefinitie zonder tekst. `reset` = de stand waarmee Opnieuw de stap opnieuw begint. */
const STEP_LOGIC_1 = {
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
    check: api => isCalculated(api) && isTutorialProject(api) && PHASES.every(p => phaseDone(api, p)),
    prepare: async (api) => {
      await prepareUpTo(api, 'afbouw');
      api.data.recalculate();
    },
  },
};

// Tutorial 2. `reset` staat alleen bij de eerste stap met handelingen: daar levert de generator een
// tussenstand (het resultaat van tutorial 1). Verderop is er geen gegenereerde beginstand per stap.
const STEP_ORDER_2 = [
  'startpunt', 'eerste-relatie', 'relaties-tekenen', 'fundering', 'lag', 'ruwbouw', 'afbouw', 'berekenen',
  'uitloop', 'terugzetten',
];

const STEP_LOGIC_2 = {
  // Alleen de aanwezigheid van de taken: in de what-if van stap 9 staat het buitenspouwblad even op 9
  // werkdagen, en wie dan Terug naar stap 1 gaat, mag niet vastlopen op een strengere controle.
  startpunt: {
    check: tasksPresent,
    prepare: async (api) => {
      if (!tasksPresent(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-1'));
    },
  },
  'eerste-relatie': {
    anchor: 'ribbon:start:relation',
    check: api => linksDone(api, LINK_GROUPS.eerste),
    prepare: api => ensureLinks(api, 'eerste'),
    reset: 'na-tut-1',
  },
  'relaties-tekenen': {
    anchor: 'ribbon:start:relation',
    check: api => linksDone(api, LINK_GROUPS.tekenen),
    prepare: api => ensureLinks(api, 'tekenen'),
  },
  fundering: {
    anchor: 'ribbon-tab:table',
    check: api => linksDone(api, LINK_GROUPS.fundering),
    prepare: api => ensureLinks(api, 'fundering'),
  },
  lag: {
    anchor: 'ribbon-tab:table',
    check: api => linksDone(api, linksUpTo('lag')) && isCalculated(api),
    prepare: async (api) => {
      await ensureLinks(api, 'lag');
      api.data.recalculate();
    },
  },
  ruwbouw: {
    anchor: 'ribbon-tab:table',
    check: api => linksDone(api, LINK_GROUPS.ruwbouw),
    prepare: api => ensureLinks(api, 'ruwbouw'),
  },
  afbouw: {
    anchor: 'ribbon-tab:table',
    check: api => linksDone(api, LINK_GROUPS.afbouw),
    prepare: api => ensureLinks(api, 'afbouw'),
  },
  berekenen: {
    anchor: 'ribbon:start:calc',
    check: networkCalculated,
    prepare: async (api) => {
      await ensureLinks(api, 'afbouw');
      setOuterLeafDays(api, OUTER_LEAF_DAYS.normal);
      api.data.recalculate();
    },
  },
  // Anker op Eigenschappen: het paneel wijkt naar links uit, zodat CPM Resultaat in beeld blijft; de
  // tabelkolommen rechts (Kritiek, Totale speling, Voorgangers) blijven leesbaar.
  uitloop: {
    anchor: 'properties-panel',
    check: api => linksDone(api, ALL_LINKS) && outerLeafDays(api) === OUTER_LEAF_DAYS.late && isCalculated(api),
    prepare: async (api) => {
      await ensureLinks(api, 'afbouw');
      setOuterLeafDays(api, OUTER_LEAF_DAYS.late);
      api.data.recalculate();
    },
  },
  terugzetten: {
    anchor: 'ribbon-tab:table',
    check: networkCalculated,
    prepare: async (api) => {
      await ensureLinks(api, 'afbouw');
      setOuterLeafDays(api, OUTER_LEAF_DAYS.normal);
      api.data.recalculate();
    },
  },
};

// Tutorial 3. De bouwvak zit in de kalender, die de API niet kan wijzigen: Toon mij opent daarvoor
// het meegeleverde project mét bouwvak (`tussen-tut-3-bouwvak`). Opnieuw staat bij de eerste stap met
// handelingen (`na-tut-2`) en bij de constraintstap, die met de tussenstand `tussen-tut-3-bouwvak` begint:
// beide zijn standen van de generator.
const STEP_ORDER_3 = [
  'startpunt', 'bouwvak', 'constraint', 'berekenen', 'deadline', 'deadline-krap', 'terugzetten',
];

const networkOk = api => tasksPresent(api) && linksDone(api, ALL_LINKS);

// De stappen die in Eigenschappen werken hebben bewust GEEN anker: een markering om het paneel laat het
// begeleidingspaneel naar links uitwijken, en daar bedekt het de takenlijst waarin je de taak aanklikt.
// Uitzondering: 'deadline-krap', waar je niets meer hoeft aan te klikken maar wel de rechterrail leest.
const STEP_LOGIC_3 = {
  startpunt: {
    check: networkOk,
    prepare: async (api) => {
      if (!networkOk(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-2'));
    },
  },
  bouwvak: {
    anchor: 'ribbon:planning:calendar',
    check: withBouwvak,
    prepare: ensureBouwvak,
    reset: 'na-tut-2',
  },
  constraint: {
    check: api => withBouwvak(api) && constraintSet(api),
    prepare: ensureConstraint,
    reset: 'tussen-tut-3-bouwvak',
  },
  berekenen: {
    anchor: 'ribbon:start:calc',
    check: constraintCalculated,
    prepare: async (api) => {
      await ensureConstraint(api);
      api.data.recalculate();
    },
  },
  deadline: {
    check: api => deadlineCalculated(api, DEADLINE.ok),
    prepare: async (api) => {
      await ensureDeadline(api, DEADLINE.ok);
      api.data.recalculate();
    },
  },
  // Anker op Eigenschappen, zoals tutorial 2 stap 9: het paneel Waarschuwingen opent onder Eigenschappen
  // in de rechterrail en CPM Resultaat staat onderaan in Eigenschappen; rechtsonder zou het
  // begeleidingspaneel ze allebei bedekken. Het paneel wijkt dan naar links; Oplevering staat nog
  // geselecteerd uit de vorige stap en de Gantt blijft vrij.
  'deadline-krap': {
    anchor: 'properties-panel',
    check: api => deadlineCalculated(api, DEADLINE.tight),
    prepare: async (api) => {
      await ensureDeadline(api, DEADLINE.tight);
      api.data.recalculate();
    },
  },
  terugzetten: {
    check: api => deadlineCalculated(api, DEADLINE.ok),
    prepare: async (api) => {
      await ensureDeadline(api, DEADLINE.ok);
      api.data.recalculate();
    },
  },
};

/** De drie tutorials: één bron voor artikel, paneel, lintknop en host-verzoek. */
const TUTORIALS = [
  { id: TUTORIAL_1_ID, order: 1, label: 'Tutorial 1', text: TEXT_1, stepOrder: STEP_ORDER_1, logic: STEP_LOGIC_1 },
  { id: TUTORIAL_2_ID, order: 2, label: 'Tutorial 2', text: TEXT_2, stepOrder: STEP_ORDER_2, logic: STEP_LOGIC_2 },
  { id: TUTORIAL_3_ID, order: 3, label: 'Tutorial 3', text: TEXT_3, stepOrder: STEP_ORDER_3, logic: STEP_LOGIC_3 },
];

const para = lines => lines.join('\n\n');

/** Paneeltekst van een stap: titel + opdracht, `---`, uitleg. `panelOnly`: alinea's die alleen in het paneel staan (het artikel heeft ze in de afsluiting). */
function stepBody(def, lang, key) {
  const t = def.text[lang];
  const s = t.steps[key];
  return `**${s.title}**\n\n${para(s.task)}\n\n---\n\n${t.whatLabel}\n\n${para([...s.explain, ...(s.panelOnly || [])])}`;
}

/** Leesversie: dezelfde stappen, als artikel. */
function articleBody(def, lang) {
  const t = def.text[lang];
  const stepWord = lang === 'nl' ? 'Stap' : 'Step';
  const steps = def.stepOrder.map((key, i) => {
    const s = t.steps[key];
    return `## ${stepWord} ${i + 1} — ${s.title}\n\n${para(s.task)}\n\n${t.whatLabel}\n\n${para(s.explain)}`;
  });
  return [para(t.intro), ...steps, para(t.outro)].join('\n\n');
}

function buildGuide(def) {
  const lang = uiLang();
  return {
    id: def.id,
    title: { nl: def.text.nl.title, en: def.text.en.title },
    steps: def.stepOrder.map((key) => {
      const logic = def.logic[key];
      return {
        id: key,
        body: { nl: stepBody(def, 'nl', key), en: stepBody(def, 'en', key) },
        ...(logic.anchor ? { anchor: logic.anchor } : {}),
        ...(logic.check ? { check: logic.check } : {}),
        ...(logic.prepare ? { prepare: logic.prepare } : {}),
        ...(logic.reset ? { resetAsset: projectAsset(lang, logic.reset) } : {}),
      };
    }),
  };
}

/**
 * Start het begeleidingspaneel van een tutorial — dezelfde route voor de lintknop en voor het verzoek
 * van de app. `startGuide` gooit als er al een begeleiding van een ándere extensie loopt; die blijft
 * dan staan, en de gebruiker krijgt uitleg in plaats van een stille klik.
 */
function startTutorial(api, def) {
  try {
    api.help.startGuide(buildGuide(def));
  } catch (error) {
    api.ui.showNotification(uiLang() === 'nl'
      ? 'De tutorial kon niet starten: er loopt al een andere begeleiding. Sluit die eerst.'
      : 'The tutorial could not start: another guide is already running. Close it first.', 'error');
  }
}

const RIBBON_ICON = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 10 12 5 2 10l10 5 10-5z'/><path d='M6 12v5c3 3 9 3 12 0v-5'/></svg>";

module.exports = {
  onLoad(api) {
    api.help.registerArticles(TUTORIALS.map(def => ({
      id: def.id,
      kind: 'tutorial',
      order: def.order,
      title: { nl: def.text.nl.title, en: def.text.en.title },
      body: { nl: articleBody(def, 'nl'), en: articleBody(def, 'en') },
    })));

    // "Tutorial" en "Tutorials" zijn in het Nederlands en het Engels hetzelfde woord; het label van
    // een extensieknop is één tekst en vertaalt niet mee met de app.
    for (const def of TUTORIALS) {
      api.ui.addRibbonButton({
        tab: 'start',
        group: 'Tutorials',
        label: def.label,
        icon: RIBBON_ICON,
        onClick: () => startTutorial(api, def),
      });
    }

    // De app vraagt om een tutorial (`host:tutorial-requested`, contract 1.4): "Ja" op de tutorialvraag
    // na de eerste voltooide rondleiding. De app zendt pas uit als deze extensie actief is (ook direct
    // na installeren), en kijkt meteen daarna of er een begeleiding van ons loopt — anders opent hij
    // Help › Tutorials. Dus: alleen op een verzoek voor ons, en SYNCHROON starten.
    api.events.on(sdk.hostEvents.tutorialRequested || 'host:tutorial-requested', (data) => {
      if (!data || data.extensionId !== EXTENSION_ID) return;
      const def = TUTORIALS.find(d => d.id === data.tutorialId);
      if (def) startTutorial(api, def);
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
