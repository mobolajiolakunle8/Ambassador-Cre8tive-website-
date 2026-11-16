(() => {
  const forms = [...document.querySelectorAll('[data-newsletter-form]')];
  if (!forms.length) return;

  const firebaseRuntime = Promise.all([
    import('./firebase-config.js'),
    import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
  ]).then(([config, firestore]) => ({ config, firestore }));

  forms.forEach((form) => {
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
      const email = String(emailInput.value || '').trim().toLowerCase().slice(0, 254);
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus('Saving your request…');
      let pendingRequestSaved = false;
      try {
        const { config, firestore } = await firebaseRuntime;
        try {
          await firestore.setDoc(firestore.doc(config.db, 'subscribers', email), {
            email,
            status: 'pending',
            source: 'website',
            createdAt: firestore.serverTimestamp(),
            updatedAt: firestore.serverTimestamp(),
          }, { merge: false });
          pendingRequestSaved = true;
        } catch (error) {
          // A pre-existing pending or confirmed address is intentionally not readable by
          // visitors. Continue to the confirmation route without revealing account state.
          if (error?.code !== 'permission-denied') throw error;
          pendingRequestSaved = true;
        }

        const response = await fetch('/api/newsletter-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 503) {
          setStatus('Your request is saved, but email confirmation is not configured yet. Please try again later.', true);
        } else if (!response.ok && response.status !== 202) {
          throw new Error(result.error || 'We could not send the confirmation email.');
        } else if (result.unavailable) {
          setStatus('We could not complete a confirmation for this address from this form. Please email us if you need subscription help.', true);
        } else if (result.alreadyConfirmed) {
          setStatus('That email is already confirmed for creative notes. Thank you.');
          form.reset();
        } else {
          config.trackEvent('newsletter_opt_in_request', { method: 'newsletter' });
          setStatus('Check your inbox and confirm your email to join the list.');
          form.reset();
        }
      } catch {
        setStatus(
          pendingRequestSaved
            ? 'Your request is saved, but we could not send a confirmation email right now. Please try again shortly.'
            : 'We could not save your request just now. Please try again shortly.',
          true,
        );
      } finally {
        button.disabled = false;
      }
    });
  });
})();
