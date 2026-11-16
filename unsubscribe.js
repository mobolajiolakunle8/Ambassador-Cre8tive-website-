(() => {
  const form = document.querySelector('[data-unsubscribe-form]');
  const status = document.querySelector('[data-unsubscribe-status]');
  const copy = document.querySelector('[data-unsubscribe-copy]');
  const params = new URLSearchParams(window.location.search);
  const email = String(params.get('email') || '').trim().toLowerCase();
  const token = String(params.get('token') || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };

  if (!validEmail || !token) {
    copy.textContent = 'This unsubscribe link is incomplete. Please email mobolajiolakunle8@gmail.com if you need help with your subscription.';
    setStatus('A valid unsubscribe link is required.', true);
    return;
  }
  copy.textContent = `Confirm that you would like to stop receiving Ambassador Cre8tive creative notes at ${email}.`;
  form.hidden = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    setStatus('Updating your preference…');
    try {
      const response = await fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) throw new Error('Unable to unsubscribe.');
      form.hidden = true;
      copy.textContent = 'You have been unsubscribed from Ambassador Cre8tive creative notes.';
      setStatus('Your preference has been saved.');
    } catch {
      setStatus('We could not update your subscription just now. Please try again or email mobolajiolakunle8@gmail.com.', true);
    } finally {
      button.disabled = false;
    }
  });
})();
