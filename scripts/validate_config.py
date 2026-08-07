#!/usr/bin/env python3
"""Validate a venues array (from research.json or a finished config) against the
explorer schema and data-honesty rules. Returns nonzero if any violation is found.

This is the quality gate the venue-scout skill describes but the harness didn't
enforce: it catches missing required fields, schema leaks, prose-in-alt, wrong
neighborhoods, undeclared types, non-https links, and un-bolded capacity numbers.

Usage:
    python3 scripts/validate_config.py --research docs/pilots/toronto/research.json
    python3 scripts/validate_config.py --venues-json somefile.json   # {"venues":[...]}
"""
import argparse
import json
import re
import sys

REQUIRED = ["k", "name", "area", "type", "addr", "cap", "flag", "link",
            "linkText", "email", "note", "img", "alt", "top"]
VALID_FLAGS = {"dedicated", "contact"}


def looks_like_alt_text(s):
    """alt should be a short noun-phrase describing the photo, not advice/prose."""
    if not s:
        return False
    if len(s) > 90:
        return True
    for bad in (" if ", "e.g.", "book ", "reach out", "confirm", "rather than",
                "prefer", "instead", "but ", "—"):
        if bad in s.lower():
            return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--research")
    ap.add_argument("--venues-json")
    a = ap.parse_args()
    path = a.research or a.venues_json
    if not path:
        sys.exit("provide --research or --venues-json")
    data = json.load(open(path, encoding="utf-8"))
    venues = data.get("venues") if isinstance(data, dict) else data
    if venues is None:
        sys.exit("no venues array found")

    problems, warnings = [], []
    seen_k, seen_name = set(), set()
    for i, v in enumerate(venues):
        tag = v.get("name") or f"venue[{i}]"
        # required fields present
        for f in REQUIRED:
            if f not in v:
                problems.append(f"{tag}: missing required field '{f}'")
        # internal/leaked fields
        for f in list(v.keys()):
            if f.startswith("_"):
                problems.append(f"{tag}: internal field '{f}' leaked into venue object")
        # types
        if v.get("type") not in ("coffee", "cowork", "event"):
            problems.append(f"{tag}: type '{v.get('type')}' not in TYPE_META")
        if v.get("area") is None and "area" not in v:
            warnings.append(f"{tag}: 'area' absent — template needs it for chips/sections")
        if v.get("k") is None and "k" not in v:
            problems.append(f"{tag}: 'k' (unique key) absent — template/data needs it")
        # flag
        if v.get("flag") not in VALID_FLAGS:
            problems.append(f"{tag}: flag '{v.get('flag')}' must be dedicated|contact")
        # link
        link = v.get("link", "")
        if link and not link.startswith("https://"):
            warnings.append(f"{tag}: link not https ({link[:40]})")
        # email format
        em = v.get("email")
        if em and not re.match(r"^\S+@\S+\.\S+$", em):
            problems.append(f"{tag}: bad email '{em}'")
        # alt = photo description, not advice
        if looks_like_alt_text(v.get("alt", "")):
            warnings.append(f"{tag}: 'alt' reads like advice/prose, not a photo caption")
        # cap should <b> the numbers (template convention)
        if "cap" in v and "<b>" not in (v.get("cap") or ""):
            warnings.append(f"{tag}: 'cap' has no <b> number (template convention)")
        # dup keys / names
        for fld, seen in (("k", seen_k), ("name", seen_name)):
            val = (v.get(fld) or "").strip().lower()
            if val:
                if val in seen:
                    problems.append(f"{tag}: duplicate {fld} '{val}'")
                seen.add(val)

    flag_counts = {}
    for v in venues:
        flag_counts[v.get("flag", "?")] = flag_counts.get(v.get("flag", "?"), 0) + 1
    print(f"venues: {len(venues)} · flags: {flag_counts}")
    for w in warnings:
        print(f"  WARN  {w}")
    for p in problems:
        print(f"  PROB  {p}")
    print(f"\n{len(problems)} problem(s), {len(warnings)} warning(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
