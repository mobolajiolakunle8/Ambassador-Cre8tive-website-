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

  // Firestore remains a private CRM copy for the verified admin. Form delivery does not wait
  // for it, so a visitor can still reach the studio through Web3Forms if Firebase is unavailable.
  const firebaseRuntime = Promise.all([
    import('./firebase-config.js'),
    import('./firebase-firestore.js'),
  ]).then(([config, firestore]) => ({ config, firestore })).catch(() => null);

  const captureLead = async (payload) => {
    const runtime = await firebaseRuntime;
    if (!runtime) return null;
    const { config, firestore } = runtime;
    try {
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
      config.trackEvent('generate_lead', { service: payload.service || 'not_specified', project: payload.project || 'general' });
      return reference;
    } catch {
      return null;
    }
  };

  const web3FormsPayload = (payload) => {
    const data = new FormData();
    data.set('name', payload.name);
    data.set('email', payload.email);
    if (payload.business) data.set('business', payload.business);
    if (payload.businessType) data.set('business_type', payload.businessType);
    if (payload.service) data.set('service', payload.service);
    if (payload.timeline) data.set('ideal_timeline', payload.timeline);
    if (payload.budget) data.set('project_budget', payload.budget);
    if (payload.website) data.set('website_or_reference', payload.website);
    if (payload.project) data.set('related_project', payload.project);
    data.set('message', payload.message);
    return data;
  };

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
    const originalMarkup = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = 'Sending…';
    setStatus('Sending your project brief…');
    try {
      const web3forms = window.AmbassadorWeb3Forms;
      if (!web3forms?.isConfigured?.()) throw new Error('The website form delivery service is not configured yet.');
      await web3forms.submit({
        formData: web3FormsPayload(payload),
        subject: `New Ambassador Cre8tive enquiry — ${payload.name}`,
        formName: 'Project enquiry',
        replyTo: payload.email,
      });
      // Do not block the visitor’s success state on the optional private CRM mirror.
      void captureLead(payload);
      setStatus('Thank you — your brief has been sent. Ambassador Cre8tive will be in touch soon.');
      form.reset();
    } catch (error) {
      const unavailable = /not configured/i.test(error?.message || '');
      setStatus(
        unavailable
          ? 'This form is not configured for online delivery yet. Your email app is opening with the brief pre-filled.'
          : 'We could not send the form right now. Your email app is opening with the brief pre-filled.',
        true,
      );
      fallbackMailto(payload);
    } finally {
      submit.innerHTML = originalMarkup;
      submit.disabled = false;
    }
  });
})();
