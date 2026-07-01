import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("absorb_blog_entries", "scripts/absorb_blog_entries.py")
absorb_blog_entries = importlib.util.module_from_spec(spec)
spec.loader.exec_module(absorb_blog_entries)


class AbsorbBlogEntriesTest(unittest.TestCase):
    def test_creates_wiki_article_for_unabsorbed_blog_entry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            raw = root / "raw" / "entries"
            wiki = root / "wiki"
            raw.mkdir(parents=True)
            wiki.mkdir()

            (raw / "2026-06-30_abc123.md").write_text(
                """---
id: abc123
date: '2026-06-30'
source_type: text
tags:
  - AI
filename: 2026-06-30-ai-model-types-guide.md
title: AI 模型类型速查指南
description: 一文搞懂各类 AI 模型。
category: AI
layout: post
---

* 目录
{:toc}

---

## AI 模型类型总览

正文内容。
""",
                encoding="utf-8",
            )

            created = absorb_blog_entries.absorb(raw, wiki)

            self.assertEqual(created, ["techniques/ai_model_types_guide.md"])
            article = wiki / "techniques" / "ai_model_types_guide.md"
            self.assertTrue(article.exists())
            text = article.read_text(encoding="utf-8")
            self.assertIn("title: AI 模型类型速查指南", text)
            self.assertIn("sources: [\"abc123\"]", text)
            self.assertIn("## AI 模型类型总览", text)
            self.assertNotIn("{:toc}", text)

    def test_skips_entries_whose_source_is_already_in_wiki(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            raw = root / "raw" / "entries"
            wiki = root / "wiki"
            raw.mkdir(parents=True)
            (wiki / "techniques").mkdir(parents=True)

            (raw / "2026-06-30_abc123.md").write_text(
                """---
id: abc123
date: '2026-06-30'
source_type: text
filename: 2026-06-30-ai-model-types-guide.md
title: AI 模型类型速查指南
layout: post
---

正文内容。
""",
                encoding="utf-8",
            )
            (wiki / "techniques" / "existing.md").write_text(
                """---
title: Existing
sources: [\"abc123\"]
---

# Existing
""",
                encoding="utf-8",
            )

            created = absorb_blog_entries.absorb(raw, wiki)

            self.assertEqual(created, [])


if __name__ == "__main__":
    unittest.main()
