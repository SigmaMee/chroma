# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Chroma, please report it by emailing the maintainers directly rather than opening a public issue.

## Security Measures

### Client-Side Only
Chroma is a purely client-side application:
- No data is sent to external servers
- All color calculations happen in your browser
- No cookies or tracking mechanisms
- No user data collection

### Data Privacy
- **No Analytics**: We don't track usage or collect analytics by default
- **No External Requests**: The app doesn't make any external API calls
- **Local Storage**: No data is stored in browser localStorage or sessionStorage
- **No PII**: No personally identifiable information is collected

### Security Headers
We implement the following security headers on our hosted version:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

### Input Validation
- All color inputs are validated with regex patterns
- Hex values are sanitized before processing
- Error handling prevents malformed inputs from breaking the app

### Dependencies
- **Zero runtime dependencies**: Pure vanilla JavaScript
- **No npm packages**: Eliminates supply chain attack vectors
- **Ionicons via CDN**: Loaded from unpkg.com with SRI (Subresource Integrity) recommended

### Recommended Practices

If you're self-hosting Chroma:

1. **Add SRI hashes** to external resources:
```html
<script type="module" 
  src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
  integrity="sha384-..." 
  crossorigin="anonymous">
</script>
```

2. **Enable HTTPS** on your hosting provider
3. **Review CSP headers** and adjust for your needs
4. **Keep dependencies updated** (if using any build tools)
5. **Monitor access logs** for unusual patterns

## Vulnerability Disclosure

We follow responsible disclosure practices:
- Report vulnerabilities privately
- Allow reasonable time for fixes before public disclosure
- Credit reporters unless they prefer to remain anonymous

## Updates

This security policy may be updated as the project evolves. Check back regularly for changes.

Last updated: December 16, 2025
