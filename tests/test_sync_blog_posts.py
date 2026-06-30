import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("sync_blog_posts", "scripts/sync_blog_posts.py")
sync_blog_posts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_blog_posts)


class SyncBlogPostsTest(unittest.TestCase):
    def test_existing_filename_is_not_synced_again(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            posts = root / "_posts"
            raw = root / "raw" / "entries"
            posts.mkdir()
            raw.mkdir(parents=True)

            (posts / "2026-06-30-new.md").write_text(
                """---
title: New Post
layout: post
tags:
  - AI
---

New body.
""",
                encoding="utf-8",
            )
            (posts / "2026-06-29-existing.md").write_text(
                """---
title: Existing Post
layout: post
---

Existing body.
""",
                encoding="utf-8",
            )
            (raw / "2026-06-29_existing.md").write_text(
                """---
id: existing
date: '2026-06-29'
source_type: text
filename: 2026-06-29-existing.md
---

Old body.
""",
                encoding="utf-8",
            )

            seen = sync_blog_posts.existing_filenames(raw)
            self.assertEqual(seen, {"2026-06-29-existing.md"})

            for post in sorted(posts.glob("*.md")):
                if post.name in seen:
                    continue
                frontmatter, body = sync_blog_posts.read_post(post)
                date_str = sync_blog_posts.post_date(post, frontmatter)
                entry_id = sync_blog_posts.make_id(post.read_text(encoding="utf-8"))
                fm = {
                    "id": entry_id,
                    "date": date_str,
                    "source_type": "text",
                    "tags": frontmatter.get("tags", []),
                    "filename": post.name,
                    "title": frontmatter["title"],
                    "layout": frontmatter["layout"],
                }
                sync_blog_posts.ingest.write_entry(raw, date_str, entry_id, fm, body)

            raw_files = sorted(path.name for path in raw.glob("*.md"))
            self.assertEqual(len(raw_files), 2)
            self.assertTrue(any(name.startswith("2026-06-30_") for name in raw_files))


if __name__ == "__main__":
    unittest.main()
