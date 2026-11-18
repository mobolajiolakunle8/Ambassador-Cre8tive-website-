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

    const ctaHref = safeCtaHref(settings.heroCtaHref);
    const ctaLabel = String(settings.heroCtaLabel || '').trim();
    document.querySelectorAll('[data-home-primary-cta]').forEach((link) => {
      if (ctaHref) link.href = ctaHref;
      if (ctaLabel) {
        const label = link.querySelector('[data-home-primary-label]');
        if (label) label.textContent = ctaLabel;
      }
    });

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
        import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
      ]);
      const snapshot = await firestore.getDoc(firestore.doc(db, 'siteSettings', 'public'));
      if (snapshot.exists()) applySettings(snapshot.data());
    } catch {
      // The semantic page copy remains in place until the public settings document exists.
    }
  })();
})();
