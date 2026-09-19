# CLAUDE.md

This repository (`xhalo-blog`) is part of the xHalo product suite: ~16 repos developed in parallel by multiple AI coding agents (Claude Code, OpenAI Codex, Google Gemini — see `codex/*`/`gemini/*` branch names across the suite), each pushing directly to GitHub. Local clones on this machine have been found stale by 1–248 commits behind `origin` — never assume a clean `git status` means this repo or branch is current.

## Before planning or implementing anything

1. **Verify freshness first.** Run `git fetch origin --quiet`, then compare the current branch to its remote (`git rev-list --left-right --count HEAD...origin/<branch>`). If behind, resolve that before planning.
2. **Read `AGENT_SKILL.md`** in this repo's root for ownership boundaries and required pre-task checks.
3. **Blog admin implementation belongs here, not in `xhalo-admin`.** Don't move it there or duplicate it.
4. **If the task could affect another repo**, check the global cross-repo registry at `C:\Users\ranbe\Documents\Github\xhalo-ai-workflow\docs\global-architecture\`. Treat it as a snapshot (last full refresh: 2026-07-06), not a live source.

## Known relationships for this repo
Depended on by: `xhalo-blog-test` (release gate — validates this repo's Pages/Worker output before production; its `source/admin/` is a synced copy of `apps/admin/src/`, so admin fixes here must be synced there too). Related: `hexo-blog` (separate public static content site, not owned by this repo).

## After the change
Update this repo's `AGENT_SKILL.md` and the global registry above if ownership, deployment, or Cloudflare mapping changed.
