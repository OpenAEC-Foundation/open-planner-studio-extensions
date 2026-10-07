/**
 * Tutorials voor Open Planner Studio — tutorial 1 "Je eerste planning", tutorial 2 "Relaties en het
 * kritieke pad", tutorial 3 "De kalender en datumafspraken", tutorial 4 "Plannen in uren", tutorial 5
 * "Resources en nivelleren", tutorial 6 "Voortgang en afwijking" en tutorial 7 "Rapporteren en delen"
 * (contract 1.4.0, permissies `help`, `ribbon` en `events`).
 *
 * Wat deze extensie doet:
 *   • api.help.registerArticles(...)  → de leesversies van de tutorials in Help › Tutorials;
 *   • api.ui.addRibbonButton(...)     → Start › Tutorials › "Tutorial 1" t/m "Tutorial 7"
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
 * tutorial 1 (Toon mij); de logica van tutorial 2 en 3; die van tutorial 4 en 5; de teksten `TEXT_1` t/m
 * `TEXT_5`; de stappen van tutorial 1 t/m 5; één blok voor tutorial 6 en 7 (logica, `TEXT_6`, `TEXT_7` en hun
 * stappen); en `onLoad`.
 *
 * De projectbestanden in `projects/<taal>/` zijn GEGENEREERD, niet met de hand gemaakt: in een
 * checkout van de app `npm run gen:tutorial-project -- --out <map>` en daarna `start-tut-1.ifc`,
 * `na-tut-1.ifc`, `na-tut-2.ifc`, `tussen-tut-3-bouwvak.ifc`, `na-tut-3.ifc`, `na-tut-4.ifc`,
 * `tussen-tut-5-resources.ifc`, `tussen-tut-5-toegewezen.ifc`, `tussen-tut-5-werkregel.ifc` en `na-tut-5.ifc` per taal
 * hierheen kopiëren. De getallen in de tekst
 * komen uit die standen (zie README.md voor de tabel): tutorial 1 uit `na-tut-1` (7 juni 2027, 14 juni,
 * Buitenspouwblad metselen als enige kritieke taak), tutorial 2 uit `na-tut-2` (6 augustus 2027, 21
 * taken, 45 werkdagen, 2 werkdagen speling), tutorial 3 uit `tussen-tut-3-bouwvak` (27 augustus 2027)
 * en `na-tut-3` (1 september 2027, 8 taken, 48 werkdagen), tutorial 4 uit `na-tut-4` (kloktijden van de
 * stort en de kraan, 3,25 en 3,38 dagen speling) en tutorial 5 uit `tussen-tut-5-werkregel` (30 augustus
 * 2027, 8 kritieke taken, 46 werkdagen, metselaar 5 dagen overbezet) en `na-tut-5` (17 kritieke taken,
 * nivelleervertraging 5).
 *
 * Tutorial 6 en 7 komen uit `na-tut-6` (basisplanning, statusdatum 28 juni 2027, voortgang; oplevering 31 augustus
 * 2027, 10 kritieke taken, 47 werkdagen); `na-tut-7` is gelijk aan `na-tut-6` (een rapport is geen projectdata).
 * Toon mij en Opnieuw van tutorial 6 stap 2–7 openen de tussenstanden `tussen-tut-6-baseline`, `-statusdatum`,
 * `-voorbereiding`, `-ontgraven`, `-fundering` en `-metselwerk` (vóór Bereken vastgelegd; de app rekent ze bij het
 * openen door: einde 30 augustus, 20 september, 14 september, 10 september, 1 september en 31 augustus 2027).
 * Kopieer ook `na-tut-6.ifc`, `na-tut-7.ifc` en de zes `tussen-tut-6-*.ifc` per taal naar `projects/<taal>/`.
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
/** Id van tutorial 4. */
const TUTORIAL_4_ID = 'tut-4-uren';
/** Id van tutorial 5. */
const TUTORIAL_5_ID = 'tut-5-resources';
/** Id van tutorial 6. */
const TUTORIAL_6_ID = 'tut-6-uitvoering';
/** Id van tutorial 7. */
const TUTORIAL_7_ID = 'tut-7-rapport';

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

/** Vingerafdruk van wat de berekening beïnvloedt (niet van de rekenuitkomst zelf): de taken (duur in dagen of
 *  uren, constraint, deadline, werkregel, nivelleervertraging), de toewijzingen (resource en inzet), de relaties
 *  (soort en lag) en de kalender (werkdagen en vrije dagen). */
function scheduleSignature(api) {
  const tasks = api.data.getTasks().map(t => [
    t.id, t.parentId || '', t.isMilestone ? 1 : 0, t.milestoneKind || '', t.time.scheduleDuration, t.time.durationUnit || '',
    t.constraint ? [t.constraint.type, t.constraint.date || '', t.constraint.hard ? 1 : 0] : '', t.deadline || '',
    t.time.durationMinutes === undefined ? '' : t.time.durationMinutes, t.workRule || '',
    t.levelingDelay || 0, t.levelingDelayMinutes || 0,
  ]);
  const assignments = api.data.getAssignments().map(a => [a.taskId, a.resourceId, a.unitsPerDay]);
  const sequences = api.data.getSequences().map(s => [
    s.predecessorId, s.successorId, s.type, s.lagDays, s.lagMinutes === undefined ? '' : s.lagMinutes, s.lagUnit || '',
    s.lagPercent === undefined ? '' : s.lagPercent,
  ]);
  const calendar = api.data.getCalendar();
  return JSON.stringify([
    api.data.getProject().id, sequences, tasks, assignments,
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

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TUTORIAL 4 EN 5 — de logica: uren, resources, werkregel en nivelleren
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// Tutorial 4 werkt op `na-tut-3`, tutorial 5 op `na-tut-4`. De getallen in de tekst (kloktijden, 3,25 en
// 3,38 dagen speling, 12 uur kraan, 30 augustus, 46 werkdagen, 17 kritieke taken, …) komen uit de standen
// `na-tut-4` en `na-tut-5` van de generator en uit wat-als-berekeningen op die standen (zie README).
//
// WAT DE EXTENSIE-API HIER NIET KAN, en wat daarvan het gevolg is:
//   • De instelling Urenplanning (en Toon werkregels en werk) is een instelling van de app, geen
//     documentdata. `api.data` kent geen instellingen. Tutorial 4 stap "Urenplanning aanzetten" leest de
//     bewaarde instelling (`ops-enableHourPlanning` in localStorage, zie settingsRegistry van de app) en
//     heeft geen Toon mij.
//   • Resources, toewijzingen en werkregels zijn te LEZEN (`getResources`, `getAssignments`, `task.workRule`)
//     maar niet te schrijven. De checks van tutorial 5 kunnen dus alles volgen; Toon mij opent per stap een
//     meegeleverde stand van de generator waarin de stap gedaan is: `tussen-tut-5-resources` (na-tut-4 + de
//     vijf resources), `tussen-tut-5-toegewezen` (+ alle twaalf toewijzingen, berekend),
//     `tussen-tut-5-werkregel` (+ stucwerk op Vast werk met twee stukadoors, berekend: de stand vóór het
//     nivelleren) en `na-tut-5`. De generator heeft geen stand per toewijsgroep of met Vast werk en nog één
//     stukadoor; Toon mij op stap 3–5 opent dus steeds de stand met álle toewijzingen, en op stap 6 die met
//     ook de tweede stukadoor (de tekst zegt dat).

// ── Urenplanning (tutorial 4) ─────────────────────────────────────────────────────────────────

/** De drie taken die in uren gaan, met hun duur in werkminuten (gelijk aan HOUR_TASKS van de generator). */
const HOUR_ORDER = ['pour', 'floor', 'roofElements'];
const HOUR_MINUTES = { pour: 360, floor: 300, roofElements: 360 }; // stort 6 u, kraan 5 u en 6 u
/** De wat-als van tutorial 4: de dakelementen kosten 12 uur kraan. */
const ROOF_LONG_MINUTES = 720;

/** Duur in werkminuten van een taak die in uren staat; `null` voor een dagtaak (of een onbekende taak). */
function hourMinutes(api, key) {
  const t = taskByKey(api, key);
  return t && t.time.durationUnit === 'hours' && typeof t.time.durationMinutes === 'number' ? t.time.durationMinutes : null;
}

/** De bewaarde instelling Urenplanning in de app (`settingsRegistry.ts`/`settingsStore.ts`: `ops-<naam>`). */
const HOUR_PLANNING_KEY = 'ops-enableHourPlanning';

/** De `ops-`-sleutels die nu op `true` staan (de vorm waarin de app een aangezette schakelaar bewaart). */
function trueSettingKeys() {
  const keys = new Set();
  const storage = window.localStorage;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith('ops-') && storage.getItem(key) === 'true') keys.add(key);
  }
  return keys;
}

/** Vangnet voor de controle hieronder: de schakelaars die bij de vorige blik (of de start van tutorial 4) aan
 *  stonden. Bijgewerkt bij elke controle, zodat ook uit- en weer aanzetten van een schakelaar telt. */
let trueSettingsSeen = null;

/**
 * Staat urenplanning aan? Een instelling van de app, geen projectdata: de extensie-API kent geen
 * instellingen, dus lezen we de bewaarde instelling. Wat de app daarover vastlegt (nagelopen in de app):
 * de standaard is uit en de sleutel ontbreekt dan; élke route die Urenplanning aanzet (Instellingen, de
 * melding "Urenplanning aanzetten", het veld Duur) schrijft `ops-enableHourPlanning` = `true`, en uitzetten
 * schrijft `false`. Een ontbrekende sleutel betekent dus "nooit veranderd, dus uit", of dat de app de
 * sleutel hernoemd heeft. Dat laatste mag een lezer niet laten vastlopen.
 *
 * Vangnet: staat de sleutel niet op `true`, maar is sinds de vorige controle (of de start van tutorial 4)
 * een ándere `ops-`-schakelaar op `true` gesprongen, dan heeft de lezer een instelling aangezet die wij niet
 * lezen. Dan gooit de controle met uitleg: de app meldt dat en de stap valt terug op "Klaar, volgende".
 * Zonder zo'n sprong blijft de controle gewoon wachten, zodat hij voor een gewone lezer betekenis houdt.
 * Stond de hernoemde schakelaar al aan, dan springt hij pas bij uit- en weer aanzetten; dat zegt de tekst.
 * Kan de opslag niet gelezen worden (geblokkeerd), dan gooit `localStorage` zelf, met hetzelfde gevolg.
 */
function hourPlanningOn() {
  if (window.localStorage.getItem(HOUR_PLANNING_KEY) === 'true') return true;
  if (trueSettingsSeen) {
    const now = trueSettingKeys();
    const switchedOn = [...now].filter(key => key !== HOUR_PLANNING_KEY && !trueSettingsSeen.has(key));
    trueSettingsSeen = now;
    if (switchedOn.length > 0) {
      throw new Error(uiLang() === 'nl'
        ? `De instelling Urenplanning is niet te lezen (${HOUR_PLANNING_KEY}; wel aangezet: ${switchedOn.join(', ')}). Staat Urenplanning aan, klik dan op Klaar, volgende.`
        : `The Hour planning setting cannot be read (${HOUR_PLANNING_KEY}; switched on instead: ${switchedOn.join(', ')}). If Hour planning is on, click Done, next.`);
    }
  }
  return false;
}

/** Zet een taak op `minutes` werkminuten in uren (zoals het veld Duur bij invoer "6h"). */
function setHourMinutes(api, key, minutes) {
  const t = taskByKey(api, key);
  if (!t || hourMinutes(api, key) === minutes) return;
  const hoursPerDay = api.data.getCalendar().hoursPerDay || 8;
  api.data.updateTask(t.id, {
    time: { durationUnit: 'hours', durationMinutes: minutes, scheduleDuration: minutes / (hoursPerDay * 60) },
  });
}

/** Het project zoals tutorial 3 het achterlaat: relaties, bouwvak en constraint. De deadline telt niet mee:
 *  die wordt in tutorial 3 heen en weer gezet. */
const afterTutorial3 = api => withBouwvak(api) && constraintSet(api);

const stortDone = api => hourMinutes(api, 'pour') === HOUR_MINUTES.pour;
const floorDone = api => hourMinutes(api, 'floor') === HOUR_MINUTES.floor;
// De dakelementen mogen ook op 12 uur staan (de wat-als): wie vanuit die stap Terug gaat, loopt niet vast.
const roofDone = api => [HOUR_MINUTES.roofElements, ROOF_LONG_MINUTES].includes(hourMinutes(api, 'roofElements'));
const roofIs = (api, minutes) => hourMinutes(api, 'roofElements') === minutes;
const hoursDone = api => afterTutorial3(api) && stortDone(api) && floorDone(api) && roofIs(api, HOUR_MINUTES.roofElements);

/** Toon mij, tutorial 4: het project na tutorial 3 (indien nodig als nieuw tabblad) met de uren t/m `upTo`. */
async function ensureHours(api, upTo, roofMinutes = HOUR_MINUTES.roofElements) {
  if (!afterTutorial3(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-3'));
  const count = HOUR_ORDER.indexOf(upTo) + 1;
  api.data.batch(() => {
    HOUR_ORDER.slice(0, count).forEach(key => setHourMinutes(api, key, key === 'roofElements' ? roofMinutes : HOUR_MINUTES[key]));
  });
}

// ── Resources, toewijzingen, werkregel en nivelleren (tutorial 5) ──────────────────────────────

/** De vijf resources van tutorial 5, gelijk aan RESOURCES in `scripts/tutorial-project.ts`. */
const RESOURCE_DEFS = {
  crew: { name: { nl: 'Timmerploeg', en: 'Carpentry crew' }, type: 'CREW', maxUnits: 1 },
  bricklayer: { name: { nl: 'Metselaar', en: 'Bricklayer' }, type: 'LABOR', maxUnits: 1 },
  crane: { name: { nl: 'Mobiele kraan', en: 'Mobile crane' }, type: 'EQUIPMENT', maxUnits: 1 },
  plasterer: { name: { nl: 'Stukadoor', en: 'Plasterer' }, type: 'SUBCONTRACTOR', maxUnits: 2 },
  concrete: { name: { nl: 'Beton', en: 'Concrete' }, type: 'MATERIAL', maxUnits: 50, unit: 'm³' },
};
const RESOURCE_ORDER = ['crew', 'bricklayer', 'crane', 'plasterer', 'concrete'];

const resourceByKey = (api, key, resources = api.data.getResources()) =>
  resources.find(r => hasName(r, RESOURCE_DEFS[key].name));

function resourceOk(r, def) {
  return !!r && r.type === def.type && Math.abs(r.maxUnits - def.maxUnits) < 1e-9
    && (!def.unit || norm(r.unitOfMeasure) === norm(def.unit));
}

/** Staan alle vijf de resources er, met het juiste type en de juiste capaciteit? Extra resources tellen
 *  niet mee (die kan Toon mij niet weghalen). */
const resourcesDone = api => {
  const resources = api.data.getResources();
  return RESOURCE_ORDER.every(key => resourceOk(resourceByKey(api, key, resources), RESOURCE_DEFS[key]));
};

/** De twaalf toewijzingen in drie groepen, in de volgorde van de stappen: [taak, resource, inzet per dag].
 *  Inzet `null` = elke inzet telt (het stucwerk gaat later van 1 naar 2 stukadoors). */
const ASSIGN_GROUPS = {
  bricklayer: [
    ['foundBrick', 'bricklayer', 1], ['innerLeaf', 'bricklayer', 1], ['outerLeaf', 'bricklayer', 1], ['breakThrough', 'bricklayer', 1],
  ],
  crewCrane: [
    ['rebar', 'crew', 1], ['floor', 'crew', 1], ['roofElements', 'crew', 1], ['frames', 'crew', 1],
    ['floor', 'crane', 1], ['roofElements', 'crane', 1],
  ],
  other: [['plaster', 'plasterer', null], ['pour', 'concrete', 8]], // beton: 8 m³ per dag
};
const ALL_ASSIGNMENTS = Object.values(ASSIGN_GROUPS).flat();

/** Bestaat deze toewijzing (taak, resource, inzet per dag)? */
function assignmentDone(api, [taskKey, resourceKey, units]) {
  const t = taskByKey(api, taskKey);
  const r = resourceByKey(api, resourceKey);
  return !!t && !!r && api.data.getAssignments().some(a => a.taskId === t.id && a.resourceId === r.id
    && (units === null || Math.abs(a.unitsPerDay - units) < 1e-9));
}
const assignmentsDone = (api, group) => resourcesDone(api) && ASSIGN_GROUPS[group].every(a => assignmentDone(api, a));

/** De werkregel van het stucwerk: Vast werk, twee stukadoors, dus 2 werkdagen (was 4). */
const PLASTER = { units: 2, days: 2 };
function workRuleDone(api) {
  const t = taskByKey(api, 'plaster');
  const r = resourceByKey(api, 'plasterer');
  if (!t || !r) return false;
  const a = api.data.getAssignments().find(x => x.taskId === t.id && x.resourceId === r.id);
  return t.workRule === 'FIXED_WORK' && !!a && Math.abs(a.unitsPerDay - PLASTER.units) < 1e-9
    && t.time.durationUnit !== 'hours' && Math.abs(t.time.scheduleDuration - PLASTER.days) < 1e-9;
}

/** Staat het stucwerk op Vast werk (de inzet mag nog 1 zijn)? */
const plasterRuleSet = (api) => {
  const t = taskByKey(api, 'plaster');
  return !!t && t.workRule === 'FIXED_WORK' && !!resourceByKey(api, 'plasterer');
};

/** Alles t/m de werkregel: resources, alle twaalf toewijzingen en het stucwerk op Vast werk. */
const setUpDone = api => tasksPresent(api) && resourcesDone(api) && ALL_ASSIGNMENTS.every(a => assignmentDone(api, a)) && workRuleDone(api);

/** Nivellering van het buitenspouwblad: de nivelleervertraging in werkdagen (5 in de tutorial). */
const levelingDelayOf = (api, key) => {
  const t = taskByKey(api, key);
  return t && typeof t.levelingDelay === 'number' ? t.levelingDelay : 0;
};
const levelingApplied = api => setUpDone(api) && levelingDelayOf(api, 'outerLeaf') > 0;

/** Haal alle nivelleervertragingen weg (zoals Resources › Nivellering › Nivellering wissen). */
function clearLeveling(api) {
  const delayed = api.data.getTasks().filter(t => (t.levelingDelay || 0) !== 0 || (t.levelingDelayMinutes || 0) !== 0);
  if (delayed.length === 0) return;
  api.data.batch(() => {
    for (const t of delayed) api.data.updateTask(t.id, { levelingDelay: 0, levelingDelayMinutes: 0 });
  });
}

/** Toon mij, tutorial 5 stap 2: het project na tutorial 4 met de vijf resources. De extensie kan geen
 *  resources aanmaken; ontbreken ze, dan opent Toon mij `tussen-tut-5-resources` (als nieuw tabblad). */
async function ensureResources(api) {
  if (!(afterTutorial4(api) && resourcesDone(api))) {
    await api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-5-resources'));
  }
}

/** De toewijsgroepen in de volgorde van stap 3, 4 en 5. */
const ASSIGN_ORDER = ['bricklayer', 'crewCrane', 'other'];

/** Toon mij, tutorial 5 stap 3–5: de toewijzingen t/m `group` (cumulatief). De extensie kan niet toewijzen en
 *  de generator heeft geen stand per groep; ontbreekt er een, dan opent Toon mij `tussen-tut-5-toegewezen`
 *  (als nieuw tabblad), met álle twaalf toewijzingen, berekend. */
async function ensureAssigned(api, group) {
  const groups = ASSIGN_ORDER.slice(0, ASSIGN_ORDER.indexOf(group) + 1);
  if (!(afterTutorial4(api) && groups.every(g => assignmentsDone(api, g)))) {
    await api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-5-toegewezen'));
  }
}

/** Toon mij, tutorial 5 stap 6 en 7: alle toewijzingen en het stucwerk op Vast werk (stap 6), of ook met twee
 *  stukadoors (stap 7, `full`). Er is geen stand met Vast werk en nog één stukadoor; ontbreekt er iets, dan
 *  opent Toon mij `tussen-tut-5-werkregel` (als nieuw tabblad): Vast werk, twee stukadoors, berekend. */
async function ensureWorkRule(api, full) {
  const done = tasksPresent(api) && afterTutorial4(api) && resourcesDone(api)
    && ALL_ASSIGNMENTS.every(a => assignmentDone(api, a)) && (full ? workRuleDone(api) : plasterRuleSet(api));
  if (!done) await api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-5-werkregel'));
}

/** De stand vóór het nivelleren: alles t/m de werkregel, berekend, zonder nivellering. Ontbreekt er iets, dan
 *  opent Toon mij `tussen-tut-5-werkregel` (als nieuw tabblad). Een nivellering in het eigen project (wie
 *  vanaf het nivelleren terug gaat) haalt Toon mij er weer uit. */
async function ensureBeforeLeveling(api) {
  if (!setUpDone(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-5-werkregel'));
  clearLeveling(api);
  api.data.recalculate();
}

/** De stand na het nivelleren is precies het resultaat van tutorial 5. */
async function ensureLeveled(api) {
  if (!levelingApplied(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-5'));
  api.data.recalculate();
}

/** Staat het project na tutorial 4: de taken, met de drie taken in uren (de duur van de dakelementen mag de wat-als zijn)? */
const afterTutorial4 = api => tasksPresent(api) && HOUR_ORDER.every(key => hourMinutes(api, key) !== null);

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
          'Start bouw is nog geselecteerd. Klik op *Start › Taken › Taak*, typ de naam en druk op Enter. Dubbelklik daarna in **Eigenschappen** in het veld **Duur**, zodat de 5 geselecteerd is, typ het aantal werkdagen en druk op Enter. Met één klik staat de cursor achter de 5 en wordt 2 dan 52. Doe dat voor deze drie taken, in deze volgorde:',
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
          'Start of construction is still selected. Click *Home › Tasks › Task*, type the name and press Enter. Then double-click the **Duration** field in **Properties**, so that the 5 is selected, type the number of working days and press Enter. With a single click the cursor sits after the 5, and 2 becomes 52. Do this for these three tasks, in this order:',
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
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-2.ifc). De regels achter deze tutorial staan in [Relaties en lag](docs://uitleg-relaties) en [Kritiek pad en speling](docs://uitleg-kritiek-pad). Hoe je het in je eigen project doet, lees je in [Relaties leggen](docs://howto-relaties-leggen). Elke kolom van de tabel, ook Voorgangers, staat in [Tabelkolommen](docs://ref-tabelkolommen).',
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
          'Een lag telt standaard in werkdagen. Beton hardt ook in het weekend uit; wil je dat laten meetellen, dan typ je `2.4 FS+3ed` (kalenderdagen), zie [Relaties en lag](docs://uitleg-relaties). Hier houden we het bij werkdagen.',
          'Druk daarna op F5, of klik op *Tabel › Planning › Bereken*.',
        ],
        explain: [
          'De cel toont `2.4 FS+3d`. De kolommen Start en Einde laten zien wat de relaties tot nu toe doen: Fundering storten staat op 18-06-2027, vrijdag. Funderingsmetselwerk begint op 24-06-2027, donderdag. Daartussen liggen drie werkdagen wachttijd: maandag 21, dinsdag 22 en woensdag 23 juni. Het weekend telt hier niet mee, want de lag staat in werkdagen; met `3ed` was het metselwerk op dinsdag 22 juni begonnen.',
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
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-2.ifc). Meer over de regels lees je in [Relaties en lag](docs://uitleg-relaties) en [Kritiek pad en speling](docs://uitleg-kritiek-pad). Hoe je het in je eigen project doet, lees je in [Relaties leggen](docs://howto-relaties-leggen). Elke kolom van de tabel, ook Voorgangers, staat in [Tabelkolommen](docs://ref-tabelkolommen).',
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
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-2.ifc). The rules behind this tutorial are in [Relations and lag](docs://uitleg-relaties) and [Critical path and float](docs://uitleg-kritiek-pad). How to do it in your own project is in [Adding relations](docs://howto-relaties-leggen). Every column of the table, including Predecessors, is in [Table columns](docs://ref-tabelkolommen).',
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
          'A lag counts in working days by default. Concrete also cures over the weekend; if you want that to count, you type `2.4 FS+3ed` (calendar days), see [Relations and lag](docs://uitleg-relaties). Here we stick to working days.',
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
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-2.ifc). You can read more about the rules in [Relations and lag](docs://uitleg-relaties) and [Critical path and float](docs://uitleg-kritiek-pad). How to do it in your own project is in [Adding relations](docs://howto-relaties-leggen). Every column of the table, including Predecessors, is in [Table columns](docs://ref-tabelkolommen).',
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
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-3.ifc). De regels achter deze tutorial staan in [Kalenders en werkdagen](docs://uitleg-kalenders) en [Constraints en deadlines](docs://uitleg-constraints). Hoe je het in je eigen project doet, lees je in [Feestdagen en bouwvak genereren](docs://howto-feestdagen-genereren) en [Een constraint of deadline zetten](docs://howto-constraint-deadline-zetten). Elk veld van het venster Kalenders en van het paneel Eigenschappen staat in [Kalendervensters](docs://ref-kalenders) en [Taakdialoog en eigenschappenpaneel](docs://ref-taak-eigenschappen).',
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
          'Waarom schuift de oplevering precies drie weken op, terwijl het meeste werk vóór de bouwvak valt? Kijk naar Tegelwerk. Dat wacht vijf werkdagen op de dekvloer, die maandag 26 juli klaar is. Dinsdag 27 tot en met vrijdag 30 juli zijn vier van die vijf wachtdagen. De vijfde zou maandag 2 augustus zijn, maar dat is bouwvak: die dag telt niet. De tegelzetter begint daarom pas op dinsdag 24 augustus in plaats van dinsdag 3 augustus, en alles daarna schuift mee. Het schilderwerk valt vóór de bouwvak en verandert niet. Een lag in werkdagen slaat de bouwvak over, ook als het om droogtijd gaat die in werkelijkheid doorloopt. Met `5ed` droogt de dekvloer ook in het weekend, maar de tegelzetter werkt in de bouwvak niet: het tegelwerk begint dan op maandag 23 augustus, één dag eerder (zie [Relaties en lag](docs://uitleg-relaties)).',
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
          'Schilderwerk duurt 3 werkdagen, maar loopt van 29 juli tot en met 23 augustus: de bouwvak ligt er middenin. Een feestdag of bouwvak midden in een taak telt niet mee; de taak loopt er gewoon overheen. Klik je op Schilderwerk, dan meldt het paneel *Eigenschappen* onder de datums en de duur: *⚠ Deze taak loopt over Bouwvak (Midden) — een vrije periode van 23 dagen (31-07-2027 t/m 22-08-2027).*',
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
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-3.ifc). Meer over de regels lees je in [Kalenders en werkdagen](docs://uitleg-kalenders) en [Constraints en deadlines](docs://uitleg-constraints). Hoe je het in je eigen project doet, lees je in [Feestdagen en bouwvak genereren](docs://howto-feestdagen-genereren) en [Een constraint of deadline zetten](docs://howto-constraint-deadline-zetten). Elk veld van het venster Kalenders en van het paneel Eigenschappen staat in [Kalendervensters](docs://ref-kalenders) en [Taakdialoog en eigenschappenpaneel](docs://ref-taak-eigenschappen).',
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
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-3.ifc). The rules behind this tutorial are in [Calendars and working days](docs://uitleg-kalenders) and [Constraints and deadlines](docs://uitleg-constraints). How to do it in your own project is in [Generating holidays and the construction holiday](docs://howto-feestdagen-genereren) and [Setting a constraint or deadline](docs://howto-constraint-deadline-zetten). Every field of the Calendars window and of the Properties panel is in [Calendar windows](docs://ref-kalenders) and [Task dialog and properties panel](docs://ref-taak-eigenschappen).',
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
          'Why does the handover move by exactly three weeks, when most of the work falls before the construction holiday? Look at Tiling. It waits five working days for the screed, which is finished on Monday 26 July. Tuesday 27 to Friday 30 July are four of those five waiting days. The fifth would be Monday 2 August, but that is construction holiday: that day does not count. So the tiler starts on Tuesday 24 August instead of Tuesday 3 August, and everything after that moves along. The painting falls before the construction holiday and does not change. A lag in working days skips the construction holiday, even when it is drying time that carries on in reality. With `5ed` the screed also dries over the weekend, but the tiler does not work during the construction holiday: tiling then starts on Monday 23 August, one day earlier (see [Relations and lag](docs://uitleg-relaties)).',
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
          'Painting takes 3 working days, but runs from 29 July up to and including 23 August: the construction holiday is in the middle of it. A holiday or construction holiday in the middle of a task does not count; the task simply runs across it. Click Painting and the *Properties* panel says below the dates and duration: *⚠ This task runs through Bouwvak (Midden) — a 23-day non-working period (31-07-2027 to 22-08-2027).*',
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
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-3.ifc). You can read more about the rules in [Calendars and working days](docs://uitleg-kalenders) and [Constraints and deadlines](docs://uitleg-constraints). How to do it in your own project is in [Generating holidays and the construction holiday](docs://howto-feestdagen-genereren) and [Setting a constraint or deadline](docs://howto-constraint-deadline-zetten). Every field of the Calendars window and of the Properties panel is in [Calendar windows](docs://ref-kalenders) and [Task dialog and properties panel](docs://ref-taak-eigenschappen).',
        ],
      },
    },
  },
};

// ── Tutorial 4: Plannen in uren ────────────────────────────────────────────────────────────────

const TEXT_4 = {
  nl: {
    title: 'Plannen in uren',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Plannen in uren',
      '## Wat je bouwt',
      'Tot nu toe telde elke taak in hele werkdagen. Dat is te grof voor drie klussen: de betonstort is in zes uur klaar en de mobiele kraan legt de kanaalplaten in vijf uur en de dakelementen in zes uur. In deze tutorial zet je urenplanning aan en plan je die drie taken in uren. Daarna reken je en zie je hoe de app dagen en uren door elkaar rekent.',
      'Aan het eind hebben de drie taken een kloktijd en blijft de oplevering op woensdag 1 september 2027 staan. Je hebt gezien waarom een dagtaak nooit midden op een dag begint en wat er gebeurt met de uren die daardoor ongebruikt blijven.',
      '## Uitgangspunt',
      'Je hebt tutorial 3 afgerond: de planning met de bouwvak, de constraint op de kozijnen en de deadline op de oplevering, berekend, met de oplevering op woensdag 1 september 2027. Heb je dat niet, [open dan het resultaat van tutorial 3](project://projects/nl/na-tut-3.ifc).',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 4*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar. Alleen de instelling Urenplanning kan het paneel niet voor je aanzetten: dat doe je zelf in de tweede stap. **Opnieuw** in de stap *De betonstort: 6 uur* laadt het resultaat van tutorial 3 opnieuw.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Urenplanning is een instelling van de app, de eenheid hoort bij de taak.** Je zette hem één keer aan en koos daarna per taak: drie taken in uren (6h, 5h en 6h), de rest in dagen. Dat is een gemengde planning. Je gebruikt uren alleen waar een dag te grof is; voor al het andere zijn dagen overzichtelijker.',
      '- **Een urentaak telt werkminuten door de werktijdblokken heen.** De stort van 6 uur liep van 07:00 tot 14:00 met de pauze ertussen. Twaalf uur kraan liep door in de volgende dag, van dinsdag 07:00 tot woensdag 11:00.',
      '- **Een dagtaak begint nooit midden op een dag.** Dakbedekking begon op de eerstvolgende werkdag na de dakelementen en niet om 14:00: woensdag 7 juli bij 6 uur kraan, donderdag 8 juli bij 12 uur.',
      '- **Wat een dagtaak niet kan gebruiken, wordt speling.** De 2 uur van de middag na de stort, een kwart dag, werden speling: 3,25 dagen in plaats van 3. Bij 12 uur kraan kromp de speling van het dak met een dag, van 3 naar 2 werkdagen. De oplevering schuift pas als een keten geen speling meer heeft.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-4.ifc). De regels achter deze tutorial staan in [Dagen en uren](docs://uitleg-dagen-en-uren). Hoe je het in je eigen project doet, lees je in [Urenplanning aanzetten](docs://howto-urenplanning-aanzetten). Wat de instelling Urenplanning inschakelen nog meer verandert, staat in [Instellingen](docs://ref-instellingen-lijst).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat zoals je het na tutorial 3 achterliet: met de bouwvak, de constraint op de kozijnen en de deadline op de oplevering. Heb je dat niet, [open dan het resultaat van tutorial 3](project://projects/nl/na-tut-3.ifc). Kijk in de statusbalk en in de kolom Duur van de takenlijst.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 01-09-2027* en *Kritiek pad: 8 taken, 48 werkdagen*. Achter elke duur in de takenlijst staat een *d* van dag: 2d, 3d, 1d. Alles telt in hele werkdagen.',
          'Voor drie klussen is dat te grof. De betonstort is in zes uur klaar. De mobiele kraan legt de kanaalplaten van de vloer in vijf uur en de dakelementen in zes uur. Als hele dagen telt de planning daar respectievelijk 2, 3 en 2 uur te veel. Daarom plan je ze in uren. Dat kan alleen als urenplanning aan staat; dat doe je in de volgende stap.',
        ],
      },
      urenplanning: {
        title: 'Urenplanning aanzetten',
        task: [
          'Klik op *Instellingen › Project › Instellingen* en open het tabblad **Planning**. Zet onder **Urenplanning** het vinkje bij **Urenplanning inschakelen** aan en sluit het venster met **Sluiten**.',
          '(Staat het vinkje al aan, dan is deze stap meteen klaar. Gaat het paneel dan niet verder, zet het vinkje uit en weer aan.)',
        ],
        explain: [
          'Onder **Urenplanning** staat nu een tweede vinkje: **Gemengde dag/uur-planning toestaan**, standaard aan. Daarmee kies je per taak of hij in dagen of in uren telt, en staan dagtaken en urentaken in één planning naast elkaar. Zo plan je zo meteen drie taken in uren en laat je de rest in dagen.',
          'Zolang urenplanning uit staat, werkt de app volledig in dagen en neemt hij een duur in uren niet over: typ je `6h` in het veld Duur, dan meldt het veld *Schakel urenplanning in om deze urentaak te bewerken.* Het is een instelling van de app, niet van dit project: je zet hem één keer aan. Onder *Beeld › Tijdschaal* kun je nu ook de schaal **Uur** kiezen.',
        ],
      },
      stort: {
        title: 'De betonstort: 6 uur',
        task: [
          'Klik in de takenlijst op **Fundering storten** (2.4). Dubbelklik in het paneel *Eigenschappen* (scroll zo nodig omlaag) in het veld **Duur**, zodat de 1 geselecteerd is, typ `6h` en druk op Enter. De h staat voor uur (*hour*).',
        ],
        explain: [
          'In de takenlijst staat bij Fundering storten nu *6h* in plaats van 1d, en in *Eigenschappen* staat naast het veld Duur de eenheid **Uren**. Onderaan in de statusbalk staat weer *Verouderd — herbereken (F5)*: een nieuwe duur verandert de datums pas als je rekent.',
          'Waarom 6 uur en niet 8? Een werkdag heeft in deze kalender 8 netto-uren: van 07:00 tot 12:00 en van 13:00 tot 16:00, met een uur pauze. Een stort van 6 uur beslaat daar 0,75 van. Als taak van 1d zou de planning de stort een hele werkdag laten bezetten.',
        ],
      },
      'kraan-vloer': {
        title: 'De kraan: 5 uur voor de kanaalplaten',
        task: [
          'Klik op **Kanaalplaatvloer leggen** (2.6). Dubbelklik in het veld **Duur**, typ `5h` en druk op Enter. De kraan legt de kanaalplaten van de vloer in 5 uur.',
        ],
        explain: [
          'Ook hier staat nu *5h* in de takenlijst. Een kraaninzet in uren is precies waar urenplanning voor dient: een kraan huur je per uur en niet per dag, en 5 uur is een ochtend. De rest van de taken blijft in dagen. Er is nog niets herberekend.',
        ],
      },
      'kraan-dak': {
        title: 'De kraan: 6 uur voor de dakelementen',
        task: [
          'Klik op **Dakelementen plaatsen** (3.3). Dubbelklik in het veld **Duur**, typ `6h` en druk op Enter.',
        ],
        explain: [
          'Je hebt nu drie taken in uren: Fundering storten (6h), Kanaalplaatvloer leggen (5h) en Dakelementen plaatsen (6h). Alle andere taken staan nog in dagen. Dat is een gemengde planning. Wat de app daarmee doet, zie je als je rekent.',
        ],
      },
      berekenen: {
        title: 'Rekenen en de klok lezen',
        task: [
          'Klik op *Start › Planning › Bereken*, of druk op F5.',
          'Ga daarna naar het tabblad **Tabel**. De kolommen **Start** en **Einde** zijn te smal voor een kloktijd. Sleep de rechterrand van beide kolomkoppen ongeveer 40 pixels naar rechts.',
        ],
        explain: [
          'De drie urentaken hebben nu een kloktijd. Fundering storten loopt op vrijdag 18 juni van 07:00 tot 14:00: 5 uur in de ochtend en 1 uur na de pauze van 12:00 tot 13:00. Kanaalplaatvloer leggen staat op maandag 28 juni van 07:00 tot 12:00 en Dakelementen plaatsen op dinsdag 6 juli van 07:00 tot 14:00.',
          'De oplevering is niet verschoven: de statusbalk zegt nog steeds *Einde: 01-09-2027* en *Kritiek pad: 8 taken, 48 werkdagen*. Geen van de drie urentaken ligt op het kritieke pad, dus de uren raken de einddatum niet.',
          'Kijk in de kolom **Totale speling** (kop *Tot…*): 3,25d bij de stort en de dakelementen en 3,38d bij de vloer (3,375). De dagtaken eromheen hebben 3 dagen speling. Het verschil zijn de uren die de dagtaak erna niet kan gebruiken. Een dagtaak begint nooit midden op een dag, dus de stort die om 14:00 klaar is, laat de laatste 2 uur van die werkdag liggen: een kwart dag, de 0,25. De vloer is al om 12:00 klaar. De 3 uur van 13:00 tot 16:00 zijn 0,375 dag.',
        ],
      },
      'langere-kraan': {
        title: 'Wat als de kraan langer nodig is?',
        task: [
          'Het dak komt toch in twee ritten en de kraan is 12 uur nodig. Klik op **Dakelementen plaatsen** (3.3), dubbelklik in het paneel *Eigenschappen* in het veld **Duur**, typ `12h`, druk op Enter en druk op F5.',
        ],
        explain: [
          'Een werkdag heeft 8 uur, dus 12 uur past niet in één dag. Dakelementen plaatsen loopt nu van dinsdag 6 juli 07:00 tot woensdag 7 juli 11:00: 8 uur op dinsdag en 4 uur op woensdag.',
          'Dakbedekking aanbrengen is een dagtaak. Die begint niet midden op woensdag, maar op de eerstvolgende werkdag: donderdag 8 juli, een dag later dan eerst, en loopt tot vrijdag 9 juli. De rest van woensdag, 4 netto-uren, kan geen dagtaak gebruiken en komt terug als speling: Dakelementen plaatsen heeft nu 2,5 dagen speling in plaats van 3,25.',
          'De oplevering schuift niet: de statusbalk zegt nog steeds *Einde: 01-09-2027* en *Kritiek pad: 8 taken, 48 werkdagen*. Wel is de speling van het dak kleiner geworden: het binnenspouwblad en de dakbedekking hebben 2 werkdagen speling in plaats van 3.',
        ],
      },
      terugzetten: {
        title: 'Terug naar 6 uur',
        task: [
          'Dubbelklik in het veld **Duur** van Dakelementen plaatsen, typ `6h`, druk op Enter en druk op F5.',
        ],
        explain: [
          'Alles staat weer zoals na het eerste rekenen: Dakelementen plaatsen op dinsdag 6 juli van 07:00 tot 14:00 met 3,25 dagen speling, Dakbedekking weer vanaf woensdag 7 juli, *Einde: 01-09-2027* en *Kritiek pad: 8 taken, 48 werkdagen*.',
          'Dit is het resultaat van tutorial 4 en het beginpunt van tutorial 5: daarin komen de kraan, de ploeg en de andere resources erbij.',
        ],
        panelOnly: [
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-4.ifc). Meer over de regels lees je in [Dagen en uren](docs://uitleg-dagen-en-uren). Hoe je het in je eigen project doet, lees je in [Urenplanning aanzetten](docs://howto-urenplanning-aanzetten). Wat de instelling Urenplanning inschakelen nog meer verandert, staat in [Instellingen](docs://ref-instellingen-lijst).',
        ],
      },
    },
  },
  en: {
    title: 'Planning in hours',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Planning in hours',
      '## What you build',
      'So far every task has counted in whole working days. That is too coarse for three jobs: the concrete pour is done in six hours, and the mobile crane places the hollow-core slabs in five hours and the roof elements in six. In this tutorial you turn on hour planning and plan those three tasks in hours. Then you calculate and see how the app mixes days and hours.',
      'At the end the three tasks have a clock time and the handover stays on Wednesday 1 September 2027. You have seen why a day task never starts in the middle of a day and what happens to the hours that are left unused because of that.',
      '## Starting point',
      'You have finished tutorial 3: the schedule with the construction holiday, the constraint on the window frames and the deadline on the handover, calculated, with the handover on Wednesday 1 September 2027. If you have not, [open the result of tutorial 3](project://projects/en/na-tut-3.ifc).',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 4* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you. Only the Hour planning setting cannot be turned on by the panel: you do that yourself in the second step. **Start over** in the step *The concrete pour: 6 hours* reloads the result of tutorial 3.',
    ],
    outro: [
      '## What you have learned',
      '- **Hour planning is a setting of the app, the unit belongs to the task.** You turned it on once and then chose per task: three tasks in hours (6h, 5h and 6h), the rest in days. That is a mixed schedule. You use hours only where a day is too coarse; for everything else days are clearer.',
      '- **An hour task counts working minutes through the working-time blocks.** The 6-hour pour ran from 07:00 to 14:00 with the break in between. Twelve hours of crane carried on into the next day, from Tuesday 07:00 to Wednesday 11:00.',
      '- **A day task never starts in the middle of a day.** Applying the roofing started on the first working day after the roof elements and not at 14:00: Wednesday 7 July with 6 hours of crane, Thursday 8 July with 12 hours.',
      '- **What a day task cannot use becomes float.** The 2 hours of the afternoon after the pour, a quarter of a day, became float: 3.25 days instead of 3. With 12 hours of crane the float of the roof shrank by a day, from 3 to 2 working days. The handover only moves when a chain has no float left.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-4.ifc). The rules behind this tutorial are in [Days and hours](docs://uitleg-dagen-en-uren). How to do it in your own project is in [Turning on hour planning](docs://howto-urenplanning-aanzetten). What else the setting Enable hour planning changes is in [Settings](docs://ref-instellingen-lijst).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open as you left it after tutorial 3: with the construction holiday, the constraint on the window frames and the deadline on the handover. If not, [open the result of tutorial 3](project://projects/en/na-tut-3.ifc). Look at the status bar and at the Duration column of the task list.',
        ],
        explain: [
          'The status bar says *End: 01-09-2027* and *Critical path: 8 tasks, 48 work days*. Every duration in the task list ends in a *d* for day: 2d, 3d, 1d. Everything counts in whole working days.',
          'For three jobs that is too coarse. The concrete pour is done in six hours. The mobile crane places the hollow-core slabs of the floor in five hours and the roof elements in six. Counted as whole days, the schedule counts 2, 3 and 2 hours too many for them. That is why you plan them in hours. That only works when hour planning is on; you do that in the next step.',
        ],
      },
      urenplanning: {
        title: 'Turning on hour planning',
        task: [
          'Click *Settings › Project › Settings* and open the **Planning** tab. Under **Hour planning**, tick **Enable hour planning** and close the window with **Close**.',
          '(If the box is already ticked, this step is done straight away. If the panel does not move on, untick the box and tick it again.)',
        ],
        explain: [
          'Under **Hour planning** there is now a second box: **Allow mixed day/hour planning**, on by default. With it you choose per task whether it counts in days or in hours, and day tasks and hour tasks sit side by side in one schedule. That is how you plan three tasks in hours in a moment and leave the rest in days.',
          'As long as hour planning is off, the app works entirely in days and does not accept a duration in hours: type `6h` in the Duration field and the field says *Enable hour planning to edit this hour task.* It is a setting of the app, not of this project: you turn it on once. Under *View › Time Scale* you can now also choose the scale **Hour**.',
        ],
      },
      stort: {
        title: 'The concrete pour: 6 hours',
        task: [
          'Click **Pour foundation** (2.4) in the task list. In the *Properties* panel (scroll down if needed), double-click the **Duration** field, so that the 1 is selected, type `6h` and press Enter. The h stands for hour.',
        ],
        explain: [
          'In the task list Pour foundation now says *6h* instead of 1d, and in *Properties* the unit **Hours** sits next to the Duration field. At the bottom, the status bar says *Out of date — recalculate (F5)* again: a new duration only changes the dates when you calculate.',
          'Why 6 hours and not 8? In this calendar a working day has 8 net hours: from 07:00 to 12:00 and from 13:00 to 16:00, with an hour of break. A 6-hour pour takes 0.75 of that. As a task of 1d the schedule would let the pour occupy a whole working day.',
        ],
      },
      'kraan-vloer': {
        title: 'The crane: 5 hours for the slabs',
        task: [
          'Click **Lay hollow-core floor** (2.6). Double-click the **Duration** field, type `5h` and press Enter. The crane places the hollow-core slabs of the floor in 5 hours.',
        ],
        explain: [
          'Here too the task list now says *5h*. Crane work in hours is exactly what hour planning is for: you hire a crane by the hour and not by the day, and 5 hours is a morning. The rest of the tasks stays in days. Nothing has been recalculated yet.',
        ],
      },
      'kraan-dak': {
        title: 'The crane: 6 hours for the roof elements',
        task: [
          'Click **Place roof elements** (3.3). Double-click the **Duration** field, type `6h` and press Enter.',
        ],
        explain: [
          'You now have three tasks in hours: Pour foundation (6h), Lay hollow-core floor (5h) and Place roof elements (6h). All other tasks are still in days. That is a mixed schedule. What the app does with it, you see when you calculate.',
        ],
      },
      berekenen: {
        title: 'Calculating and reading the clock',
        task: [
          'Click *Home › Schedule › Calculate*, or press F5.',
          'Then go to the **Table** tab. The **Start** and **Finish** columns are too narrow for a clock time. Drag the right edge of both column headers about 40 pixels to the right.',
        ],
        explain: [
          'The three hour tasks now have a clock time. Pour foundation runs on Friday 18 June from 07:00 to 14:00: 5 hours in the morning and 1 hour after the break from 12:00 to 13:00. Lay hollow-core floor is on Monday 28 June from 07:00 to 12:00 and Place roof elements on Tuesday 6 July from 07:00 to 14:00.',
          'The handover has not moved: the status bar still says *End: 01-09-2027* and *Critical path: 8 tasks, 48 work days*. None of the three hour tasks is on the critical path, so the hours do not touch the finish date.',
          'Look at the **Total float** column (header *Tot…*): 3.25d for the pour and the roof elements and 3.38d for the floor (3.375). The day tasks around them have 3 days of float. The difference is the hours that the day task after them cannot use. A day task never starts in the middle of a day, so the pour that is done at 14:00 leaves the last 2 hours of that working day unused: a quarter of a day, the 0.25. The floor is already done at 12:00. The 3 hours from 13:00 to 16:00 are 0.375 of a day.',
        ],
      },
      'langere-kraan': {
        title: 'What if the crane is needed longer?',
        task: [
          'The roof comes in two lifts after all and the crane is needed for 12 hours. Click **Place roof elements** (3.3), double-click the **Duration** field in the *Properties* panel, type `12h`, press Enter and press F5.',
        ],
        explain: [
          'A working day has 8 hours, so 12 hours does not fit in one day. Place roof elements now runs from Tuesday 6 July 07:00 to Wednesday 7 July 11:00: 8 hours on Tuesday and 4 hours on Wednesday.',
          'Apply roofing is a day task. It does not start in the middle of Wednesday, but on the first working day after: Thursday 8 July, a day later than before, and it runs until Friday 9 July. The rest of Wednesday, 4 net hours, cannot be used by a day task and comes back as float: Place roof elements now has 2.5 days of float instead of 3.25.',
          'The handover does not move: the status bar still says *End: 01-09-2027* and *Critical path: 8 tasks, 48 work days*. The float of the roof has become smaller, though: the inner cavity leaf and the roofing have 2 working days of float instead of 3.',
        ],
      },
      terugzetten: {
        title: 'Back to 6 hours',
        task: [
          'Double-click the **Duration** field of Place roof elements, type `6h`, press Enter and press F5.',
        ],
        explain: [
          'Everything is back as after the first calculation: Place roof elements on Tuesday 6 July from 07:00 to 14:00 with 3.25 days of float, Apply roofing again from Wednesday 7 July, *End: 01-09-2027* and *Critical path: 8 tasks, 48 work days*.',
          'This is the result of tutorial 4 and the starting point of tutorial 5: in that one the crane, the crew and the other resources are added.',
        ],
        panelOnly: [
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-4.ifc). You can read more about the rules in [Days and hours](docs://uitleg-dagen-en-uren). How to do it in your own project is in [Turning on hour planning](docs://howto-urenplanning-aanzetten). What else the setting Enable hour planning changes is in [Settings](docs://ref-instellingen-lijst).',
        ],
      },
    },
  },
};

// ── Tutorial 5: Resources en nivelleren ────────────────────────────────────────────────────────

const TEXT_5 = {
  nl: {
    title: 'Resources en nivelleren',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Resources en nivelleren',
      '## Wat je bouwt',
      'Je zet de mensen en machines in de planning van de aanbouw: vijf resources en twaalf toewijzingen, van de timmerploeg tot het beton voor de stort. Daarna stel je de werkregel van het stucwerk in, lees je in het histogram wie wanneer werkt en ontdek je dat één metselaar op twee muren tegelijk staat. Die overbezetting los je op met nivelleren.',
      'Aan het eind is er geen overbezetting meer. De oplevering staat op maandag 30 augustus 2027, twee werkdagen eerder dan in tutorial 4, doordat het stucwerk met twee stukadoors korter wordt. Je hebt gezien dat nivelleren het buitenspouwblad vijf werkdagen laat wachten zonder dat de oplevering schuift, en wat dat de taak kost.',
      '## Uitgangspunt',
      'Je hebt tutorial 4 afgerond: het project met de betonstort en de twee kraaninzetten in uren, berekend, met de oplevering op woensdag 1 september 2027. Heb je dat niet, [open dan het resultaat van tutorial 4](project://projects/nl/na-tut-4.ifc). Meldt de app daarbij *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**.',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 5*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar. Een extensie kan geen resources, toewijzingen of werkregels aanmaken; daarom opent Toon mij in deze tutorial zo nodig een meegeleverd project als nieuw tabblad, waarin de stap al gedaan is. Bij de drie toewijsstappen is dat steeds het project met alle twaalf toewijzingen, en bij de werkregel staat ook de tweede stukadoor er al in. **Opnieuw** laadt de beginstand van een stap opnieuw: in de stap *Vijf resources aanmaken* het resultaat van tutorial 4, in *De metselaar op vier taken* dat resultaat met de vijf resources, in *De werkregel: Vast werk* het project met alle toewijzingen en in *Nivelleren* het project vóór het nivelleren.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een resource heeft een capaciteit en een toewijzing zet hem op een taak.** De app legt per werkdag de vraag naast *Max. eenheden*. De metselaar, met capaciteit 1, kreeg op 5 dagen 2 gevraagd: dat is overbezetting.',
      '- **Het histogram weegt uren mee.** De kraan stond op 28 juni en 6 juli voor 0,625 en 0,75 eenheid: 5 en 6 van de 8 werkuren van die dag.',
      '- **De werkregel bepaalt wat meebeweegt als je de inzet wijzigt.** Met Vast werk werd het stucwerk met twee stukadoors 2 werkdagen in plaats van 4 en de oplevering twee werkdagen eerder, maandag 30 augustus. Met de standaardregel was het werk verdubbeld.',
      '- **Relaties kennen geen capaciteit.** Volgens de relaties mochten het binnen- en buitenspouwblad tegelijk, maar met één metselaar kan dat niet. Dat zie je pas met resources.',
      '- **Nivelleren laat taken later beginnen, meer niet, en gebruikt daarvoor speling.** Het buitenspouwblad wachtte 5 werkdagen en de oplevering bleef op 30 augustus, maar de taak is nu kritiek: loopt hij uit, dan schuift de oplevering.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-5.ifc). De regels achter deze tutorial staan in [Werkregels: duur, inzet en werk](docs://uitleg-werkregels) en [Nivelleren](docs://uitleg-nivelleren). Hoe je het in je eigen project doet, lees je in [Resources beheren](docs://howto-resources-beheren), [Resources toewijzen met een curve](docs://howto-resource-toewijzen), [Werkregel kiezen](docs://howto-werkregel-kiezen) en [Overbezetting oplossen](docs://howto-overbezetting-oplossen). Elk veld en elke knop staat in [Resourcepaneel](docs://ref-resourcepaneel) en [Nivelleringsopties](docs://ref-nivellering).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat met de drie taken in uren uit tutorial 4: Fundering storten (6h), Kanaalplaatvloer leggen (5h) en Dakelementen plaatsen (6h). Heb je dat niet, [open dan het resultaat van tutorial 4](project://projects/nl/na-tut-4.ifc). Meldt de app *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**. Kijk in de statusbalk.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 01-09-2027* en *Kritiek pad: 8 taken, 48 werkdagen*, en er staat geen melding over resources.',
          'De taken hebben een duur, maar niemand voert ze uit. De app weet niet wie de metselaar is, dat er maar één kraan is en dat die niet op twee plekken tegelijk kan staan. Die kennis zit in resources: mensen, machines en materiaal, elk met een capaciteit. Zodra ze er zijn, kan de app uitrekenen of de planning te veel van ze vraagt.',
        ],
      },
      resources: {
        title: 'Vijf resources aanmaken',
        task: [
          'Klik op *Resources › Beheer › Nieuwe resource*. Het resourcepaneel neemt de werkruimte over, met een lege rij onderaan de tabel. Typ de naam, kies het **Type** en druk op Enter: er opent dan direct een lege rij voor de volgende. Maak zo deze vijf resources:',
          '- `Timmerploeg`, type **Ploeg**: de ploeg voor wapening, vloer, dak en kozijnen.\n- `Metselaar`, type **Arbeid**: metselt de fundering en de spouwmuren en breekt de achtergevel door.\n- `Mobiele kraan`, type **Materieel**: legt de kanaalplaten en de dakelementen.\n- `Stukadoor`, type **Onderaannemer**, **Max. eenheden** `2`: een onderaannemer die met twee man kan komen.\n- `Beton`, type **Materiaal**, **Max. eenheden** `50` en **Eenheid** `m³`: het beton voor de stort, in kubieke meter per dag.',
          'Max. eenheden en Eenheid vul je in de rij in voordat je op Enter drukt. Dubbelklik in het vak Max. eenheden, zodat de 1 geselecteerd is, en typ het getal: met één klik komt de cursor naast de 1 en wordt 2 dan 21. Druk na de vijfde op Esc.',
          '**Toon mij** opent hier het resultaat van tutorial 4 met de vijf resources erin, als nieuw tabblad. Resources aanmaken kan het paneel zelf niet.',
        ],
        explain: [
          'In het resourcepaneel staan vijf rijen. De **Max. eenheden** is de capaciteit per werkdag: 1 is één persoon of één machine, 2 zijn er twee en bij het beton zijn het 50 m³. Dat getal gebruikt de app straks als grens: vraagt de planning op één dag meer dan de capaciteit, dan is de resource overbezet.',
          'Het type is vooral een etiket. Alleen **Materiaal** rekent anders: een materiaal stuurt de duur van een taak nooit en wordt niet genivelleerd. Een kraan en een metselaar behandelt de app hetzelfde. Er staat nog niets op een taak: de resources bestaan alleen nog.',
        ],
      },
      'toewijzen-metselaar': {
        title: 'De metselaar op vier taken',
        task: [
          'Sluit het resourcepaneel met het kruisje rechtsboven en selecteer in de takenlijst **Funderingsmetselwerk** (2.5). Klik op *Resources › Toewijzing › Toewijzen ▾*, laat **Eenh./dag** op 1 en **Curve** op Uniform staan en klik op **Metselaar**. Doe hetzelfde voor Binnenspouwblad metselen (3.1), Buitenspouwblad metselen (3.2) en Achtergevel doorbreken (3.6).',
          '**Toon mij** opent hier, als nieuw tabblad, het project waarin alle twaalf toewijzingen al staan, ook die van de volgende twee stappen. Toewijzen kan het paneel zelf niet, en een project met alleen de metselaar is er niet.',
        ],
        explain: [
          'De metselaar staat nu op vier taken. Selecteer je een van die taken, dan staat in *Eigenschappen* onder **Toewijzingen**: Metselaar met Eenh./dag 1. Die inzet is hoeveel van de resource er per werkdag aan de taak werkt. De curve, hier Uniform, verdeelt het over de dagen van de taak: elke dag evenveel.',
          'Onderaan in de statusbalk staat nu *⚠ 1 resource(s) overbezet*. Daar kom je later in deze tutorial op terug.',
        ],
      },
      'toewijzen-ploeg-kraan': {
        title: 'De timmerploeg en de kraan',
        task: [
          'Wijs op dezelfde manier de **Timmerploeg** toe aan Wapening en bekisting fundering (2.2), Kanaalplaatvloer leggen (2.6), Dakelementen plaatsen (3.3) en Kozijnen plaatsen (3.5). Wijs daarna de **Mobiele kraan** toe aan Kanaalplaatvloer leggen (2.6) en Dakelementen plaatsen (3.3). Een taak kan meer dan één resource hebben: de vloer en de dakelementen staan straks op ploeg én kraan.',
          '**Toon mij** opent hier, net als in de vorige stap, het project met alle twaalf toewijzingen als nieuw tabblad, dus ook met die van de volgende stap.',
        ],
        explain: [
          'De vloer en de dakelementen hebben nu twee resources. Selecteer Kanaalplaatvloer leggen: onder Toewijzingen staan de Timmerploeg en de Mobiele kraan, allebei met Eenh./dag 1. Dat is één ploeg en één kraan op een taak van 5 uur. Hoeveel dat per werkdag telt, zie je straks in het histogram.',
        ],
      },
      'toewijzen-overig': {
        title: 'De stukadoor en het beton',
        task: [
          'Wijs de **Stukadoor** toe aan Stucwerk (4.2). Wijs daarna het **Beton** toe aan Fundering storten (2.4): dubbelklik in het venster van Toewijzen ▾ eerst in het vak **Eenh./dag**, typ `8` en klik dan op **Beton**. Dat is 8 m³ beton per dag.',
          '**Toon mij** opent hier het project met alle twaalf toewijzingen, als nieuw tabblad.',
        ],
        explain: [
          'Je hebt nu twaalf toewijzingen: vier voor de metselaar, vier voor de timmerploeg, twee voor de kraan, en één voor de stukadoor en het beton. Bij Fundering storten staat onder Toewijzingen *Beton* met Eenh./dag 8.',
          'Bij een materiaal is de inzet een hoeveelheid per dag: 8 m³. De stort duurt 6 uur, 0,75 werkdag, dus de app telt 6 m³ beton op de stortdag. Materiaal telt niet mee voor de duur van de taak: het beton kan de stort niet sneller of trager maken.',
        ],
      },
      werkregel: {
        title: 'De werkregel: Vast werk',
        task: [
          'Zet eerst de werkregel in beeld: klik op *Instellingen › Project › Instellingen*, open het tabblad **Planning** en zet onder **Berekenen** het vinkje bij **Toon werkregels en werk** aan. Sluit het venster met **Sluiten**.',
          'Het stucwerk gaat straks met twee stukadoors werken. Selecteer **Stucwerk** (4.2) in de takenlijst. Kies in *Eigenschappen* bij **Werkregel** de regel **Vast werk**.',
          '**Toon mij** opent hier, als nieuw tabblad, het project waarin het stucwerk al op Vast werk staat en ook de tweede stukadoor uit de volgende stap al is ingezet, berekend. Een werkregel instellen kan het paneel zelf niet. Het vinkje bij Toon werkregels en werk is een instelling van de app: dat zet je zelf aan.',
        ],
        explain: [
          'Onder het veld Werkregel staat nu *Beschermd: werk (duur volgt de inzet)*. Er is nog niets veranderd: Stucwerk duurt nog 4d en de planning is niet verouderd. Een werkregel doet pas iets bij je eerstvolgende wijziging. Wel legt de app nu het werk vast, zodat er iets is om te beschermen: 4 dagen × 1 stukadoor × 8 uur is 32 uur. Het staat onder **Toewijzingen** bij **Werk (rest)**.',
          'De werkregel bepaalt wat de app aanpast als je de duur, de inzet of het werk wijzigt. Bij **Vast werk** blijft het werk staan en volgt de duur de inzet. Meer: [Werkregels: duur, inzet en werk](docs://uitleg-werkregels).',
        ],
      },
      'tweede-stukadoor': {
        title: 'Een tweede stukadoor',
        task: [
          'Zet in *Eigenschappen* in het blok **Toewijzingen** (onderaan, scroll zo nodig omlaag) de **Eenh./dag** van de Stukadoor op `2` (dubbelklik in het vak en typ `2`) en druk op Enter: twee stukadoors dus.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met het stucwerk op Vast werk en twee stukadoors, al berekend: dan is ook de volgende stap, Rekenen, gedaan.',
        ],
        explain: [
          'Stucwerk duurt nu 2d in plaats van 4d, en de statusbalk meldt weer *Verouderd — herbereken (F5)*. Het werk is gelijk gebleven: 4 dagen × 1 stukadoor × 8 uur is 32 uur, en met twee stukadoors per dag is dat 2 werkdagen.',
          'Onder de standaardregel *Vaste duur en inzet* was het stucwerk 4 werkdagen blijven duren en was het werk verdubbeld naar 64 uur: je betaalt dan twee stukadoors voor hetzelfde werk. Onder Vast werk volgt de duur de inzet.',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Klik op *Start › Planning › Bereken*, of druk op F5.',
        ],
        explain: [
          'Stucwerk loopt nu van vrijdag 23 tot en met maandag 26 juli (2 werkdagen, het weekend telt niet) in plaats van tot woensdag 28 juli. Alles erna schuift twee werkdagen naar voren: de statusbalk zegt *Einde: 30-08-2027* en *Kritiek pad: 8 taken, 46 werkdagen*. De oplevering staat op maandag 30 augustus, twee werkdagen eerder dan op 1 september.',
          'Maar in de statusbalk staat nog steeds *⚠ 1 resource(s) overbezet*. Het stucwerk was het eenvoudige deel. Dit is het lastige: de planning klopt op papier, maar vraagt van één resource meer dan hij kan leveren.',
        ],
      },
      histogram: {
        title: 'Het histogram: wie werkt wanneer',
        task: [
          'Klik op *Resources › Histogram › Histogram*. Onder de Gantt opent het histogram, met links een lijst van de resources. Staat er nog een taak geselecteerd (het Stucwerk uit de vorige stappen), druk dan eerst op Esc: met een geselecteerde taak toont het histogram alleen de resources van die taak. Klik daarna in de lijst op **Mobiele kraan**. Bedekt dit paneel de lijst, kies de kraan dan met *Resources › Histogram › Volgende*.',
        ],
        explain: [
          'Het histogram toont per werkdag hoeveel van de resource gevraagd wordt, onder dezelfde tijdlijn als de Gantt. Bij de Mobiele kraan staan twee smalle balken: op maandag 28 juni (de kanaalplaten) en op dinsdag 6 juli (de dakelementen). Ze reiken niet tot de bovenkant van de schaal (*1 eenheden*): de balken zijn 5/8 en 6/8 van een eenheid hoog, 0,625 en 0,75.',
          'Dat komt door de uren. Een kraaninzet van 5 uur is 5 van de 8 werkuren van die dag en telt dus voor 0,625 mee, 6 uur voor 0,75. Een urentaak weegt naar rato van zijn uren mee, ook als hij korter is dan een dag.',
        ],
      },
      overbezetting: {
        title: 'Overbezetting: de metselaar',
        task: [
          'Kijk in het lint bij *Resources › Overallocatie*: daar staat in het rood *1 resource*. Klik op de melding *⚠ 1 resource(s) overbezet* onderaan in de statusbalk. Rechts opent het paneel *Waarschuwingen*. Klik op de regel van de **Metselaar**.',
        ],
        explain: [
          'Het paneel meldt bij de Metselaar *Overbezet op 5 dag(en) (29-06-2027 – 05-07-2027)*. De app zet het histogram op de Metselaar en selecteert de taken van de metselaar. Op die vijf dagen steken de balken rood uit boven de lijn van de capaciteit: de planning vraagt 2 eenheden van een metselaar die er 1 heeft.',
          'De oorzaak zit in de relaties uit tutorial 2. Binnenspouwblad en Buitenspouwblad hangen allebei aan de kanaalplaatvloer, dus ze beginnen allebei op dinsdag 29 juni, en beide staan op dezelfde metselaar. Een relatie legt alleen een volgorde vast en weet niet hoeveel mensen er zijn. Dat zie je pas met resources.',
        ],
      },
      nivelleren: {
        title: 'Nivelleren',
        task: [
          'Klik op *Resources › Nivellering › Nivelleren…*. Het venster *Resources nivelleren* opent. Laat het vakje *Alleen binnen speling nivelleren (smoothing) — projecteinddatum blijft vast* uit staan. Onder **Resources** staan de resources die genivelleerd worden; het beton hoort er niet bij, want een materiaal wordt niet genivelleerd. Klik op **Berekenen**, lees het voorstel en klik op **Toepassen**.',
        ],
        explain: [
          'Het voorstel meldt *Projecteinddatum: ongewijzigd (30-08-2027)* en toont één regel: **Buitenspouwblad metselen**, oude start 29-06-2027, nieuwe start 06-07-2027, *5 d*. Na Toepassen staat bij *Resources › Overallocatie* *Geen* en is de waarschuwing uit de statusbalk verdwenen. Het buitenspouwblad loopt nu van dinsdag 6 juli tot en met dinsdag 13 juli.',
          'Waarom het buitenspouwblad en niet het binnenspouwblad? Beide hebben dezelfde prioriteit, en de app zet eerst de taak met de minste speling neer: het binnenspouwblad (3 werkdagen speling) blijft staan en het buitenspouwblad (5) wijkt. Het wijkt tot de eerste dag waarop de metselaar vrij is, 5 werkdagen later: de nivelleervertraging.',
          'En waarom schuift de oplevering niet? Het buitenspouwblad had 5 werkdagen speling, omdat de kozijnen sinds tutorial 3 pas op 14 juli komen. Nivelleren gebruikt die speling op. Het buitenspouwblad heeft er nu 0 en is kritiek: de statusbalk zegt *Kritiek pad: 17 taken, 46 werkdagen*, tegen 8 taken ervoor. Loopt het buitenspouwblad nu uit, dan schuift de oplevering. Meer: [Nivelleren](docs://uitleg-nivelleren).',
        ],
        panelOnly: [
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-5.ifc). Meer over de regels lees je in [Werkregels: duur, inzet en werk](docs://uitleg-werkregels) en [Nivelleren](docs://uitleg-nivelleren). Hoe je het in je eigen project doet, lees je in [Resources beheren](docs://howto-resources-beheren), [Resources toewijzen met een curve](docs://howto-resource-toewijzen), [Werkregel kiezen](docs://howto-werkregel-kiezen) en [Overbezetting oplossen](docs://howto-overbezetting-oplossen). Elk veld en elke knop staat in [Resourcepaneel](docs://ref-resourcepaneel) en [Nivelleringsopties](docs://ref-nivellering).',
        ],
      },
    },
  },
  en: {
    title: 'Resources and leveling',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Resources and leveling',
      '## What you build',
      'You put the people and machines into the schedule for the extension: five resources and twelve assignments, from the carpentry crew to the concrete for the pour. Then you set the work rule of the plastering, read in the histogram who works when and find out that one bricklayer is standing on two walls at once. You solve that overallocation with leveling.',
      'At the end there is no overallocation left. The handover is on Monday 30 August 2027, two working days earlier than in tutorial 4, because the plastering gets shorter with two plasterers. You have seen that leveling makes the outer cavity leaf wait five working days without the handover moving, and what that costs the task.',
      '## Starting point',
      'You have finished tutorial 4: the project with the concrete pour and the two crane jobs in hours, calculated, with the handover on Wednesday 1 September 2027. If you have not, [open the result of tutorial 4](project://projects/en/na-tut-4.ifc). If the app then says *This file contains hour-based planning.*, click **Enable hour planning**.',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 5* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you. An extension cannot create resources, assignments or work rules, so in this tutorial Show me opens a supplied project as a new tab if needed, in which the step has already been done. For the three assignment steps that is always the project with all twelve assignments, and for the work rule the second plasterer is already in it too. **Start over** reloads the starting point of a step: in the step *Creating five resources* the result of tutorial 4, in *The bricklayer on four tasks* that result with the five resources, in *The work rule: Fixed work* the project with all assignments and in *Leveling* the project before leveling.',
    ],
    outro: [
      '## What you have learned',
      '- **A resource has a capacity and an assignment puts it on a task.** Per working day the app sets the demand against *Max units*. The bricklayer, with capacity 1, was asked for 2 on 5 days: that is overallocation.',
      '- **The histogram counts hours.** The crane stood at 0.625 and 0.75 units on 28 June and 6 July: 5 and 6 of the 8 working hours of that day.',
      '- **The work rule decides what moves when you change the units.** With Fixed work the plastering with two plasterers took 2 working days instead of 4 and the handover came two working days earlier, Monday 30 August. With the default rule the work would have doubled.',
      '- **Relationships know no capacity.** According to the relationships the inner and outer cavity leaf could run at the same time, but not with one bricklayer. You only see that with resources.',
      '- **Leveling makes tasks start later, nothing more, and uses float to do it.** The outer cavity leaf waited 5 working days and the handover stayed on 30 August, but the task is now critical: if it runs late, the handover moves.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-5.ifc). The rules behind this tutorial are in [Work rules: duration, units and work](docs://uitleg-werkregels) and [Resource leveling](docs://uitleg-nivelleren). How to do it in your own project is in [Managing resources](docs://howto-resources-beheren), [Assigning resources with a curve](docs://howto-resource-toewijzen), [Choosing a work rule](docs://howto-werkregel-kiezen) and [Resolving overallocation](docs://howto-overbezetting-oplossen). Every field and button is in [Resource panel](docs://ref-resourcepaneel) and [Leveling options](docs://ref-nivellering).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open with the three tasks in hours from tutorial 4: Pour foundation (6h), Lay hollow-core floor (5h) and Place roof elements (6h). If not, [open the result of tutorial 4](project://projects/en/na-tut-4.ifc). If the app says *This file contains hour-based planning.*, click **Enable hour planning**. Look at the status bar.',
        ],
        explain: [
          'The status bar says *End: 01-09-2027* and *Critical path: 8 tasks, 48 work days*, and there is no message about resources.',
          'The tasks have a duration, but nobody carries them out. The app does not know who the bricklayer is, that there is only one crane and that it cannot stand in two places at once. That knowledge sits in resources: people, machines and material, each with a capacity. Once they exist, the app can work out whether the schedule asks too much of them.',
        ],
      },
      resources: {
        title: 'Creating five resources',
        task: [
          'Click *Resources › Manage › New resource*. The resource panel takes over the workspace, with an empty row at the bottom of the table. Type the name, choose the **Type** and press Enter: an empty row for the next one then opens straight away. Create these five resources:',
          '- `Carpentry crew`, type **Crew**: the crew for reinforcement, floor, roof and window frames.\n- `Bricklayer`, type **Labor**: builds the foundation brickwork and the cavity walls and breaks through the rear wall.\n- `Mobile crane`, type **Equipment**: places the hollow-core slabs and the roof elements.\n- `Plasterer`, type **Subcontractor**, **Max units** `2`: a subcontractor who can come with two people.\n- `Concrete`, type **Material**, **Max units** `50` and **Unit** `m³`: the concrete for the pour, in cubic metres per day.',
          'Fill in Max units and Unit in the row before you press Enter. Double-click the Max units box, so that the 1 is selected, and type the number: with a single click the cursor lands next to the 1 and 2 becomes 21. Press Esc after the fifth.',
          '**Show me** opens the result of tutorial 4 with the five resources in it, as a new tab. The guide cannot create resources itself.',
        ],
        explain: [
          'The resource panel now has five rows. **Max units** is the capacity per working day: 1 is one person or one machine, 2 is two, and for the concrete it is 50 m³. The app uses that number as a limit in a moment: if the schedule asks more than the capacity on one day, the resource is overallocated.',
          'The type is mostly a label. Only **Material** calculates differently: a material never drives the duration of a task and is not leveled. The app treats a crane and a bricklayer the same. Nothing is on a task yet: the resources only exist.',
        ],
      },
      'toewijzen-metselaar': {
        title: 'The bricklayer on four tasks',
        task: [
          'Close the resource panel with the cross at the top right and select **Foundation brickwork** (2.5) in the task list. Click *Resources › Assignment › Assign ▾*, leave **Units/day** on 1 and **Curve** on Uniform and click **Bricklayer**. Do the same for Build inner cavity leaf (3.1), Build outer cavity leaf (3.2) and Break through rear wall (3.6).',
          '**Show me** opens, as a new tab, the project with all twelve assignments already in it, including those of the next two steps. The guide cannot assign resources itself, and there is no project with only the bricklayer.',
        ],
        explain: [
          'The bricklayer is now on four tasks. Select one of those tasks and in *Properties* under **Assignments** it says: Bricklayer with Units/day 1. That is how much of the resource works on the task per working day. The curve, Uniform here, spreads it over the days of the task: the same every day.',
          'At the bottom, the status bar now says *⚠ 1 resource(s) overallocated*. You come back to that later in this tutorial.',
        ],
      },
      'toewijzen-ploeg-kraan': {
        title: 'The carpentry crew and the crane',
        task: [
          'In the same way, assign the **Carpentry crew** to Foundation formwork and reinforcement (2.2), Lay hollow-core floor (2.6), Place roof elements (3.3) and Install window frames (3.5). Then assign the **Mobile crane** to Lay hollow-core floor (2.6) and Place roof elements (3.3). A task can have more than one resource: the floor and the roof elements will be on crew and crane.',
          '**Show me** opens, as in the previous step, the project with all twelve assignments as a new tab, so including those of the next step.',
        ],
        explain: [
          'The floor and the roof elements now have two resources. Select Lay hollow-core floor: under Assignments there are the Carpentry crew and the Mobile crane, both with Units/day 1. That is one crew and one crane on a 5-hour task. How much that counts per working day, you see in the histogram in a moment.',
        ],
      },
      'toewijzen-overig': {
        title: 'The plasterer and the concrete',
        task: [
          'Assign the **Plasterer** to Plastering (4.2). Then assign the **Concrete** to Pour foundation (2.4): in the Assign ▾ window first double-click the **Units/day** box, type `8` and then click **Concrete**. That is 8 m³ of concrete per day.',
          '**Show me** opens the project with all twelve assignments, as a new tab.',
        ],
        explain: [
          'You now have twelve assignments: four for the bricklayer, four for the carpentry crew, two for the crane, and one each for the plasterer and the concrete. At Pour foundation, under Assignments, it says *Concrete* with Units/day 8.',
          'For a material the units are a quantity per day: 8 m³. The pour takes 6 hours, 0.75 of a working day, so the app counts 6 m³ of concrete on the day of the pour. Material does not count for the duration of the task: the concrete cannot make the pour faster or slower.',
        ],
      },
      werkregel: {
        title: 'The work rule: Fixed work',
        task: [
          'First make the work rule visible: click *Settings › Project › Settings*, open the **Planning** tab and tick **Show work rules and work** under **Calculation**. Close the window with **Close**.',
          'The plastering is going to be done with two plasterers. Select **Plastering** (4.2) in the task list. In *Properties*, choose the rule **Fixed work** at **Work rule**.',
          '**Show me** opens, as a new tab, the project in which the plastering is already on Fixed work and the second plasterer from the next step is already in place, calculated. The guide cannot set a work rule itself. The Show work rules and work tick box is a setting of the app: you turn that on yourself.',
        ],
        explain: [
          'Under the Work rule field it now says *Protected: work (duration follows units)*. Nothing has changed yet: Plastering still takes 4d and the schedule is not out of date. A work rule only does something at your next change. What the app does now is fix the work, so that there is something to protect: 4 days × 1 plasterer × 8 hours is 32 hours. It is shown under **Assignments**, at **Work (rem.)**.',
          'The work rule decides what the app adjusts when you change the duration, the units or the work. With **Fixed work** the work stays put and the duration follows the units. More: [Work rules: duration, units and work](docs://uitleg-werkregels).',
        ],
      },
      'tweede-stukadoor': {
        title: 'A second plasterer',
        task: [
          'In *Properties*, in the **Assignments** block (at the bottom, scroll down if needed), set the **Units/day** of the Plasterer to `2` (double-click the box and type `2`) and press Enter: two plasterers.',
          '**Show me** opens, as a new tab, the project with the plastering on Fixed work and two plasterers, already calculated: then the next step, Calculating, is done as well.',
        ],
        explain: [
          'Plastering now takes 2d instead of 4d, and the status bar says *Out of date — recalculate (F5)* again. The work stayed the same: 4 days × 1 plasterer × 8 hours is 32 hours, and with two plasterers per day that is 2 working days.',
          'Under the default rule *Fixed duration and units* the plastering would have kept taking 4 working days and the work would have doubled to 64 hours: you would pay two plasterers for the same work. Under Fixed work the duration follows the units.',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Click *Home › Schedule › Calculate*, or press F5.',
        ],
        explain: [
          'Plastering now runs from Friday 23 up to and including Monday 26 July (2 working days, the weekend does not count) instead of up to Wednesday 28 July. Everything after it moves two working days forward: the status bar says *End: 30-08-2027* and *Critical path: 8 tasks, 46 work days*. The handover is on Monday 30 August, two working days earlier than on 1 September.',
          'But the status bar still says *⚠ 1 resource(s) overallocated*. The plastering was the easy part. This is the hard one: the schedule works on paper, but asks more of one resource than it can deliver.',
        ],
      },
      histogram: {
        title: 'The histogram: who works when',
        task: [
          'Click *Resources › Histogram › Histogram*. The histogram opens below the Gantt, with a list of the resources on the left. If a task is still selected (Plastering from the previous steps), first press Esc: with a task selected, the histogram only shows the resources of that task. Then click **Mobile crane** in the list. If this panel covers the list, choose the crane with *Resources › Histogram › Next*.',
        ],
        explain: [
          'The histogram shows per working day how much of the resource is asked, under the same timeline as the Gantt. For the Mobile crane there are two narrow bars: on Monday 28 June (the slabs) and on Tuesday 6 July (the roof elements). They do not reach the top of the scale (*1 units*): the bars are 5/8 and 6/8 of a unit high, 0.625 and 0.75.',
          'That is because of the hours. Crane work of 5 hours is 5 of the 8 working hours of that day and so counts for 0.625, 6 hours for 0.75. An hour task counts in proportion to its hours, even when it is shorter than a day.',
        ],
      },
      overbezetting: {
        title: 'Overallocation: the bricklayer',
        task: [
          'On the ribbon, look at *Resources › Overallocation*: it says *1 resource* in red. Click the message *⚠ 1 resource(s) overallocated* at the bottom of the status bar. The *Warnings* panel opens on the right. Click the line of the **Bricklayer**.',
        ],
        explain: [
          'The panel says for the Bricklayer *Overallocated on 5 day(s) (29-06-2027 – 05-07-2027)*. The app puts the histogram on the Bricklayer and selects the bricklayer\'s tasks. On those five days the bars stick out in red above the capacity line: the schedule asks 2 units of a bricklayer who has 1.',
          'The cause is in the relationships from tutorial 2. The inner and the outer cavity leaf both hang on Lay hollow-core floor, so they both start on Tuesday 29 June, and both are on the same bricklayer. A relationship only fixes an order and does not know how many people there are. You only see that with resources.',
        ],
      },
      nivelleren: {
        title: 'Leveling',
        task: [
          'Click *Resources › Leveling › Level…*. The window *Level resources* opens. Leave the box *Level only within slack (smoothing) — project end date stays fixed* unticked. Under **Resources** are the resources that get leveled; the concrete is not one of them, because a material is not leveled. Click **Calculate**, read the proposal and click **Apply**.',
        ],
        explain: [
          'The proposal says *Project end date: unchanged (30-08-2027)* and shows one line: **Build outer cavity leaf**, old start 29-06-2027, new start 06-07-2027, *5 d*. After Apply, *Resources › Overallocation* says *None* and the warning has gone from the status bar. The outer cavity leaf now runs from Tuesday 6 July up to and including Tuesday 13 July.',
          'Why the outer and not the inner cavity leaf? They have the same priority, and the app places the task with the least float first: the inner leaf (3 working days of float) stays and the outer leaf (5) gives way. It gives way until the first day the bricklayer is free, 5 working days later: the leveling delay.',
          'And why does the handover not move? The outer cavity leaf had 5 working days of float, because since tutorial 3 the window frames only arrive on 14 July. Leveling uses up that float. The outer leaf now has 0 and is critical: the status bar says *Critical path: 17 tasks, 46 work days*, against 8 tasks before. If the outer leaf runs late now, the handover moves. More: [Resource leveling](docs://uitleg-nivelleren).',
        ],
        panelOnly: [
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-5.ifc). You can read more about the rules in [Work rules: duration, units and work](docs://uitleg-werkregels) and [Resource leveling](docs://uitleg-nivelleren). How to do it in your own project is in [Managing resources](docs://howto-resources-beheren), [Assigning resources with a curve](docs://howto-resource-toewijzen), [Choosing a work rule](docs://howto-werkregel-kiezen) and [Resolving overallocation](docs://howto-overbezetting-oplossen). Every field and button is in [Resource panel](docs://ref-resourcepaneel) and [Leveling options](docs://ref-nivellering).',
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
  // Anker op het tabblad Tabel, bewust NIET op Eigenschappen. In de doorloop op 1366×768 wijkt het
  // begeleidingspaneel bij een anker op Eigenschappen naar links uit en bedekt dan de onderste helft van de
  // tabel: de rij van het buitenspouwblad (3.2) en de kolom Duur, waar je in deze stap in klikt, zijn dan
  // niet te bedienen. Rechtsonder bedekt het paneel alleen het onderste deel van Eigenschappen; CPM
  // Resultaat lees je door dat paneel naar boven te scrollen.
  uitloop: {
    anchor: 'ribbon-tab:table',
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
  // Anker op Eigenschappen: het paneel Waarschuwingen opent onder Eigenschappen in de rechterrail en CPM
  // Resultaat staat onderaan in Eigenschappen; rechtsonder zou het begeleidingspaneel ze allebei bedekken.
  // Het paneel wijkt dan naar links uit. Anders dan in tutorial 2 stap 9 hoef je hier links niets aan te
  // klikken: Oplevering staat nog geselecteerd uit de vorige stap en de melding in de statusbalk blijft vrij
  // (gecontroleerd op 1366×768).
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

// Tutorial 4. De instelling Urenplanning zit niet in het document en de extensie kan haar niet zetten: die
// stap heeft een controle (de bewaarde instelling) maar geen Toon mij. `reset` staat bij de eerste stap die
// het document verandert (`stort`): daar levert de generator een tussenstand (het resultaat van tutorial 3).
// De stappen in Eigenschappen hebben geen anker (zie tutorial 3): een markering om dat paneel laat het
// begeleidingspaneel naar links uitwijken, over de takenlijst waarin je de taak aanklikt.
const STEP_ORDER_4 = [
  'startpunt', 'urenplanning', 'stort', 'kraan-vloer', 'kraan-dak', 'berekenen', 'langere-kraan', 'terugzetten',
];

const STEP_LOGIC_4 = {
  startpunt: {
    check: afterTutorial3,
    prepare: async (api) => {
      if (!afterTutorial3(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-3'));
    },
  },
  urenplanning: {
    anchor: 'ribbon:instellingen:projectSettings',
    check: hourPlanningOn,
  },
  stort: {
    check: api => afterTutorial3(api) && stortDone(api),
    prepare: api => ensureHours(api, 'pour'),
    reset: 'na-tut-3',
  },
  'kraan-vloer': {
    check: api => afterTutorial3(api) && floorDone(api),
    prepare: api => ensureHours(api, 'floor'),
  },
  'kraan-dak': {
    check: api => afterTutorial3(api) && roofDone(api),
    prepare: api => ensureHours(api, 'roofElements'),
  },
  berekenen: {
    anchor: 'ribbon:start:calc',
    check: api => hoursDone(api) && isCalculated(api),
    prepare: async (api) => {
      await ensureHours(api, 'roofElements');
      api.data.recalculate();
    },
  },
  'langere-kraan': {
    check: api => afterTutorial3(api) && stortDone(api) && floorDone(api) && roofIs(api, ROOF_LONG_MINUTES) && isCalculated(api),
    prepare: async (api) => {
      await ensureHours(api, 'roofElements', ROOF_LONG_MINUTES);
      setHourMinutes(api, 'roofElements', ROOF_LONG_MINUTES);
      api.data.recalculate();
    },
  },
  terugzetten: {
    check: api => hoursDone(api) && isCalculated(api),
    prepare: async (api) => {
      await ensureHours(api, 'roofElements');
      setHourMinutes(api, 'roofElements', HOUR_MINUTES.roofElements);
      api.data.recalculate();
    },
  },
};

// Tutorial 5. Resources, toewijzingen en werkregels zijn voor de extensie alleen te lezen. De checks volgen
// dus elke stap; Toon mij opent per stap een meegeleverde stand waarin die stap gedaan is (zie de helpers
// hierboven). `reset` staat alleen waar de generator de beginstand van de stap levert, bij de eerste stap die
// vanuit die stand het document verandert: `resources` (na-tut-4), `toewijzen-metselaar`
// (tussen-tut-5-resources), `werkregel` (tussen-tut-5-toegewezen) en `nivelleren` (tussen-tut-5-werkregel).
// Niet bij stap 4, 5 en 7 (geen stand met een deel van de toewijzingen of met Vast werk en één stukadoor), niet
// bij `berekenen` (de meegeleverde stand is al berekend) en niet bij histogram en overbezetting (die
// veranderen het document niet).
const STEP_ORDER_5 = [
  'startpunt', 'resources', 'toewijzen-metselaar', 'toewijzen-ploeg-kraan', 'toewijzen-overig', 'werkregel',
  'tweede-stukadoor', 'berekenen', 'histogram', 'overbezetting', 'nivelleren',
];

// Ankers: voor de lintitems die een eigen component renderen (de keuzelijst Toewijzen, de indicator
// Overallocatie) wijzen we de GROEP aan: het anker op het item zelf raakt kwijt zodra de keuzelijst opnieuw
// rendert (taakselectie wisselt) terwijl er een extensie met lintknoppen actief is, en de markering valt dan
// terug op de linttab.
const STEP_LOGIC_5 = {
  startpunt: {
    check: afterTutorial4,
    prepare: async (api) => {
      if (!afterTutorial4(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-4'));
    },
  },
  resources: {
    anchor: 'ribbon:resources:newResource',
    check: resourcesDone,
    prepare: ensureResources,
    reset: 'na-tut-4',
  },
  'toewijzen-metselaar': {
    anchor: 'ribbon-group:resources:resourceAssignment',
    check: api => assignmentsDone(api, 'bricklayer'),
    prepare: api => ensureAssigned(api, 'bricklayer'),
    reset: 'tussen-tut-5-resources',
  },
  'toewijzen-ploeg-kraan': {
    anchor: 'ribbon-group:resources:resourceAssignment',
    check: api => assignmentsDone(api, 'crewCrane'),
    prepare: api => ensureAssigned(api, 'crewCrane'),
  },
  'toewijzen-overig': {
    anchor: 'ribbon-group:resources:resourceAssignment',
    check: api => assignmentsDone(api, 'other'),
    prepare: api => ensureAssigned(api, 'other'),
  },
  werkregel: {
    anchor: 'ribbon:instellingen:projectSettings',
    check: plasterRuleSet,
    prepare: api => ensureWorkRule(api, false),
    reset: 'tussen-tut-5-toegewezen',
  },
  // Anker op Eigenschappen: het blok Toewijzingen staat onderaan in dat paneel; het begeleidingspaneel wijkt dan
  // naar links uit en bedekt het niet. Stucwerk staat nog geselecteerd uit de vorige stap, de takenlijst is niet
  // meer nodig.
  'tweede-stukadoor': {
    anchor: 'properties-panel',
    check: workRuleDone,
    prepare: api => ensureWorkRule(api, true),
  },
  berekenen: {
    anchor: 'ribbon:start:calc',
    check: api => workRuleDone(api) && isCalculated(api),
    prepare: ensureBeforeLeveling,
  },
  // Stappen zonder controle: het histogram openen, een resource kiezen en de melding aanklikken laten geen
  // sporen na in het document, en de extensie kan de weergave niet lezen. Daarom "Klaar, volgende".
  histogram: {
    anchor: 'ribbon:resources:toggleHistogram',
    prepare: ensureBeforeLeveling,
  },
  overbezetting: {
    anchor: 'ribbon-group:resources:overallocationIndicator',
    prepare: ensureBeforeLeveling,
  },
  nivelleren: {
    anchor: 'ribbon:resources:levelResources',
    check: levelingApplied,
    prepare: ensureLeveled,
    reset: 'tussen-tut-5-werkregel',
  },
};

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TUTORIAL 6 EN 7 — de logica: baseline, statusdatum, voortgang en rapporten
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// Tutorial 6 werkt op `na-tut-5`, tutorial 7 op `na-tut-6`. De getallen in de tekst (28 juni, 31 augustus, 10 taken,
// 47 werkdagen, 81 %, 28,7 % en 25 %, …) komen uit de stand `na-tut-6` van de generator en uit de rapporten van de
// draaiende app (zie README). De voortgang die tutorial 6 laat invullen is precies die van `na-tut-6`: in de doorloop
// geeft hij na Bereken voor alle 23 taken dezelfde vroege datums, speling en kritiekheid als dat bestand.
//
// WAT DE EXTENSIE-API HIER NIET KAN, en wat daarvan het gevolg is:
//   • Een baseline is niet te lezen (`api.data` kent geen baselines, ook geen event) en niet te schrijven. De stap
//     "Een baseline opslaan" heeft dus geen controle ("Klaar, volgende"), en zijn Toon mij opent ALTIJD de stand
//     `tussen-tut-6-baseline`: het paneel kan niet zien of de baseline er al is.
//   • De statusdatum is wel te lezen (`getProject().statusDate`) maar niet te schrijven (er is geen project-update).
//     Controle ja; Toon mij opent zo nodig `tussen-tut-6-statusdatum`.
//   • Voortgang (`time.completion`, `time.actualStart`, `time.actualFinish`) is te lezen, dus elke invoerstap heeft een
//     controle. Schrijven kan alleen via `updateTask`, de ruwe veldschrijfroute zonder de regels van de app
//     (percentage ↔ werkelijke datums ↔ status, de startvraag, het weigeren van een datum na de statusdatum): daar
//     bouwen we geen Toon mij op. Toon mij opent zo nodig de stand van de generator waarin de stap gedaan is
//     (`tussen-tut-6-voorbereiding`, `-ontgraven`, `-fundering`, `-metselwerk`).
//   • De generator legt die tussenstanden vast vóór Bereken, zoals de lezer ze heeft. Maar de app rekent een .ifc bij
//     het openen altijd door (en zet hem dan niet op "Verouderd"). Na Toon mij of Opnieuw in stap 3–7 ziet de lezer
//     dus een BEREKENDE planning: met alleen de statusdatum einde 20 september (alles op 28 juni, deadline
//     overschreden), na de voorbereiding 14 september, na het ontgraven 10 september, na de fundering 1 september, na
//     het metselwerk 31 augustus (= na-tut-6, en stap 8 is dan al gedaan). De tekst bij Toon mij zegt dat. De app-check
//     `check-tutorial-project.ts` pint die getallen.
//   • De kolommen van de tabel, het gekozen rapport, het papierformaat, de PDF-export en het exportvenster laten niets
//     achter in het document en zijn niet te lezen: die stappen zijn "Klaar, volgende". Tutorial 7 verandert het
//     project niet, dus ook geen Opnieuw.

/** De statusdatum van tutorial 6: maandag 28 juni 2027 (STATUS_DATE in `scripts/tutorial-project.ts`). */
const TUT6_STATUS_DATE = '2027-06-28';

/** Heeft deze werkelijke datum de verwachte waarde (voor een urentaak met kloktijd, een dag en tijd)? */
const actualIs = (actual, expected) => typeof actual === 'string' && actual.startsWith(expected);

/**
 * De voortgang die tutorial 6 laat invullen, gelijk aan DONE_TASKS, LATE_TASK en IN_PROGRESS van de generator (stand
 * `na-tut-6`): [taak, werkelijke start, werkelijk einde]. Een mijlpaal heeft één datum; de app zet start en einde dan
 * allebei. De stort is een urentaak: zijn werkelijke datums hebben een kloktijd.
 */
const PROGRESS_GROUPS = {
  voorbereiding: [
    ['msStart', '2027-06-07', '2027-06-07'],
    ['site', '2027-06-07', '2027-06-08'],
    ['garden', '2027-06-09', '2027-06-09'],
    ['setout', '2027-06-10', '2027-06-10'],
  ],
  ontgraven: [['excavate', '2027-06-11', '2027-06-15']],
  fundering: [
    ['rebar', '2027-06-16', '2027-06-18'],
    ['inspection', '2027-06-18', '2027-06-18'],
    ['pour', '2027-06-21T07:00', '2027-06-21T14:00'],
  ],
};
/** Het funderingsmetselwerk: begonnen op vrijdag 25 juni, voor de helft klaar, nog geen einde. */
const BRICKWORK_PROGRESS = { start: '2027-06-25', completion: 0.5 };

/** Is de taak voltooid met precies deze werkelijke datums? */
function progressRowDone(api, [key, start, finish], tasks = api.data.getTasks()) {
  const t = taskByKey(api, key, tasks);
  return !!t && t.time.completion === 1 && actualIs(t.time.actualStart, start) && actualIs(t.time.actualFinish, finish);
}
const progressGroupDone = (api, group) => {
  const tasks = api.data.getTasks();
  return PROGRESS_GROUPS[group].every(row => progressRowDone(api, row, tasks));
};
/** Het funderingsmetselwerk loopt: gestart op 25 juni, 50 %, niet klaar. */
const brickworkRunning = (api) => {
  const t = taskByKey(api, 'foundBrick');
  return !!t && Math.abs(t.time.completion - BRICKWORK_PROGRESS.completion) < 1e-9
    && actualIs(t.time.actualStart, BRICKWORK_PROGRESS.start) && !t.time.actualFinish;
};
const statusDateIsSet = api => dayOf(api.data.getProject().statusDate) === TUT6_STATUS_DATE;
/** Alle voortgang van tutorial 6 is ingevuld. */
const allProgressEntered = api => statusDateIsSet(api)
  && Object.keys(PROGRESS_GROUPS).every(group => progressGroupDone(api, group)) && brickworkRunning(api);

/** Het project zoals tutorial 5 het achterlaat: de taken, de vijf resources en het genivelleerde buitenspouwblad. */
const startFromTutorial5 = api => tasksPresent(api) && resourcesDone(api) && levelingApplied(api);
/** Het project zoals tutorial 6 het achterlaat: tutorial 5 plus statusdatum en voortgang (berekend of niet). */
const startFromTutorial6 = api => startFromTutorial5(api) && allProgressEntered(api);

/** Vingerafdruk van de voortgang (statusdatum, percentage en werkelijke datums van de bladtaken). `scheduleSignature`
 *  dekt de voortgang niet: zonder deze tweede afdruk zou een berekening van vóór de voortgangsinvoer als "berekend"
 *  tellen. Fasen blijven erbuiten: hun percentage volgt uit de berekening zelf. */
function progressSignature(api) {
  return JSON.stringify([
    api.data.getProject().statusDate || '',
    api.data.getTasks().filter(t => t.childIds.length === 0)
      .map(t => [t.id, t.time.completion, t.time.actualStart || '', t.time.actualFinish || '']),
  ]);
}
let calculatedProgressSignature = null;
/** Berekend na de voortgangsinvoer? De laatste berekening was er een van precies deze planning én deze voortgang. */
const progressCalculated = api => isCalculated(api) && calculatedProgressSignature !== null
  && calculatedProgressSignature === progressSignature(api);

/** Toon mij, tutorial 6 stap 1: het project na tutorial 5. Ontbreekt iets, dan opent Toon mij het resultaat van
 *  tutorial 5 als nieuw tabblad. */
async function ensureAfterTutorial5(api) {
  if (!startFromTutorial5(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-5'));
}

/** De voortgangsgroepen van tutorial 6 in de volgorde van de stappen. */
const PROGRESS_ORDER = ['voorbereiding', 'ontgraven', 'fundering'];
/** De voortgang t/m `group` (cumulatief) is ingevuld. */
const progressUpTo = (api, group) => PROGRESS_ORDER.slice(0, PROGRESS_ORDER.indexOf(group) + 1)
  .every(g => progressGroupDone(api, g));

/** Toon mij, tutorial 6 stap 3–7: heeft het project (na tutorial 5) de stap en alles daarvoor nog niet, dan opent
 *  Toon mij de stand van de generator waarin dat gedaan is, als nieuw tabblad. De extensie kan geen statusdatum en
 *  (via de regels van de app) geen voortgang zetten. De app rekent de stand bij het openen door. */
async function ensureTut6Stage(api, done, stand) {
  if (!(startFromTutorial5(api) && done(api))) await api.help.openBundledProject(projectAsset(uiLang(), stand));
}

/** Toon mij, tutorial 6 vanaf het rekenen en tutorial 7 stap 1: het project na tutorial 6, berekend. De extensie kan
 *  geen baseline, statusdatum of voortgang zetten; ontbreekt er iets, dan opent Toon mij het resultaat van tutorial 6
 *  (als nieuw tabblad). Staat alles er al, dan rekent Toon mij alleen. */
async function ensureAfterTutorial6(api) {
  if (!startFromTutorial6(api)) await api.help.openBundledProject(projectAsset(uiLang(), 'na-tut-6'));
  api.data.recalculate();
}

// ── Tutorial 6: Voortgang en afwijking ────────────────────────────────────────────────────────

const TEXT_6 = {
  nl: {
    title: 'Voortgang en afwijking',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Voortgang en afwijking',
      '## Wat je bouwt',
      'Je zet de planning van de aanbouw om van voorspelling naar werkelijkheid. Je legt de planning vast als baseline, een afspraak om later aan te meten, zet de statusdatum op maandag 28 juni 2027 en vult in wat er in de eerste drie weken werkelijk is gebeurd: acht taken klaar, één taak halverwege en een ontgraving die een dag langer duurde dan gepland. Daarna reken je en lees je de afwijking af.',
      'Aan het eind staat de oplevering op dinsdag 31 augustus 2027, één werkdag later dan de baseline. Je hebt gezien waarom die ene dag van het ontgraven de hele oplevering laat opschuiven, en waar je de afwijking leest: onder de balken in de Gantt en in de tabel.',
      '## Uitgangspunt',
      'Je hebt tutorial 5 afgerond: het project *Aanbouw woning* met vijf resources, de werkregel van het stucwerk en het genivelleerde buitenspouwblad, met de oplevering op maandag 30 augustus 2027. Heb je dat niet, [open dan het resultaat van tutorial 5](project://projects/nl/na-tut-5.ifc). Meldt de app daarbij *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**.',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 6*. Rechtsonder verschijnt een paneel met steeds één opdracht. Het paneel ziet zelf wanneer je een stap hebt gedaan en vertelt dan wat je ziet. Met **Toon mij** zet het paneel de stap voor je klaar. Een extensie kan geen baseline opslaan, geen statusdatum zetten en geen voortgang invoeren; daarom opent Toon mij in deze tutorial zo nodig een meegeleverd project als nieuw tabblad, waarin de stap al gedaan is: bij de eerste stap het resultaat van tutorial 5, bij de stappen daarna dat resultaat met de baseline, de statusdatum en de voortgang tot en met die stap, en vanaf het rekenen het resultaat van deze tutorial. Let op: de app rekent een project bij het openen altijd door, ook als je in de tutorial nog niet zou rekenen. Na Toon mij in de stappen 3 tot en met 7 zie je dus een berekende planning, niet de oude berekening die de tekst beschrijft; bij het rekenen in stap 8 komt alles op hetzelfde uit. De stap *Een baseline opslaan* kan het paneel niet zien: daar staat **Klaar, volgende**. **Opnieuw** laadt de beginstand van een stap opnieuw: in *Een baseline opslaan* het resultaat van tutorial 5, en in de stappen 3 tot en met 7 het project zoals het na de vorige stap is (ook dat rekent de app bij het openen door).',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een baseline is een foto van de afspraak.** Je legde hem vast voordat er voortgang was; daardoor liet de afwijking zien wat er sindsdien veranderde. Een baseline die je ná de voortgang opslaat, legt de werkelijke stand vast en laat een afwijking van 0 zien.',
      '- **De statusdatum is de grens tussen feit en voorspelling.** Alles vóór maandag 28 juni vulde je in als werkelijkheid; alles erna rekent de app vanaf die dag. Rekende je met alleen een statusdatum, dan schoof alles wat nog niet begonnen was naar die dag en kwam de oplevering op 20 september.',
      '- **Voortgang bestaat uit een werkelijke start, een werkelijk einde en een percentage, en ze hangen aan elkaar.** Een werkelijk einde maakt de taak 100% en een percentage boven 0 maakt hem *Bezig*. Vul daarom eerst de start in: zonder start neemt de app de geplande start, of bij een werkelijk einde die einddatum zelf.',
      '- **Een dag vertraging op het kritieke pad is een dag vertraging van de oplevering.** Het ontgraven duurde 3 in plaats van 2 werkdagen en lag op het kritieke pad: alles erachter schoof een werkdag op en de oplevering ging van 30 naar 31 augustus.',
      '- **Afwijking lees je in werkdagen: een plus is later, een min is eerder.** Je zag haar onder de balken in de Gantt en in de kolom Eindafwijking. In tutorial 7 staat dezelfde afwijking in een rapport.',
      'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-6.ifc). De regels achter deze tutorial staan in [Voortgang, statusdatum en baseline](docs://uitleg-voortgang) en [Kritiek pad en speling](docs://uitleg-kritiek-pad). Hoe je het in je eigen project doet, lees je in [Een baseline opslaan en beheren](docs://howto-baseline-opslaan-en-beheren) en [Voortgang bijwerken](docs://howto-voortgang-bijwerken). Elke kolom die je gebruikte, ook die van de baseline, staat in [Tabelkolommen](docs://ref-tabelkolommen).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat zoals tutorial 5 het achterliet: met de vijf resources, het stucwerk op Vast werk met twee stukadoors en het genivelleerde buitenspouwblad. Heb je dat niet, [open dan het resultaat van tutorial 5](project://projects/nl/na-tut-5.ifc). Meldt de app *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**. Kijk in de statusbalk.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 30-08-2027* en *Kritiek pad: 17 taken, 46 werkdagen*. Dat is de planning zoals je hem in tutorial 5 afrondde: de oplevering op maandag 30 augustus.',
          'Maar dit is een voorspelling. De app rekende uit wat er volgens jouw taken, relaties en resources zou moeten gebeuren, niet wat er op de bouwplaats gebeurd is. Zodra het werk loopt, wil je weten wat er klaar is en wat dat voor de oplevering betekent. Daarvoor heb je drie dingen nodig: een baseline om aan te meten, een statusdatum en de voortgang zelf.',
        ],
      },
      baseline: {
        title: 'Een baseline opslaan',
        task: [
          'Leg eerst de afspraak vast. Klik op *Planning › Baselines & voortgang › Baselines beheren…*. Het venster **Baselines** opent. Onder **Nieuwe baseline opslaan** staat een voorstel voor de naam. Vervang dat door `Basisplanning`, klik op **Opslaan** en dan op **Sluiten**.',
          'Staat er in het venster *Planning is verouderd — herbereken eerst (F5)*? Sluit het venster dan, druk op F5 en begin opnieuw: een baseline legt de datums vast die op dat moment berekend zijn.',
          '**Toon mij** opent hier, als nieuw tabblad, het resultaat van tutorial 5 met de baseline *Basisplanning* erin. Een baseline opslaan kan het paneel zelf niet, en het kan ook niet zien of je dat al deed: Toon mij opent dit project daarom altijd.',
        ],
        explain: [
          'Het venster toont nu één baseline, *Basisplanning*, met een bolletje onder **Actief**. Sluit je het venster, dan staat in de Gantt onder de taakbalken een dunne grijze balk, en onder de mijlpalen een klein ruitje. Dat is de baseline. Hij valt nu precies onder de balken, want er is nog niets veranderd.',
          'Een baseline is een foto van de planning op dit moment: van elke taak zonder onderliggende taken legt de app de start, het einde en de duur vast. Wat je daarna wijzigt, raakt de foto niet. Zo kun je straks zien hoeveel de uitvoering afwijkt van de afspraak. Leg hem daarom vast voordat je voortgang invult: een baseline die al de werkelijke datums bevat, laat een afwijking van 0 zien.',
        ],
      },
      statusdatum: {
        title: 'De statusdatum',
        task: [
          'Klik bij *Planning › Baselines & voortgang* in het veld **Statusdatum** en typ `28`, `06` en `2027` in de vakjes voor dag, maand en jaar (in de volgorde van je datumnotatie). De app springt zelf naar het volgende vakje. Druk op Enter. Druk **nog niet** op Bereken.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met de baseline en de statusdatum 28 juni 2027. Een statusdatum zetten kan het paneel zelf niet. De app rekent het project bij het openen door: na Toon mij staat er dus geen *Verouderd* in de statusbalk, maar zie je meteen wat de laatste alinea hieronder beschrijft: Start bouw op 28 juni, *Einde: 20-09-2027* en *1 deadline(s) overschreden*. Dat komt goed zodra je de voortgang hebt ingevuld en in stap 8 rekent.',
        ],
        explain: [
          'In de Gantt staat een oranje stippellijn op maandag 28 juni, met de datum bovenin, en de statusbalk zegt *Verouderd — herbereken (F5)*: de statusdatum is een wijziging die nog niet doorgerekend is. De lijn maakt uitstapjes naar links, naar de balken die vóór 28 juni gepland staan maar nog geen voortgang hebben.',
          'De statusdatum is de dag waarop je de stand opneemt: alles daarvoor is een feit, alles erna moet nog gebeuren. De uitvoerder meldt de stand van vrijdag, jij neemt hem maandagochtend op, dus de statusdatum is maandag. De app doet er drie dingen mee: ze weigert een werkelijke datum na de statusdatum, ze laat werk dat nog niet begonnen is niet in het verleden liggen (dat schuift naar de statusdatum), en het restwerk van een taak die loopt begint op deze dag.',
          'Dat laatste is waarom je nog niet rekent. Zou je nu op Bereken drukken, dan zou de app álles wat nog niet begonnen is naar 28 juni schuiven, ook de taken die volgens jou allang klaar zijn: Start bouw op 28 juni, de oplevering op 20 september, en de statusbalk meldt *1 deadline(s) overschreden*. Eerst de voortgang, dan rekenen.',
        ],
      },
      voorbereiding: {
        title: 'De voorbereiding is klaar',
        task: [
          'De uitvoerder meldt wat er sinds de start gebeurd is. Dat vul je in de tabel in. Klik op het tabblad *Tabel* en dan op *Tabel › Kolommen › Kolommen…* (of op de **+** rechts in de kop van de takenlijst). Kies onder **Voortgang** de kolom **Werkelijke start**; het menu sluit zich. Open het opnieuw en kies **Werkelijke einde**. De kolom **Voortgang** staat er al.',
          'Dubbelklik dan op een cel, typ de datum en druk op Enter. Vul in:',
          '- `Start bouw`: bij **Werkelijke einde** `07-06-2027`. Een mijlpaal heeft één datum; de app vult de start zelf in.\n- `Bouwplaats inrichten`: **Werkelijke start** `07-06-2027`, **Werkelijke einde** `08-06-2027`.\n- `Tuin en bestrating verwijderen`: start en einde allebei `09-06-2027`.\n- `Aanbouw uitzetten`: start en einde allebei `10-06-2027`.',
          'Vul bij elke taak eerst de start in en dan het einde. Staat *Automatisch berekenen* aan, dan rekent de app na elke invoer mee: je eindresultaat is hetzelfde, maar de balken springen tussendoor.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met de baseline, de statusdatum en de voortgang van deze vier taken. Voortgang invoeren kan het paneel zelf niet, en de kolommen zet je zelf in de tabel. De app rekent het project bij het openen door: na Toon mij staat in de statusbalk *Einde: 14-09-2027* (nog steeds *1 deadline(s) overschreden*) en de fase Voorbereiding op 100%, niet de oude berekening die hieronder staat.',
        ],
        explain: [
          'De vier taken staan op 100% in de kolom Voortgang: een werkelijk einde maakt de taak voltooid. De fase Voorbereiding staat nog op 0%. Een fase heeft geen eigen voortgang, ze rekent die uit haar taken, en dat gebeurt pas bij Bereken. De statusbalk toont nog de einddatum van de vorige berekening, met *Verouderd* erachter: *Einde: 30-08-2027*, of *Einde: 20-09-2027* als je de statusdatum via **Toon mij** of **Opnieuw** kreeg (die stand rekent de app bij het openen door).',
          'Deze vier taken verliepen volgens planning, dus de datums die je intypte zijn dezelfde als in de baseline. Toch typ je ze in: de werkelijke datums zijn de feiten, de berekende datums blijven de voorspelling. Daarom eerst de start: vul je bij een taak van twee dagen alleen het einde in, dan neemt de app dezelfde dag als start.',
        ],
      },
      ontgraven: {
        title: 'Het ontgraven liep uit',
        task: [
          'Het grondwater stond hoger dan gedacht: de funderingssleuf was pas na 3 werkdagen klaar in plaats van 2. Vul bij `Funderingssleuf ontgraven` in: **Werkelijke start** `11-06-2027` en **Werkelijke einde** `15-06-2027`.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met de voortgang tot en met het ontgraven. De app rekent het bij het openen door: na Toon mij zegt de statusbalk *Einde: 10-09-2027*, en de taken na het ontgraven staan al op de nieuwe berekening, met de wapening op de statusdatum.',
        ],
        explain: [
          'Funderingssleuf ontgraven staat op 100%, met start 11-06-2027 en einde 15-06-2027. Gepland waren 2 werkdagen, vrijdag 11 en maandag 14 juni; werkelijk waren het er 3: vrijdag 11, maandag 14 en dinsdag 15 juni. Dat is de afwijking waar deze tutorial om draait.',
          'De rest van de planning weet het nog niet: de kolommen Start en Einde en alles achter het ontgraven staan nog op de oude berekening. Pas bij Bereken schuift het door.',
        ],
      },
      fundering: {
        title: 'De wapening, de keuring en de stort',
        task: [
          'Vul in:',
          '- `Wapening en bekisting fundering`: **Werkelijke start** `16-06-2027`, **Werkelijke einde** `18-06-2027`. De wapening kon pas beginnen toen het ontgraven klaar was.\n- `Inspectie wapening`: bij **Werkelijke einde** `18-06-2027`.\n- `Fundering storten`: **Werkelijke start** `21-06-2027 07:00`, **Werkelijke einde** `21-06-2027 14:00`. De stort is een taak in uren, dus typ de kloktijd mee.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met de voortgang tot en met de stort. De app rekent het bij het openen door: na Toon mij zegt de statusbalk *Einde: 01-09-2027*, en het funderingsmetselwerk, dat nog niet begonnen is, staat op 28 en 29 juni.',
        ],
        explain: [
          'Alle drie staan op 100%. De keuring was vrijdag 18 juni en de stort volgt op de keuring: na het weekend is dat maandag 21 juni, van 07:00 tot 14:00 (6 uur, met de pauze van 12 tot 13).',
          'Waarom de kloktijd? Bij een taak in uren hoort een werkelijke start en een werkelijk einde met een tijdstip. Typ je alleen de datum, dan weet de app niet hoe laat de stort begon en rekent hij daarna met een andere tijd: het resultaat klopt dan niet meer met de rest van deze tutorial, en de stap telt niet als gedaan.',
        ],
      },
      metselwerk: {
        title: 'Het funderingsmetselwerk loopt',
        task: [
          'Het funderingsmetselwerk begon vrijdag 25 juni en is op de statusdatum voor de helft klaar. Vul bij `Funderingsmetselwerk` eerst bij **Werkelijke start** `25-06-2027` in en dan bij **Voortgang** `50`.',
          '**Toon mij** opent hier, als nieuw tabblad, het project met alle voortgang van deze tutorial. De app rekent het bij het openen door, dus dan is ook de volgende stap, Rekenen, al gedaan: de statusbalk zegt *Einde: 31-08-2027*.',
        ],
        explain: [
          'De taak staat op 50% met een werkelijke start en nog geen werkelijk einde: hij loopt. Het restwerk is de duur maal wat er nog te doen is: 2 werkdagen × (1 − 0,5) = 1 werkdag. Dat restwerk begint op de statusdatum, maandag 28 juni.',
          'Waarom eerst de start? Typ je alleen het percentage, dan neemt de app de datum in de kolom Start als werkelijke start: donderdag 24 juni als je alles zelf hebt ingevuld, een latere dag na **Toon mij** of **Opnieuw**. Maar het metselwerk begon vrijdag, na de wachttijd van 3 werkdagen na de stort uit tutorial 2 (22, 23 en 24 juni).',
        ],
      },
      berekenen: {
        title: 'Rekenen',
        task: [
          'Klik op *Tabel › Planning › Bereken*, of druk op F5. Staat *Automatisch berekenen* aan, dan heeft de app al gerekend en is deze stap al gedaan.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 31-08-2027* en *Kritiek pad: 10 taken, 47 werkdagen*. De oplevering staat op dinsdag 31 augustus, één werkdag later dan de baseline van maandag 30 augustus. In de tabel staan de acht voltooide taken op 100% en niet meer op kritiek: een voltooide taak staat vast op zijn werkelijke datums en kan de oplevering niet meer bepalen. De fase Voorbereiding staat nu op 100% en Fundering op 81%.',
          'Waarom één dag? Het ontgraven lag op het kritieke pad: elke taak erachter wachtte op zijn einde. Het duurde een dag langer, dus schuift alles erachter een werkdag op. Het funderingsmetselwerk begon zo op vrijdag 25 juni: 3 werkdagen wachttijd na de stort van maandag 21 juni, dus 22, 23 en 24 juni. Zijn balk loopt van de werkelijke start tot maandag 28 juni, de statusdatum: het restwerk van 1 werkdag. De kanaalplaatvloer volgt op dinsdag 29 juni, een dag later dan de maandag 28 juni die de baseline had.',
          'De 81% van Fundering is een gewogen gemiddelde: de taken erin wegen samen 8,375 werkdagen (2 + 3 + 0,75 + 2 + 0,625; een mijlpaal weegt 0 en een taak in uren telt naar rato van de werkdag van 8 uur) en daarvan is 6,75 gedaan (2 + 3 + 0,75 + de helft van 2).',
        ],
      },
      'afwijking-gantt': {
        title: 'De afwijking in de Gantt',
        task: [
          'Klik op het tabblad *Start*. Kijk in de Gantt onder de balken van Funderingssleuf ontgraven en de taken daarna. Scroll de Gantt naar rechts en omlaag om ook Oplevering te zien.',
        ],
        explain: [
          'Onder elke balk staat nog de dunne grijze balk van de baseline, en nu zie je het verschil. Het ontgraven is aan het eind een dag langer dan zijn baseline, en vanaf de wapening begint en eindigt elke taak een werkdag rechts van zijn baseline. Bij Oplevering staat het ruitje van de baseline een werkdag links van de mijlpaal zelf. De acht voltooide taken zijn niet meer rood.',
          'De oranje lijn op 28 juni is nu bijna recht: alles links ervan is klaar, op het halve funderingsmetselwerk na. De lijn buigt daar naar het punt in de balk dat het percentage aangeeft. Hij laat in één blik zien wie voor of achter op de planning loopt.',
        ],
      },
      'afwijking-tabel': {
        title: 'De afwijking in cijfers',
        task: [
          'Klik op het tabblad *Tabel*. Open *Tabel › Kolommen › Kolommen…* en klap onder **Baseline** de kolommen van je baseline open. Kies **Basisplanning — Eindafwijking**. Staat de kolom buiten beeld, scroll de tabel dan naar rechts.',
        ],
        explain: [
          'Bij de eerste vier taken staat 0 in de kolom: ze liepen volgens afspraak. Bij Funderingssleuf ontgraven staat 1, bij alle taken daarna ook 1, tot en met Oplevering. De afwijking staat in werkdagen: een positief getal is later, een negatief getal eerder.',
          'Eén taak, één dag, en de hele keten erachter schuift mee. Ook het schilderwerk, dat 6 werkdagen speling heeft, staat op 1: speling zorgt er niet voor dat een taak niet verschuift, alleen dat de oplevering er niet door schuift. De kolom *Basisplanning — Startafwijking* laat zien dat het ontgraven zelf op tijd begon, en dat de wapening een dag te laat begon omdat ze op het ontgraven wachtte. In tutorial 7 staat dezelfde afwijking in een rapport, klaar om uit te delen.',
        ],
        panelOnly: [
          'Wil je je resultaat vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-6.ifc). De regels achter deze tutorial staan in [Voortgang, statusdatum en baseline](docs://uitleg-voortgang) en [Kritiek pad en speling](docs://uitleg-kritiek-pad). Hoe je het in je eigen project doet, lees je in [Een baseline opslaan en beheren](docs://howto-baseline-opslaan-en-beheren) en [Voortgang bijwerken](docs://howto-voortgang-bijwerken). Elke kolom die je gebruikte, ook die van de baseline, staat in [Tabelkolommen](docs://ref-tabelkolommen).',
        ],
      },
    },
  },
  en: {
    title: 'Progress and variance',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Progress and variance',
      '## What you build',
      'You turn the schedule for the house extension from a forecast into reality. You save the schedule as a baseline, an agreement to measure against later, set the status date to Monday 28 June 2027 and enter what really happened in the first three weeks: eight tasks finished, one task halfway and an excavation that took a day longer than planned. Then you calculate and read the variance.',
      'At the end the handover is on Tuesday 31 August 2027, one working day later than the baseline. You have seen why that one day of excavation moves the whole handover, and where you read the variance: below the bars in the Gantt and in the table.',
      '## Starting point',
      'You have finished tutorial 5: the project *House extension* with five resources, the work rule of the plastering and the leveled outer cavity leaf, with the handover on Monday 30 August 2027. If you have not, [open the result of tutorial 5](project://projects/en/na-tut-5.ifc). If the app then says *This file contains hour-based planning.*, click **Enable hour planning**.',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 6* on the ribbon. A panel appears at the bottom right with one instruction at a time. The panel notices when you have done a step and then tells you what you see. **Show me** sets the step up for you. An extension cannot save a baseline, set a status date or enter progress; that is why in this tutorial Show me opens a bundled project as a new tab if needed, in which the step has been done: for the first step the result of tutorial 5, for the steps after that this result with the baseline, the status date and the progress up to and including that step, and from calculating onwards the result of this tutorial. Note: the app always calculates a project when it opens it, even when the tutorial would not calculate yet. After Show me in steps 3 to 7 you therefore see a calculated schedule, not the old calculation the text describes; when you calculate in step 8 everything comes out the same. The panel cannot see the step *Saving a baseline*: it says **Done, next**. **Start over** reloads the starting point of a step: in *Saving a baseline* the result of tutorial 5, and in steps 3 to 7 the project as it is after the previous step (the app calculates that one too when it opens it).',
    ],
    outro: [
      '## What you have learned',
      '- **A baseline is a photo of the agreement.** You saved it before there was any progress; that is why the variance showed what had changed since. A baseline saved after the progress records the actual situation and shows a variance of 0.',
      '- **The status date is the boundary between fact and forecast.** Everything before Monday 28 June you entered as reality; everything after it the app calculates from that day. If you had calculated with only a status date, everything that had not started would have moved to that day and the handover would have landed on 20 September.',
      '- **Progress is an actual start, an actual finish and a percentage, and they depend on each other.** An actual finish makes the task 100% and a percentage above 0 makes it *In progress*. That is why you enter the start first: without a start the app takes the planned start, or, with an actual finish, that finish date itself.',
      '- **A day of delay on the critical path is a day of delay on the handover.** The excavation took 3 working days instead of 2 and was on the critical path: everything behind it moved a working day and the handover went from 30 to 31 August.',
      '- **You read variance in working days: a plus is later, a minus is earlier.** You saw it below the bars in the Gantt and in the column Finish variance. In tutorial 7 the same variance is in a report.',
      'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-6.ifc). The rules behind this tutorial are in [Progress, status date and baseline](docs://uitleg-voortgang) and [Critical path and float](docs://uitleg-kritiek-pad). How to do it in your own project is in [Saving and managing a baseline](docs://howto-baseline-opslaan-en-beheren) and [Updating progress](docs://howto-voortgang-bijwerken). Every column you used, including those of the baseline, is in [Table columns](docs://ref-tabelkolommen).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open as tutorial 5 left it: with the five resources, the plastering on Fixed work with two plasterers and the leveled outer cavity leaf. If not, [open the result of tutorial 5](project://projects/en/na-tut-5.ifc). If the app says *This file contains hour-based planning.*, click **Enable hour planning**. Look at the status bar.',
        ],
        explain: [
          'The status bar says *End: 30-08-2027* and *Critical path: 17 tasks, 46 work days*. That is the schedule as you finished it in tutorial 5: the handover on Monday 30 August.',
          'But this is a forecast. The app worked out what should happen according to your tasks, relationships and resources, not what has happened on site. As soon as the work is under way, you want to know what is finished and what that means for the handover. For that you need three things: a baseline to measure against, a status date and the progress itself.',
        ],
      },
      baseline: {
        title: 'Saving a baseline',
        task: [
          'First record the agreement. Click *Planning › Baselines & progress › Manage baselines…*. The **Baselines** window opens. Under **Save new baseline** there is a suggested name. Replace it with `Baseline` and click **Save**, then **Close**.',
          'Does the window say *Schedule is out of date — recalculate first (F5)*? Then close the window, press F5 and start again: a baseline records the dates that were calculated at that moment.',
          '**Show me** opens, as a new tab, the result of tutorial 5 with the baseline *Baseline* in it. The panel cannot save a baseline itself, and it cannot see whether you already did: that is why Show me always opens this project.',
        ],
        explain: [
          'The window now shows one baseline, *Baseline*, with a dot under **Active**. When you close the window, the Gantt has a thin grey bar below the task bars, and a small diamond below the milestones. That is the baseline. It sits exactly below the bars for now, because nothing has changed yet.',
          'A baseline is a photo of the schedule at this moment: for every task without subtasks the app records the start, the finish and the duration. What you change afterwards does not touch the photo. That way you can see in a moment how far the execution deviates from the agreement. So record it before you enter progress: a baseline that already contains the actual dates shows a variance of 0.',
        ],
      },
      statusdatum: {
        title: 'The status date',
        task: [
          'In *Planning › Baselines & progress*, click the **Status date** field and type `28`, `06` and `2027` in the boxes for day, month and year (in the order of your date notation). The app jumps to the next box by itself. Press Enter. Do **not** press Calculate yet.',
          '**Show me** opens, as a new tab, the project with the baseline and the status date 28 June 2027. The panel cannot set a status date itself. The app calculates the project when it opens it: after Show me the status bar does not say *Out of date*, and you see right away what the last paragraph below describes: Start of construction on 28 June, *End: 20-09-2027* and *1 deadline(s) missed*. That is put right once you have entered the progress and calculate in step 8.',
        ],
        explain: [
          'The Gantt now has an orange dotted line on Monday 28 June, with the date at the top, and the status bar says *Out of date — recalculate (F5)*: the status date is a change that has not been calculated yet. The line makes excursions to the left, to the bars that are planned before 28 June but have no progress yet.',
          'The status date is the day you take stock: everything before it is fact, everything after it still has to happen. The foreman reports the situation of Friday, you record it on Monday morning, so the status date is Monday. The app does three things with it: it refuses an actual date after the status date, it does not leave work that has not started in the past (that moves to the status date), and the remaining work of a task that is under way starts on this day.',
          'That last one is why you do not calculate yet. If you pressed Calculate now, the app would move everything that has not started to 28 June, including the tasks you consider long finished: Start of construction on 28 June, the handover on 20 September, and the status bar says *1 deadline(s) missed*. Progress first, then calculate.',
        ],
      },
      voorbereiding: {
        title: 'The preparation is finished',
        task: [
          'The foreman reports what has happened since the start. You enter that in the table. Click the *Table* tab and then *Table › Columns › Columns…* (or the **+** at the right of the task list header). Under **Progress**, choose the column **Actual start**; the menu closes. Open it again and choose **Actual finish**. The column **Progress** is already there.',
          'Then double-click a cell, type the date and press Enter. Enter:',
          '- `Start of construction`: at **Actual finish** `07-06-2027`. A milestone has one date; the app fills in the start itself.\n- `Set up site`: **Actual start** `07-06-2027`, **Actual finish** `08-06-2027`.\n- `Clear garden and paving`: start and finish both `09-06-2027`.\n- `Set out the extension`: start and finish both `10-06-2027`.',
          'For every task, enter the start first and then the finish. If *Calculate automatically* is on, the app calculates along after every entry: your end result is the same, but the bars jump around in between.',
          '**Show me** opens, as a new tab, the project with the baseline, the status date and the progress of these four tasks. The panel cannot enter progress itself, and you add the columns to the table yourself. The app calculates the project when it opens it: after Show me the status bar says *End: 14-09-2027* (still *1 deadline(s) missed*) and the phase Preparation is at 100%, not the old calculation described below.',
        ],
        explain: [
          'The four tasks show 100% in the Progress column: an actual finish makes the task complete. The phase Preparation is still at 0%. A phase has no progress of its own, it works that out from its tasks, and that only happens at Calculate. The status bar still shows the end date of the previous calculation, followed by *Out of date*: *End: 30-08-2027*, or *End: 20-09-2027* if you got the status date through **Show me** or **Start over** (the app calculates that project when it opens it).',
          'These four tasks went according to plan, so the dates you typed are the same as in the baseline. You still type them: the actual dates are the facts, the calculated dates remain the forecast. That is also why you enter the start first: if you enter only the finish for a two-day task, the app takes the same day as the start.',
        ],
      },
      ontgraven: {
        title: 'The excavation ran late',
        task: [
          'The groundwater was higher than expected: the foundation trench was only finished after 3 working days instead of 2. For `Excavate foundation trench`, enter **Actual start** `11-06-2027` and **Actual finish** `15-06-2027`.',
          '**Show me** opens, as a new tab, the project with the progress up to and including the excavation. The app calculates it when it opens it: after Show me the status bar says *End: 10-09-2027*, and the tasks after the excavation are already on the new calculation, with the reinforcement on the status date.',
        ],
        explain: [
          'Excavate foundation trench is at 100%, with start 11-06-2027 and finish 15-06-2027. It was planned for 2 working days, Friday 11 and Monday 14 June; in reality it took 3: Friday 11, Monday 14 and Tuesday 15 June. That is the variance this tutorial is about.',
          'The rest of the schedule does not know yet: the columns Start and Finish and everything behind the excavation are still on the old calculation. Only at Calculate does it move along.',
        ],
      },
      fundering: {
        title: 'The reinforcement, the inspection and the pour',
        task: [
          'Enter:',
          '- `Foundation formwork and reinforcement`: **Actual start** `16-06-2027`, **Actual finish** `18-06-2027`. The reinforcement could only start when the excavation was finished.\n- `Reinforcement inspection`: at **Actual finish** `18-06-2027`.\n- `Pour foundation`: **Actual start** `21-06-2027 07:00`, **Actual finish** `21-06-2027 14:00`. The pour is a task in hours, so type the clock time as well.',
          '**Show me** opens, as a new tab, the project with the progress up to and including the pour. The app calculates it when it opens it: after Show me the status bar says *End: 01-09-2027*, and the foundation brickwork, which has not started yet, is on 28 and 29 June.',
        ],
        explain: [
          'All three show 100%. The inspection was on Friday 18 June and the pour follows the inspection: after the weekend that is Monday 21 June, from 07:00 to 14:00 (6 hours, with the break from 12 to 13).',
          'Why the clock time? A task in hours has an actual start and an actual finish with a time of day. If you type only the date, the app does not know what time the pour started and then calculates with a different time: the result no longer matches the rest of this tutorial, and the step does not count as done.',
        ],
      },
      metselwerk: {
        title: 'The foundation brickwork is under way',
        task: [
          'The foundation brickwork started on Friday 25 June and is half finished on the status date. For `Foundation brickwork`, first enter `25-06-2027` at **Actual start** and then `50` at **Progress**.',
          '**Show me** opens, as a new tab, the project with all the progress of this tutorial. The app calculates it when it opens it, so the next step, Calculating, is then done as well: the status bar says *End: 31-08-2027*.',
        ],
        explain: [
          'The task is at 50% with an actual start and no actual finish yet: it is under way. The remaining work is the duration times what is still to do: 2 working days × (1 − 0.5) = 1 working day. That remaining work starts on the status date, Monday 28 June.',
          'Why the start first? If you type only the percentage, the app takes the date in the Start column as the actual start: Thursday 24 June if you entered everything yourself, a later day after **Show me** or **Start over**. But the brickwork started on Friday, after the 3 working days of waiting after the pour from tutorial 2 (22, 23 and 24 June).',
        ],
      },
      berekenen: {
        title: 'Calculating',
        task: [
          'Click *Table › Schedule › Calculate*, or press F5. If *Calculate automatically* is on, the app has already calculated and this step is already done.',
        ],
        explain: [
          'The status bar says *End: 31-08-2027* and *Critical path: 10 tasks, 47 work days*. The handover is on Tuesday 31 August, one working day later than the baseline of Monday 30 August. In the table the eight finished tasks are at 100% and no longer critical: a finished task is fixed on its actual dates and can no longer determine the handover. The phase Preparation is now at 100% and Foundations at 81%.',
          'Why one day? The excavation was on the critical path: every task behind it waited for its finish. It took a day longer, so everything behind it moves a working day. That is how the foundation brickwork started on Friday 25 June: 3 working days of waiting after the pour of Monday 21 June, so 22, 23 and 24 June. Its bar runs from the actual start to Monday 28 June, the status date: the remaining work of 1 working day. The hollow-core floor follows on Tuesday 29 June, a day later than the Monday 28 June the baseline had.',
          'The 81% of Foundations is a weighted average: the tasks in it weigh 8.375 working days together (2 + 3 + 0.75 + 2 + 0.625; a milestone weighs 0 and a task in hours counts in proportion to the 8-hour working day) and of that 6.75 is done (2 + 3 + 0.75 + half of 2).',
        ],
      },
      'afwijking-gantt': {
        title: 'The variance in the Gantt',
        task: [
          'Click the *Home* tab. In the Gantt, look below the bars of Excavate foundation trench and the tasks after it. Scroll the Gantt to the right and down to see Handover as well.',
        ],
        explain: [
          'Below every bar there is still the thin grey bar of the baseline, and now you see the difference. The excavation is a day longer at the end than its baseline, and from the reinforcement onwards every task starts and finishes a working day to the right of its baseline. At Handover the diamond of the baseline is a working day to the left of the milestone itself. The eight finished tasks are no longer red.',
          'The orange line on 28 June is almost straight now: everything to the left of it is finished, except for the half-done foundation brickwork. The line bends there to the point in the bar that the percentage indicates. At a glance it shows who is ahead of or behind the schedule.',
        ],
      },
      'afwijking-tabel': {
        title: 'The variance in numbers',
        task: [
          'Click the *Table* tab. Open *Table › Columns › Columns…* and expand the columns of your baseline under **Baseline**. Choose **Baseline — Finish variance**. If the column is out of view, scroll the table to the right.',
        ],
        explain: [
          'For the first four tasks the column shows 0: they went as agreed. For Excavate foundation trench it shows 1, and for every task after that also 1, up to and including Handover. The variance is in working days: a positive number is later, a negative number earlier.',
          'One task, one day, and the whole chain behind it moves along. So does the painting, which has 6 working days of float, and also shows 1: float does not stop a task from moving, it only stops the handover from moving with it. The column *Baseline — Start variance* shows that the excavation itself started on time, and that the reinforcement started a day late because it waited for the excavation. In tutorial 7 the same variance is in a report, ready to hand out.',
        ],
        panelOnly: [
          'Want to compare your result? [Open the end result of this tutorial](project://projects/en/na-tut-6.ifc). The rules behind this tutorial are in [Progress, status date and baseline](docs://uitleg-voortgang) and [Critical path and float](docs://uitleg-kritiek-pad). How to do it in your own project is in [Saving and managing a baseline](docs://howto-baseline-opslaan-en-beheren) and [Updating progress](docs://howto-voortgang-bijwerken). Every column you used, including those of the baseline, is in [Table columns](docs://ref-tabelkolommen).',
        ],
      },
    },
  },
};

// ── Tutorial 7: Rapporteren en delen ──────────────────────────────────────────────────────────

const TEXT_7 = {
  nl: {
    title: 'Rapporteren en delen',
    whatLabel: '**Wat je nu ziet, en waarom**',
    intro: [
      '# Rapporteren en delen',
      '## Wat je bouwt',
      'Het is maandag 28 juni 2027, bouwoverleg. De opdrachtgever wil weten hoe het ervoor staat en wat dat voor de oplevering betekent. Je laat twee rapporten van de aanbouw zien, het Voortgangsrapport en de Variance, zet het papier goed, maakt er een PDF van en kijkt hoe je de planning zelf deelt met iemand die een ander planningsprogramma gebruikt.',
      'Aan het eind heb je een PDF van het Voortgangsrapport op A4 liggend, en je weet welke getallen erin staan: gepland 28,7%, werkelijk 25%, de oplevering op 31 augustus en een afwijking van 1 werkdag. Je hebt gezien dat een rapport niets nieuws uitrekent, maar de berekening van tutorial 6 in een vorm zet die je kunt uitdelen.',
      '## Uitgangspunt',
      'Je hebt tutorial 6 afgerond: het project *Aanbouw woning* met de baseline *Basisplanning*, de statusdatum 28 juni 2027 en de voortgang, berekend, met de oplevering op dinsdag 31 augustus 2027. Heb je dat niet, [open dan het resultaat van tutorial 6](project://projects/nl/na-tut-6.ifc). Meldt de app daarbij *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**.',
      'Wil je de stappen in de app zelf doorlopen, klik dan in het lint op *Start › Tutorials › Tutorial 7*. Rechtsonder verschijnt een paneel met steeds één opdracht. Met **Toon mij** zet het paneel de stap voor je klaar, maar dat kan hier alleen bij de eerste stap, waar het zo nodig het resultaat van tutorial 6 opent als nieuw tabblad. Een rapportkeuze, een papierformaat, een PDF en een export laten niets achter in het project; het paneel kan niet zien of je ze gedaan hebt en een extensie kan ze niet voor je doen. Die stappen eindigen daarom met **Klaar, volgende**. Er is ook geen **Opnieuw**: deze tutorial verandert het project niet.',
    ],
    outro: [
      '## Wat je hebt geleerd',
      '- **Een rapport rekent niet zelf, het toont de laatste berekening.** Is je planning gewijzigd sinds die berekening, dan staat boven een tabelrapport *De planning is gewijzigd sinds de laatste berekening — druk op Bereken (F5) voor actuele waarden.* Reken dus eerst, dan rapporteer je.',
      '- **Het Voortgangsrapport meet in werkdagen, niet in taken.** Gepland 28,7% en werkelijk 25% zijn gewogen naar de duur van de taken: 12,375 en 10,75 van de 43,125 werkdagen. Het verschil, 1,625 werkdagen, is de helft van het funderingsmetselwerk (1) en de kanaalplaatvloer (0,625): door de extra dag ontgraven liggen die twee een werkdag achter.',
      '- **De Variance laat dezelfde afwijking zien als de kolommen uit tutorial 6**, per taak en met een totaal: 19 taken later, 0 eerder en een projecteinde van +1 werkdag.',
      '- **Papier en opties onthoudt de app op dit apparaat, voor al je projecten, en ze gelden voor alle rapporten.** Standaard staat het papier op A3 liggend; kies A4 voordat je exporteert als je die printer hebt.',
      '- **Een PDF is om te lezen, een exportbestand om mee verder te werken.** Het rapport eindigt altijd als PDF: de app stuurt niets naar een printer. Wil een collega de planning zelf openen, dan exporteer je het project via *Bestand › Exporteren* naar een ander formaat.',
      'Wil je je project vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-7.ifc), dat hetzelfde is als dat van tutorial 6. De regels en opties staan in [Een rapport maken en afdrukken](docs://howto-rapport-maken-en-afdrukken), [Rapporttypes](docs://ref-rapporttypes), [De rapportageperiode kiezen](docs://howto-rapportageperiode-kiezen) en [Exporteren](docs://howto-exporteren). Wat de getallen betekenen, lees je in [Voortgang, statusdatum en baseline](docs://uitleg-voortgang). Het voortgangsblad voor de uitvoerder staat in [Voortgang uit een spreadsheet importeren](docs://howto-voortgang-importeren).',
    ],
    steps: {
      startpunt: {
        title: 'Het startpunt',
        task: [
          'Zorg dat het project *Aanbouw woning* openstaat zoals tutorial 6 het achterliet. Heb je dat niet, [open dan het resultaat van tutorial 6](project://projects/nl/na-tut-6.ifc). Meldt de app *Dit bestand bevat urenplanning.*, klik dan op **Urenplanning aanzetten**. Kijk in de statusbalk.',
        ],
        explain: [
          'De statusbalk zegt *Einde: 31-08-2027* en *Kritiek pad: 10 taken, 47 werkdagen*, en er staat geen melding *Verouderd*. Dat is de stand voor de rapporten: de laatste berekening, met de voortgang van 28 juni en de baseline Basisplanning.',
          'Een rapport rekent niet zelf. Het laat zien wat de laatste berekening opleverde. Daarom is het goed dat de planning hier niet verouderd is: de getallen in de rapporten zijn dan actueel.',
        ],
      },
      'rapport-openen': {
        title: 'Het tabblad Rapport',
        task: [
          'Klik op het tabblad *Rapport*, of druk op Ctrl+P.',
        ],
        explain: [
          'Links staat de kolom **Rapportage** met bovenaan een keuzelijst voor het rapporttype, daaronder een overzicht en de instellingen. Rechts staat het voorbeeld, en wat je daar ziet komt in de PDF. Het rapporttype staat op *Gantt-afdruk*, de planning als balkenplan voor op papier; staat hij op een ander rapport, dan is dat geen probleem.',
          'Bij **Overzicht** staat *Taken: 27*, *Bladtaken: 23*, *Kritiek: 10* en *Relaties: 24*. De 27 taken zijn de 23 bladtaken, de taken zonder onderliggende taken, plus de vier fasen. De 10 kritieke taken zijn dezelfde 10 als in de statusbalk.',
        ],
      },
      variance: {
        title: 'De Variance: wat is er verschoven?',
        task: [
          'Kies in de keuzelijst bovenaan de kolom **Rapportage** het rapport **Variance**.',
        ],
        explain: [
          'Het Variance-rapport zet de huidige planning naast de baseline. Per taak staan de datums uit de baseline, de huidige datums en het verschil in werkdagen, met de status *Op schema* of *Later*. Links staat bij Overzicht *Taken 23*, *Later 19*, *Eerder 0* en *Projecteinde: +1 werkdagen*.',
          'De vier taken van de voorbereiding staan op *Op schema*. Funderingssleuf ontgraven staat op *Later* met 0 bij de start en +1 bij het einde, en alle taken daarna hebben +1 op start en einde, tot en met Oplevering: 30-08-2027 in de baseline, 31-08-2027 nu. Dat zijn dezelfde getallen als de afwijkingskolommen uit tutorial 6: de Eindafwijking die je daar opende, en de Startafwijking ernaast. De 19 taken die later zijn: alles behalve de vier van de voorbereiding.',
        ],
      },
      voortgangsrapport: {
        title: 'Het Voortgangsrapport: waar staan we?',
        task: [
          'Kies in de keuzelijst bovenaan de kolom **Rapportage** het **Voortgangsrapport**.',
        ],
        explain: [
          'Links en bovenaan het rapport staan de kerncijfers. *Statusdatum 28-06-2027*, *Baseline-einde 30-08-2027*, *Prognose-einde 31-08-2027* en *Δ einde (wd) +1*: de oplevering staat een werkdag later dan afgesproken. Daaronder *Voltooid 8 / 23*, *In uitvoering 1* en *Niet gestart 14*, en lijsten met de taken per groep.',
          '*Gepland (baseline)* is 28,7% en *Werkelijk* is 25%. Beide zijn gewogen naar werkdagen: de 23 taken wegen samen 43,125 werkdagen (een mijlpaal weegt 0 en een taak in uren telt naar rato van de werkdag van 8 uur). Volgens de baseline hadden op 28 juni taken van 12,375 werkdagen klaar moeten zijn: 4 voor de voorbereiding, 2 voor het ontgraven, 3 voor de wapening, 0,75 voor de stort, 2 voor het funderingsmetselwerk en 0,625 voor de kanaalplaatvloer. Werkelijk is 10,75 gedaan: 4 + 2 + 3 + 0,75 en de helft van het metselwerk, 1. Dat is 12,375 ÷ 43,125 = 28,7% en 10,75 ÷ 43,125 = 24,9%, dat het rapport als 25% toont.',
          'Het rapport kijkt naar een periode: standaard *Afgelopen maand*, hier 29-05-2027 – 28-06-2027, tot en met de statusdatum, met een vooruitblik tot 29-07-2027. Daar hangen de lijsten *Voltooid in de afgelopen periode* en *Start in de komende periode* aan. Hoe je de periode aanpast, staat in [De rapportageperiode kiezen](docs://howto-rapportageperiode-kiezen).',
        ],
      },
      papier: {
        title: 'Het papier',
        task: [
          'Staat het Voortgangsrapport nog geselecteerd? Kies dan bij **Papier:** de maat **A4**. Laat **Orientatie:** op Liggend staan.',
        ],
        explain: [
          'Op het scherm verandert er niets: een tabelrapport staat als lange tabel in het voorbeeld, zonder pagina\'s. De keuze telt in de PDF: die bestaat dan uit A4-pagina\'s, liggend. Standaard staat het papier op A3 liggend, wat voor een bouwplanning handig is, maar niet elke printer drukt A3 af. Kies je het formaat nu, dan legt de app de pagina\'s direct voor A4 op, in plaats van dat je ze later moet laten krimpen.',
          'Papier en oriëntatie gelden voor alle rapporten, ook voor de Variance, en de app onthoudt ze op dit apparaat, voor al je projecten.',
        ],
      },
      pdf: {
        title: 'De PDF',
        task: [
          'Klik onderaan in de kolom links op **Exporteer PDF**. Zie je de knop niet, scroll de kolom dan omlaag.',
        ],
        explain: [
          'De app maakt een PDF van wat je in het voorbeeld ziet: *Aanbouw woning-voortgang.pdf*, drie pagina\'s A4 liggend. In de desktopapp kies je in een opslagdialoog waar het bestand komt. In de browser zet je browser hem in de downloadmap, of vraagt eerst waar hij moet komen; de app zelf meldt daarbij niets, dus kijk in de downloads van je browser.',
          'Een rapport eindigt altijd als PDF: de app stuurt niets naar een printer. Die PDF druk je af met je PDF-lezer, of mail je door. Wil je ook de Variance, kies hem dan en klik op **Exporteer PDF**: dat geeft *Aanbouw woning-afwijkingen.pdf*, één pagina, ook A4 liggend.',
        ],
      },
      delen: {
        title: 'Delen: de planning zelf',
        task: [
          'Een PDF is om te lezen. Voor een collega die de planning zelf wil openen, in een ander programma, exporteer je het project. Klik op het tabblad *Bestand* en dan op **Exporteren**. Kies **MS Project XML**.',
        ],
        explain: [
          'Het exportscherm toont de formaten: *Voortgangsblad (Excel)*, *Voortgangsblad (CSV)*, *CSV (puntkomma-gescheiden)*, *MS Project XML* (met de toelichting *Te openen in Microsoft Project. Volledige WBS-structuur.*), *Primavera P6 XML* en *IFC 4x3*. Na je keuze komt het bestand *Aanbouw woning.xml*: in de browser meldt de app dat het in je downloadmap staat, of je krijgt een opslagdialoog; in de desktopapp kies je zelf waar het komt. Het project zelf verandert niet.',
          'In het bestand staan de statusdatum, de voortgang en de baseline: de collega ziet dus niet alleen de planning, maar ook wat er sinds 7 juni gebeurd is. Het *Voortgangsblad* is er voor de andere kant op: een slank blad met alleen id, WBS, naam, datums en voltooiing, dat de uitvoerder kan invullen en dat je terugleest met *Voortgang bijwerken uit een blad*. Zo hoef je volgende week niet alles zelf te typen. Dat doe je in [Voortgang uit een spreadsheet importeren](docs://howto-voortgang-importeren).',
        ],
        panelOnly: [
          'Wil je je project vergelijken? [Open het eindresultaat van deze tutorial](project://projects/nl/na-tut-7.ifc), dat hetzelfde is als dat van tutorial 6. De regels en opties staan in [Een rapport maken en afdrukken](docs://howto-rapport-maken-en-afdrukken), [Rapporttypes](docs://ref-rapporttypes), [De rapportageperiode kiezen](docs://howto-rapportageperiode-kiezen) en [Exporteren](docs://howto-exporteren). Wat de getallen betekenen, lees je in [Voortgang, statusdatum en baseline](docs://uitleg-voortgang). Het voortgangsblad voor de uitvoerder staat in [Voortgang uit een spreadsheet importeren](docs://howto-voortgang-importeren).',
        ],
      },
    },
  },
  en: {
    title: 'Reporting and sharing',
    whatLabel: '**What you see now, and why**',
    intro: [
      '# Reporting and sharing',
      '## What you build',
      'It is Monday 28 June 2027, site meeting. The client wants to know how things stand and what that means for the handover. You show two reports of the extension, the Progress report and the Variance, set the paper right, make a PDF of it and look at how to share the schedule itself with someone who uses a different planning program.',
      'At the end you have a PDF of the Progress report on A4 landscape, and you know which numbers are in it: planned 28.7%, actual 25%, the handover on 31 August and a variance of 1 working day. You have seen that a report works out nothing new, but puts the calculation of tutorial 6 in a form you can hand out.',
      '## Starting point',
      'You have finished tutorial 6: the project *House extension* with the baseline *Baseline*, the status date 28 June 2027 and the progress, calculated, with the handover on Tuesday 31 August 2027. If you have not, [open the result of tutorial 6](project://projects/en/na-tut-6.ifc). If the app then says *This file contains hour-based planning.*, click **Enable hour planning**.',
      'To walk through the steps in the app itself, click *Home › Tutorials › Tutorial 7* on the ribbon. A panel appears at the bottom right with one instruction at a time. **Show me** sets the step up for you, but here that is only possible for the first step, where it opens the result of tutorial 6 as a new tab if needed. A report choice, a paper size, a PDF and an export leave nothing behind in the project; the panel cannot see whether you have done them and an extension cannot do them for you. Those steps therefore end with **Done, next**. There is no **Start over** either: this tutorial does not change the project.',
    ],
    outro: [
      '## What you have learned',
      '- **A report does not calculate by itself, it shows the last calculation.** If your schedule has changed since that calculation, a table report starts with *The schedule changed since the last calculation — press Calculate (F5) for current values.* So calculate first, then report.',
      '- **The Progress report measures in working days, not in tasks.** Planned 28.7% and actual 25% are weighted by the duration of the tasks: 12.375 and 10.75 of the 43.125 working days. The difference, 1.625 working days, is half of the foundation brickwork (1) and the hollow-core floor (0.625): because of the extra day of excavation those two are a working day behind.',
      '- **The Variance shows the same variance as the columns from tutorial 6**, per task and with a total: 19 tasks later, 0 earlier and a project end of +1 working day.',
      '- **The app remembers paper and options on this device, for all your projects, and they apply to all reports.** The paper is on A3 landscape by default; choose A4 before you export if that is your printer.',
      '- **A PDF is for reading, an export file is for working on.** The report always ends as a PDF: the app sends nothing to a printer. If a colleague wants to open the schedule itself, you export the project to another format via *File › Export*.',
      'Want to compare your project? [Open the end result of this tutorial](project://projects/en/na-tut-7.ifc), which is the same as that of tutorial 6. The rules and options are in [Making and printing a report](docs://howto-rapport-maken-en-afdrukken), [Report types](docs://ref-rapporttypes), [Choosing the reporting period](docs://howto-rapportageperiode-kiezen) and [Exporting](docs://howto-exporteren). What the numbers mean is in [Progress, status date and baseline](docs://uitleg-voortgang). The progress sheet for the foreman is in [Importing progress from a spreadsheet](docs://howto-voortgang-importeren).',
    ],
    steps: {
      startpunt: {
        title: 'The starting point',
        task: [
          'Make sure the project *House extension* is open as tutorial 6 left it. If not, [open the result of tutorial 6](project://projects/en/na-tut-6.ifc). If the app says *This file contains hour-based planning.*, click **Enable hour planning**. Look at the status bar.',
        ],
        explain: [
          'The status bar says *End: 31-08-2027* and *Critical path: 10 tasks, 47 work days*, and there is no *Out of date* message. That is the situation for the reports: the last calculation, with the progress of 28 June and the baseline.',
          'A report does not calculate by itself. It shows what the last calculation produced. That is why it is good that the schedule is not out of date here: the numbers in the reports are then current.',
        ],
      },
      'rapport-openen': {
        title: 'The Report tab',
        task: [
          'Click the *Report* tab, or press Ctrl+P.',
        ],
        explain: [
          'On the left is the **Report** column with a list for the report type at the top, below it a summary and the settings. On the right is the preview, and what you see there ends up in the PDF. The report type is on *Gantt chart*, the schedule as a bar chart for paper; if it is on another report, that is no problem.',
          'Under **Summary** it says *Tasks: 27*, *Leaf tasks: 23*, *Critical: 10* and *Relations: 24*. The 27 tasks are the 23 leaf tasks, the tasks without subtasks, plus the four phases. The 10 critical tasks are the same 10 as in the status bar.',
        ],
      },
      variance: {
        title: 'The Variance: what has moved?',
        task: [
          'In the list at the top of the **Report** column, choose the report **Variance**.',
        ],
        explain: [
          'The Variance report puts the current schedule next to the baseline. Per task it shows the baseline dates, the current dates and the difference in working days, with the status *On schedule* or *Later*. On the left the Summary says *Tasks 23*, *Later 19*, *Earlier 0* and *Project end: +1 work days*.',
          'The four preparation tasks are *On schedule*. Excavate foundation trench is *Later* with 0 at the start and +1 at the finish, and all tasks after it have +1 at start and finish, up to and including Handover: 30-08-2027 in the baseline, 31-08-2027 now. Those are the same numbers as the variance columns from tutorial 6: the Finish variance you opened there, and the Start variance next to it. The 19 tasks that are later: everything except the four of the preparation.',
        ],
      },
      voortgangsrapport: {
        title: 'The Progress report: where do we stand?',
        task: [
          'In the list at the top of the **Report** column, choose the **Progress report**.',
        ],
        explain: [
          'On the left and at the top of the report are the key figures. *Status date 28-06-2027*, *Baseline finish 30-08-2027*, *Forecast finish 31-08-2027* and *Δ finish (wd) +1*: the handover is a working day later than agreed. Below that *Complete 8 / 23*, *In progress 1* and *Not started 14*, and lists of the tasks per group.',
          '*Planned (baseline)* is 28.7% and *Actual* is 25%. Both are weighted by working days: the 23 tasks weigh 43.125 working days together (a milestone weighs 0 and a task in hours counts in proportion to the 8-hour working day). According to the baseline, tasks of 12.375 working days should have been finished on 28 June: 4 for the preparation, 2 for the excavation, 3 for the reinforcement, 0.75 for the pour, 2 for the foundation brickwork and 0.625 for the hollow-core floor. In reality 10.75 is done: 4 + 2 + 3 + 0.75 and half of the brickwork, 1. That is 12.375 ÷ 43.125 = 28.7% and 10.75 ÷ 43.125 = 24.9%, which the report shows as 25%.',
          'The report looks at a period: by default *Last month*, here 29-05-2027 – 28-06-2027, up to and including the status date, with a look ahead until 29-07-2027. The lists *Completed in the past period* and *Starting in the next period* hang on that. How to adjust the period is in [Choosing the reporting period](docs://howto-rapportageperiode-kiezen).',
        ],
      },
      papier: {
        title: 'The paper',
        task: [
          'Is the Progress report still selected? Then choose the size **A4** at **Paper:**. Leave **Orientation:** on Landscape.',
        ],
        explain: [
          'Nothing changes on the screen: a table report is a long table in the preview, without pages. The choice counts in the PDF: it then consists of A4 pages, landscape. The paper is on A3 landscape by default, which is handy for a construction schedule, but not every printer prints A3. If you choose the size now, the app lays out the pages for A4 straight away, instead of you having to shrink them later.',
          'Paper and orientation apply to all reports, including the Variance, and the app remembers them on this device, for all your projects.',
        ],
      },
      pdf: {
        title: 'The PDF',
        task: [
          'Click **Export PDF** at the bottom of the left column. If you do not see the button, scroll the column down.',
        ],
        explain: [
          'The app makes a PDF of what you see in the preview: *House extension-voortgang.pdf*, three pages on A4 landscape. In the desktop app you choose in a save dialog where the file goes. In the browser, your browser puts it in the downloads folder, or asks first where it should go; the app itself reports nothing, so look in your browser\'s downloads.',
          'A report always ends as a PDF: the app sends nothing to a printer. You print that PDF with your PDF reader, or mail it on. If you want the Variance too, choose it and click **Export PDF**: that gives *House extension-afwijkingen.pdf*, one page, also A4 landscape.',
        ],
      },
      delen: {
        title: 'Sharing: the schedule itself',
        task: [
          'A PDF is for reading. For a colleague who wants to open the schedule itself, in another program, you export the project. Click the *File* tab and then **Export**. Choose **MS Project XML**.',
        ],
        explain: [
          'The export screen shows the formats: *Progress sheet (Excel)*, *Progress sheet (CSV)*, *CSV (semicolon-separated)*, *MS Project XML* (described as *Opens in Microsoft Project. Full WBS structure.*), *Primavera P6 XML* and *IFC 4x3*. After your choice the file *House extension.xml* appears: in the browser the app reports that it is in your downloads folder, or you get a save dialog; in the desktop app you choose where it goes. The project itself does not change.',
          'The file holds the status date, the progress and the baseline: your colleague sees not only the schedule, but also what has happened since 7 June. The *Progress sheet* is for the other direction: a slim sheet with only id, WBS, name, dates and completion, which the foreman can fill in and which you read back with *Update progress from a spreadsheet*. That way you do not have to type everything yourself next week. You do that in [Importing progress from a spreadsheet](docs://howto-voortgang-importeren).',
        ],
        panelOnly: [
          'Want to compare your project? [Open the end result of this tutorial](project://projects/en/na-tut-7.ifc), which is the same as that of tutorial 6. The rules and options are in [Making and printing a report](docs://howto-rapport-maken-en-afdrukken), [Report types](docs://ref-rapporttypes), [Choosing the reporting period](docs://howto-rapportageperiode-kiezen) and [Exporting](docs://howto-exporteren). What the numbers mean is in [Progress, status date and baseline](docs://uitleg-voortgang). The progress sheet for the foreman is in [Importing progress from a spreadsheet](docs://howto-voortgang-importeren).',
        ],
      },
    },
  },
};

// Tutorial 6. De statusdatum en de voortgang zijn te lezen (controle), maar niet te schrijven door de extensie, en een
// baseline niet te lezen en niet te schrijven. Toon mij opent daarom per stap een stand van de generator: bij
// `startpunt` het resultaat van tutorial 5, bij `baseline` t/m `metselwerk` de tussenstand waarin die stap gedaan is
// (`tussen-tut-6-*`, zie de helpers hierboven; de app rekent ze bij het openen door) en vanaf `berekenen` het
// resultaat van tutorial 6. `reset` staat bij elke stap die het document verandert, want de generator levert van
// elk daarvan de beginstand: `baseline` (na-tut-5), `statusdatum` (tussen-tut-6-baseline), `voorbereiding`
// (-statusdatum), `ontgraven` (-voorbereiding), `fundering` (-ontgraven) en `metselwerk` (-fundering). Niet bij
// `berekenen`: zijn beginstand (`tussen-tut-6-metselwerk`) is na het openen al gerekend. `baseline` heeft geen
// controle: een baseline laat geen spoor na in `api.data` ("Klaar, volgende").
//
// Ankers: alle stappen met invoer in de tabel wijzen een lintitem aan, geen paneel (zie tutorial 2 en 3: een anker
// in Eigenschappen laat het begeleidingspaneel naar links uitwijken). De lintgroep Baselines & voortgang bevat
// widgets in één component; daarom het anker op de groep (zie tutorial 5).
const STEP_ORDER_6 = [
  'startpunt', 'baseline', 'statusdatum', 'voorbereiding', 'ontgraven', 'fundering', 'metselwerk', 'berekenen',
  'afwijking-gantt', 'afwijking-tabel',
];

const STEP_LOGIC_6 = {
  startpunt: {
    check: startFromTutorial5,
    prepare: ensureAfterTutorial5,
  },
  // Geen controle (een baseline is voor de extensie onzichtbaar), dus Toon mij opent altijd de stand met baseline.
  baseline: {
    anchor: 'ribbon-group:planning:baselines',
    prepare: api => api.help.openBundledProject(projectAsset(uiLang(), 'tussen-tut-6-baseline')),
    reset: 'na-tut-5',
  },
  statusdatum: {
    anchor: 'ribbon-group:planning:baselines',
    check: statusDateIsSet,
    prepare: api => ensureTut6Stage(api, statusDateIsSet, 'tussen-tut-6-statusdatum'),
    reset: 'tussen-tut-6-baseline',
  },
  voorbereiding: {
    anchor: 'ribbon:table:tableColumns',
    check: api => progressGroupDone(api, 'voorbereiding'),
    prepare: api => ensureTut6Stage(api, a => statusDateIsSet(a) && progressUpTo(a, 'voorbereiding'), 'tussen-tut-6-voorbereiding'),
    reset: 'tussen-tut-6-statusdatum',
  },
  ontgraven: {
    anchor: 'ribbon-tab:table',
    check: api => progressGroupDone(api, 'ontgraven'),
    prepare: api => ensureTut6Stage(api, a => statusDateIsSet(a) && progressUpTo(a, 'ontgraven'), 'tussen-tut-6-ontgraven'),
    reset: 'tussen-tut-6-voorbereiding',
  },
  fundering: {
    anchor: 'ribbon-tab:table',
    check: api => progressGroupDone(api, 'fundering'),
    prepare: api => ensureTut6Stage(api, a => statusDateIsSet(a) && progressUpTo(a, 'fundering'), 'tussen-tut-6-fundering'),
    reset: 'tussen-tut-6-ontgraven',
  },
  metselwerk: {
    anchor: 'ribbon-tab:table',
    check: brickworkRunning,
    prepare: api => ensureTut6Stage(api, allProgressEntered, 'tussen-tut-6-metselwerk'),
    reset: 'tussen-tut-6-fundering',
  },
  berekenen: {
    anchor: 'ribbon:table:calc',
    check: api => startFromTutorial6(api) && progressCalculated(api),
    prepare: ensureAfterTutorial6,
  },
  // De twee leesstappen hebben geen controle (een kolom of een Gantt-weergave laat geen spoor in het document na).
  // Toon mij zet de stand klaar: voortgang ingevuld en berekend.
  'afwijking-gantt': {
    anchor: 'ribbon-tab:start',
    prepare: ensureAfterTutorial6,
  },
  'afwijking-tabel': {
    anchor: 'ribbon:table:tableColumns',
    prepare: ensureAfterTutorial6,
  },
};

// Tutorial 7. Het project verandert niet: alleen `startpunt` heeft een controle en een Toon mij (het resultaat van
// tutorial 6, berekend). Een rapportkeuze, het papier, de PDF-export en het exportvenster laten geen spoor na in het
// document en zijn voor een extensie niet te lezen: "Klaar, volgende". Geen `reset`: er is geen stap die het
// document verandert. Ankers: het tabblad Rapport, het rapportpaneel en het tabblad Bestand.
const STEP_ORDER_7 = [
  'startpunt', 'rapport-openen', 'variance', 'voortgangsrapport', 'papier', 'pdf', 'delen',
];

const STEP_LOGIC_7 = {
  startpunt: {
    check: startFromTutorial6,
    prepare: ensureAfterTutorial6,
  },
  'rapport-openen': { anchor: 'ribbon-tab:report' },
  variance: { anchor: 'report-panel' },
  voortgangsrapport: { anchor: 'report-panel' },
  papier: { anchor: 'report-panel' },
  pdf: { anchor: 'report-panel' },
  delen: { anchor: 'ribbon-tab:file' },
};

// ── De beelden ────────────────────────────────────────────────────────────────────────────────
//
// GEGENEREERD, niet met de hand gemaakt: in een checkout van de app `npm run gen:docs-screenshots -- --out
// <deze map>`. Dat draait per tutorial het stapscript (`tests/browser/tutorials/tut-<n>.ts` van de app) met echte
// klikken vanaf de stand van de generator, controleert na elke stap de toestand en schrijft de uitsneden naar
// `img/<taal>/<naam>.webp` (alleen licht thema). De naam hier is die van het beeld in het stapscript.
//
// Alleen waar het beeld iets toevoegt (ontwerp gebruikersdocumentatie §4): een venster dat de lezer moet
// invullen, en wat je na een stap ziet als dat in woorden lastig is (de Gantt, het histogram, een rapport).
// `at`: 'task' = onder de opdracht (het venster tijdens de stap), 'explain' = in "Wat je nu ziet, en waarom",
// na de eerste alinea (die zegt wat je ziet; de rest legt uit waarom). In het artikel staan ze allemaal. In het paneel alleen `panel: true`: kleine uitsneden (±300 px,
// leesbaar in het paneel) van iets in de rechterrail, waar het begeleidingspaneel overheen kan liggen.
const STEP_IMAGES = {
  [TUTORIAL_1_ID]: {
    'nieuw-project': [{ file: 'tut-1-nieuw-project', at: 'task', alt: {
      nl: 'Het venster Nieuw project, ingevuld: projectnaam Aanbouw woning, startdatum 07-06-2027, land Nederland, bouwvak Geen en de regel 36 feestdagen, 2026–2030.',
      en: 'The New project window, filled in: project name House extension, start date 07-06-2027, country Netherlands, construction holiday None and the line 36 holidays, 2026–2030.',
    } }],
    berekenen: [{ file: 'tut-1-berekend', at: 'explain', alt: {
      nl: 'De takenlijst met de vier fasen en hun taken, en de Gantt na Bereken: alle balken beginnen op maandag 7 juni, Buitenspouwblad metselen is rood en achter de andere taken loopt een groene band speling.',
      en: 'The task list with the four phases and their tasks, and the Gantt after Calculate: every bar starts on Monday 7 June, Build outer cavity leaf is red and a green float band runs behind the other tasks.',
    } }],
  },
  [TUTORIAL_2_ID]: {
    'relaties-tekenen': [{ file: 'tut-2-type-relatie', at: 'task', alt: {
      nl: 'Het venstertje Type relatie in de Gantt, met FS gekozen en een vak voor de lag, na het slepen van Bouwplaats inrichten naar Tuin en bestrating verwijderen.',
      en: 'The small Relation type window in the Gantt, with FS selected and a box for the lag, after dragging from Set up site to Clear garden and paving.',
    } }],
    berekenen: [{ file: 'tut-2-kritiek-pad', at: 'explain', alt: {
      nl: 'De Gantt na Bereken, passend gemaakt op het project: de taken staan achter elkaar van juni tot augustus, het kritieke pad is rood, en Buitenspouwblad metselen en Schilderwerk zijn blauw met een groene band speling.',
      en: 'The Gantt after Calculate, fitted to the project: the tasks follow each other from June to August, the critical path is red, and Build outer cavity leaf and Painting are blue with a green float band.',
    } }],
    uitloop: [{ file: 'tut-2-speling', at: 'task', alt: {
      nl: 'De tabel bij de ruwbouw, 3.1 tot en met 3.6: Buitenspouwblad metselen is niet kritiek en heeft 2d totale speling, de andere taken zijn kritiek met 0d, en bij Kozijnen plaatsen staat het bliksemsymbool achter 3.4 FS.',
      en: 'The table at the shell, 3.1 up to 3.6: Build outer cavity leaf is not critical and has 2d total float, the other tasks are critical with 0d, and at Install window frames the lightning symbol follows 3.4 FS.',
    } }],
  },
  [TUTORIAL_3_ID]: {
    bouwvak: [{ file: 'tut-3-feestdagen-genereren', at: 'task', alt: {
      nl: 'Feestdagen genereren in het venster Kalenders: land Nederland, bouwvak Midden gekozen, de regel 41 feestdagen, 2026–2030 en de knop Genereren.',
      en: 'Generate holidays in the Calendars window: country Netherlands, construction holiday Central selected, the line 41 holidays, 2026–2030 and the Generate button.',
    } }],
    berekenen: [{ file: 'tut-3-bouwvak-constraint', at: 'explain', alt: {
      nl: 'De Gantt na Bereken: het grijze blok Bouwvak (Midden) in augustus, het kritieke pad in rood vanaf Kozijnen plaatsen, de taken daarvoor blauw met speling, en Schilderwerk dat over de bouwvak heen loopt.',
      en: 'The Gantt after Calculate: the grey Bouwvak (Midden) block in August, the critical path in red from Install window frames, the tasks before it blue with float, and Painting running across the construction holiday.',
    } }],
    'deadline-krap': [{ file: 'tut-3-deadline-overschreden', at: 'explain', panel: true, alt: {
      nl: 'Het paneel Waarschuwingen: 0 fout(en), 1 waarschuwing(en), met bij 4.7 Oplevering de melding Deadline 27-08-2027 overschreden — vroegste einde 01-09-2027.',
      en: 'The Warnings panel: 0 error(s), 1 warning(s), with at 4.7 Handover the message Deadline 27-08-2027 missed — early finish 01-09-2027.',
    } }],
  },
  [TUTORIAL_4_ID]: {
    urenplanning: [{ file: 'tut-4-urenplanning', at: 'task', alt: {
      nl: 'Het venster Instellingen op het tabblad Planning: onder Urenplanning staan Urenplanning inschakelen en Gemengde dag/uur-planning toestaan aan.',
      en: 'The Settings window on the Planning tab: under Hour planning, Enable hour planning and Allow mixed day/hour planning are on.',
    } }],
    berekenen: [{ file: 'tut-4-kloktijden', at: 'explain', alt: {
      nl: 'De tabel na Bereken, met bredere kolommen Start en Einde: Fundering storten 18-06-2027 07:00 tot 14:00, Kanaalplaatvloer leggen 28-06-2027 07:00 tot 12:00 en Dakelementen plaatsen 06-07-2027 07:00 tot 14:00, met 3,25d en 3,38d totale speling.',
      en: 'The table after Calculate, with wider Start and Finish columns: Pour foundation 18-06-2027 07:00 to 14:00, Lay hollow-core floor 28-06-2027 07:00 to 12:00 and Place roof elements 06-07-2027 07:00 to 14:00, with 3.25d and 3.38d total float.',
    } }],
  },
  [TUTORIAL_5_ID]: {
    resources: [{ file: 'tut-5-resources', at: 'explain', alt: {
      nl: 'Het resourcepaneel met de vijf resources: Timmerploeg (Ploeg, 1), Metselaar (Arbeid, 1), Mobiele kraan (Materieel, 1), Stukadoor (Onderaannemer, 2) en Beton (Materiaal, 50, eenheid m³).',
      en: 'The resource panel with the five resources: Carpentry crew (Crew, 1), Bricklayer (Labor, 1), Mobile crane (Equipment, 1), Plasterer (Subcontractor, 2) and Concrete (Material, 50, unit m³).',
    } }],
    werkregel: [{ file: 'tut-5-werkregel', at: 'explain', panel: true, alt: {
      nl: 'In Eigenschappen staat het veld Werkregel op Vast werk, met eronder Beschermd: werk (duur volgt de inzet).',
      en: 'In Properties the Work rule field is on Fixed work, with Protected: work (duration follows units) below it.',
    } }],
    histogram: [{ file: 'tut-5-histogram-kraan', at: 'explain', alt: {
      nl: 'Het histogram met links de resourcelijst en Mobiele kraan gekozen: twee smalle balken die niet tot de bovenkant van de schaal (1 eenheden) reiken.',
      en: 'The histogram with the resource list on the left and Mobile crane selected: two narrow bars that do not reach the top of the scale (1 units).',
    } }],
    overbezetting: [{ file: 'tut-5-overbezetting', at: 'explain', alt: {
      nl: 'De Gantt met de vier taken van de metselaar geselecteerd, en eronder het histogram van de Metselaar: op vijf dagen steken de balken rood boven de capaciteit uit.',
      en: 'The Gantt with the four tasks of the bricklayer selected, and below it the histogram of the Bricklayer: on five days the bars stick out in red above the capacity.',
    } }],
    nivelleren: [{ file: 'tut-5-nivelleren', at: 'explain', alt: {
      nl: 'Het venster Resources nivelleren na Berekenen: Projecteinddatum: ongewijzigd (30-08-2027) en één regel, Buitenspouwblad metselen, oude start 29-06-2027, nieuwe start 06-07-2027, 5 d.',
      en: 'The Level resources window after Calculate: Project end date: unchanged (30-08-2027) and one line, Build outer cavity leaf, old start 29-06-2027, new start 06-07-2027, 5 d.',
    } }],
  },
  [TUTORIAL_6_ID]: {
    baseline: [{ file: 'tut-6-baseline', at: 'explain', alt: {
      nl: 'Het venster Baselines met één baseline, Basisplanning, met het bolletje onder Actief.',
      en: 'The Baselines window with one baseline, Baseline, with the dot under Active.',
    } }],
    metselwerk: [{ file: 'tut-6-voortgang', at: 'explain', alt: {
      nl: 'De tabel met de kolommen Voortgang, Werkelijke start en Werkelijke einde ingevuld: de acht taken van de voorbereiding en de fundering op 100 %, Funderingsmetselwerk op 50 % met alleen een werkelijke start.',
      en: 'The table with the Progress, Actual start and Actual finish columns filled in: the eight tasks of the preparation and the foundations at 100%, Foundation brickwork at 50% with only an actual start.',
    } }],
    'afwijking-gantt': [{ file: 'tut-6-afwijking-gantt', at: 'explain', alt: {
      nl: 'De Gantt na Bereken: onder elke balk de grijze balk van de baseline, de oranje statusdatumlijn op 28 juni, en vanaf het ontgraven ligt elke taak een werkdag rechts van zijn baseline.',
      en: 'The Gantt after Calculate: below every bar the grey baseline bar, the orange status date line on 28 June, and from the excavation onwards every task lies a working day to the right of its baseline.',
    } }],
  },
  [TUTORIAL_7_ID]: {
    variance: [{ file: 'tut-7-variance', at: 'explain', alt: {
      nl: 'Het Variance-rapport: links Taken 23, Later 19, Eerder 0 en Projecteinde: +1 werkdagen; rechts per taak de datums uit de baseline, de huidige datums, de afwijking en de status.',
      en: 'The Variance report: on the left Tasks 23, Later 19, Earlier 0 and Project end: +1 work days; on the right per task the baseline dates, the current dates, the variance and the status.',
    } }],
    voortgangsrapport: [{ file: 'tut-7-voortgangsrapport', at: 'explain', alt: {
      nl: 'Het Voortgangsrapport: statusdatum 28-06-2027, baseline-einde 30-08-2027, prognose-einde 31-08-2027, Δ einde +1, gepland 28,7 % en werkelijk 25 %, met daaronder de takenlijsten per groep.',
      en: 'The Progress report: status date 28-06-2027, baseline finish 30-08-2027, forecast finish 31-08-2027, Δ finish +1, planned 28.7% and actual 25%, with the task lists per group below.',
    } }],
  },
};

/** De beelden van een stap op plek `at` als Markdown-regels; `panelOnly`: alleen die ook in het paneel staan. */
function imageLines(def, key, lang, at, panelOnly) {
  return ((STEP_IMAGES[def.id] || {})[key] || [])
    .filter(img => img.at === at && (!panelOnly || img.panel))
    .map(img => `![${img.alt[lang]}](img/{lang}/${img.file}.webp)`);
}

/** De zeven tutorials: één bron voor artikel, paneel, lintknop en host-verzoek. */
const TUTORIALS = [
  { id: TUTORIAL_1_ID, order: 1, label: 'Tutorial 1', text: TEXT_1, stepOrder: STEP_ORDER_1, logic: STEP_LOGIC_1 },
  { id: TUTORIAL_2_ID, order: 2, label: 'Tutorial 2', text: TEXT_2, stepOrder: STEP_ORDER_2, logic: STEP_LOGIC_2 },
  { id: TUTORIAL_3_ID, order: 3, label: 'Tutorial 3', text: TEXT_3, stepOrder: STEP_ORDER_3, logic: STEP_LOGIC_3 },
  { id: TUTORIAL_4_ID, order: 4, label: 'Tutorial 4', text: TEXT_4, stepOrder: STEP_ORDER_4, logic: STEP_LOGIC_4 },
  { id: TUTORIAL_5_ID, order: 5, label: 'Tutorial 5', text: TEXT_5, stepOrder: STEP_ORDER_5, logic: STEP_LOGIC_5 },
  { id: TUTORIAL_6_ID, order: 6, label: 'Tutorial 6', text: TEXT_6, stepOrder: STEP_ORDER_6, logic: STEP_LOGIC_6 },
  { id: TUTORIAL_7_ID, order: 7, label: 'Tutorial 7', text: TEXT_7, stepOrder: STEP_ORDER_7, logic: STEP_LOGIC_7 },
];

const para = lines => lines.join('\n\n');

/** Paneeltekst van een stap: titel + opdracht, `---`, uitleg. `panelOnly`: alinea's die alleen in het paneel staan (het artikel heeft ze in de afsluiting). */
function stepBody(def, lang, key) {
  const t = def.text[lang];
  const s = t.steps[key];
  const task = [...s.task, ...imageLines(def, key, lang, 'task', true)];
  const explain = [s.explain[0], ...imageLines(def, key, lang, 'explain', true), ...s.explain.slice(1), ...(s.panelOnly || [])];
  return `**${s.title}**\n\n${para(task)}\n\n---\n\n${t.whatLabel}\n\n${para(explain)}`;
}

/** Leesversie: dezelfde stappen, als artikel. */
function articleBody(def, lang) {
  const t = def.text[lang];
  const stepWord = lang === 'nl' ? 'Stap' : 'Step';
  const steps = def.stepOrder.map((key, i) => {
    const s = t.steps[key];
    const task = [...s.task, ...imageLines(def, key, lang, 'task', false)];
    const explain = [s.explain[0], ...imageLines(def, key, lang, 'explain', false), ...s.explain.slice(1)];
    return `## ${stepWord} ${i + 1} — ${s.title}\n\n${para(task)}\n\n${t.whatLabel}\n\n${para(explain)}`;
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
  if (def.id === TUTORIAL_4_ID) {
    // Vangnet van de urenplanningstap: onthoud welke schakelaars al aan stonden. Geblokkeerde opslag laat
    // dit leeg; de controle gooit dan zelf (en valt terug op "Klaar, volgende").
    try { trueSettingsSeen = trueSettingKeys(); } catch { trueSettingsSeen = null; }
  }
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
    // Tutorial 6 en 7: ook de voortgang telt mee in "berekend" (zie `progressSignature`).
    api.events.on(sdk.hostEvents.scheduleCalculated, (data) => {
      calculatedProgressSignature = data && data.hasError ? null : progressSignature(api);
    });
  },

  onUnload() {
    // De host ruimt artikelen, knop, begeleiding en event-abonnement zelf op.
    calculatedSignature = null;
    calculatedProgressSignature = null;
  },
};
