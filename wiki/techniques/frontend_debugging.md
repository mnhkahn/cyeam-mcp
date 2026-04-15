---
title: Frontend Debugging
type: techniques
created: 2026-03-16
last_updated: 2026-03-17
related: ["[[CSS Device Frames]]", "[[Web Scraping]]", "[[Development Tools]]"]
sources: ["0462da572fc6", "7c60504e9701"]
---

# Frontend Debugging

The subject has documented several techniques for diagnosing layout and rendering issues on web pages, particularly on mobile viewports.

## Mobile Overflow Diagnosis

In March 2026, the subject investigated unwanted horizontal scrollbars on mobile pages. Because mobile viewports are narrow, a single element that exceeds the viewport width can trigger a horizontal scrollbar. Reproducing the issue on a desktop browser requires matching the problematic device's exact resolution; the subject built a [pixel-detection tool](https://www.cyeam.com/tool/pixel) for this purpose.

### Automated Overflow Detection

For complex pages with deep nesting, manual inspection in the Elements panel is tedious. The subject uses a console script that scans every element, highlights those that overflow the viewport with a red border, and prints a clickable table:

```js
(function() {
  const allElements = document.querySelectorAll('*');
  const overflowElements = [];
  document.querySelectorAll('[data-overflow-highlight]').forEach(el => {
    el.style.removeProperty('border');
    el.removeAttribute('data-overflow-highlight');
  });
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if ((rect.right > window.innerWidth || rect.left < 0) && rect.width > 0) {
      el.style.border = '2px solid red !important';
      el.style.boxShadow = '0 0 10px red !important';
      el.setAttribute('data-overflow-highlight', 'true');
      let selector = '';
      if (el.id) selector = `#${el.id}`;
      else if (el.className) selector = `.${el.className.trim().replace(/\s+/g, '.')}`;
      else selector = el.tagName.toLowerCase();
      overflowElements.push({
        element: el,
        tag: el.tagName,
        class: el.className,
        id: el.id || 'none',
        selector,
        width: `${rect.width.toFixed(2)}px`,
        right: `${rect.right.toFixed(2)}px`,
        overflow: `${(rect.right - window.innerWidth).toFixed(2)}px`
      });
    }
  });
  console.table(overflowElements);
})();
```

Clicking the "element" column in the console table jumps directly to the corresponding node in the Elements panel.

## Playwright Rendering Scan

In March 2026, the subject built a Playwright-based scanner to detect rendering defects across an entire site. The script reads a sitemap, visits each URL under multiple device presets, and records:

- **Horizontal scrollbars** — detected by comparing `scrollWidth` to `clientWidth`.
- **Broken images** — images with `naturalWidth === 0` are flagged, and their XPath, `src`, and `alt` are logged.
- **Page load time** — measured per URL.
- **Screenshots** — full-page captures saved per device.

The scanner supports retry logic for timeouts and filters sitemap URLs to the same base domain. Results are written to a JSON report per device.
