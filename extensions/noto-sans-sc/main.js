/**
 * Noto Sans SC — CJK-font-provider voor de vector-PDF-export (permissie 'pdf-fonts').
 *
 * Dekking (covers): CJK Unified Ideographs (U+4E00–9FFF), CJK Unified Ideographs Extension A
 * (U+3400–4DBF), CJK Compatibility Ideographs (U+F900–FAFF), CJK-symbolen/interpunctie
 * (U+3000–303F) en fullwidth-vormen (U+FF00–FFEF) — dekking voor Chinees (vereenvoudigd).
 * `covers` mag ruim zijn: de app subset per export met harfbuzz en dwingt de werkelijke
 * per-glyph-coverage af, dus overlappende ranges met andere regio-extensies zijn onschadelijk.
 *
 * Alleen Regular: er is bewust geen Bold-instance meegeleverd — de host valt terug op Regular
 * als getBoldBytes ontbreekt.
 */
function covers(cp) {
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Unified Ideographs Extension A
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
    (cp >= 0x3000 && cp <= 0x303f) || // CJK Symbols and Punctuation
    (cp >= 0xff00 && cp <= 0xffef)    // Halfwidth and Fullwidth Forms
  );
}

module.exports = {
  onLoad(api) {
    api.pdfFonts.register({
      id: 'noto-sans-sc',
      covers,
      getRegularBytes: () => api.assets.get('NotoSansSC-Regular.ttf'),
    });
  },
  onUnload() {
    // Niets te doen: de host schrijft de font-provider automatisch uit bij disable.
  },
};
