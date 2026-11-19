(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  const safeContentHref = (value = '') => {
    const raw = String(value).trim();
    if (/^(?:[a-z0-9_-]+\.html(?:\?[^\s]*)?|\/[a-z0-9_/?#=&.-]*)$/i.test(raw)) return raw;
    try {
      const url = new URL(raw);
      return ['https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.toString() : '';
    } catch { return ''; }
  };
  const isLocalImage = (value = '') => /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(String(value));
  const safeImageUrl = (value = '') => {
    const raw = String(value).trim();
    if (isLocalImage(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
    } catch { return ''; }
  };
  const validDate = (value = '') => /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  const today = () => {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  };
  const readableDate = (value = '') => {
    const date = validDate(value) ? new Date(`${value}T12:00:00`) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      : 'Undated';
  };
  const setMessage = (element, message = '', isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', Boolean(isError));
  };
  const authErrorMessage = (error) => {
    const code = String(error?.code || '');
    if (code.includes('permission-denied') || code.includes('unauthorized')) return 'Firebase denied this action. Verify the approved email and deploy the updated Firestore rules.';
    if (code.includes('network-request-failed') || code.includes('unavailable')) return 'A network connection is required to save this change.';
    return error?.message || 'Something went wrong. Please try again.';
  };
  const debounce = (callback, delay = 850) => {
    let timer = null;
    return (...args) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const siteSettingsForm = $('[data-site-settings-form]');
  const siteMessage = $('[data-site-settings-message]');
  const testimonialForm = $('[data-testimonial-form]');
  const testimonialList = $('[data-testimonial-list]');
  const testimonialMessage = $('[data-testimonial-message]');
  const testimonialId = $('[data-testimonial-id]');
  const testimonialHeading = $('[data-testimonial-heading]');
  const resetTestimonialButton = $('[data-reset-testimonial]');
  const journalForm = $('[data-journal-form]');
  const journalList = $('[data-journal-list]');
  const journalMessage = $('[data-journal-message]');
  const journalId = $('[data-journal-id]');
  const journalHeading = $('[data-journal-heading]');
  const resetJournalButton = $('[data-reset-journal]');
  const projectForm = $('[data-project-form]');
  const projectId = $('[data-project-id]');
  const projectMessage = $('[data-project-message]');
  const enquiryList = $('[data-enquiry-list]');

  const DEFAULT_SITE_SETTINGS = Object.freeze({
    heroLineOne: 'Creating',
    heroHighlightOne: 'brands',
    heroLineTwo: 'and digital',
    heroHighlightTwo: 'solutions',
    heroIntro: 'Brand identity and strategic design for ambitious businesses, founders, and growing teams ready to show up clearly.',
    heroCtaLabel: 'Start a project',
    heroCtaHref: 'contact.html?topic=Discovery%20call',
    aboutCopy: 'At Ambassador Cre8tive, we combine creativity, strategy, and design to help businesses establish their identity, strengthen their presence, and communicate with confidence.',
    footerKicker: 'Have a project?',
    footerLineOne: 'Let’s make',
    footerLineTwo: 'something',
    footerHighlight: 'matter.',
    contactEmail: 'mobolajiolakunle8@gmail.com',
    contactPhone: '0903 019 2034',
    testimonialsKicker: 'Client perspective',
    testimonialsTitle: 'Words from the people behind the work.',
    availabilityKicker: 'Studio availability',
    availabilityTitle: 'Ready when the right brief is.',
    availabilityCopy: 'Tell us what you are building, what needs to change, and where you would like the work to take your brand. We will help you find the most useful next step.',
    availabilityStatus: 'Currently accepting selected projects.',
    availabilityCtaLabel: 'Start a project',
    availabilityCtaHref: 'contact.html?topic=Discovery%20call',
    processKicker: 'How we work',
    processTitle: 'A focused path from brief to delivery.',
    processIntro: 'Every project is shaped around the problem that matters most, with clear decisions and thoughtful collaboration from the first conversation onward.',
    processStep1Title: 'Discover',
    processStep1Copy: 'We clarify the business goal, audience, priorities, and practical context behind the brief.',
    processStep2Title: 'Define',
    processStep2Copy: 'We turn the brief into a focused creative direction, scope, and route forward.',
    processStep3Title: 'Design',
    processStep3Copy: 'We build the visual system and key materials with considered feedback at the right moments.',
    processStep4Title: 'Deliver',
    processStep4Copy: 'We hand over practical, ready-to-use work that helps your team move with confidence.',
  });
  const SITE_LIMITS = Object.freeze({
    heroLineOne: 80, heroHighlightOne: 80, heroLineTwo: 80, heroHighlightTwo: 80, heroIntro: 380,
    heroCtaLabel: 60, heroCtaHref: 500, aboutCopy: 650, footerKicker: 80, footerLineOne: 80,
    footerLineTwo: 80, footerHighlight: 80, contactEmail: 254, contactPhone: 40,
    testimonialsKicker: 80, testimonialsTitle: 160, availabilityKicker: 80, availabilityTitle: 160,
    availabilityCopy: 650, availabilityStatus: 160, availabilityCtaLabel: 60, availabilityCtaHref: 500,
    processKicker: 80, processTitle: 160, processIntro: 650,
    processStep1Title: 80, processStep1Copy: 380, processStep2Title: 80, processStep2Copy: 380,
    processStep3Title: 80, processStep3Copy: 380, processStep4Title: 80, processStep4Copy: 380,
  });
  const JOURNAL_CATEGORIES = Object.freeze({ branding: 'Branding', design: 'Design', growth: 'Growth', studio: 'Studio' });

  let firebase = null;
  let authSdk = null;
  let firestore = null;
  let currentUser = null;
  let unsubscribeSettings = null;
  let unsubscribeTestimonials = null;
  let unsubscribeJournal = null;
  let testimonials = [];
  let journalPosts = [];
  let savingSettings = false;
  let savingProject = false;
  let savingTestimonial = false;
  let savingJournal = false;
  let resaveSettings = false;
  let resaveProject = false;
  let resaveTestimonial = false;
  let resaveJournal = false;
  let savingEnquiryIds = new Set();

  const normaliseSettings = (source = {}) => Object.fromEntries(Object.entries(DEFAULT_SITE_SETTINGS).map(([key, fallback]) => {
    const raw = source[key] === undefined || source[key] === null ? fallback : source[key];
    return [key, String(raw).trim().slice(0, SITE_LIMITS[key])];
  }));

  const renderSettings = (source, preserveFocused = true) => {
    if (!siteSettingsForm) return;
    const focused = document.activeElement;
    Object.entries(normaliseSettings(source)).forEach(([key, value]) => {
      const field = siteSettingsForm.elements[key];
      if (!field || (preserveFocused && field === focused)) return;
      field.value = value;
    });
  };

  const settingsPayload = () => {
    const formData = new FormData(siteSettingsForm);
    const source = Object.fromEntries(Object.keys(DEFAULT_SITE_SETTINGS).map((key) => [key, formData.get(key)]));
    const values = normaliseSettings(source);
    values.heroCtaHref = safeContentHref(values.heroCtaHref);
    values.availabilityCtaHref = safeContentHref(values.availabilityCtaHref);
    return values;
  };

  const settingsIssue = (payload) => {
    if (!payload.heroCtaHref) return 'Use a local .html page or a public HTTPS URL for the primary call-to-action link.';
    if (!payload.availabilityCtaHref) return 'Use a local .html page or a public HTTPS URL for the availability call-to-action link.';
    if (!isEmail(payload.contactEmail)) return 'Enter a valid public contact email address.';
    if (!/^[0-9+() .-]{7,40}$/.test(payload.contactPhone)) return 'Enter a valid public phone number.';
    return '';
  };

  const saveSettings = async (automatic = false) => {
    if (!siteSettingsForm || !firebase || !firestore || !currentUser) return;
    if (savingSettings) return;
    const payload = settingsPayload();
    const issue = settingsIssue(payload);
    if (issue) {
      setMessage(siteMessage, issue, true);
      return;
    }
    savingSettings = true;
    setMessage(siteMessage, automatic ? 'Saving homepage changes…' : 'Saving now…');
    try {
      await firestore.setDoc(firestore.doc(firebase.db, 'siteSettings', 'public'), { ...payload, updatedAt: firestore.serverTimestamp() });
      setMessage(siteMessage, 'Saved. This content is live across open browsers.');
    } catch (error) {
      setMessage(siteMessage, authErrorMessage(error), true);
    } finally {
      savingSettings = false;
      if (resaveSettings) {
        resaveSettings = false;
        queueSettingsSave();
      }
    }
  };
  const queueSettingsSave = debounce(() => {
    if (savingSettings) { resaveSettings = true; return; }
    saveSettings(true);
  });

  const projectPayload = () => {
    const data = new FormData(projectForm);
    const rawImage = String(data.get('image') || '').trim();
    return {
      payload: {
        title: String(data.get('title') || '').trim().slice(0, 120),
        client: String(data.get('client') || '').trim().slice(0, 120),
        category: ['identity', 'campaign', 'digital', 'print'].includes(String(data.get('category') || '')) ? String(data.get('category')) : 'identity',
        date: validDate(data.get('date')) ? String(data.get('date')) : '',
        description: String(data.get('description') || '').trim().slice(0, 650),
        challenge: String(data.get('challenge') || '').trim().slice(0, 700),
        approach: String(data.get('approach') || '').trim().slice(0, 700),
        deliverables: String(data.get('deliverables') || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 12),
        outcome: String(data.get('outcome') || '').trim().slice(0, 700),
        testimonial: String(data.get('testimonial') || '').trim().slice(0, 650),
        testimonialAttribution: String(data.get('testimonialAttribution') || '').trim().slice(0, 160),
        imageAlt: String(data.get('imageAlt') || '').trim().slice(0, 180),
        image: safeImageUrl(rawImage),
        storagePath: '',
        featured: data.get('featured') === 'on',
        published: data.get('published') === 'on',
      },
      rawImage,
    };
  };
  const projectHasContent = (payload) => Boolean(payload.title || payload.client || payload.description || payload.challenge || payload.approach || payload.deliverables.length || payload.outcome || payload.testimonial || payload.testimonialAttribution || payload.image || payload.imageAlt || payload.featured || payload.published);
  const projectIssue = (payload, rawImage) => {
    if (rawImage && !payload.image) return 'Use a public HTTPS image link or a valid local assets/… image path.';
    if (payload.published && !payload.title) return 'Add a project title before publishing.';
    if (payload.published && !payload.image) return 'Add a valid public image link before publishing.';
    return '';
  };
  const saveProjectDraft = async () => {
    if (!projectForm || !firebase || !firestore || !currentUser || savingProject) return;
    const { payload, rawImage } = projectPayload();
    if (!projectId.value && !projectHasContent(payload)) return;
    const issue = projectIssue(payload, rawImage);
    if (issue) { setMessage(projectMessage, issue, true); return; }
    savingProject = true;
    setMessage(projectMessage, projectId.value ? 'Saving project changes…' : 'Creating project draft…');
    try {
      if (projectId.value) {
        await firestore.updateDoc(firestore.doc(firebase.db, 'projects', projectId.value), { ...payload, id: projectId.value, updatedAt: firestore.serverTimestamp() });
      } else {
        const reference = firestore.doc(firestore.collection(firebase.db, 'projects'));
        await firestore.setDoc(reference, { ...payload, id: reference.id, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp() });
        projectId.value = reference.id;
        const heading = $('[data-form-heading]');
        if (heading) heading.textContent = 'Edit project draft';
        const cancel = $('[data-cancel-edit]');
        if (cancel) cancel.hidden = false;
      }
      setMessage(projectMessage, 'Saved. This project is synchronised across signed-in browsers.');
    } catch (error) {
      setMessage(projectMessage, authErrorMessage(error), true);
    } finally {
      savingProject = false;
      if (resaveProject) {
        resaveProject = false;
        queueProjectSave();
      }
    }
  };
  const queueProjectSave = debounce(() => {
    if (savingProject) { resaveProject = true; return; }
    saveProjectDraft();
  });

  const blankTestimonial = () => ({ quote: '', attribution: '', role: '', project: '', sortOrder: 0, featured: false, published: false });
  const testimonialPayload = () => {
    const data = new FormData(testimonialForm);
    const parsedOrder = Number.parseInt(String(data.get('sortOrder') || '0'), 10);
    return {
      quote: String(data.get('quote') || '').trim().slice(0, 650),
      attribution: String(data.get('attribution') || '').trim().slice(0, 160),
      role: String(data.get('role') || '').trim().slice(0, 160),
      project: String(data.get('project') || '').trim().slice(0, 160),
      sortOrder: Number.isInteger(parsedOrder) ? Math.min(999, Math.max(0, parsedOrder)) : 0,
      featured: data.get('featured') === 'on',
      published: data.get('published') === 'on',
    };
  };
  const testimonialHasContent = (value) => Boolean(value.quote || value.attribution || value.role || value.project || value.sortOrder || value.featured || value.published);
  const testimonialIssue = (value) => value.published && (!value.quote || !value.attribution) ? 'A public testimonial needs both an approved quote and an attribution.' : '';
  const resetTestimonial = () => {
    if (!testimonialForm) return;
    testimonialForm.reset();
    testimonialId.value = '';
    testimonialForm.elements.sortOrder.value = '0';
    testimonialForm.elements.featured.checked = false;
    testimonialForm.elements.published.checked = false;
    if (testimonialHeading) testimonialHeading.textContent = 'Add a testimonial';
    if (resetTestimonialButton) resetTestimonialButton.hidden = true;
    setMessage(testimonialMessage, 'Start typing to create a private draft.');
  };
  const fillTestimonial = (record) => {
    if (!testimonialForm || !record) return;
    testimonialId.value = record.id;
    testimonialForm.elements.quote.value = record.quote || '';
    testimonialForm.elements.attribution.value = record.attribution || '';
    testimonialForm.elements.role.value = record.role || '';
    testimonialForm.elements.project.value = record.project || '';
    testimonialForm.elements.sortOrder.value = String(record.sortOrder || 0);
    testimonialForm.elements.featured.checked = Boolean(record.featured);
    testimonialForm.elements.published.checked = Boolean(record.published);
    if (testimonialHeading) testimonialHeading.textContent = 'Edit testimonial';
    if (resetTestimonialButton) resetTestimonialButton.hidden = false;
    setMessage(testimonialMessage, 'Editing a live Firestore record. Changes auto-save after a short pause.');
    testimonialForm.closest('.admin-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const renderTestimonials = () => {
    document.querySelectorAll('[data-overview-testimonials]').forEach((element) => { element.textContent = testimonials.filter((record) => record.published).length; });
    if (!testimonialList) return;
    if (!testimonials.length) {
      testimonialList.innerHTML = '<p class="admin-empty">No testimonials are saved yet. Add only client-approved social proof.</p>';
      return;
    }
    testimonialList.innerHTML = [...testimonials].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.attribution || '').localeCompare(String(b.attribution || ''))).map((record) => `
      <article class="admin-content-row" data-testimonial-row="${escapeHtml(record.id)}"><div class="admin-content-row__copy"><small>${record.featured ? 'Featured quote' : 'Client testimonial'} · ${record.published ? 'Visible publicly' : 'Private draft'}</small><h3>${escapeHtml(record.attribution || 'Unnamed testimonial')}</h3><p>${escapeHtml(record.quote || 'No quote written yet.')}</p><div class="admin-content-row__meta"><span class="${record.published ? '' : 'is-draft'}">${record.published ? 'Published' : 'Draft'}</span>${record.project ? `<span>${escapeHtml(record.project)}</span>` : ''}</div></div><div class="admin-content-row__actions"><button type="button" data-edit-testimonial="${escapeHtml(record.id)}">Edit</button><button class="is-delete" type="button" data-delete-testimonial="${escapeHtml(record.id)}">Delete</button></div></article>
    `).join('');
  };
  const saveTestimonial = async (automatic = false) => {
    if (!testimonialForm || !firebase || !firestore || !currentUser || savingTestimonial) return;
    const payload = testimonialPayload();
    if (!testimonialId.value && !testimonialHasContent(payload)) return;
    const issue = testimonialIssue(payload);
    if (issue) { setMessage(testimonialMessage, issue, true); return; }
    savingTestimonial = true;
    setMessage(testimonialMessage, automatic ? 'Saving testimonial…' : 'Saving now…');
    try {
      if (testimonialId.value) {
        await firestore.updateDoc(firestore.doc(firebase.db, 'testimonials', testimonialId.value), { ...payload, id: testimonialId.value, updatedAt: firestore.serverTimestamp() });
      } else {
        const reference = firestore.doc(firestore.collection(firebase.db, 'testimonials'));
        await firestore.setDoc(reference, { ...payload, id: reference.id, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp() });
        testimonialId.value = reference.id;
        if (testimonialHeading) testimonialHeading.textContent = 'Edit testimonial';
        if (resetTestimonialButton) resetTestimonialButton.hidden = false;
      }
      setMessage(testimonialMessage, 'Saved. This testimonial is synchronised across signed-in browsers.');
    } catch (error) {
      setMessage(testimonialMessage, authErrorMessage(error), true);
    } finally {
      savingTestimonial = false;
      if (resaveTestimonial) {
        resaveTestimonial = false;
        queueTestimonialSave();
      }
    }
  };
  const queueTestimonialSave = debounce(() => {
    if (savingTestimonial) { resaveTestimonial = true; return; }
    saveTestimonial(true);
  });
  const deleteTestimonial = async (id, button) => {
    const record = testimonials.find((item) => item.id === id);
    if (!record || !window.confirm(`Delete the testimonial from “${record.attribution || 'this client'}”? This cannot be undone.`)) return;
    button.disabled = true;
    try {
      await firestore.deleteDoc(firestore.doc(firebase.db, 'testimonials', id));
      if (testimonialId.value === id) resetTestimonial();
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.disabled = false;
    }
  };

  const blankJournal = () => ({ title: '', category: 'branding', date: today(), readTime: '', image: '', imageAlt: '', excerpt: '', body: '', takeaway: '', featured: false, published: false });
  const journalPayload = () => {
    const data = new FormData(journalForm);
    const rawImage = String(data.get('image') || '').trim();
    return {
      payload: {
        title: String(data.get('title') || '').trim().slice(0, 160),
        category: Object.prototype.hasOwnProperty.call(JOURNAL_CATEGORIES, String(data.get('category') || '')) ? String(data.get('category')) : 'branding',
        date: validDate(data.get('date')) ? String(data.get('date')) : '',
        readTime: String(data.get('readTime') || '').trim().slice(0, 40),
        image: safeImageUrl(rawImage),
        imageAlt: String(data.get('imageAlt') || '').trim().slice(0, 180),
        excerpt: String(data.get('excerpt') || '').trim().slice(0, 500),
        body: String(data.get('body') || '').trim().slice(0, 12000),
        takeaway: String(data.get('takeaway') || '').trim().slice(0, 650),
        featured: data.get('featured') === 'on',
        published: data.get('published') === 'on',
      },
      rawImage,
    };
  };
  const journalHasContent = (value) => Boolean(value.title || value.readTime || value.image || value.imageAlt || value.excerpt || value.body || value.takeaway || value.featured || value.published);
  const journalIssue = (value, rawImage) => {
    if (rawImage && !value.image) return 'Use a public HTTPS cover-image link or a valid local assets/… image path.';
    if (!value.published) return '';
    if (!value.title || !value.excerpt || !value.body || !value.image || !value.date) return 'A public journal note needs a title, introduction, body, date, and approved cover image.';
    return '';
  };
  const resetJournal = () => {
    if (!journalForm) return;
    journalForm.reset();
    journalId.value = '';
    journalForm.elements.category.value = 'branding';
    journalForm.elements.date.value = today();
    journalForm.elements.featured.checked = false;
    journalForm.elements.published.checked = false;
    if (journalHeading) journalHeading.textContent = 'Write a journal note';
    if (resetJournalButton) resetJournalButton.hidden = true;
    setMessage(journalMessage, 'Start typing to create a private draft.');
  };
  const fillJournal = (record) => {
    if (!journalForm || !record) return;
    journalId.value = record.id;
    journalForm.elements.title.value = record.title || '';
    journalForm.elements.category.value = JOURNAL_CATEGORIES[record.category] ? record.category : 'branding';
    journalForm.elements.date.value = validDate(record.date) ? record.date : today();
    journalForm.elements.readTime.value = record.readTime || '';
    journalForm.elements.image.value = record.image || '';
    journalForm.elements.imageAlt.value = record.imageAlt || '';
    journalForm.elements.excerpt.value = record.excerpt || '';
    journalForm.elements.body.value = record.body || '';
    journalForm.elements.takeaway.value = record.takeaway || '';
    journalForm.elements.featured.checked = Boolean(record.featured);
    journalForm.elements.published.checked = Boolean(record.published);
    if (journalHeading) journalHeading.textContent = 'Edit journal note';
    if (resetJournalButton) resetJournalButton.hidden = false;
    setMessage(journalMessage, 'Editing a live Firestore record. Changes auto-save after a short pause.');
    journalForm.closest('.admin-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const renderJournal = () => {
    document.querySelectorAll('[data-overview-journal]').forEach((element) => { element.textContent = journalPosts.filter((record) => record.published).length; });
    if (!journalList) return;
    if (!journalPosts.length) {
      journalList.innerHTML = '<p class="admin-empty">No studio notes are saved yet. Write a useful, client-safe insight when it is ready.</p>';
      return;
    }
    journalList.innerHTML = [...journalPosts].sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.date || '').localeCompare(String(a.date || '')) || String(a.title || '').localeCompare(String(b.title || ''))).map((record) => `
      <article class="admin-content-row" data-journal-row="${escapeHtml(record.id)}"><div class="admin-content-row__copy"><small>${escapeHtml(JOURNAL_CATEGORIES[record.category] || 'Studio')} · ${escapeHtml(readableDate(record.date))}</small><h3>${escapeHtml(record.title || 'Untitled journal note')}</h3><p>${escapeHtml(record.excerpt || record.body || 'No article content written yet.')}</p><div class="admin-content-row__meta"><span class="${record.published ? '' : 'is-draft'}">${record.published ? 'Published' : 'Draft'}</span>${record.featured ? '<span>Featured</span>' : ''}</div></div><div class="admin-content-row__actions"><button type="button" data-edit-journal="${escapeHtml(record.id)}">Edit</button><button class="is-delete" type="button" data-delete-journal="${escapeHtml(record.id)}">Delete</button></div></article>
    `).join('');
  };
  const saveJournal = async (automatic = false) => {
    if (!journalForm || !firebase || !firestore || !currentUser || savingJournal) return;
    const { payload, rawImage } = journalPayload();
    if (!journalId.value && !journalHasContent(payload)) return;
    const issue = journalIssue(payload, rawImage);
    if (issue) { setMessage(journalMessage, issue, true); return; }
    savingJournal = true;
    setMessage(journalMessage, automatic ? 'Saving journal note…' : 'Saving now…');
    try {
      if (journalId.value) {
        await firestore.updateDoc(firestore.doc(firebase.db, 'journalPosts', journalId.value), { ...payload, id: journalId.value, updatedAt: firestore.serverTimestamp() });
      } else {
        const reference = firestore.doc(firestore.collection(firebase.db, 'journalPosts'));
        await firestore.setDoc(reference, { ...payload, id: reference.id, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp() });
        journalId.value = reference.id;
        if (journalHeading) journalHeading.textContent = 'Edit journal note';
        if (resetJournalButton) resetJournalButton.hidden = false;
      }
      setMessage(journalMessage, 'Saved. This journal note is synchronised across signed-in browsers.');
    } catch (error) {
      setMessage(journalMessage, authErrorMessage(error), true);
    } finally {
      savingJournal = false;
      if (resaveJournal) {
        resaveJournal = false;
        queueJournalSave();
      }
    }
  };
  const queueJournalSave = debounce(() => {
    if (savingJournal) { resaveJournal = true; return; }
    saveJournal(true);
  });
  const deleteJournal = async (id, button) => {
    const record = journalPosts.find((item) => item.id === id);
    if (!record || !window.confirm(`Delete “${record.title || 'this journal note'}”? This cannot be undone.`)) return;
    button.disabled = true;
    try {
      await firestore.deleteDoc(firestore.doc(firebase.db, 'journalPosts', id));
      if (journalId.value === id) resetJournal();
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.disabled = false;
    }
  };

  const queueEnquirySave = (() => {
    const timers = new Map();
    return (row) => {
      const id = row?.dataset.enquiryId;
      if (!id) return;
      if (timers.has(id)) window.clearTimeout(timers.get(id));
      const button = $('[data-save-enquiry]', row);
      if (button) button.textContent = 'Saving…';
      timers.set(id, window.setTimeout(async () => {
        timers.delete(id);
        if (!firebase || !firestore || !currentUser || savingEnquiryIds.has(id)) return;
        savingEnquiryIds.add(id);
        try {
          await firestore.updateDoc(firestore.doc(firebase.db, 'enquiries', id), {
            status: String($('[data-enquiry-status]', row)?.value || 'new'),
            adminNotes: String($('[data-enquiry-notes]', row)?.value || '').trim().slice(0, 2000),
            updatedAt: firestore.serverTimestamp(),
          });
          if (button) {
            button.textContent = 'Saved';
            window.setTimeout(() => { if (button.isConnected) button.textContent = 'Save workflow'; }, 1300);
          }
        } catch (error) {
          if (button) button.textContent = 'Save workflow';
          window.alert(authErrorMessage(error));
        } finally { savingEnquiryIds.delete(id); }
      }, 850));
    };
  })();

  const subscribeSettings = () => {
    if (!firebase || !firestore || !siteSettingsForm || unsubscribeSettings) return;
    setMessage(siteMessage, 'Loading live homepage content…');
    unsubscribeSettings = firestore.onSnapshot(firestore.doc(firebase.db, 'siteSettings', 'public'), (snapshot) => {
      renderSettings(snapshot.exists() ? snapshot.data() : DEFAULT_SITE_SETTINGS, true);
      if (!snapshot.metadata.hasPendingWrites) setMessage(siteMessage, snapshot.exists() ? 'Autosave is on. Changes sync across browsers.' : 'Using current website copy. Start editing to activate live content.');
    }, (error) => setMessage(siteMessage, authErrorMessage(error), true));
  };
  const subscribeTestimonials = () => {
    if (!firebase || !firestore || !testimonialList || unsubscribeTestimonials) return;
    testimonialList.innerHTML = '<p class="admin-empty">Loading testimonials…</p>';
    unsubscribeTestimonials = firestore.onSnapshot(firestore.collection(firebase.db, 'testimonials'), (snapshot) => {
      testimonials = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      renderTestimonials();
    }, (error) => { testimonialList.innerHTML = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`; });
  };
  const subscribeJournal = () => {
    if (!firebase || !firestore || !journalList || unsubscribeJournal) return;
    journalList.innerHTML = '<p class="admin-empty">Loading journal notes…</p>';
    unsubscribeJournal = firestore.onSnapshot(firestore.collection(firebase.db, 'journalPosts'), (snapshot) => {
      journalPosts = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      renderJournal();
    }, (error) => { journalList.innerHTML = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`; });
  };
  const stopLiveContent = () => {
    [unsubscribeSettings, unsubscribeTestimonials, unsubscribeJournal].forEach((stop) => { if (stop) stop(); });
    unsubscribeSettings = null;
    unsubscribeTestimonials = null;
    unsubscribeJournal = null;
    testimonials = [];
    journalPosts = [];
  };

  const bindEvents = () => {
    siteSettingsForm?.addEventListener('submit', (event) => { event.preventDefault(); saveSettings(false); });
    siteSettingsForm?.addEventListener('input', queueSettingsSave);
    siteSettingsForm?.addEventListener('change', queueSettingsSave);

    projectForm?.addEventListener('input', queueProjectSave);
    projectForm?.addEventListener('change', queueProjectSave);

    testimonialForm?.addEventListener('submit', (event) => { event.preventDefault(); saveTestimonial(false); });
    testimonialForm?.addEventListener('input', queueTestimonialSave);
    testimonialForm?.addEventListener('change', queueTestimonialSave);
    resetTestimonialButton?.addEventListener('click', resetTestimonial);
    testimonialList?.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-testimonial]');
      const remove = event.target.closest('[data-delete-testimonial]');
      if (edit) fillTestimonial(testimonials.find((item) => item.id === edit.dataset.editTestimonial));
      if (remove) deleteTestimonial(remove.dataset.deleteTestimonial, remove);
    });

    journalForm?.addEventListener('submit', (event) => { event.preventDefault(); saveJournal(false); });
    journalForm?.addEventListener('input', queueJournalSave);
    journalForm?.addEventListener('change', queueJournalSave);
    resetJournalButton?.addEventListener('click', resetJournal);
    journalList?.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-journal]');
      const remove = event.target.closest('[data-delete-journal]');
      if (edit) fillJournal(journalPosts.find((item) => item.id === edit.dataset.editJournal));
      if (remove) deleteJournal(remove.dataset.deleteJournal, remove);
    });

    enquiryList?.addEventListener('input', (event) => {
      if (event.target.matches('[data-enquiry-notes]')) queueEnquirySave(event.target.closest('[data-enquiry-id]'));
    });
    enquiryList?.addEventListener('change', (event) => {
      if (event.target.matches('[data-enquiry-status]')) queueEnquirySave(event.target.closest('[data-enquiry-id]'));
    });
  };

  (async () => {
    try {
      const [config, authModule, firestoreModule] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-auth.js'),
        import('./firebase-firestore.js'),
      ]);
      firebase = config;
      authSdk = authModule;
      firestore = firestoreModule;
      bindEvents();
      if (testimonialForm) resetTestimonial();
      if (journalForm) resetJournal();
      authSdk.onAuthStateChanged(firebase.auth, (user) => {
        if (!firebase.isApprovedAdmin(user)) {
          currentUser = null;
          stopLiveContent();
          return;
        }
        currentUser = user;
        subscribeSettings();
        subscribeTestimonials();
        subscribeJournal();
      });
    } catch {
      // admin.js already gives the administrator a clear Firebase load error.
    }
  })();
})();
