# Privacy Policy

**Last updated: December 16, 2025**

## Overview

Chroma is a privacy-first color token generator that operates entirely in your browser. We do not collect, store, or transmit any personal data.

## Data Collection

**We collect zero data.** Specifically:

- ❌ No analytics or tracking
- ❌ No cookies
- ❌ No browser fingerprinting
- ❌ No third-party integrations
- ❌ No server-side logging
- ❌ No user accounts or registration

## How Chroma Works

Chroma is a **100% client-side application**:

1. You enter a color value
2. Your browser performs all calculations locally
3. Tokens are generated in your browser's memory
4. Nothing is sent to our servers or any third party

## Data Storage

- **No server storage**: We don't have a database or backend server
- **No local storage**: We don't use localStorage or sessionStorage
- **No persistent data**: Close your browser tab and everything is gone

## External Resources

The app loads icons from Ionicons (unpkg.com):
- Ionicons are loaded from a CDN for visual consistency
- These requests do not include any user data
- CDN may log standard server access logs (IP, user agent)
- We have no control over or access to these logs

## Your Rights

Since we don't collect any data:
- There's nothing to request, delete, or modify
- No GDPR/CCPA compliance needed (no data = no requirements)
- Complete anonymity by default

## Self-Hosting

For maximum privacy, you can self-host Chroma:

```bash
git clone https://github.com/SigmaMee/chroma.git
cd chroma
python3 -m http.server 8080
```

When self-hosting, you can:
- Download and host Ionicons locally
- Disable all external requests
- Run completely offline
- Audit all source code

## Third-Party Services

**Ionicons (unpkg.com):**
- Purpose: Icon library
- Data shared: Standard HTTP headers (IP, user agent)
- Privacy policy: https://www.jsdelivr.com/privacy-policy-jsdelivr-net

## Changes to This Policy

We may update this privacy policy as the application evolves. Changes will be posted on this page with an updated revision date.

## Contact

For privacy questions or concerns, please open an issue on GitHub:
https://github.com/SigmaMee/chroma/issues

## Summary

**TL;DR:** Chroma is completely private. We don't collect, store, or transmit your data. Everything happens in your browser.
