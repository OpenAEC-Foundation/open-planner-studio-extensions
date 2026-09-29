// Genereert de tussenstand `tussen-tut-3-bouwvak.ifc` (nl + en) van de extensie `tutorials`.
//
// WAAROM EEN TUSSENSTAND. Tutorial 3 begint bij `na-tut-2` en zet als eerste stap de bouwvak in de
// projectkalender. De extensie-API kan de kalender niet wijzigen, dus "Toon mij" op die stap kan alleen
// een project openen waarin de bouwvak al staat. Dit is dat project: `na-tut-2` + bouwvak Midden 2027
// (ma 2 t/m vr 20 aug), berekend. De generator van de app (`npm run gen:tutorial-project`) levert deze
// stand niet; zodra hij dat doet, kan dit script vervallen.
//
// HOE. Dit script draait tegen een checkout van de APP (het gebruikt de echte store, kalendergenerator
// en IFC-writer) en doet dezelfde stappen als het venster Kalenders (`CalendarDialog.commit` en de
// stand `na-tut-3` in `scripts/tutorial-project.ts`): projectkalender in de bibliotheek, feestdagen
// opnieuw genereren mét bouwvak over de projectspanne, kalenderbibliotheek vastleggen, berekenen.
//
//   1. npm run gen:tutorial-project -- --out <map>          (levert <map>/<taal>/na-tut-2.ifc)
//   2. kopieer dit bestand naar <app>/scripts/gen-tussenstand-bouwvak.ts   (niet committen in de app)
//   3. node scripts/run-ts.mjs scripts/gen-tussenstand-bouwvak.ts <map> <uitvoermap>
//   4. kopieer <uitvoermap>/<taal>/tussen-tut-3-bouwvak.ifc naar projects/<taal>/ in de extensie
import '../tests/planning/domStub';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { useAppStore } from '@/state/appStore';
import { writeIFC } from '@/services/ifc/ifcWriter';
import { buildWriteIFCInput } from '@/state/ifcSaveInput';
import { computeGenerateSpan, materializeHolidays } from '@/engine/calendar/generateCalendarHolidays';
import { withCanonicalHolidayEnds } from '@/utils/holidayRange';
import type { WorkCalendar } from '@/types/calendar';
import { BOUWVAK_REGION } from './tutorial-project';

const S = () => useAppStore.getState();
const [inDir, outDir] = process.argv.slice(2);
if (!inDir || !outDir) {
  console.error('gebruik: node scripts/run-ts.mjs scripts/gen-tussenstand-bouwvak.ts <map met na-tut-2> <uitvoermap>');
  process.exit(2);
}

async function main() {
  for (const lang of ['nl', 'en']) {
    const ok = await S().openExampleFromString(readFileSync(join(inDir, lang, 'na-tut-2.ifc'), 'utf8'), 'na-tut-2.ifc');
    if (!ok) throw new Error(`na-tut-2.ifc (${lang}) kon niet geopend worden`);
    S().ensureProjectCalendarInLibrary();
    const projectCalId = S().project.calendarId;
    const span = computeGenerateSpan(S().project.startDate, S().project.endDate || undefined);
    const { holidays, generation } = materializeHolidays(
      { country: 'NL', region: undefined, bouwvak: BOUWVAK_REGION }, span.from, span.to,
    );
    const calendars = (structuredClone(S().calendars) as WorkCalendar[]).map(c =>
      c.id === projectCalId ? { ...c, holidays, generation } : c);
    if (!S().commitCalendarLibrary(calendars.map(withCanonicalHolidayEnds), projectCalId)) throw new Error('kalender niet gewijzigd');
    S().runCPM();
    if (S().cpmResult?.error) throw new Error(`berekenen mislukt: ${S().cpmResult?.error}`);
    // Controle: de bouwvak staat erin en de oplevering staat drie weken later (vr 27 aug 2027).
    const bouwvak = S().calendar.holidays.find(h => h.startDate === '2027-08-02' && h.endDate === '2027-08-20');
    const finish = S().cpmResult?.projectEnd?.slice(0, 10);
    if (!bouwvak || finish !== '2027-08-27') throw new Error(`onverwachte stand: bouwvak ${bouwvak?.name}, einde ${finish}`);
    mkdirSync(join(outDir, lang), { recursive: true });
    writeFileSync(join(outDir, lang, 'tussen-tut-3-bouwvak.ifc'), writeIFC(buildWriteIFCInput(S())), 'utf8');
    console.log(`✓ ${lang}/tussen-tut-3-bouwvak.ifc — ${bouwvak.name}, einde ${finish}`);
  }
}

main().then(() => process.exit(0), (e: unknown) => { console.error(e); process.exit(1); });
