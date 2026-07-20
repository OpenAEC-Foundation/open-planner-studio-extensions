# AGENTS.md

Dit is een **statische catalogus** van extensies voor [Open Planner Studio](https://github.com/OpenAEC-Foundation/open-planner-studio).
Geen build, test, lint, codegen of CI — de "deploy" is een git push naar `main` (de app leest `catalog.json` en de ZIP's via `raw.githubusercontent.com`).

## De grote val: ZIP's moeten wél gecommit zijn, maar `.gitignore` negeert ze

`*.zip` staat in `.gitignore`. De workflow eist toch dat elke extensie-ZIP **in de repo wordt gecommit**,
omdat de app `raw.githubusercontent.com` gebruikt (release-assets falen op CORS — zie `README.md`).

- Een nieuwe ZIP **moet met `-f`** worden toegevoegd, anders is hij onzichtbaar voor `git add`:

  ```bash
  cd extensions/<id>
  zip <id>-<version>.zip manifest.json main.js
  git add -f <id>-<version>.zip
  ```

- De bestaande ZIP in `extensions/voorbeeld-takenlijst-importer/` is vóór de `.gitignore`-regel
  gecommit en daarom wél tracked. Re-check met `git ls-files` als je twijfelt.

## Een extensie toevoegen of bumpen

1. Bron staat in `extensions/<id>/` met minimaal `manifest.json` + `main.js` (CommonJS,
   `module.exports = { onLoad(api), onUnload() }`). SDK via `require('open-planner-studio')`.
2. Maak de ZIP met `manifest.json` + `main.js` in de wortel; naamconventie `<id>-<version>.zip`.
3. Voeg de ZIP toe met `git add -f` (zie hierboven).
4. Voeg/werk in `catalog.json` de entry bij. Verplichte velden staan in `README.md`;
   `downloadUrl` **moet** wijzen naar
   `https://raw.githubusercontent.com/OpenAEC-Foundation/open-planner-studio-extensions/main/extensions/<id>/<id>-<version>.zip`.
5. Bump `lastUpdated` (formaat `JJJJ-MM-DD`) in `catalog.json`.

## Architectuuraantekeningen die niet uit de bestandsnamen blijken

- `catalog.json` is de **enige** bron die de app inleest (raw-URL, ~30 min gecachet).
  De app-fetch is een gewone browser-`fetch` — daarom de CORS-vereiste.
- `manifest.json` bepaalt permissies (`ribbon`, `events`, …); de host weigert API-calls
  die niet in `permissions` staan. `minAppVersion` wordt bij activeren afgedwongen.
- De SDK in `main.js` is stateloos: muteren doe je uitsluitend via de `api` die `onLoad(api)`
  binnenkrijgt (`api.data.*`, `api.ui.*`, `api.events.*`, `api.importers.*`), nooit via `sdk.*`.
- Auteursreferentie voor de API leeft in de app-repo: [`docs/extensions.md`](https://github.com/OpenAEC-Foundation/open-planner-studio/blob/main/docs/extensions.md).

## Workflowconventies (uit `git log`)

- Commit-prefixen: `feat:`, `fix:`, `revert:` (vaak met scope, bv. `feat(catalog):`).
- Wijzigingen gaan via feature branch + PR naar `main`. Ongebruikte/gewenste extensies worden
  clean gerevert (zie de reverts van *Rose Thema* en *meme-theme*) — verwijder zowel de map
  als de `catalog.json`-entry.

## Referentie-extensie

`extensions/voorbeeld-takenlijst-importer/` is de volledige referentie (importer + ribbon-knop +
event-listener). Lees deze map voordat je een nieuwe extensie schrijft — alle API-oppervlakken
worden daar gedemonstreerd.
