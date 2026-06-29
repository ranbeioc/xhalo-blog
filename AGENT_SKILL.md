# AGENT_SKILL.md

## Skill Name
xhalo-blog-publishing-skill

## Purpose
Develops the Cloudflare-backed xHalo blog publishing system.

## When To Use This Skill
Use this skill when the task is about:
- blog admin implementation
- editor
- preview and publish flow
- attachments
- menu/statistics
- GitHub OAuth preview login
- blog Pages/Workers/D1/R2/Queues integration

## When Not To Use This Skill
Do not use this repository for:
- global auth core
- standalone TTS engine
- Bible data pipeline
- global AI workflow registry
- global admin shell outside blog publishing

If the requested task belongs to another repository, stop and report the correct repository.

## Repository Ownership
This repository owns:
- blog admin implementation
- editor
- preview and publish flow
- attachments
- menu/statistics
- GitHub OAuth preview login
- blog Pages/Workers/D1/R2/Queues integration

This repository does not own:
- global auth core
- standalone TTS engine
- Bible data pipeline
- global AI workflow registry
- global admin shell outside blog publishing

## Project Notes
- Blog admin belongs here, not in xhalo-admin.

## Cloudflare Ownership
This repository maps to the following Cloudflare resources:

| Resource Type | Name | Environment | Domain/Route | Verification |
| --- | --- | --- | --- | --- |
| Pages | xhalo-blog-landing | production | xhalo-blog-landing.pages.dev, blog.xhalo.co | matched |
| Worker | xhalo-blog-production-api | production | needs-verification | matched |
| Worker | xhalo-blog-production-queue | production | needs-verification | matched |
| Worker | xhalo-blog-staging-api | production | needs-verification | matched |
| Worker | xhalo-blog-staging-queue | production | needs-verification | matched |
| D1 | xhalo-blog-production-db | production |  | matched |
| D1 | xhalo-blog-staging | production |  | matched |
| R2 | xhalo-blog-production-assets | production | needs-verification | matched |
| R2 | xhalo-blog-staging-assets | production | needs-verification | matched |
| Queue | xhalo-blog-production-queue | production |  | matched |
| Queue | xhalo-blog-staging-tasks | production |  | matched |

Use `needs-verification` instead of guessing.

## Related Repositories
| Repository | Relationship |
| --- | --- |
| hexo-blog | Public Hexo content site and production static blog surface. |
| xhalo-blog-test | Private/test release gate for blog/admin/landing publishing flow. |
| xhalo-auth | Provides identity where needed. |

## Required Pre-Task Checks
Before editing, run:

```bash
pwd
git remote -v
git status --short
git branch -vv
git worktree list || true
```

Then confirm:
- The task belongs to this repository.
- The current branch is safe.
- There are no unrelated uncommitted changes.
- The task will not overwrite another branch's work.
- Cloudflare production resources are not affected unless explicitly intended.
- Cross-repository boundaries are respected.

## Branch Safety Rules
- Do not assume the current branch is correct.
- Do not overwrite existing worktree changes.
- Do not use destructive Git commands.
- Do not merge or rebase unless explicitly requested.
- Do not push unless explicitly requested.
- Use a dedicated feature or chore branch.
- Recommended branch for architecture-memory work: `chore/global-architecture-memory-alignment`.

## Development Rules
- Prefer minimal, reviewable changes.
- Keep architecture documentation current.
- Update this file when repository ownership, deployment, or Cloudflare mapping changes.
- Update global registry files in `xhalo-ai-workflow` when cross-project ownership changes.
- Do not duplicate logic owned by another repository.
- Do not introduce secrets into source control.

## Cloudflare Source-of-Truth Rule
Cloudflare live resources are treated as an external source of truth for deployment mapping.
Repository configuration must be cross-checked against:
- Cloudflare Pages projects
- Cloudflare Workers scripts
- D1 databases
- R2 buckets
- KV namespaces
- Queues
- AI Gateway configuration
- Email Sending
- DNS records
- Access / Tunnel configuration

If repository config conflicts with Cloudflare live resources, do not guess. Mark the mapping as `conflict` or `needs-verification` and report it.

## Forbidden Changes
Never do the following without explicit approval:
- Move this repository's owned feature to another repository.
- Import another repository's responsibility into this repository.
- Edit production Cloudflare bindings casually.
- Rename Cloudflare resources casually.
- Delete or recreate D1, R2, KV, Queue, Pages, or Worker resources.
- Rewrite Git history.
- Force push.
- Delete branches.
- Commit `.env` files or real secrets.

## Expected Outputs
For every task, the agent should report:
1. Current repository and branch.
2. Files changed.
3. Whether Cloudflare resources are affected.
4. Whether cross-repository boundaries are affected.
5. Tests or checks run.
6. Remaining risks.
