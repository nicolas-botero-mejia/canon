---
type: poc-results
phase: "01"
topic: "window-probe"
status: complete
author: AI
date: "2026-06-12"
description: Probes the frontmatter-aware header window.
key_facts: []
questions: []
---
# Phase 1 — POC 01: Window Probe — Results

**Author:** AI
**Date:** 2026-06-12
**Status:** Complete

The frontmatter above is 11 lines; under a raw `head -10` the **Author:** and
**Date:** headers were unreachable. The header window must skip the frontmatter
and find them in the first 10 body lines.
