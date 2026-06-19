# Open Planner Studio — Extension Catalog

Catalogus van extensies voor **[Open Planner Studio](https://github.com/OpenAEC-Foundation/open-planner-studio)**.
De app haalt `catalog.json` op via GitHub raw en toont de extensies onder **Bestand → Extensies → Bladeren**.

## Structuur

| Pad | Rol |
|---|---|
| `catalog.json` | De catalogus die de app inleest (raw-URL, ~30 min gecachet) |
| `extensions/<id>/` | Bron + de installeerbare ZIP van elke extensie |

> **Let op — hosting via `raw`, niet via Releases.** De app downloadt de ZIP met een
> gewone browser-`fetch`. GitHub **release-assets** sturen géén `Access-Control-Allow-Origin`
> en worden door CORS geblokkeerd; `raw.githubusercontent.com` stuurt `*` en werkt wél.
> Commit de ZIP daarom in de repo en laat `downloadUrl` naar de raw-URL wijzen.

## `catalog.json`-formaat

```json
{
  "version": "1.0",
  "lastUpdated": "JJJJ-MM-DD",
  "extensions": [
    {
      "id": "mijn-extensie",
      "name": "Mijn Extensie",
      "version": "1.0.0",
      "author": "Naam",
      "description": "Wat het doet.",
      "category": "Import/Export",
      "tags": ["import"],
      "minAppVersion": "2026.0.0",
      "repository": "https://github.com/...",
      "downloadUrl": "https://github.com/OpenAEC-Foundation/open-planner-studio-extensions/releases/download/<tag>/<bestand>.zip",
      "icon": "<svg…>"
    }
  ]
}
```

Categorieën: `Import/Export`, `Planning`, `Reporting`, `Utility`, `Other`.
`minAppVersion` wordt door de app afgedwongen bij activeren.

## Een extensie toevoegen

1. Zet de bron in `extensions/<id>/` (`manifest.json` + `main.js`).
2. Maak een ZIP met **minstens** `manifest.json` + `main.js` in de wortel en commit die
   in `extensions/<id>/`.
3. Voeg een entry toe aan `catalog.json` met `downloadUrl` naar de **raw**-URL van die ZIP
   (zie de waarschuwing hierboven — release-assets werken niet door CORS).

Zie de auteurshandleiding in de app-repo: [`docs/extensions.md`](https://github.com/OpenAEC-Foundation/open-planner-studio/blob/main/docs/extensions.md).
