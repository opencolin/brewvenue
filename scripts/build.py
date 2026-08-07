#!/usr/bin/env python3
"""Assemble a BrewVenue city page from a config file + the venue-scout explorer template.

Usage:
    python3 scripts/build.py configs/la_config.js "LA Tech Week — Venue Options · BrewVenue" los-angeles

Writes <slug>/index.html with the config spliced between the template's EDIT markers
and a "← BrewVenue" home link injected into the hero.
"""
import os
import sys

TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "skill", "venue-scout", "assets", "explorer-template.html")
START = "/* ============================ EDIT BELOW ============================ */"
END = "/* ============================ EDIT ABOVE ============================ */"
HOMELINK_CSS = (
    "  .homelink { font-size: 12.5px; font-weight: 600; color: var(--ink-3); "
    "text-decoration: none; display: inline-block; margin-bottom: 8px; }\n"
    "  .homelink:hover { color: var(--ink-1); }\n"
)
HOMELINK_A = '<a class="homelink" href="/">← BrewVenue</a>\n    '


def build(config_path: str, title: str, slug: str) -> str:
    tpl = open(TEMPLATE, encoding="utf-8").read()
    cfg = open(config_path, encoding="utf-8").read()
    i, j = tpl.index(START), tpl.index(END) + len(END)
    out = tpl[:i] + START + "\n\n" + cfg + "\n" + END + tpl[j:]
    out = out.replace("<title>Venue Scout</title>", f"<title>{title}</title>")
    out = out.replace("</style>", HOMELINK_CSS + "</style>")
    out = out.replace('<div class="kicker" id="kicker"></div>', HOMELINK_A + '<div class="kicker" id="kicker"></div>')
    dest = os.path.join(slug, "index.html")
    os.makedirs(slug, exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(out)
    return dest


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    dest = build(sys.argv[1], sys.argv[2], sys.argv[3])
    print(f"wrote {dest}")
