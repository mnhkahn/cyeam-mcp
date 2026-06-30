import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("rebuild_index", "scripts/rebuild_index.py")
rebuild_index = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rebuild_index)


class RebuildIndexTest(unittest.TestCase):
    def test_index_includes_frontmatter_description_and_aliases(self):
        with tempfile.TemporaryDirectory() as tmp:
            wiki_dir = Path(tmp) / "wiki"
            article_dir = wiki_dir / "projects"
            article_dir.mkdir(parents=True)
            (article_dir / "cyeam_mcp.md").write_text(
                """---
title: Cyeam MCP
description: Personal Wiki MCP Server
aliases:
  - cyeam-mcp
  - wiki mcp
---

# Cyeam MCP

Related to [[Model Context Protocol]].
""",
                encoding="utf-8",
            )

            rebuild_index.WIKI_DIR = wiki_dir
            rebuild_index.INDEX_PATH = wiki_dir / "_index.md"
            rebuild_index.BACKLINKS_PATH = wiki_dir / "_backlinks.json"

            rebuild_index.main()

            index_text = rebuild_index.INDEX_PATH.read_text(encoding="utf-8")
            self.assertIn("- [[Cyeam MCP]] — Personal Wiki MCP Server", index_text)
            self.assertIn("  Also: cyeam-mcp, wiki mcp", index_text)


if __name__ == "__main__":
    unittest.main()
