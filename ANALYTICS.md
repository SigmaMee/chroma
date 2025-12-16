# Analytics & Monitoring Guide

Chroma includes an **optional, privacy-first analytics system** that can help you understand how the app is used while respecting user privacy.

## Philosophy

- **Opt-in only**: Analytics are disabled by default
- **Client-side only**: All tracking happens in the browser
- **No third parties**: No data sent to external services
- **User-controlled**: Users can enable/disable at any time
- **Transparent**: All tracked data can be viewed and exported

## Features

### Event Tracking
- Page views and tab switches
- Token generation with configuration details
- Export and download actions
- User interactions (clicks, form submissions)
- Error tracking (JavaScript errors, failed operations)

### Privacy Protection
- No personally identifiable information (PII)
- No cookies or persistent storage
- Session-based tracking only (resets on page reload)
- Local storage only (never leaves the browser)
- User can export and delete all data

## Usage

### Enable Analytics

Add this to your `main.js`:

```javascript
import analytics from './analytics.js';

// Enable analytics
analytics.enable();

// Track events
analytics.track('custom_event', { 
  property: 'value' 
});
```

### Track Token Generation

```javascript
analytics.tokenGeneration({
  primaryColor: '#3366FF',
  complianceLevel: 'AA',
  tintAmount: 'mid',
  tintColor: 'primary',
  outputFormat: 'json',
  prefix: 'brand'
});
```

### Track Exports

```javascript
analytics.export('json'); // or 'css'
```

### Track Errors

```javascript
try {
  // risky operation
} catch (error) {
  analytics.error(error.message, {
    context: 'token_generation'
  });
}
```

### View Analytics Summary

```javascript
const summary = analytics.getSummary();
console.log(summary);
/*
{
  sessionId: "session_1234567890_abc123",
  sessionDuration: 45000,
  totalEvents: 12,
  eventCounts: {
    "page_view": 3,
    "token_generation": 5,
    "export": 2
  }
}
*/
```

### Export All Data

```javascript
const data = analytics.exportEvents();
// Download or log the JSON data
```

### Clear Analytics

```javascript
analytics.clear();
```

## Integration Examples

### Add Analytics UI (Optional)

You could add a settings panel to let users control analytics:

```html
<div class="analytics-settings">
  <label>
    <input type="checkbox" id="analyticsToggle">
    Enable analytics (local only, no data sent externally)
  </label>
  <button id="viewAnalytics">View Analytics</button>
  <button id="exportAnalytics">Export Analytics</button>
  <button id="clearAnalytics">Clear Analytics</button>
</div>
```

```javascript
import analytics from './analytics.js';

const toggle = document.getElementById('analyticsToggle');
toggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    analytics.enable();
  } else {
    analytics.disable();
  }
});

document.getElementById('viewAnalytics').addEventListener('click', () => {
  console.table(analytics.getSummary());
});

document.getElementById('exportAnalytics').addEventListener('click', () => {
  const data = analytics.exportEvents();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chroma-analytics.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('clearAnalytics').addEventListener('click', () => {
  if (confirm('Clear all analytics data?')) {
    analytics.clear();
  }
});
```

### Track Tab Switches

```javascript
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.dataset.tab;
    analytics.pageView(tabName);
  });
});
```

### Track Button Clicks

```javascript
const generateBtn = document.getElementById('generate');
generateBtn.addEventListener('click', () => {
  analytics.interaction('generate_button', 'click');
});
```

## Data Structure

Each event includes:

```json
{
  "sessionId": "session_1234567890_abc123",
  "timestamp": 1702761600000,
  "sessionDuration": 45000,
  "eventName": "token_generation",
  "properties": {
    "primaryColor": "#3366FF",
    "complianceLevel": "AA",
    "userAgent": "Mozilla/5.0...",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "colorScheme": "dark"
  }
}
```

## Third-Party Analytics (Optional)

If you want to send data to external analytics services (like Plausible, Fathom, or self-hosted solutions), you can extend the Analytics class:

```javascript
class ExtendedAnalytics extends Analytics {
  track(eventName, properties = {}) {
    super.track(eventName, properties);
    
    // Send to external service
    if (this.enabled && window.plausible) {
      window.plausible(eventName, { props: properties });
    }
  }
}
```

### Recommended Privacy-Friendly Services

- **Plausible**: Lightweight, privacy-focused, GDPR compliant
- **Fathom**: Simple analytics without tracking
- **Umami**: Self-hosted, open-source alternative
- **Matomo**: Self-hosted with full control

## Best Practices

1. **Always disclose**: Tell users if analytics are enabled
2. **Make it opt-in**: Don't enable by default
3. **Provide controls**: Let users disable at any time
4. **Be transparent**: Show what data is collected
5. **Respect privacy**: Never collect PII
6. **Keep it local**: Don't send data without consent
7. **Document everything**: Explain what each event tracks

## Compliance

This analytics implementation:
- ✅ **GDPR compliant**: No PII, user-controlled, transparent
- ✅ **CCPA compliant**: No sale of data, opt-in only
- ✅ **Privacy-first**: Client-side only, no cookies
- ✅ **ePrivacy Directive**: No tracking without consent

## Limitations

- **Session-based only**: Data cleared on page reload
- **1000 event limit**: Older events are removed
- **No server-side**: Can't aggregate across users
- **No real-time**: Data only available locally

## Future Enhancements

Potential improvements:

- [ ] LocalStorage persistence (with user consent)
- [ ] Export to CSV format
- [ ] Visualization dashboard
- [ ] A/B testing support
- [ ] Funnel analysis
- [ ] Heat map integration

## Disabled by Default

Analytics are **disabled by default** in Chroma. To enable them, you must explicitly call `analytics.enable()` or add a user-facing toggle.

This ensures maximum privacy and compliance with data protection regulations.
