(() => {
  const forms = [...document.querySelectorAll('[data-newsletter-form]')];
  if (!forms.length) return;

  // Keep a private pending record for the studio without turning a public form submission
  // into a deliverable newsletter subscriber. Web3Forms sends the notification to the studio.
  const firebaseRuntime = Promise.all([
    import('./firebase-config.js'),
    import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
  ]).then(([config, firestore]) => ({ config, firestore })).catch(() => null);

  const captureNewsletterRequest = async (email) => {
    const runtime = await firebaseRuntime;
    if (!runtime) return null;
    const { config, firestore } = runtime;
    try {
      await firestore.setDoc(firestore.doc(config.db, 'subscribers', email), {
        email,
        status: 'pending',
        source: 'website',
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      }, { merge: false });
      config.trackEvent('newsletter_request_sent', { method: 'web3forms' });
      return true;
    } catch (error) {
      // A visitor must not be able to learn whether a private address is already stored.
      if (error?.code === 'permission-denied') return true;
      return null;
    }
  };

  const addBotcheck = (form) => {
    if (form.querySelector('[name="botcheck"]')) return;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'botcheck';
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.style.display = 'none';
    form.append(input);
  };

  forms.forEach((form) => {
    addBotcheck(form);
    const status = form.querySelector('[data-newsletter-status]');
    const emailInput = form.querySelector('input[type="email"]');
    const setStatus = (message, isError = false) => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('is-error', isError);
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const submitted = new FormData(form);
      if (submitted.get('botcheck')) {
        setStatus('Thanks — your request has been received.');
        form.reset();
        return;
      }
      const email = String(emailInput.value || '').trim().toLowerCase().slice(0, 254);
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending…';
      setStatus('Sending your request…');
      try {
        const web3forms = window.AmbassadorWeb3Forms;
        if (!web3forms?.isConfigured?.()) throw new Error('The website form delivery service is not configured yet.');
        const delivery = new FormData();
        delivery.set('name', 'Creative-notes signup request');
        delivery.set('email', email);
        delivery.set('request_type', 'Creative notes signup request');
        delivery.set('message', `A visitor asked to receive creative notes. Follow up with them before adding them to a campaign.`);
        await web3forms.submit({
          formData: delivery,
          subject: `Creative-notes signup request — ${email}`,
          formName: 'Creative-notes signup request',
          replyTo: email,
        });
        // This best-effort record remains pending. It does not confer campaign consent.
        void captureNewsletterRequest(email);
        setStatus('Thanks — your request has been sent to Ambassador Cre8tive. We’ll be in touch before adding you to creative notes.');
        form.reset();
      } catch (error) {
        setStatus(
          /not configured/i.test(error?.message || '')
            ? 'Creative-notes requests are not configured yet. Please email us directly.'
            : 'We could not send your request right now. Please try again shortly or email us directly.',
          true,
        );
      } finally {
        button.textContent = originalText;
        button.disabled = false;
      }
    });
  });
})();
