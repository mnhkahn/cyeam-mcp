---
title: CSS Device Frames
type: techniques
created: 2014-02-07
last_updated: 2014-02-07
related: ["[[Markdown Cheatsheet]]"]
sources: ["ba476b7421c2"]
---

# CSS Device Frames

In February 2014, the subject implemented a CSS-only iPhone frame for displaying screenshots on a blog. The solution was obtained via a Stack Overflow answer.

## iPhone Frame with CSS3

The approach uses a single wrapper class, `.iphone`, applied around an `<img>` element. The frame is constructed from layered linear gradients for the body, screen, and shine. Buttons, the home button, front camera, and speaker are rendered with `:before` and `:after` pseudo-elements and extensive `box-shadow` declarations. The image is absolutely positioned over the screen area.

## DIV-based Alternative

The subject later found a simpler DIV-based approach in Baidu Site App. It uses a background image for the phone body and a nested `.phone_display` div for the screen content. This method requires less custom CSS but depends on an external background image asset.
