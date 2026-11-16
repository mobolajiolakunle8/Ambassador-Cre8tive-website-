(() => {
  const form = document.querySelector('[data-confirmation-form]');
  const status = document.querySelector('[data-confirmation-status]');
  const copy = document.querySelector('[data-confirmation-copy]');
  const params = new URLSearchParams(window.location.search);
  const email = String(params.get('email') || '').trim().toLowerCase();
  const token = String(params.get('token') || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };

  if (!validEmail || !token) {
    copy.textContent = 'This confirmation link is incomplete. Please return to the website and request a new confirmation email.';
    setStatus('A valid confirmation link is required.', true);
    return;
  }
  copy.textContent = `Confirm that ${email} should receive occasional Ambassador Cre8tive creative notes.`;
  form.hidden = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    setStatus('Confirming your subscription…');
    try {
      const response = await fetch(`/api/confirm-subscription?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to confirm subscription.');
      form.hidden = true;
      copy.textContent = 'Your email is confirmed. Welcome to Ambassador Cre8tive creative notes.';
      setStatus('Your subscription is active.');
      import('./firebase-config.js').then((config) => config.trackEvent('sign_up', { method: 'newsletter_confirmed' })).catch(() => {});
    } catch (error) {
      setStatus(error?.message || 'We could not confirm your subscription just now. Please try again shortly.', true);
    } finally {
      button.disabled = false;
    }
  });
})();
