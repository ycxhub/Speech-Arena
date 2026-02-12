# speecharena.org Domain Setup Guide

Step-by-step instructions to add **speecharena.org** to Vercel and configure Cloudflare DNS.

---

## Prerequisites

- [ ] Domain **speecharena.org** purchased and accessible
- [ ] Domain added to Cloudflare (nameservers at registrar point to Cloudflare)
- [ ] TTS Battles project deployed on Vercel

---

## Part 1: Add Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **TTS Battles** project
3. Click **Settings** → **Domains**
4. Click **Add Domain**
5. Enter `speecharena.org`
6. Choose **Recommended (WWW & non-WWW)** — this adds both apex and www
7. Vercel will show the DNS records you need. **Copy these values** (they may be project-specific):

   | Type | Name | Value |
   |------|------|-------|
   | **A** | `@` | `76.76.21.21` |
   | **CNAME** | `www` | `cname.vercel-dns.com` *(or project-specific)* |

   > **Note:** The CNAME target may be project-specific (e.g. `xxxxxxxx.vercel-dns-xxx.com`). Use the exact value shown in the Vercel dashboard.

---

## Part 2: Configure Cloudflare DNS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select the **speecharena.org** site
3. Go to **DNS** → **Records**
4. Add or update these records:

### Apex domain (speecharena.org)

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| **A** | `@` | `76.76.21.21` | **DNS only** (grey cloud) | Auto |

### WWW subdomain (www.speecharena.org)

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| **CNAME** | `www` | `cname.vercel-dns.com` | **DNS only** (grey cloud) | Auto |

5. **Important:** Set **Proxy status** to **DNS only** (grey cloud ☁️), not proxied (orange cloud).  
   Vercel does not recommend using Cloudflare as a reverse proxy in front of Vercel [(docs)](https://vercel.com/docs/integrations/external-platforms/cloudflare).

6. Remove any conflicting records for `@` or `www` if they exist.

---

## Part 3: Verify

1. Wait 5–15 minutes for DNS propagation (can take up to 24–48 hours in some cases)
2. In Vercel, check that the domain status shows **Valid Configuration**
3. Test:
   - https://speecharena.org
   - https://www.speecharena.org

### Quick DNS check

```bash
# Apex
dig A speecharena.org +short

# WWW
dig CNAME www.speecharena.org +short
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Domain shows "Invalid Configuration" in Vercel | Confirm A and CNAME match exactly; check proxy is OFF |
| SSL certificate pending | Wait for propagation; Vercel provisions certificates automatically |
| Redirect loops | Ensure Cloudflare proxy is OFF (DNS only) for Vercel records |
| Old site still loading | Clear DNS cache; propagation can take up to 48 hours |

---

## Reference

- [Vercel: Adding a Custom Domain](https://vercel.com/docs/domains/add-a-domain)
- [Vercel: Cloudflare in front of Vercel](https://vercel.com/docs/integrations/external-platforms/cloudflare) — use DNS only, not proxy
