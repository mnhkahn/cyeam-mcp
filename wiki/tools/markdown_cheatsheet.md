---
title: Markdown Cheatsheet
type: tools
created: 2014-01-12
last_updated: 2014-01-12
related: []
sources: ["e1640651fd6f"]
---

# Markdown Cheatsheet

## Images with Custom CSS

Markdown image syntax can be combined with CSS attribute selectors:

```markdown
![IMG-THUMBNAIL]({IMAGE URL})
```

```css
img[alt=IMG-THUMBNAIL] {
    /* custom styles */
}
```

## Links

```markdown
[{text}]({url})
```

## Emphasis

- One asterisk or underscore: *italic*
- Two asterisks or underscores: **bold**
- Three asterisks or underscores: ***bold italic***

## Anchors

Link to an anchor:
```markdown
[配置](#config)
```

Create an anchor:
```html
<a name="config"></a>配置
```

## Blockquotes

Use the right angle bracket (`>`) to indicate blockquotes. Nesting and inclusion of other Markdown elements are supported.

## Tables

An extended Markdown table syntax:

```markdown
|| *Year* || *Temperature (low)* || *Temperature (high)* ||
|| 1900 || -10 || 25 ||
|| 1910 || -15 || 30 ||
```
