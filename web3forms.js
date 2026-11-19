(() => {
  const endpoint = 'https://api.web3forms.com/submit';
  const clean = (value, maximum = 1000) => String(value || '').trim().slice(0, maximum);
  const oneLine = (value, maximum = 180) => clean(value, maximum).replace(/[\r\n]+/g, ' ');
  const accessKey = () => clean(window.AmbassadorWeb3FormsConfig?.accessKey, 300);

  const isConfigured = () => Boolean(accessKey());

  const submit = async ({ formData, subject, formName, replyTo } = {}) => {
    if (!(formData instanceof FormData)) throw new Error('A valid form submission is required.');
    const key = accessKey();
    if (!key) throw new Error('The website form delivery service is not configured yet.');

    // These values are set here rather than trusting arbitrary form fields.
    formData.set('access_key', key);
    formData.set('subject', oneLine(subject || 'New Ambassador Cre8tive website form'));
    formData.set('from_name', 'Ambassador Cre8tive website');
    formData.set('form_name', oneLine(formName || 'Website form'));
    if (replyTo) formData.set('replyto', clean(replyTo, 254));
    if (window.location?.href) formData.set('page_url', clean(window.location.href, 2000));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.success !== true) {
      const providerMessage = oneLine(data?.message || data?.body?.message || 'The message could not be sent.', 220);
      throw new Error(providerMessage || 'The message could not be sent.');
    }
    return data;
  };

  window.AmbassadorWeb3Forms = Object.freeze({ isConfigured, submit });
})();
