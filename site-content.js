(() => {
  const setText = (selector, value) => {
    const text = String(value || '').trim();
    if (!text) return;
    document.querySelectorAll(selector).forEach((element) => { element.textContent = text; });
  };

  const safeCtaHref = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(?:[a-z0-9_-]+\.html(?:\?[^\s]*)?|\/[a-z0-9_/?#=&.-]*)$/i.test(raw)) return raw;
    try {
      const url = new URL(raw);
      return ['https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  };

  const safeEmail = (value) => {
    const email = String(value || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  };

  const safePhone = (value) => {
    const phone = String(value || '').trim();
    return /^[0-9+() .-]{7,40}$/.test(phone) ? phone : '';
  };

  const applyCta = (selector, labelSelector, hrefValue, labelValue) => {
    const href = safeCtaHref(hrefValue);
    const label = String(labelValue || '').trim();
    document.querySelectorAll(selector).forEach((link) => {
      if (href) link.href = href;
      if (label) {
        const labelElement = link.querySelector(labelSelector);
        if (labelElement) labelElement.textContent = label;
      }
    });
  };

  const applySettings = (settings) => {
    setText('[data-home-hero-line-one]', settings.heroLineOne);
    setText('[data-home-hero-highlight-one]', settings.heroHighlightOne);
    setText('[data-home-hero-line-two]', settings.heroLineTwo);
    setText('[data-home-hero-highlight-two]', settings.heroHighlightTwo);
    setText('[data-home-hero-intro]', settings.heroIntro);
    setText('[data-home-about-copy]', settings.aboutCopy);
    setText('[data-site-footer-kicker]', settings.footerKicker);
    setText('[data-site-footer-line-one]', settings.footerLineOne);
    setText('[data-site-footer-line-two]', settings.footerLineTwo);
    setText('[data-site-footer-highlight]', settings.footerHighlight);
    setText('[data-home-testimonials-kicker]', settings.testimonialsKicker);
    setText('[data-home-testimonials-title]', settings.testimonialsTitle);
    setText('[data-home-availability-kicker]', settings.availabilityKicker);
    setText('[data-home-availability-title]', settings.availabilityTitle);
    setText('[data-home-availability-copy]', settings.availabilityCopy);
    setText('[data-home-availability-status]', settings.availabilityStatus);
    setText('[data-home-process-kicker]', settings.processKicker);
    setText('[data-home-process-title]', settings.processTitle);
    setText('[data-home-process-intro]', settings.processIntro);
    for (let step = 1; step <= 4; step += 1) {
      setText(`[data-home-process-step-${step}-title]`, settings[`processStep${step}Title`]);
      setText(`[data-home-process-step-${step}-copy]`, settings[`processStep${step}Copy`]);
    }

    applyCta('[data-home-primary-cta]', '[data-home-primary-label]', settings.heroCtaHref, settings.heroCtaLabel);
    applyCta('[data-home-availability-cta]', '[data-home-availability-label]', settings.availabilityCtaHref, settings.availabilityCtaLabel);

    const email = safeEmail(settings.contactEmail);
    if (email) {
      document.querySelectorAll('[data-site-contact-email]').forEach((link) => {
        link.href = `mailto:${email}`;
        link.textContent = email;
        link.setAttribute('aria-label', `Email Ambassador Cre8tive at ${email}`);
      });
    }

    const phone = safePhone(settings.contactPhone);
    if (phone) {
      const tel = phone.replace(/[^+\d]/g, '');
      document.querySelectorAll('[data-site-contact-phone]').forEach((link) => {
        link.href = `tel:${tel}`;
        link.textContent = phone;
      });
    }
  };

  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-firestore.js'),
      ]);
      firestore.onSnapshot(firestore.doc(db, 'siteSettings', 'public'), (snapshot) => {
        if (snapshot.exists()) applySettings(snapshot.data());
      }, () => {
        // Semantic source copy remains visible whenever Firebase is unavailable.
      });
    } catch {
      // Semantic source copy remains visible in network-restricted previews.
    }
  })();
})();
