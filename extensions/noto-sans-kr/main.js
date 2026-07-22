/**
 * Noto Sans KR — CJK-font-provider voor de vector-PDF-export (permissie 'pdf-fonts').
 *
 * Dekking (covers): Hangul Syllables (U+AC00–D7AF), Hangul Jamo (U+1100–11FF), Hangul
 * Compatibility Jamo (U+3130–318F) plus dezelfde ideograaf-/symboolranges als het Chinese
 * font (CJK Unified U+4E00–9FFF, Ext-A U+3400–4DBF, Compat U+F900–FAFF, CJK-symbolen/
 * interpunctie U+3000–303F, fullwidth U+FF00–FFEF) voor Hanja — dekking voor Koreaans.
 * `covers` mag ruim zijn: de app subset per export met harfbuzz en dwingt de werkelijke
 * per-glyph-coverage af, dus overlappende ranges met andere regio-extensies zijn onschadelijk.
 *
 * Alleen Regular: er is bewust geen Bold-instance meegeleverd — de host valt terug op Regular
 * als getBoldBytes ontbreekt.
 */
function covers(cp) {
  return (
    (cp >= 0xac00 && cp <= 0xd7af) || // Hangul Syllables
    (cp >= 0x1100 && cp <= 0x11ff) || // Hangul Jamo
    (cp >= 0x3130 && cp <= 0x318f) || // Hangul Compatibility Jamo
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs (Hanja)
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Unified Ideographs Extension A
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
    (cp >= 0x3000 && cp <= 0x303f) || // CJK Symbols and Punctuation
    (cp >= 0xff00 && cp <= 0xffef)    // Halfwidth and Fullwidth Forms
  );
}

module.exports = {
  onLoad(api) {
    api.pdfFonts.register({
      id: 'noto-sans-kr',
      covers,
      getRegularBytes: () => api.assets.get('NotoSansKR-Regular.ttf'),
    });
  },
  onUnload() {
    // Niets te doen: de host schrijft de font-provider automatisch uit bij disable.
  },
};
