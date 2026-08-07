#!/usr/bin/env python3
"""Assemble a ComputeCafe city page from a config file + the venue-scout explorer template.

Usage:
    python3 scripts/build.py configs/la_config.js "LA Tech Week — Venue Options · ComputeCafe" los-angeles

Writes <slug>/index.html with the config spliced between the template's EDIT markers
and a "← ComputeCafe" home link injected into the hero.
"""
import os
import sys

REPO_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
TEMPLATE = os.path.join(REPO_ROOT, "skill", "venue-scout", "assets", "explorer-template.html")
START = "/* ============================ EDIT BELOW ============================ */"
END = "/* ============================ EDIT ABOVE ============================ */"
HOMELINK_CSS = (
    "  .homelink { font-size: 12.5px; font-weight: 600; color: var(--ink-3); "
    "text-decoration: none; display: inline-block; margin-bottom: 8px; }\n"
    "  .homelink:hover { color: var(--ink-1); }\n"
)
HOMELINK_A = '<a class="homelink" href="/">← ComputeCafe</a>\n    '


def splice(doc: str, needle: str, replacement: str) -> str:
    n = doc.count(needle)
    assert n == 1, f"expected exactly 1 occurrence of {needle!r} in template, found {n}"
    return doc.replace(needle, replacement)


def build(config_path: str, title: str, slug: str) -> str:
    tpl = open(TEMPLATE, encoding="utf-8").read()
    cfg = open(config_path, encoding="utf-8").read()
    i, j = tpl.index(START), tpl.index(END) + len(END)
    out = tpl[:i] + START + "\n\n" + cfg + "\n" + END + tpl[j:]
    out = splice(out, "<title>Compute Cafe</title>", f"<title>{title}</title>")
    out = splice(out, "</style>", HOMELINK_CSS + "</style>")
    out = splice(out, '<div class="kicker" id="kicker"></div>', HOMELINK_A + '<div class="kicker" id="kicker"></div>')
    dest = os.path.join(REPO_ROOT, slug, "index.html")
    os.makedirs(os.path.join(REPO_ROOT, slug), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(out)
    return dest


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    dest = build(sys.argv[1], sys.argv[2], sys.argv[3])
    print(f"wrote {dest}")
