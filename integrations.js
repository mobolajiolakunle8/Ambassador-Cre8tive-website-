(() => {
  const normalizeWhatsapp = (number = '') => String(number).replace(/\D/g, '');
  // Use WhatsApp's official click-to-chat endpoint rather than a third-party redirect.
  const makeWhatsappUrl = (number, text) => `https://api.whatsapp.com/send?phone=${normalizeWhatsapp(number)}&text=${encodeURIComponent(text)}`;
  const isHttpUrl = (value) => {
    try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
  };

  const firebaseRuntime = import('./firebase-config.js');
  firebaseRuntime.then((config) => {
    const bookingUrl = String(config.BOOKING_URL || '').trim();
    const whatsappNumber = normalizeWhatsapp(config.WHATSAPP_NUMBER);
    const businessUrl = String(config.GOOGLE_BUSINESS_PROFILE_URL || '').trim();

    if (config.VERCEL_ANALYTICS_ENABLED) {
      // Official plain-HTML Vercel Analytics queue. Vercel serves this path only after
      // Web Analytics is enabled for the deployed Vercel project.
      window.va = window.va || function queueVercelAnalytics() { (window.vaq = window.vaq || []).push(arguments); };
      if (!document.querySelector('script[data-vercel-insights]')) {
        const script = document.createElement('script');
        script.defer = true;
        script.src = '/_vercel/insights/script.js';
        script.dataset.vercelInsights = 'true';
        document.head.append(script);
      }
    }

    if (bookingUrl && isHttpUrl(bookingUrl)) {
      document.querySelectorAll('[data-booking-link]').forEach((link) => {
        link.href = bookingUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.hidden = false;
        link.addEventListener('click', () => config.trackEvent('schedule', { method: 'booking_link' }));
      });
    }
    if (whatsappNumber) {
      document.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
        const context = link.dataset.whatsappMessage || 'Hello Ambassador Cre8tive, I would like to discuss a creative project.';
        link.href = makeWhatsappUrl(whatsappNumber, context);
        link.target = '_blank';
        link.rel = 'noopener';
        link.hidden = false;
        link.addEventListener('click', () => config.trackEvent('contact', { method: 'whatsapp' }));
      });
    }
    if (businessUrl && isHttpUrl(businessUrl)) {
      document.querySelectorAll('[data-google-business-link]').forEach((link) => {
        link.href = businessUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.hidden = false;
      });
    }

    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.addEventListener('click', () => config.trackEvent('contact', { method: 'email' }));
    });
    document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
      link.addEventListener('click', () => config.trackEvent('contact', { method: 'phone' }));
    });
  }).catch(() => {});
})();
