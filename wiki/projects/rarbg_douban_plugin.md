---
title: RARBG Douban Plugin
type: projects
created: 2017-07-28
last_updated: 2017-07-28
related: ["[[Web Scraping]]", "[[Film Reflections]]"]
sources: ["534c68016f52"]
---

# RARBG Douban Plugin

In July 2017, the subject released a browser userscript that enriches the RARBG torrent site with Chinese movie titles and Douban ratings.

## Functionality

The plugin injects additional metadata into RARBG's movie list pages, displaying:

- The Chinese title of each film.
- The Douban rating score.

This reduces the friction of identifying films on an English-language torrent index for Chinese-speaking users.

## Installation

The plugin is distributed as a userscript and requires a userscript manager:

1. Install [Tampermonkey](http://tampermonkey.net/) in the browser.
2. Install the script from [Greasy Fork](https://greasyfork.org/zh-CN/scripts/27376-rarbg).

## Limitations

- Because the Douban API server is located in China, uncached responses can be slow for users outside the region.
- At the time of release, the plugin supported movies only; TV series were not yet covered.
