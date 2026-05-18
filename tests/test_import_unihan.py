import importlib.util
from pathlib import Path
import unittest


spec = importlib.util.spec_from_file_location("import_unihan", "scripts/import_unihan.py")
import_unihan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(import_unihan)


class ImportUnihanTest(unittest.TestCase):
    def test_parse_ids_keeps_braced_component_tokens(self):
        structure, leaves = import_unihan.parse_ids("⿹{22}一")

        self.assertEqual(structure, "top-right-surround")
        self.assertEqual(leaves, ["{22}", "一"])

    @unittest.skipUnless(
        Path("data/cache/IDS.TXT").exists() and Path("data/cache/Unihan.zip").exists(),
        "requires local IDS and Unihan cache files",
    )
    def test_all_basic_iicore_ids_records_parse(self):
        ids_map = import_unihan.fetch_ids_data()
        iicore = import_unihan.fetch_unihan_iicore()
        candidates = [
            char
            for char in iicore
            if char in ids_map and 0x4E00 <= ord(char) <= 0x9FFF
        ]

        self.assertEqual(len(candidates), 9706)

        skipped = []
        for char in candidates:
            structure, leaves = import_unihan.parse_ids(ids_map[char])
            if not structure or not leaves:
                skipped.append((char, ids_map[char]))

        self.assertEqual(skipped, [])


if __name__ == "__main__":
    unittest.main()
