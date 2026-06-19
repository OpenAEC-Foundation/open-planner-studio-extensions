# Open Planner Studio — Extension Catalog

Catalogus van extensies voor **[Open Planner Studio](https://github.com/OpenAEC-Foundation/open-planner-studio)**.
De app haalt `catalog.json` op via GitHub raw en toont de extensies onder **Bestand → Extensies → Bladeren**.

## Structuur

| Pad | Rol |
|---|---|
| `catalog.json` | De catalogus die de app inleest (raw-URL, ~30 min gecachet) |
| `extensions/<id>/` | Bron van elke extensie (manifest + main.js), voor leesbaarheid en PR's |
| Releases | De installeerbare ZIP per extensie (waar `downloadUrl` naar wijst) |

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
2. Maak een ZIP met **minstens** `manifest.json` + `main.js` in de wortel.
3. Publiceer die ZIP als release-asset (tag bv. `<id>-v<versie>`).
4. Voeg een entry toe aan `catalog.json` met de `downloadUrl` naar die asset.

Zie de auteurshandleiding in de app-repo: [`docs/extensions.md`](https://github.com/OpenAEC-Foundation/open-planner-studio/blob/main/docs/extensions.md).
