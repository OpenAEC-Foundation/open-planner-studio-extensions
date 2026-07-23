# Noto Sans JP (Japans) — PDF-font

Font-provider-extensie voor **Open Planner Studio**. Registreert
[Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) als
CJK-font-provider voor de vector-PDF-export (permissie `pdf-fonts`), zodat
Japanse tekst (kanji, hiragana, katakana) in geëxporteerde PDF's als echte
vectortekst verschijnt in plaats van via de raster-fallback.

## Wat doet hij?

- `onLoad(api)` roept `api.pdfFonts.register(...)` aan met:
  - `covers(cp)`: dekt dezelfde ideograaf-/symboolranges als het Chinese
    font (CJK Unified U+4E00–9FFF, Ext-A U+3400–4DBF, Compat U+F900–FAFF,
    CJK-symbolen/interpunctie U+3000–303F, fullwidth U+FF00–FFEF) plus
    Hiragana (U+3040–309F) en Katakana (U+30A0–30FF).
  - `getRegularBytes()`: leest `NotoSansJP-Regular.ttf` uit de mee-verpakte
    ZIP-assets via `api.assets.get(...)`.
- Geen Bold-instance: de host valt terug op Regular als `getBoldBytes`
  ontbreekt.

## Font-bestand

`NotoSansJP-Regular.ttf` is een **statische wght=400-instance**, gemaakt met
`fontTools.varLib.instancer` uit het officiële variabele glyf-font
(`google/fonts` repo, `ofl/notosansjp/NotoSansJP[wght].ttf`). Geverifieerd:
`glyf`-outlines (geen `CFF`/`CFF2`), geen resterende `fvar`/`gvar`, en
cmap-dekking van het testwoord `ひらがなカタカナ日本語`.

## Licentie

Noto Sans JP is gelicenseerd onder de **SIL Open Font License 1.1** — zie
[`OFL.txt`](./OFL.txt) in deze map (overgenomen uit `google/fonts`,
`ofl/notosansjp/OFL.txt`).

## Installeren (voor het testen)

Bestand → Extensies → **ZIP** → kies `noto-sans-jp-1.0.0.zip`.
