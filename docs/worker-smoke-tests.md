# Worker API Smoke Testing Guide

This guide provides the cURL commands and expected response structures to verify that your deployed `xhalo-blog` API Worker is operating securely and correctly.

## 1. Public Endpoint Validation

Verify that public endpoints return `200 OK` without requiring authentication headers.

### A. Health Check
```bash
curl -i https://your-worker-domain/api/health
```
- **Expected Status**: `200 OK`
- **Expected Body**:
  ```json
  {
    "ok": true,
    "timestamp": "..."
  }
  ```

### B. Scaffold Config
```bash
curl -i https://your-worker-domain/api/scaffold
```
- **Expected Status**: `200 OK`
- **Expected Body**:
  ```json
  {
    "repo": "xhalo-blog",
    "version": "..."
  }
  ```

---

## 2. Authentication Boundary Verification

Verify that protected endpoints reject unauthorized requests.

### A. Readiness Check (Without Admin Header)
```bash
curl -i https://your-worker-domain/api/readiness
```
- **Expected Status**: `401 Unauthorized`
- **Expected Body**:
  ```json
  {
    "error": "Unauthorized admin API request: missing authorization assertions."
  }
  ```

### B. Readiness Check (With Valid Shared Secret)
```bash
curl -i -H "x-xhalo-admin-secret: your_shared_secret" https://your-worker-domain/api/readiness
```
- **Expected Status**: `200 OK`
- **Expected Body**:
  ```json
  {
    "summary": {
      "admin_gate": "auth-header-secret",
      "live_write_gate": "disabled"
    }
  }
  ```

---

## 3. Input validation & Crash Protection

Verify that the payload validation layers reject invalid inputs gracefully instead of throwing unhandled 500 errors.

### A. Invalid JSON Syntax
```bash
curl -i -X POST \
  -H "x-xhalo-admin-secret: your_shared_secret" \
  -H "content-type: application/json" \
  -d "{invalid json" \
  https://your-worker-domain/api/drafts/publish
```
- **Expected Status**: `400 Bad Request`
- **Expected Body**:
  ```json
  {
    "error": "Invalid JSON request body."
  }
  ```

### B. Missing Required Fields (Title/Slug)
```bash
curl -i -X POST \
  -H "x-xhalo-admin-secret: your_shared_secret" \
  -H "content-type: application/json" \
  -d '{"mode": "dry-run"}' \
  https://your-worker-domain/api/drafts/publish
```
- **Expected Status**: `400 Bad Request`
- **Expected Body**:
  ```json
  {
    "error": "Validation failed.",
    "details": [
      "Missing required field: title",
      "Missing required field: slug"
    ]
  }
  ```

### C. Live Publish with Writes Disabled
```bash
curl -i -X POST \
  -H "x-xhalo-admin-secret: your_shared_secret" \
  -H "content-type: application/json" \
  -d '{"title": "Demo", "slug": "demo", "mode": "live"}' \
  https://your-worker-domain/api/drafts/publish
```
- **Expected Status**: `403 Forbidden`
- **Expected Body**:
  ```json
  {
    "error": "Live write operations are disabled by configuration.",
    "required_env": "LIVE_WRITES_ENABLED=true"
  }
  ```
