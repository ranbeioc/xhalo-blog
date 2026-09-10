# xhalo-blog Documentation Index

Central documentation catalog for the Cloudflare-backed xHalo blog publishing platform.

## Architecture & Infrastructure
- [Architecture Overview](architecture.md): Core platform architecture and component design.
- [Functions & Workers](functions-workers.md): Cloudflare Workers (API and Queue) routing and responsibilities.
- [Cloudflare Pages](cloudflare-pages.md): Pages hosting and Advanced Mode routing proxies.
- [D1 Schema](d1-schema.md) & [Migrations](d1-migrations.md): Database tables, indices, and schema versioning.
- [R2 Assets](r2-assets.md): Media asset management, signed uploads, and storage boundaries.
- [Queues](queues.md): Asynchronous background task processing for publishing.
- [Security](security.md): Cloudflare Access, Turnstile verification, and API secret guards.
- [Runtime Safety Checklist](cloudflare-runtime-safety-checklist.md): Preflight safety requirements.

## Admin Features & Workspaces
- [Admin Publishing MVP](admin-publishing-mvp.md): Article lifecycle, preview gates, and PR creation.
- [GitHub OAuth Login](admin-github-oauth-login.md): Identity provider integration and session cookies.
- [Media Asset Manager](admin-media-asset-manager.md): R2 file upload and snippet generation.
- [Site Menu Manager](admin-site-menu-manager.md): Navigation and social links configuration.
- [Owner Direct Publish Mode](owner-direct-publish-mode.md): Controlled direct publishing workflow.

## Runbooks & Operations
- [Deployment Integration Runbook](deployment-integration-runbook.md): Full deployment procedures.
- [Async Publish Runbook](async-publish-runbook.md): Queue worker operations and troubleshooting.
- [Production Publish Runbook](production-publish-runbook.md): Production release guidance.
- [Production Rollback Plan](production-rollback-plan.md): Incident mitigation and rollback procedures.
- [Level 1 Read-only Validation Runbook](level1-readonly-validation-runbook.md): Safety audit protocols.
- [Deployment Smoke Test Matrix](deployment-smoke-test-matrix.md): End-to-end verification checklist.
