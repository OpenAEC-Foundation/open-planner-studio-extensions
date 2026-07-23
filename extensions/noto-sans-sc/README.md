# Noto Sans SC (Chinees) — PDF-font

Font-provider-extensie voor **Open Planner Studio**. Registreert
[Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) als
CJK-font-provider voor de vector-PDF-export (permissie `pdf-fonts`), zodat
Chinese (vereenvoudigd) tekst in geëxporteerde PDF's als echte vectortekst
verschijnt in plaats van via de raster-fallback.

## Wat doet hij?

- `onLoad(api)` roept `api.pdfFonts.register(...)` aan met:
  - `covers(cp)`: dekt CJK Unified Ideographs (U+4E00–9FFF), CJK Unified
    Ideographs Extension A (U+3400–4DBF), CJK Compatibility Ideographs
    (U+F900–FAFF), CJK-symbolen/interpunctie (U+3000–303F) en
    fullwidth-vormen (U+FF00–FFEF).
  - `getRegularBytes()`: leest `NotoSansSC-Regular.ttf` uit de mee-verpakte
    ZIP-assets via `api.assets.get(...)`.
- Geen Bold-instance: de host valt terug op Regular als `getBoldBytes`
  ontbreekt.

## Font-bestand

`NotoSansSC-Regular.ttf` is een **statische wght=400-instance**, gemaakt met
`fontTools.varLib.instancer` uit het officiële variabele glyf-font
(`google/fonts` repo, `ofl/notosanssc/NotoSansSC[wght].ttf`). Geverifieerd:
`glyf`-outlines (geen `CFF`/`CFF2`), geen resterende `fvar`/`gvar`, en
cmap-dekking van het testwoord `施工基础中文`.

## Licentie

Noto Sans SC is gelicenseerd onder de **SIL Open Font License 1.1** — zie
[`OFL.txt`](./OFL.txt) in deze map (overgenomen uit `google/fonts`,
`ofl/notosanssc/OFL.txt`).

## Installeren (voor het testen)

Bestand → Extensies → **ZIP** → kies `noto-sans-sc-1.0.0.zip`.
