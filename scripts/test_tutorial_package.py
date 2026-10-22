"""Alleen in CI: weigeringen van de echte pakket-/leveringspoort."""

import copy
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

from tutorial_package import (
    RAW_URL, SOURCE, check_zip, delivery_errors, digest, load_inputs, make_zip,
)


class TutorialPackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files, cls.manifest = load_inputs()
        cls.packed = make_zip(cls.files)

    def catalog(self):
        return {"lastUpdated": "2026-10-22", "extensions": [{
            "id": "tutorials", "version": self.manifest["version"],
            "minAppVersion": self.manifest["minAppVersion"],
            "downloadUrl": RAW_URL + f"tutorials-{self.manifest['version']}.zip",
            "sha256": digest(self.packed),
        }]}

    def test_reproducible_and_complete(self):
        check_zip(self.packed, self.files)
        self.assertEqual(self.packed, make_zip(dict(reversed(list(self.files.items())))))

    def test_missing_extra_duplicate_and_unsafe_zip_paths(self):
        for mutation in ("missing", "extra", "duplicate", "unsafe"):
            with self.subTest(mutation=mutation):
                buffer = io.BytesIO()
                with zipfile.ZipFile(io.BytesIO(self.packed)) as source, zipfile.ZipFile(buffer, "w") as target:
                    for info in source.infolist():
                        if mutation != "missing" or info.filename != "main.js":
                            target.writestr(info, source.read(info))
                    if mutation in ("extra", "unsafe", "duplicate"):
                        name = {"extra": "extra.txt", "unsafe": "../main.js", "duplicate": "main.js"}[mutation]
                        target.writestr(name, b"ongewenst")
                with self.assertRaises(ValueError):
                    check_zip(buffer.getvalue(), self.files)

    def test_changed_source_or_asset_bytes_are_rejected(self):
        for name in ("main.js", "manifest.json", "projects/nl/start-tut-1.ifc", "img/en/tut-1-berekend.webp"):
            with self.subTest(name=name):
                changed = {**self.files, name: b"x" * len(self.files[name])}
                with self.assertRaisesRegex(ValueError, "ZIP-bronbytes"):
                    check_zip(self.packed, changed)

    def test_source_inventory_rejects_missing_or_extra_path(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source"
            for name, data in self.files.items():
                path = source / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
            listing = root / "files.txt"
            listing.write_text("\n".join(self.files) + "\n", encoding="utf-8")
            (source / "img/en/extra.webp").write_bytes(b"extra")
            with self.assertRaisesRegex(ValueError, "Bronpaden"):
                load_inputs(source, listing)
            (source / "img/en/extra.webp").unlink()
            (source / "projects/nl/start-tut-1.ifc").unlink()
            with self.assertRaisesRegex(ValueError, "Bronpaden"):
                load_inputs(source, listing)

    def test_delivery_requires_exact_committed_zip_and_catalog(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory)
            filename = source / f"tutorials-{self.manifest['version']}.zip"
            catalog = self.catalog()
            self.assertTrue(delivery_errors(self.files, self.manifest, self.packed, catalog, source))
            filename.write_bytes(self.packed)
            self.assertEqual(delivery_errors(self.files, self.manifest, self.packed, catalog, source), [])
            for field, value in [("version", "0.0.0"), ("minAppVersion", "0.0.0"), ("sha256", "0" * 64), ("downloadUrl", "https://example.invalid/oud.zip")]:
                changed = copy.deepcopy(catalog)
                changed["extensions"][0][field] = value
                with self.subTest(field=field):
                    self.assertTrue(delivery_errors(self.files, self.manifest, self.packed, changed, source))
            changed = copy.deepcopy(catalog)
            changed["lastUpdated"] = "geen datum"
            self.assertTrue(delivery_errors(self.files, self.manifest, self.packed, changed, source))
            # Dezelfde inhoud met andere ZIP-metadata is niet het gecontroleerde CI-artefact.
            buffer = io.BytesIO()
            with zipfile.ZipFile(io.BytesIO(self.packed)) as original, zipfile.ZipFile(buffer, "w") as target:
                for info in original.infolist():
                    info.date_time = (2000, 1, 1, 0, 0, 0)
                    target.writestr(info, original.read(info))
            filename.write_bytes(buffer.getvalue())
            self.assertTrue(any("bytegelijk" in error for error in
                                delivery_errors(self.files, self.manifest, self.packed, catalog, source)))
            # Een echt bestaand oud pakket mag geen groen bewijs voor de nieuwe bron opleveren.
            filename.write_bytes((SOURCE / "tutorials-1.2.0.zip").read_bytes())
            self.assertTrue(delivery_errors(self.files, self.manifest, self.packed, catalog, source))


if __name__ == "__main__":
    unittest.main()
