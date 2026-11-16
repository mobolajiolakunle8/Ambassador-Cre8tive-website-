(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-form-status]');
  const params = new URLSearchParams(window.location.search);
  const suggestedTopic = params.get('project') || params.get('topic');
  const suggestedService = params.get('service');
  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };
  const clean = (value, length) => String(value || '').trim().slice(0, length);

  if (suggestedTopic) {
    const message = form.querySelector('[name="message"]');
    if (message && !message.value) message.value = `I would like to discuss ${suggestedTopic}.`;
  }
  if (suggestedService) {
    const service = form.querySelector('[name="service"]');
    if (service && [...service.options].some((option) => option.value === suggestedService)) service.value = suggestedService;
  }

  const fallbackMailto = (payload) => {
    const subject = `New Ambassador Cre8tive enquiry from ${payload.name}`;
    const details = [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      payload.business && `Business / brand: ${payload.business}`,
      payload.businessType && `Business type: ${payload.businessType}`,
      `Service: ${payload.service || 'Not specified'}`,
      payload.timeline && `Ideal timeline: ${payload.timeline}`,
      payload.budget && `Comfortable budget: ${payload.budget}`,
      payload.website && `Website / reference: ${payload.website}`,
      payload.project && `Related project: ${payload.project}`,
    ].filter(Boolean).join('\n');
    window.location.href = `mailto:mobolajiolakunle8@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${details}\n\nProject details:\n${payload.message}`)}`;
  };

  const firebaseRuntime = Promise.all([
    import('./firebase-config.js'),
    import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
  ]).then(([config, firestore]) => ({ config, firestore }));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const payload = {
      name: clean(data.get('name'), 120),
      email: clean(data.get('email'), 254),
      business: clean(data.get('business'), 160),
      businessType: clean(data.get('businessType'), 80),
      service: clean(data.get('service'), 120),
      timeline: clean(data.get('timeline'), 80),
      budget: clean(data.get('budget'), 120),
      website: clean(data.get('website'), 500),
      message: clean(data.get('message'), 3000),
      project: clean(params.get('project'), 160),
      companyWebsite: clean(data.get('companyWebsite'), 500),
    };

    // A hidden field catches simple automated bots without affecting genuine visitors.
    if (payload.companyWebsite) {
      setStatus('Thank you. Your message has been received.');
      form.reset();
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setStatus('Saving your project brief…');
    try {
      const { config, firestore } = await firebaseRuntime;
      const reference = await firestore.addDoc(firestore.collection(config.db, 'enquiries'), {
        name: payload.name,
        email: payload.email,
        business: payload.business,
        businessType: payload.businessType,
        service: payload.service,
        timeline: payload.timeline,
        budget: payload.budget,
        website: payload.website,
        message: payload.message,
        project: payload.project,
        status: 'new',
        source: 'website',
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      });

      // Resend notification is optional. Firestore capture remains the source of truth.
      fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, enquiryId: reference.id }),
      }).catch(() => {});
      config.trackEvent('generate_lead', { service: payload.service || 'not_specified', project: payload.project || 'general' });
      setStatus('Thank you — your brief has been received. Ambassador Cre8tive will be in touch soon.');
      form.reset();
    } catch {
      setStatus('We could not save the form right now. Your email app is opening with the brief pre-filled.', true);
      fallbackMailto(payload);
    } finally {
      submit.disabled = false;
    }
  });
})();
