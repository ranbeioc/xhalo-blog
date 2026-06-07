# GitHub App Setup Guide

This guide walks you through registering, configuring, and installing a custom GitHub App to authenticate the `xhalo-blog` publishing pipeline.

---

## 1. Why a GitHub App?

`xhalo-blog` publishes drafts by creating repository branches and opening pull requests.
Using a custom GitHub App offers significant security advantages over personal access tokens (PATs) or default `GITHUB_TOKEN` credentials:
- **Fine-grained permissions**: Access is strictly limited to target repositories and specific API endpoints.
- **Short-lived access tokens**: The Worker dynamically signs a JWT using the App's private key, exchanging it for a short-lived (1-hour) installation access token.
- **No user credentials**: The private key (PEM format) remains safe within the Cloudflare Worker secrets store.

---

## 2. Registering the GitHub App

1. Go to your GitHub account settings → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. Fill in the basic settings:
   - **GitHub App name**: `xhalo-blog-publisher` (or a name of your choice).
   - **Homepage URL**: Your production blog URL (e.g. `https://yourdomain.com`).
3. Configure the **Webhook** section:
   - **Active**: Check this box.
   - **Webhook URL**: Point it to your API worker webhook endpoint: `https://yourdomain.com/webhooks/github` (or your worker's live routing url).
   - **Webhook secret**: Enter a strong random secret. You will configure this as the `GITHUB_WEBHOOK_SECRET` in your Cloudflare Worker.

---

## 3. Configuring Permissions

Under **Permissions & events**, grant the App the following specific scopes:

### 3.1 Repository Permissions
- **Contents**: `Read and write` (required to commit draft markdown files and upload post assets).
- **Pull requests**: `Read and write` (required to open publication pull requests).
- **Metadata**: `Read-only` (automatically required by GitHub for base operations).

### 3.2 Subscribe to Webhook Events
Under the list of events, select:
- **Push**: Check this box (notifies the Worker when changes are pushed, triggering the posts index cache reconciliation).

---

## 4. Key and ID Generation

1. Click **Create GitHub App**.
2. Save the **App ID** displayed at the top of the App settings page.
3. At the bottom of the page, locate the **Private keys** section and click **Generate a private key**.
4. A `.pem` file containing your private key will be downloaded to your computer. Keep this file secure and private.

---

## 5. Installing the App on your Repository

The App must be installed on the repository containing your Hexo blog source files.

1. In the App settings sidebar, click **Install App**.
2. Click **Install** next to your GitHub account or organization.
3. Select **Only select repositories** and choose your blog repository (e.g. `hexo-blog`).
4. Click **Install**.
5. Once installed, copy the **Installation ID** from the URL. The URL will look like:
   `https://github.com/settings/installations/12345678` (where `12345678` is your installation ID).

---

## 6. Worker Secret Configuration

Once you have gathered the App ID, Installation ID, and Private Key, set them as secrets on your API worker:

```bash
# Set the App ID
wrangler secret put GITHUB_APP_ID --name xhalo-blog-api

# Set the Installation ID
wrangler secret put GITHUB_INSTALLATION_ID --name xhalo-blog-api

# Set the private key PEM content
# Note: You can pass the entire PEM file contents when prompted by Wrangler
wrangler secret put GITHUB_APP_PRIVATE_KEY --name xhalo-blog-api
```

---

## 7. Webhook Signature Verification

Ensure you set `GITHUB_WEBHOOK_SECRET` to verify webhook signatures securely:

```bash
wrangler secret put GITHUB_WEBHOOK_SECRET --name xhalo-blog-api
```

Once configured, pushes to your GitHub repository will trigger the `/webhooks/github` route, verifying the signature against your secret and synchronizing the posts index database automatically.
