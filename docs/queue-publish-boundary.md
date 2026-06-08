# Queue Publishing Boundary

This document outlines the architectural boundaries and functional split between the HTTP API Worker (`workers/api`) and the Task Queue Worker (`workers/queue`) in `v0.1.0-alpha.0`.

---

## 1. Architectural Overview

To ensure the cms dashboard remains responsive, high-latency write operations (such as compiling drafts, pushing to GitHub, or calling external APIs) are separated from the main HTTP API request-response loop:

```text
+-----------------------+      enqueue task      +-------------------------+
|    HTTP API Worker    | ---------------------> |     Cloudflare Queue    |
| (validation, logging) |                        | (xhalo-blog-tasks)      |
+-----------------------+                        +-------------------------+
                                                              |
                                                              | dispatch task
                                                              v
                                                 +-------------------------+
                                                 |   Task Queue Worker     |
                                                 | (reconciliation, sync)  |
                                                 +-------------------------+
```

---

## 2. Release Candidate Boundary (v0.1.0-alpha)

In `v0.1.0-alpha.0`, the system operates under the following functional boundaries:

### HTTP API Worker (`workers/api`)
- **Implemented Functions**: Handles Zero Trust authentication (Cloudflare Access JWT, shared secrets), Turnstile spam prevention, filename/MIME sanitation, D1 database CRUD operations (posts, settings, audit logging), and webhook signature verification.
- **Direct GitHub Writes**: When live writes are enabled (`LIVE_WRITES_ENABLED=true`), the API Worker *synchronously* performs GitHub App token generation, branch creation, file commits, and Pull Request creation.

### Task Queue Worker (`workers/queue`)
- **Current Role**: Operates as a task reconciliation scaffold. It processes messages from the Cloudflare Queue, logs execution statuses in D1, and reconciles task states.
- **Limitation**: The Queue Worker does *not* yet implement the active GitHub App token exchange or branch/commit/PR creation logic for `draft_publish` tasks. 
- **Future Target**: Fully transitioning the active publishing logic from the API Worker into the Queue Worker is scheduled as **Phase 7.1**.

---

## 3. Configuration & Operator Impact

- **Staging Verification**: To test staging live writes (as documented in [live-write-verification.md](./live-write-verification.md)), ensure the API Worker has the required `LIVE_WRITES_ENABLED` and GitHub credentials configured.
- **Scalability**: For high-volume sites, synchronous publish requests will block the Worker thread for the duration of the GitHub REST API round-trips. Keep `LIVE_WRITES_ENABLED` disabled in public production deployments until the Phase 7.1 asynchronous publishing engine is implemented and verified.
