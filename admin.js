(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  const safeExternalUrl = (value = '') => {
    try {
      const url = new URL(String(value).trim());
      return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
    } catch { return ''; }
  };
  const isLocalAssetImage = (value = '') => /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(String(value));
  const safeProjectImageUrl = (value = '') => {
    const raw = String(value).trim();
    if (isLocalAssetImage(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
    } catch { return ''; }
  };
  const categoryLabel = (category) => ({ identity: 'Brand identity', campaign: 'Campaign', digital: 'Digital content', print: 'Print' }[category] || category);
  const dateLabel = (value) => {
    if (!value) return 'Undated project';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const authView = $('[data-auth-view]');
  const loginCard = $('[data-login-card]');
  const setupCard = $('[data-setup-card]');
  const verifyCard = $('[data-verify-card]');
  const dashboard = $('[data-dashboard]');
  const logoutButton = $('[data-logout]');
  const loginForm = $('[data-login-form]');
  const setupForm = $('[data-setup-form]');
  const projectForm = $('[data-project-form]');
  const projectList = $('[data-project-list]');
  const projectId = $('[data-project-id]');
  const projectImage = $('[data-project-image]');
  const projectStoragePath = $('[data-project-storage-path]');
  const imageLinkPreview = $('[data-image-link-preview]');
  const imageLinkPreviewImage = $('[data-image-link-preview-image]');
  const imageLinkPreviewAnchor = $('[data-image-link-preview-anchor]');
  const imageLinkStatus = $('[data-image-link-status]');
  const formHeading = $('[data-form-heading]');
  const cancelEdit = $('[data-cancel-edit]');
  const saveProject = $('[data-save-project]');
  const legacyStarterPanel = $('[data-legacy-starter-panel]');
  const legacyStarterButton = $('[data-remove-starter-projects]');
  const enquiryList = $('[data-enquiry-list]');
  const subscriberList = $('[data-subscriber-list]');
  const newsletterRequestList = $('[data-newsletter-request-list]');
  const newsletterCampaignForm = $('[data-newsletter-campaign-form]');
  const siteSettingsForm = $('[data-site-settings-form]');
  const dashboardViews = [...document.querySelectorAll('[data-dashboard-view]')];
  const dashboardNavigation = [...document.querySelectorAll('[data-dashboard-nav]')];
  const dashboardJumpButtons = [...document.querySelectorAll('[data-dashboard-jump]')];

  let firebase = null;
  let authSdk = null;
  let firestore = null;
  let currentUser = null;
  let projects = [];
  let enquiries = [];
  let subscribers = [];
  let newsletterRequests = [];
  let unsubscribeProjects = null;
  let unsubscribeEnquiries = null;
  let unsubscribeSubscribers = null;
  let activeDashboardView = 'overview';
  let siteSettings = null;

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
  });

  // Placeholder case studies are never imported again. This allowlist exists only to give
  // the verified administrator a deliberate cleanup option for a prior Firestore import.
  const LEGACY_STARTER_PROJECT_IDS = new Set([
    'orbit-co', 'wealthwise', 'common-ground', 'northstar', 'gather-together',
  ]);
  const portfolioProjects = () => projects.filter((project) => !LEGACY_STARTER_PROJECT_IDS.has(project.id));

  const setMessage = (element, message = '', isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('is-error', Boolean(isError));
  };

  const showMode = (mode) => {
    const dashboardMode = mode === 'dashboard';
    authView.hidden = dashboardMode;
    loginCard.hidden = mode !== 'login';
    setupCard.hidden = mode !== 'setup';
    verifyCard.hidden = mode !== 'verify';
    dashboard.hidden = !dashboardMode;
    logoutButton.hidden = !dashboardMode;
  };

  const authErrorMessage = (error) => {
    const code = error?.code || '';
    if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Incorrect password. Please try again.';
    if (code.includes('too-many-requests')) return 'Too many attempts. Wait a moment, then try again.';
    if (code.includes('email-already-in-use')) return 'This administrator account already exists. Please sign in instead.';
    if (code.includes('weak-password')) return 'Use a password with at least 10 characters.';
    if (code.includes('operation-not-allowed')) return 'Enable Email/Password in Firebase Authentication before using the dashboard.';
    if (code.includes('permission-denied') || code.includes('unauthorized')) return 'Firebase denied this action. Verify the approved email and deploy the Firebase security rules.';
    if (code.includes('network-request-failed')) return 'A network connection is required to reach Firebase.';
    return error?.message || 'Something went wrong. Please try again.';
  };

  const timestampLabel = (value) => {
    const date = value?.toDate?.() || (value ? new Date(value) : null);
    if (!date || Number.isNaN(date.getTime())) return 'Just received';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const enquiryStatusLabel = (status) => ({ new: 'New', contacted: 'Contacted', proposal: 'Proposal', won: 'Won', closed: 'Closed' }[status] || 'New');
  const setCount = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  const renderDashboardOverview = () => {
    const visibleProjects = portfolioProjects();
    setCount('[data-overview-published]', visibleProjects.filter((project) => project.published).length);
    setCount('[data-overview-enquiries]', enquiries.filter((enquiry) => enquiry.status === 'new').length);
    setCount('[data-overview-subscribers]', subscribers.length);
    setCount('[data-overview-newsletter-requests]', newsletterRequests.length);

    const enquiryRoot = $('[data-dashboard-recent-enquiries]');
    if (enquiryRoot) {
      const recent = [...enquiries].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
      enquiryRoot.innerHTML = recent.length
        ? recent.map((enquiry) => `<article class="admin-overview-item"><div><small>${escapeHtml(timestampLabel(enquiry.createdAt))}</small><strong>${escapeHtml(enquiry.name || 'Unnamed enquiry')}</strong><span>${escapeHtml(enquiry.service || enquiry.business || 'General project brief')}</span></div><b class="status-${escapeHtml(enquiry.status || 'new')}">${escapeHtml(enquiryStatusLabel(enquiry.status))}</b></article>`).join('')
        : '<p class="admin-empty">No project briefs have arrived yet.</p>';
    }

    const projectRoot = $('[data-dashboard-recent-projects]');
    if (projectRoot) {
      const recent = [...visibleProjects].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 3);
      projectRoot.innerHTML = recent.length
        ? recent.map((project) => `<article class="admin-overview-item"><div><small>${escapeHtml(categoryLabel(project.category))} · ${escapeHtml(dateLabel(project.date))}</small><strong>${escapeHtml(project.title || 'Untitled project')}</strong><span>${project.published ? 'Published to the portfolio' : 'Saved as a private draft'}</span></div><b class="${project.published ? 'is-live' : 'is-draft'}">${project.published ? 'Live' : 'Draft'}</b></article>`).join('')
        : '<p class="admin-empty">Add a first project to begin building the public portfolio.</p>';
    }
  };

  const updateStats = () => {
    const visibleProjects = portfolioProjects();
    setCount('[data-project-count]', visibleProjects.length);
    setCount('[data-published-count]', visibleProjects.filter((project) => project.published).length);
    setCount('[data-enquiry-count]', enquiries.filter((enquiry) => enquiry.status === 'new').length);
    setCount('[data-subscriber-count]', subscribers.length);
    renderDashboardOverview();
  };

  const setDashboardView = (requestedView, shouldFocus = false) => {
    const next = dashboardViews.find((view) => view.dataset.dashboardView === requestedView);
    if (!next) return;
    activeDashboardView = requestedView;
    dashboardViews.forEach((view) => { view.hidden = view !== next; });
    dashboardNavigation.forEach((button) => {
      const active = button.dataset.dashboardNav === requestedView;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (shouldFocus) {
      const heading = next.querySelector('h2, h3');
      heading?.focus?.({ preventScroll: true });
      next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const safeContentHref = (value = '') => {
    const raw = String(value).trim();
    if (/^(?:[a-z0-9_-]+\.html(?:\?[^\s]*)?|\/[a-z0-9_/?#=&.-]*)$/i.test(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' ? url.toString() : '';
    } catch { return ''; }
  };

  const normaliseSiteSettings = (source = {}) => Object.fromEntries(
    Object.entries(DEFAULT_SITE_SETTINGS).map(([key, fallback]) => [key, String(source[key] ?? fallback).trim().slice(0, key === 'heroIntro' ? 380 : (key === 'aboutCopy' ? 650 : (key === 'heroCtaHref' ? 500 : (key === 'contactEmail' ? 254 : (key === 'contactPhone' ? 40 : 80)))))]),
  );

  const renderSiteSettings = (source = DEFAULT_SITE_SETTINGS) => {
    if (!siteSettingsForm) return;
    const values = normaliseSiteSettings(source);
    Object.entries(values).forEach(([key, value]) => {
      const field = siteSettingsForm.elements[key];
      if (field) field.value = value;
    });
  };

  const loadSiteSettings = async () => {
    if (!siteSettingsForm || !firebase || !firestore) return;
    const message = $('[data-site-settings-message]');
    setMessage(message, 'Loading homepage content…');
    try {
      const reference = firestore.doc(firebase.db, 'siteSettings', 'public');
      const snapshot = await firestore.getDoc(reference);
      siteSettings = normaliseSiteSettings(snapshot.exists() ? snapshot.data() : DEFAULT_SITE_SETTINGS);
      renderSiteSettings(siteSettings);
      setMessage(message, snapshot.exists() ? 'Homepage content is ready to edit.' : 'Using the current website copy as your starting point. Save to activate live editing.');
    } catch (error) {
      renderSiteSettings(DEFAULT_SITE_SETTINGS);
      setMessage(message, authErrorMessage(error), true);
    }
  };

  const siteSettingsPayload = () => {
    const data = new FormData(siteSettingsForm);
    return normaliseSiteSettings({
      heroLineOne: data.get('heroLineOne'),
      heroHighlightOne: data.get('heroHighlightOne'),
      heroLineTwo: data.get('heroLineTwo'),
      heroHighlightTwo: data.get('heroHighlightTwo'),
      heroIntro: data.get('heroIntro'),
      heroCtaLabel: data.get('heroCtaLabel'),
      heroCtaHref: safeContentHref(data.get('heroCtaHref')),
      aboutCopy: data.get('aboutCopy'),
      footerKicker: data.get('footerKicker'),
      footerLineOne: data.get('footerLineOne'),
      footerLineTwo: data.get('footerLineTwo'),
      footerHighlight: data.get('footerHighlight'),
      contactEmail: data.get('contactEmail'),
      contactPhone: data.get('contactPhone'),
    });
  };

  const saveSiteSettings = async () => {
    if (!siteSettingsForm || !firebase || !firestore) return;
    if (!siteSettingsForm.checkValidity()) {
      siteSettingsForm.reportValidity();
      return;
    }
    const message = $('[data-site-settings-message]');
    const button = $('[data-save-site-settings]');
    const payload = siteSettingsPayload();
    if (!payload.heroCtaHref) {
      setMessage(message, 'Use a local .html page or a public HTTPS URL for the primary call-to-action link.', true);
      return;
    }
    if (!isEmail(payload.contactEmail)) {
      setMessage(message, 'Enter a valid public contact email address.', true);
      return;
    }
    if (!/^[0-9+() .-]{7,40}$/.test(payload.contactPhone)) {
      setMessage(message, 'Enter a valid public phone number.', true);
      return;
    }
    button.disabled = true;
    setMessage(message, 'Publishing homepage content…');
    try {
      await firestore.setDoc(firestore.doc(firebase.db, 'siteSettings', 'public'), { ...payload, updatedAt: firestore.serverTimestamp() });
      siteSettings = payload;
      setMessage(message, 'Homepage content saved. Refresh the public homepage to review the live update.');
    } catch (error) {
      setMessage(message, authErrorMessage(error), true);
    } finally {
      button.disabled = false;
    }
  };

  const renderProjects = () => {
    updateStats();
    const legacyStarterCount = projects.filter((project) => LEGACY_STARTER_PROJECT_IDS.has(project.id)).length;
    const visibleProjects = portfolioProjects();
    if (legacyStarterPanel) legacyStarterPanel.hidden = legacyStarterCount === 0;
    if (!visibleProjects.length) {
      projectList.innerHTML = '<p class="admin-empty">No portfolio projects are saved yet. Add a completed, client-approved project when you are ready.</p>';
      return;
    }
    projectList.innerHTML = [...visibleProjects]
      .sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.date || '').localeCompare(String(a.date || '')))
      .map((project) => `
        <article class="admin-project-row" data-row-id="${escapeHtml(project.id)}">
          <div class="admin-project-row__image"><img src="${escapeHtml(safeProjectImageUrl(project.image) || 'assets/about.jpg')}" alt="${escapeHtml(project.imageAlt || project.title)}" /></div>
          <div class="admin-project-row__info">
            <small>${escapeHtml(categoryLabel(project.category))} · ${escapeHtml(dateLabel(project.date))}</small>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description || project.client || 'No description added yet.')}</p>
            <div class="admin-project-row__state"><span class="${project.published ? '' : 'is-draft'}">${project.published ? 'Published' : 'Draft'}</span>${project.featured ? '<span>Featured</span>' : ''}</div>
          </div>
          <div class="admin-project-row__actions"><button type="button" data-edit-project="${escapeHtml(project.id)}">Edit</button><button type="button" class="is-delete" data-delete-project="${escapeHtml(project.id)}">Delete</button></div>
        </article>
      `).join('');
  };

  const subscribeToProjects = () => {
    if (!firebase || !firestore || unsubscribeProjects) return;
    projectList.innerHTML = '<p class="admin-empty">Loading Firebase projects…</p>';
    unsubscribeProjects = firestore.onSnapshot(
      firestore.collection(firebase.db, 'projects'),
      (snapshot) => {
        projects = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
        renderProjects();
      },
      (error) => {
        projectList.innerHTML = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`;
      },
    );
  };

  const stopProjectSubscription = () => {
    if (unsubscribeProjects) unsubscribeProjects();
    unsubscribeProjects = null;
    projects = [];
  };

  const renderEnquiries = () => {
    updateStats();
    if (!enquiryList) return;
    if (!enquiries.length) {
      enquiryList.innerHTML = '<p class="admin-empty">No website project briefs have arrived yet.</p>';
      return;
    }
    enquiryList.innerHTML = [...enquiries]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((enquiry) => {
        const email = isEmail(enquiry.email) ? String(enquiry.email).trim() : '';
        const website = safeExternalUrl(enquiry.website);
        return `
          <article class="admin-enquiry-row" data-enquiry-id="${escapeHtml(enquiry.id)}">
            <div class="admin-enquiry-row__head"><div><small>${escapeHtml(timestampLabel(enquiry.createdAt))}</small><h3>${escapeHtml(enquiry.name || 'Unnamed enquiry')}</h3>${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : '<span>No valid email supplied</span>'}</div><span class="admin-enquiry-status status-${escapeHtml(enquiry.status || 'new')}">${escapeHtml(enquiryStatusLabel(enquiry.status))}</span></div>
            <dl class="admin-enquiry-details">
              ${enquiry.business ? `<div><dt>Business</dt><dd>${escapeHtml(enquiry.business)}</dd></div>` : ''}
              ${enquiry.businessType ? `<div><dt>Type</dt><dd>${escapeHtml(enquiry.businessType)}</dd></div>` : ''}
              ${enquiry.service ? `<div><dt>Service</dt><dd>${escapeHtml(enquiry.service)}</dd></div>` : ''}
              ${enquiry.timeline ? `<div><dt>Timeline</dt><dd>${escapeHtml(enquiry.timeline)}</dd></div>` : ''}
              ${enquiry.budget ? `<div><dt>Budget</dt><dd>${escapeHtml(enquiry.budget)}</dd></div>` : ''}
              ${website ? `<div><dt>Reference</dt><dd><a href="${escapeHtml(website)}" target="_blank" rel="noopener">Open link ↗</a></dd></div>` : ''}
            </dl>
            <p class="admin-enquiry-message">${escapeHtml(enquiry.message || 'No project detail supplied.')}</p>
            <div class="admin-enquiry-controls"><label>Stage <select data-enquiry-status><option value="new" ${enquiry.status === 'new' ? 'selected' : ''}>New</option><option value="contacted" ${enquiry.status === 'contacted' ? 'selected' : ''}>Contacted</option><option value="proposal" ${enquiry.status === 'proposal' ? 'selected' : ''}>Proposal</option><option value="won" ${enquiry.status === 'won' ? 'selected' : ''}>Won</option><option value="closed" ${enquiry.status === 'closed' ? 'selected' : ''}>Closed</option></select></label><label>Internal notes <textarea data-enquiry-notes maxlength="2000" placeholder="Private follow-up notes only">${escapeHtml(enquiry.adminNotes || '')}</textarea></label><button class="admin-text-button" type="button" data-save-enquiry>Save workflow</button></div>
          </article>
        `;
      }).join('');
  };

  const renderNewsletterRequests = () => {
    if (!newsletterRequestList) return;
    if (!newsletterRequests.length) {
      newsletterRequestList.innerHTML = '<p class="admin-empty">No creative-notes requests have arrived yet.</p>';
      return;
    }
    newsletterRequestList.innerHTML = [...newsletterRequests]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((request) => {
        const email = isEmail(request.email) ? String(request.email).trim() : '';
        return `<article class="admin-subscriber-row">${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : '<span>Invalid email record</span>'}<small>Requested ${escapeHtml(timestampLabel(request.createdAt))} · awaiting a direct follow-up</small></article>`;
      })
      .join('');
  };

  const renderSubscribers = () => {
    updateStats();
    if (!subscriberList) return;
    if (!subscribers.length) {
      subscriberList.innerHTML = '<p class="admin-empty">No consent-verified newsletter contacts are available.</p>';
      return;
    }
    subscriberList.innerHTML = [...subscribers]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .map((subscriber) => {
        const email = isEmail(subscriber.email) ? String(subscriber.email).trim() : '';
        return `<article class="admin-subscriber-row">${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : '<span>Invalid subscriber record</span>'}<small>Joined ${escapeHtml(timestampLabel(subscriber.createdAt))}</small></article>`;
      })
      .join('');
  };

  const subscribeToEnquiries = () => {
    if (!firebase || !firestore || unsubscribeEnquiries || !enquiryList) return;
    enquiryList.innerHTML = '<p class="admin-empty">Loading private project briefs…</p>';
    unsubscribeEnquiries = firestore.onSnapshot(firestore.collection(firebase.db, 'enquiries'), (snapshot) => {
      enquiries = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      renderEnquiries();
    }, (error) => { enquiryList.innerHTML = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`; });
  };

  const subscribeToSubscribers = () => {
    if (!firebase || !firestore || unsubscribeSubscribers || (!subscriberList && !newsletterRequestList)) return;
    if (subscriberList) subscriberList.innerHTML = '<p class="admin-empty">Loading consent-verified contacts…</p>';
    if (newsletterRequestList) newsletterRequestList.innerHTML = '<p class="admin-empty">Loading creative-notes requests…</p>';
    unsubscribeSubscribers = firestore.onSnapshot(firestore.collection(firebase.db, 'subscribers'), (snapshot) => {
      const records = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
      subscribers = records.filter((subscriber) => subscriber.status === 'subscribed');
      newsletterRequests = records.filter((subscriber) => subscriber.status === 'pending');
      renderNewsletterRequests();
      renderSubscribers();
    }, (error) => {
      const message = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`;
      if (subscriberList) subscriberList.innerHTML = message;
      if (newsletterRequestList) newsletterRequestList.innerHTML = message;
    });
  };

  const stopLeadSubscriptions = () => {
    if (unsubscribeEnquiries) unsubscribeEnquiries();
    if (unsubscribeSubscribers) unsubscribeSubscribers();
    unsubscribeEnquiries = null;
    unsubscribeSubscribers = null;
    enquiries = [];
    subscribers = [];
    newsletterRequests = [];
    updateStats();
  };

  const saveEnquiryWorkflow = async (row, button) => {
    const id = row?.dataset.enquiryId;
    if (!id || !firestore || !firebase) return;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Saving…';
    try {
      await firestore.updateDoc(firestore.doc(firebase.db, 'enquiries', id), {
        status: row.querySelector('[data-enquiry-status]').value,
        adminNotes: String(row.querySelector('[data-enquiry-notes]').value || '').trim().slice(0, 2000),
        updatedAt: firestore.serverTimestamp(),
      });
      button.textContent = 'Saved';
      window.setTimeout(() => { button.textContent = original; }, 1300);
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.textContent = original;
    } finally {
      button.disabled = false;
    }
  };

  const sendNewsletterCampaign = async () => {
    if (!newsletterCampaignForm || !currentUser) return;
    const data = new FormData(newsletterCampaignForm);
    const existingCampaignId = String(data.get('campaignId') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const html = String(data.get('html') || '').trim();
    const message = $('[data-newsletter-campaign-message]');
    const button = $('[data-send-newsletter]', newsletterCampaignForm);
    if (!data.get('confirm')) {
      setMessage(message, 'Confirm that this is a consent-based campaign before sending.', true);
      return;
    }
    if (!existingCampaignId && (!subject || !html)) {
      setMessage(message, 'Add a subject and email content before starting a new campaign.', true);
      return;
    }
    const confirmation = existingCampaignId
      ? 'Continue this saved newsletter campaign? It will send the next unsent batch only.'
      : 'Send this newsletter to every currently subscribed contact? This cannot be recalled.';
    if (!window.confirm(confirmation)) return;

    button.disabled = true;
    let campaignId = existingCampaignId;
    let sent = 0;
    let hasMore = true;
    let batch = 0;
    try {
      while (hasMore && batch < 50) {
        batch += 1;
        setMessage(message, `Sending newsletter batch ${batch}…`);
        const token = await currentUser.getIdToken();
        const payload = campaignId
          ? { campaignId }
          : { subject, previewText: String(data.get('previewText') || '').trim(), html };
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Newsletter delivery failed.');
        campaignId = result.campaignId || campaignId;
        sent += Number(result.sentCount || 0);
        hasMore = Boolean(result.hasMore);
      }
      if (hasMore) {
        newsletterCampaignForm.elements.campaignId.value = campaignId;
        setMessage(message, `Sent ${sent} email${sent === 1 ? '' : 's'} so far. Continue campaign ${campaignId} to deliver the next batch.`, true);
      } else {
        newsletterCampaignForm.reset();
        setMessage(message, sent ? `Campaign complete: ${sent} email${sent === 1 ? '' : 's'} sent to currently subscribed contacts.` : 'No currently subscribed contacts were available for this campaign.');
      }
    } catch (error) {
      if (campaignId) newsletterCampaignForm.elements.campaignId.value = campaignId;
      setMessage(message, `${error?.message || 'Newsletter delivery failed.'}${campaignId ? ` Resume with campaign ID ${campaignId}; do not start a second campaign.` : ''}`, true);
    } finally {
      button.disabled = false;
    }
  };

  const setImagePreview = (value = '', alt = '') => {
    const url = safeProjectImageUrl(value);
    if (!url) {
      imageLinkPreview.hidden = true;
      delete imageLinkPreviewImage.dataset.previewUrl;
      imageLinkPreviewImage.onload = null;
      imageLinkPreviewImage.onerror = null;
      imageLinkPreviewImage.removeAttribute('src');
      imageLinkPreviewAnchor.removeAttribute('href');
      if (String(value).trim()) setMessage(imageLinkStatus, 'Use a public HTTPS image link or a valid local assets/… image path.', true);
      else setMessage(imageLinkStatus);
      return false;
    }
    imageLinkPreview.hidden = false;
    imageLinkPreviewImage.dataset.previewUrl = url;
    imageLinkPreviewImage.alt = alt || 'Selected project image preview';
    imageLinkPreviewImage.onload = () => {
      if (imageLinkPreviewImage.dataset.previewUrl === url) setMessage(imageLinkStatus, 'Image link loaded and is ready to publish.');
    };
    imageLinkPreviewImage.onerror = () => {
      if (imageLinkPreviewImage.dataset.previewUrl === url) setMessage(imageLinkStatus, 'We could not load this image. Verify that the public link is direct and accessible.', true);
    };
    imageLinkPreviewImage.src = url;
    imageLinkPreviewAnchor.href = url;
    imageLinkPreviewAnchor.textContent = 'Open image link ↗';
    setMessage(imageLinkStatus, 'Checking image link…');
    return true;
  };

  const resetForm = () => {
    projectForm.reset();
    projectId.value = '';
    projectStoragePath.value = '';
    projectForm.elements.published.checked = false;
    projectForm.elements.featured.checked = false;
    setImagePreview();
    formHeading.textContent = 'Add a project';
    saveProject.innerHTML = 'Save project <span>↗</span>';
    cancelEdit.hidden = true;
    setMessage($('[data-project-message]'));
  };

  const beginEdit = (id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    projectId.value = project.id;
    projectStoragePath.value = '';
    projectForm.elements.title.value = project.title || '';
    projectForm.elements.client.value = project.client || '';
    projectForm.elements.category.value = project.category || 'identity';
    projectForm.elements.date.value = project.date || '';
    projectForm.elements.image.value = project.image || '';
    projectForm.elements.description.value = project.description || '';
    projectForm.elements.challenge.value = project.challenge || '';
    projectForm.elements.approach.value = project.approach || '';
    projectForm.elements.deliverables.value = Array.isArray(project.deliverables) ? project.deliverables.join('\n') : (project.deliverables || '');
    projectForm.elements.outcome.value = project.outcome || '';
    projectForm.elements.testimonial.value = project.testimonial || '';
    projectForm.elements.testimonialAttribution.value = project.testimonialAttribution || '';
    projectForm.elements.imageAlt.value = project.imageAlt || '';
    projectForm.elements.featured.checked = Boolean(project.featured);
    projectForm.elements.published.checked = Boolean(project.published);
    setImagePreview(project.image || '', project.imageAlt || project.title);
    formHeading.textContent = 'Edit project';
    saveProject.innerHTML = 'Save changes <span>↗</span>';
    cancelEdit.hidden = false;
    projectForm.closest('.admin-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const projectPayload = () => {
    const data = new FormData(projectForm);
    return {
      title: String(data.get('title') || '').trim(),
      client: String(data.get('client') || '').trim(),
      category: String(data.get('category') || '').trim(),
      date: String(data.get('date') || '').trim(),
      description: String(data.get('description') || '').trim(),
      challenge: String(data.get('challenge') || '').trim(),
      approach: String(data.get('approach') || '').trim(),
      deliverables: String(data.get('deliverables') || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 12),
      outcome: String(data.get('outcome') || '').trim(),
      testimonial: String(data.get('testimonial') || '').trim(),
      testimonialAttribution: String(data.get('testimonialAttribution') || '').trim(),
      imageAlt: String(data.get('imageAlt') || '').trim(),
      image: safeProjectImageUrl(data.get('image')),
      // Retained as an empty legacy field so existing project documents remain compatible
      // with the deployed Firestore schema while new work uses image links exclusively.
      storagePath: '',
      featured: data.get('featured') === 'on',
      published: data.get('published') === 'on',
    };
  };

  const saveCurrentProject = async () => {
    if (!projectForm.checkValidity()) {
      projectForm.reportValidity();
      return;
    }
    const message = $('[data-project-message]');
    const payload = projectPayload();
    if (payload.published && !payload.image) {
      setMessage(message, 'Publishing requires a public HTTPS image link or a valid local assets/… image path. You can still save an unfinished draft automatically.', true);
      return;
    }
    const existingId = projectId.value;
    saveProject.disabled = true;
    setMessage(message, existingId ? 'Saving changes to Firestore…' : 'Saving project to Firestore…');
    try {
      if (existingId) {
        const reference = firestore.doc(firebase.db, 'projects', existingId);
        await firestore.updateDoc(reference, { ...payload, id: existingId, updatedAt: firestore.serverTimestamp() });
      } else {
        const reference = firestore.doc(firestore.collection(firebase.db, 'projects'));
        await firestore.setDoc(reference, { ...payload, id: reference.id, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp() });
      }
      resetForm();
      setMessage(message, existingId ? 'Project updated successfully.' : 'Project saved successfully.');
    } catch (error) {
      setMessage(message, authErrorMessage(error), true);
    } finally {
      saveProject.disabled = false;
    }
  };

  const deleteCurrentProject = async (id, button) => {
    const project = projects.find((item) => item.id === id);
    if (!project || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    button.disabled = true;
    try {
      await firestore.deleteDoc(firestore.doc(firebase.db, 'projects', id));
      if (projectId.value === id) resetForm();
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.disabled = false;
    }
  };

  const removeLegacyStarterProjects = async () => {
    if (!firebase || !firestore || !currentUser) return;
    const legacyProjects = projects.filter((project) => LEGACY_STARTER_PROJECT_IDS.has(project.id));
    if (!legacyProjects.length) return;
    const count = legacyProjects.length;
    if (!window.confirm(`Permanently delete ${count} legacy starter project${count === 1 ? '' : 's'} from Firestore? This cannot be undone.`)) return;
    const message = $('[data-legacy-starter-message]');
    legacyStarterButton.disabled = true;
    setMessage(message, 'Removing legacy starter records…');
    try {
      const batch = firestore.writeBatch(firebase.db);
      legacyProjects.forEach((project) => batch.delete(firestore.doc(firebase.db, 'projects', project.id)));
      await batch.commit();
      setMessage(message, 'Legacy starter records removed from Firestore.');
    } catch (error) {
      setMessage(message, authErrorMessage(error), true);
      legacyStarterButton.disabled = false;
    }
  };

  const handleAuthenticatedUser = async (user) => {
    currentUser = user;
    if (!user) {
      stopProjectSubscription();
      stopLeadSubscriptions();
      siteSettings = null;
      showMode('login');
      return;
    }
    const approvedEmail = user.email && user.email.toLowerCase() === firebase.ADMIN_EMAIL;
    if (!approvedEmail) {
      await authSdk.signOut(firebase.auth);
      showMode('login');
      setMessage($('[data-login-message]'), 'This account is not approved for the Ambassador Cre8tive dashboard.', true);
      return;
    }
    if (!firebase.isApprovedAdmin(user)) {
      stopProjectSubscription();
      stopLeadSubscriptions();
      showMode('verify');
      return;
    }
    showMode('dashboard');
    setDashboardView(activeDashboardView);
    subscribeToProjects();
    subscribeToEnquiries();
    subscribeToSubscribers();
    // Live site settings and autosave are handled by admin-content.js after verified sign-in.
  };

  const bindEvents = () => {
    dashboardNavigation.forEach((button) => button.addEventListener('click', () => setDashboardView(button.dataset.dashboardNav, true)));
    dashboardJumpButtons.forEach((button) => button.addEventListener('click', () => setDashboardView(button.dataset.dashboardJump, true)));
    $('[data-show-setup]')?.addEventListener('click', () => { showMode('setup'); setMessage($('[data-setup-message]')); });
    $('[data-show-login]')?.addEventListener('click', () => { showMode('login'); setMessage($('[data-login-message]')); });

    loginForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = $('[data-login-message]');
      const submit = $('button[type="submit"]', loginForm);
      submit.disabled = true;
      setMessage(message, 'Signing in securely…');
      try {
        await authSdk.signInWithEmailAndPassword(firebase.auth, firebase.ADMIN_EMAIL, new FormData(loginForm).get('password'));
        loginForm.reset();
      } catch (error) {
        setMessage(message, authErrorMessage(error), true);
      } finally {
        submit.disabled = false;
      }
    });

    setupForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = $('[data-setup-message]');
      const submit = $('button[type="submit"]', setupForm);
      const values = new FormData(setupForm);
      const password = String(values.get('password') || '');
      const confirmation = String(values.get('confirmation') || '');
      if (password.length < 10) { setMessage(message, 'Use a password with at least 10 characters.', true); return; }
      if (password !== confirmation) { setMessage(message, 'Passwords do not match.', true); return; }
      submit.disabled = true;
      setMessage(message, 'Creating your Firebase administrator account…');
      try {
        const credential = await authSdk.createUserWithEmailAndPassword(firebase.auth, firebase.ADMIN_EMAIL, password);
        await authSdk.sendEmailVerification(credential.user);
        setupForm.reset();
        showMode('verify');
        setMessage($('[data-verify-message]'), 'Verification email sent. Open it, then return here.');
      } catch (error) {
        setMessage(message, authErrorMessage(error), true);
      } finally {
        submit.disabled = false;
      }
    });

    $('[data-forgot-password]')?.addEventListener('click', async () => {
      const message = $('[data-login-message]');
      setMessage(message, 'Sending password-reset email…');
      try {
        await authSdk.sendPasswordResetEmail(firebase.auth, firebase.ADMIN_EMAIL);
        setMessage(message, 'Password-reset email sent to the approved administrator address.');
      } catch (error) {
        setMessage(message, authErrorMessage(error), true);
      }
    });

    $('[data-resend-verification]')?.addEventListener('click', async () => {
      const message = $('[data-verify-message]');
      if (!firebase.auth.currentUser) return;
      setMessage(message, 'Sending a fresh verification email…');
      try {
        await authSdk.sendEmailVerification(firebase.auth.currentUser);
        setMessage(message, 'Verification email sent.');
      } catch (error) {
        setMessage(message, authErrorMessage(error), true);
      }
    });

    $('[data-check-verification]')?.addEventListener('click', async () => {
      const message = $('[data-verify-message]');
      const user = firebase.auth.currentUser;
      if (!user) return;
      setMessage(message, 'Checking verification status…');
      try {
        await user.reload();
        await user.getIdToken(true);
        await handleAuthenticatedUser(firebase.auth.currentUser);
        if (!firebase.auth.currentUser.emailVerified) setMessage(message, 'This address is not verified yet. Open the Firebase email, then try again.', true);
      } catch (error) {
        setMessage(message, authErrorMessage(error), true);
      }
    });

    const signOut = async () => {
      try { await authSdk.signOut(firebase.auth); }
      catch (error) { setMessage($('[data-login-message]'), authErrorMessage(error), true); }
    };
    logoutButton?.addEventListener('click', signOut);
    $('[data-verify-sign-out]')?.addEventListener('click', signOut);

    projectImage?.addEventListener('input', () => setImagePreview(projectImage.value, projectForm.elements.imageAlt.value));
    projectForm?.elements.imageAlt?.addEventListener('input', () => setImagePreview(projectImage.value, projectForm.elements.imageAlt.value));

    projectForm?.addEventListener('submit', (event) => { event.preventDefault(); saveCurrentProject(); });
    newsletterCampaignForm?.addEventListener('submit', (event) => { event.preventDefault(); sendNewsletterCampaign(); });
    cancelEdit?.addEventListener('click', resetForm);
    $('[data-refresh-projects]')?.addEventListener('click', () => {
      if (!unsubscribeProjects) subscribeToProjects();
      setMessage($('[data-project-message]'), 'Firebase changes sync automatically while this dashboard is open.');
    });
    $('[data-refresh-enquiries]')?.addEventListener('click', () => {
      if (!unsubscribeEnquiries) subscribeToEnquiries();
      renderEnquiries();
    });
    $('[data-refresh-subscribers]')?.addEventListener('click', () => {
      if (!unsubscribeSubscribers) subscribeToSubscribers();
      renderNewsletterRequests();
      renderSubscribers();
    });
    enquiryList?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-save-enquiry]');
      if (button) saveEnquiryWorkflow(button.closest('[data-enquiry-id]'), button);
    });
    projectList?.addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-edit-project]');
      const deleteButton = event.target.closest('[data-delete-project]');
      if (editButton) beginEdit(editButton.dataset.editProject);
      if (deleteButton) deleteCurrentProject(deleteButton.dataset.deleteProject, deleteButton);
    });
    legacyStarterButton?.addEventListener('click', removeLegacyStarterProjects);
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
      authSdk.onAuthStateChanged(firebase.auth, handleAuthenticatedUser);
    } catch (error) {
      showMode('login');
      setMessage($('[data-login-message]'), 'Firebase could not load. Check the Firebase project setup or your network connection, then refresh.', true);
    }
  })();
})();
