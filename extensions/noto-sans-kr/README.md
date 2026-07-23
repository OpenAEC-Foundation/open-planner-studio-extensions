# Noto Sans KR (Koreaans) — PDF-font

Font-provider-extensie voor **Open Planner Studio**. Registreert
[Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR) als
CJK-font-provider voor de vector-PDF-export (permissie `pdf-fonts`), zodat
Koreaanse tekst (hangul + hanja) in geëxporteerde PDF's als echte
vectortekst verschijnt in plaats van via de raster-fallback.

## Wat doet hij?

- `onLoad(api)` roept `api.pdfFonts.register(...)` aan met:
  - `covers(cp)`: dekt Hangul Syllables (U+AC00–D7AF), Hangul Jamo
    (U+1100–11FF), Hangul Compatibility Jamo (U+3130–318F) plus dezelfde
    ideograaf-/symboolranges als het Chinese font (CJK Unified U+4E00–9FFF,
    Ext-A U+3400–4DBF, Compat U+F900–FAFF, CJK-symbolen/interpunctie
    U+3000–303F, fullwidth U+FF00–FFEF) voor Hanja.
  - `getRegularBytes()`: leest `NotoSansKR-Regular.ttf` uit de mee-verpakte
    ZIP-assets via `api.assets.get(...)`.
- Geen Bold-instance: de host valt terug op Regular als `getBoldBytes`
  ontbreekt.

## Font-bestand

`NotoSansKR-Regular.ttf` is een **statische wght=400-instance**, gemaakt met
`fontTools.varLib.instancer` uit het officiële variabele glyf-font
(`google/fonts` repo, `ofl/notosanskr/NotoSansKR[wght].ttf`). Geverifieerd:
`glyf`-outlines (geen `CFF`/`CFF2`), geen resterende `fvar`/`gvar`, en
cmap-dekking van het testwoord `한국어공사기초`.

## Licentie

Noto Sans KR is gelicenseerd onder de **SIL Open Font License 1.1** — zie
[`OFL.txt`](./OFL.txt) in deze map (overgenomen uit `google/fonts`,
`ofl/notosanskr/OFL.txt`).

## Installeren (voor het testen)

Bestand → Extensies → **ZIP** → kies `noto-sans-kr-1.0.0.zip`.
