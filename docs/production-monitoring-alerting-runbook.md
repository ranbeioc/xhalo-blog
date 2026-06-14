# Production Monitoring and Alerting Runbook

> Scope: monitoring and alerting for xhalo-blog production publish pipeline.

---

## 1. Signals to Monitor

### Worker API

- 2xx publish requests;
- 4xx auth/Turnstile failures;
- 403 writes rejected because `LIVE_WRITES_ENABLED=false`;
- 5xx errors;
- repeated publish requests;
- latency spikes;
- request origin anomalies.

### Queue Worker

- task enqueue count;
- task success count;
- task failure count;
- retry count;
- dead-letter queue, if configured;
- processing latency;
- duplicate task IDs.

### D1

- audit log insert count;
- failed task query count;
- mutation attempt count;
- destructive SQL attempt count;
- unusual row growth.

### R2

- object write count;
- unexpected object prefix;
- object delete count;
- large object upload;
- public asset exposure.

### GitHub

- branch creation count;
- PR creation count;
- direct main write attempt;
- auto-merge status;
- PR template quality gate;
- branch cleanup status.

---

## 2. Alert Conditions

- [x] `LIVE_WRITES_ENABLED=true` outside approved window.
- [x] More than one production publish request in a window.
- [x] Any direct main write.
- [x] Any auto-merge enablement.
- [x] Any unexpected R2 write.
- [x] Any destructive D1 operation.
- [x] Any publish request without valid auth.
- [x] Any secret-like string in logs.
- [x] Queue task failure or retry loop.
- [x] GitHub PR body contains template placeholders.

---

## 3. Manual Observation Window

After every production write trial:

```text
Observe for at least 30 minutes:
- Worker logs
- Queue Worker logs
- D1 audit rows
- GitHub branch / PR status
- R2 objects
- Cloudflare security events
```

---

## 4. Owner Escalation

Incident owner:

```text
ranbeioc
```

Escalation rule:

```text
Stop production write path first, investigate second.
```
