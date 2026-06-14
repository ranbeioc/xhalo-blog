# Production Incident Response Runbook

---

## 1. Stop Conditions

Stop immediately if:

- more than one production request is executed;
- unexpected branch is created;
- unexpected PR is opened;
- direct main write occurs;
- auto-merge is enabled;
- R2 object is written without approval;
- D1 destructive operation is attempted;
- secret/token/private key appears in logs;
- `LIVE_WRITES_ENABLED=true` remains enabled after window;
- queue retries repeatedly;
- unauthorized request succeeds.

---

## 2. Immediate Response

1. Set `LIVE_WRITES_ENABLED=false`.
2. Redeploy production API Worker.
3. Confirm subsequent write request returns 403.
4. Pause or drain queue if needed.
5. Preserve sanitized logs.
6. Close unexpected PR without merge.
7. Delete unexpected branch after owner confirmation.
8. Remove unexpected R2 object after owner confirmation.
9. Record incident report.
10. Do not run another request until owner approval.

---

## 3. Recovery Evidence

Every incident must record:

- timestamp;
- operator;
- request ID;
- task ID;
- affected branch;
- affected PR;
- R2 object key, if any;
- D1 audit row, if any;
- mitigation action;
- final status.
