"""CI-pakketbouw en leveringspoort voor uitsluitend de tutorials-extensie."""

import argparse
from datetime import date
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extensions/tutorials"
OUT = ROOT / "build/tutorials"
RAW_URL = "https://raw.githubusercontent.com/OpenAEC-Foundation/open-planner-studio-extensions/main/extensions/tutorials/"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_inputs(source=SOURCE, listing=ROOT / "scripts/tutorial-package-files.txt"):
    names = listing.read_text(encoding="utf-8").splitlines()
    require(len(names) == len(set(names)) == 78, "De vaste lijst moet exact 78 unieke entries bevatten")
    for name in names:
        path = PurePosixPath(name)
        require(name.isascii() and not path.is_absolute() and ".." not in path.parts
                and "\\" not in name and path.as_posix() == name, f"Ongeldig pakketpad: {name}")
    require(not source.is_symlink(), "De bronmap mag geen symlink zijn")
    actual = {"manifest.json", "main.js"}
    for directory in (source / "projects", source / "img"):
        require(directory.is_dir() and not directory.is_symlink(), f"Ontbrekende/ongeldige bronmap: {directory}")
        for path in directory.rglob("*"):
            require(not path.is_symlink(), f"Symlink in pakketbron: {path}")
            if path.is_file():
                actual.add(path.relative_to(source).as_posix())
    require(actual == set(names), f"Bronpaden wijken af: ontbreekt {sorted(set(names) - actual)}; extra {sorted(actual - set(names))}")
    files = {}
    for name in sorted(names):
        path = source / name
        require(path.is_file() and not path.is_symlink(), f"Ontbrekend/geweigerd bronbestand: {name}")
        files[name] = path.read_bytes()
        require(len(files[name]) <= 24 * 1024 * 1024, f"Bestand groter dan appgrens: {name}")
    require(sum(map(len, files.values())) <= 48 * 1024 * 1024, "Pakketinhoud groter dan appgrens")
    manifest = json.loads(files["manifest.json"])
    require(manifest.get("id") == "tutorials" and manifest.get("main") == "main.js", "Onjuiste tutorials-identiteit/entrypoint")
    require(re.fullmatch(r"(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)", manifest.get("version", "")), "Ongeldige pakketversie")
    return files, manifest


def make_zip(files):
    # STORE voorkomt verschillen door zlib-versies. Tijd, volgorde en attributen zijn vast;
    # de circa 2,7 MB blijft ruim binnen de appgrens en heeft dezelfde 78 entries als zip -X.
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_STORED, allowZip64=False) as archive:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.create_version = info.extract_version = 20
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(info, data)
    return buffer.getvalue()


def check_zip(data, files):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)) == 78 and set(names) == set(files),
                "ZIP moet exact de 78 bronpaden bevatten, zonder duplicaten/extra entries")
        for info in archive.infolist():
            require(not info.is_dir() and not info.flag_bits & 1
                    and stat.S_ISREG(info.external_attr >> 16), f"Ongeldige ZIP-entry: {info.filename}")
            require(info.file_size == len(files[info.filename]), f"ZIP-grootte wijkt af: {info.filename}")
            require(archive.read(info) == files[info.filename], f"ZIP-bronbytes wijken af: {info.filename}")


def catalog_errors(catalog, manifest, sha):
    errors = []
    entries = [entry for entry in catalog.get("extensions", []) if entry.get("id") == "tutorials"]
    if len(entries) != 1:
        return ["Catalogus moet exact één tutorials-entry bevatten"]
    entry = entries[0]
    for field in ("id", "version", "minAppVersion"):
        if entry.get(field) != manifest.get(field):
            errors.append(f"Catalogus-{field} {entry.get(field)!r} wijkt af van bronmanifest {manifest.get(field)!r}")
    expected_url = RAW_URL + f"tutorials-{manifest['version']}.zip"
    if entry.get("downloadUrl") != expected_url:
        errors.append(f"Catalogus-downloadUrl moet {expected_url} zijn")
    if entry.get("sha256") != sha:
        errors.append("Catalogus-SHA256 wijkt af van exact het CI-pakket")
    try:
        stamp = catalog["lastUpdated"]
        require(date.fromisoformat(stamp).isoformat() == stamp, "Datum is niet YYYY-MM-DD")
    except (KeyError, ValueError, TypeError):
        errors.append("Catalogus-lastUpdated moet een echte datum in YYYY-MM-DD zijn")
    return errors


def delivery_errors(files, manifest, candidate, catalog, source=SOURCE):
    errors = catalog_errors(catalog, manifest, digest(candidate))
    committed = source / f"tutorials-{manifest['version']}.zip"
    if not committed.is_file() or committed.is_symlink():
        errors.append(f"Gecommitteerd CI-pakket ontbreekt: {committed.name}")
    else:
        try:
            packed = committed.read_bytes()
            check_zip(packed, files)
            require(packed == candidate, "Gecommitteerd ZIP is niet bytegelijk aan de reproduceerbare CI-opbouw")
        except (ValueError, zipfile.BadZipFile) as error:
            errors.append(str(error))
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("build", "verify"))
    args = parser.parse_args()
    files, manifest = load_inputs()
    candidate = make_zip(files)
    check_zip(candidate, files)
    catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    if args.mode == "verify":
        errors = delivery_errors(files, manifest, candidate, catalog)
        require(not errors, "Leveringspoort ROOD:\n- " + "\n- ".join(errors))
        print(f"Leveringspoort GROEN: tutorials {manifest['version']}, 78 bron-/pakketentries en catalogus gelijk")
        return

    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    require(commit == os.environ["SOURCE_COMMIT"], "Checkout wijkt af van de gevraagde head")
    OUT.mkdir(parents=True, exist_ok=True)
    filename = f"tutorials-{manifest['version']}.zip"
    (OUT / filename).write_bytes(candidate)
    (OUT / (filename + ".sha256")).write_text(f"{digest(candidate)}  {filename}\n", encoding="utf-8")
    report = {
        "sourceCommit": commit, "version": manifest["version"], "entryCount": len(files),
        "zipSha256": digest(candidate),
        "files": {name: {"size": len(data), "sha256": digest(data)} for name, data in files.items()},
    }
    (OUT / "package-inputs.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    entries = [entry for entry in catalog["extensions"] if entry["id"] == "tutorials"]
    require(len(entries) == 1, "Catalogus moet exact één tutorials-entry bevatten")
    proposal = {**entries[0], "version": manifest["version"], "minAppVersion": manifest["minAppVersion"],
                "downloadUrl": RAW_URL + filename, "sha256": digest(candidate)}
    (OUT / "catalog-entry.json").write_text(json.dumps(proposal, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"version={manifest['version']}\n")
    print(f"CI-pakket gemaakt en gecontroleerd: {filename}; 78 entries; SHA256 {digest(candidate)}")


if __name__ == "__main__":
    main()
