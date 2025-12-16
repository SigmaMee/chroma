/**
 * Optional Analytics & Monitoring
 * 
 * Privacy-first analytics that can be enabled/disabled by users.
 * All events are logged locally and can be exported for analysis.
 * No third-party services by default.
 */

class Analytics {
  constructor() {
    this.enabled = false;
    this.events = [];
    this.maxEvents = 1000;
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  /**
   * Generate a random session ID for grouping events
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable analytics tracking
   */
  enable() {
    this.enabled = true;
    this.track('analytics_enabled');
  }

  /**
   * Disable analytics tracking
   */
  disable() {
    this.track('analytics_disabled');
    this.enabled = false;
  }

  /**
   * Track an event
   * @param {string} eventName - Name of the event
   * @param {object} properties - Event properties
   */
  track(eventName, properties = {}) {
    if (!this.enabled && eventName !== 'analytics_enabled' && eventName !== 'analytics_disabled') {
      return;
    }

    const event = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      eventName,
      properties: {
        ...properties,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    };

    this.events.push(event);

    // Limit event storage
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Analytics]', eventName, properties);
    }
  }

  /**
   * Track page view
   */
  pageView(page) {
    this.track('page_view', { page });
  }

  /**
   * Track user interaction
   */
  interaction(element, action) {
    this.track('interaction', { element, action });
  }

  /**
   * Track error
   */
  error(errorMessage, context = {}) {
    this.track('error', {
      message: errorMessage,
      ...context
    });
  }

  /**
   * Track token generation
   */
  tokenGeneration(config) {
    this.track('token_generation', {
      primaryColor: config.primaryColor,
      complianceLevel: config.complianceLevel,
      tintAmount: config.tintAmount,
      tintColor: config.tintColor,
      outputFormat: config.outputFormat,
      hasPrefix: !!config.prefix
    });
  }

  /**
   * Track export action
   */
  export(format) {
    this.track('export', { format });
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const totalEvents = this.events.length;
    const eventCounts = {};
    
    this.events.forEach(event => {
      eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
    });

    const sessionDuration = Date.now() - this.sessionStart;

    return {
      sessionId: this.sessionId,
      sessionDuration,
      totalEvents,
      eventCounts,
      firstEvent: this.events[0],
      lastEvent: this.events[this.events.length - 1]
    };
  }

  /**
   * Export all events as JSON
   */
  exportEvents() {
    return JSON.stringify({
      summary: this.getSummary(),
      events: this.events
    }, null, 2);
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
    this.track('analytics_cleared');
  }
}

// Global analytics instance
const analytics = new Analytics();

// Error tracking
window.addEventListener('error', (event) => {
  analytics.error(event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection tracking
window.addEventListener('unhandledrejection', (event) => {
  analytics.error('Unhandled Promise Rejection', {
    reason: event.reason
  });
});

// Export for use in main application
export default analytics;
