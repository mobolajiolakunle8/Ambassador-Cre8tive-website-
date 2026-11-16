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
  const uploadInput = $('[data-upload-input]');
  const dropzone = $('[data-dropzone]');
  const preview = $('[data-upload-preview]');
  const previewImage = $('[data-preview-image]');
  const uploadEmpty = $('[data-upload-empty]');
  const uploadStatus = $('[data-upload-status]');
  const formHeading = $('[data-form-heading]');
  const cancelEdit = $('[data-cancel-edit]');
  const saveProject = $('[data-save-project]');
  const seedPanel = $('[data-seed-panel]');
  const seedButton = $('[data-seed-projects]');
  const enquiryList = $('[data-enquiry-list]');
  const subscriberList = $('[data-subscriber-list]');
  const newsletterCampaignForm = $('[data-newsletter-campaign-form]');

  let firebase = null;
  let authSdk = null;
  let firestore = null;
  let storageSdk = null;
  let currentUser = null;
  let projects = [];
  let enquiries = [];
  let subscribers = [];
  let unsubscribeProjects = null;
  let unsubscribeEnquiries = null;
  let unsubscribeSubscribers = null;

  const starterProjects = [
    {
      id: 'orbit-co', title: 'Orbit & Co.', client: 'Brand identity project', category: 'identity', description: 'A refined visual identity and print direction built for a contemporary lifestyle brand.', image: 'assets/project_01.jpg', imageAlt: 'African-inspired brand identity stationery and packaging', date: '2026-05-14', featured: true, published: true,
      challenge: 'Create a polished visual identity that could give Orbit & Co. a clear, recognisable presence across everyday brand touchpoints.', approach: 'We shaped a refined creative direction, then translated it into a flexible visual system so type, tone, and printed details could feel connected.', deliverables: ['Core visual identity', 'Colour and typography system', 'Stationery direction', 'Print-ready assets'], outcome: 'A cohesive identity foundation designed to make every customer-facing touchpoint feel intentional and recognisable.', testimonial: '', testimonialAttribution: '', storagePath: ''
    },
    {
      id: 'wealthwise', title: 'Wealthwise', client: 'Digital content direction', category: 'digital', description: 'A digital campaign system for clear, confident social communication.', image: 'assets/project_02.jpg', imageAlt: 'African creative professional working on a digital design project', date: '2026-04-21', featured: false, published: true,
      challenge: 'Make complex financial ideas feel more approachable through a confident, easy-to-follow digital content direction.', approach: 'We established a focused content system with clear hierarchy, adaptable layouts, and a visual rhythm suited to everyday digital communication.', deliverables: ['Digital content direction', 'Social content layouts', 'Campaign graphic system', 'Reusable visual guidance'], outcome: 'A practical direction designed to help financial messages feel clearer, more consistent, and easier to engage with.', testimonial: '', testimonialAttribution: '', storagePath: ''
    },
    {
      id: 'common-ground', title: 'Common Ground', client: 'Campaign creative direction', category: 'campaign', description: 'Bold campaign imagery created to bring a vibrant brand story to life.', image: 'assets/project_03.jpg', imageAlt: 'African fashion campaign photographed in an urban setting', date: '2026-03-03', featured: false, published: true,
      challenge: 'Give a campaign story enough visual distinction to cut through while keeping every touchpoint part of one clear idea.', approach: 'We used a bold image-led direction and a repeatable set of campaign elements to create consistency from the hero visual through supporting assets.', deliverables: ['Campaign creative direction', 'Hero visual direction', 'Digital campaign assets', 'Launch-ready artwork'], outcome: 'A cohesive campaign toolkit built to carry one memorable idea across multiple customer moments.', testimonial: '', testimonialAttribution: '', storagePath: ''
    },
    {
      id: 'northstar', title: 'Northstar', client: 'Product packaging identity', category: 'identity', description: 'A product identity system that combines contemporary form with African-inspired pattern.', image: 'assets/project_04.jpg', imageAlt: 'African-inspired artisan product packaging and brand visuals', date: '2026-02-10', featured: false, published: true,
      challenge: 'Create a product identity with enough personality to feel distinctive while remaining practical across packaging and digital materials.', approach: 'We balanced contemporary form with considered pattern, material, and typography decisions to build a recognisable identity system.', deliverables: ['Product identity system', 'Packaging direction', 'Typography and colour rules', 'Digital visual assets'], outcome: 'An adaptable identity designed to give the product a confident, coherent presence wherever people meet it.', testimonial: '', testimonialAttribution: '', storagePath: ''
    },
    {
      id: 'gather-together', title: 'Gather Together', client: 'Print and publication design', category: 'print', description: 'A tactile print system for editorial materials, invitations, and campaign collateral.', image: 'assets/project_05.jpg', imageAlt: 'African-inspired printed publications and invitations on a studio table', date: '2026-01-22', featured: false, published: true,
      challenge: 'Create printed materials that could make an occasion feel considered, warm, and consistently branded from invitation to follow-up piece.', approach: 'We developed a tactile editorial direction with a clear information hierarchy and visual details that translate beautifully in print.', deliverables: ['Editorial print direction', 'Invitation and collateral layouts', 'Print-ready artwork', 'Production guidance'], outcome: 'A unified print system designed to make each physical touchpoint feel purposeful and memorable.', testimonial: '', testimonialAttribution: '', storagePath: ''
    },
  ];

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
  const updateStats = () => {
    $('[data-project-count]').textContent = projects.length;
    $('[data-published-count]').textContent = projects.filter((project) => project.published).length;
    $('[data-enquiry-count]').textContent = enquiries.filter((enquiry) => enquiry.status === 'new').length;
    $('[data-subscriber-count]').textContent = subscribers.length;
  };

  const renderProjects = () => {
    updateStats();
    if (seedPanel) seedPanel.hidden = projects.length > 0;
    if (!projects.length) {
      projectList.innerHTML = '<p class="admin-empty">No Firebase projects are saved yet. Import the starter portfolio or upload your first completed project.</p>';
      return;
    }
    projectList.innerHTML = [...projects]
      .sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.date || '').localeCompare(String(a.date || '')))
      .map((project) => `
        <article class="admin-project-row" data-row-id="${escapeHtml(project.id)}">
          <div class="admin-project-row__image"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt || project.title)}" /></div>
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

  const renderSubscribers = () => {
    updateStats();
    if (!subscriberList) return;
    if (!subscribers.length) {
      subscriberList.innerHTML = '<p class="admin-empty">No newsletter contacts have opted in yet.</p>';
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
    if (!firebase || !firestore || unsubscribeSubscribers || !subscriberList) return;
    subscriberList.innerHTML = '<p class="admin-empty">Loading subscribed contacts…</p>';
    unsubscribeSubscribers = firestore.onSnapshot(firestore.collection(firebase.db, 'subscribers'), (snapshot) => {
      subscribers = snapshot.docs.map((item) => ({ ...item.data(), id: item.id })).filter((subscriber) => subscriber.status === 'subscribed');
      renderSubscribers();
    }, (error) => { subscriberList.innerHTML = `<p class="admin-empty">${escapeHtml(authErrorMessage(error))}</p>`; });
  };

  const stopLeadSubscriptions = () => {
    if (unsubscribeEnquiries) unsubscribeEnquiries();
    if (unsubscribeSubscribers) unsubscribeSubscribers();
    unsubscribeEnquiries = null;
    unsubscribeSubscribers = null;
    enquiries = [];
    subscribers = [];
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

  const setPreview = (url = '', alt = '', storagePath = '') => {
    projectImage.value = url;
    projectStoragePath.value = storagePath;
    if (url) {
      preview.hidden = false;
      uploadEmpty.hidden = true;
      previewImage.src = url;
      previewImage.alt = alt || 'Selected project preview';
    } else {
      preview.hidden = true;
      uploadEmpty.hidden = false;
      previewImage.removeAttribute('src');
    }
  };

  const resetForm = () => {
    projectForm.reset();
    projectId.value = '';
    projectForm.dataset.originalStoragePath = '';
    projectForm.elements.published.checked = true;
    projectForm.elements.featured.checked = false;
    setPreview();
    uploadInput.value = '';
    formHeading.textContent = 'Add a project';
    saveProject.innerHTML = 'Save project <span>↗</span>';
    cancelEdit.hidden = true;
    setMessage($('[data-project-message]'));
    setMessage(uploadStatus);
  };

  const beginEdit = (id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    projectId.value = project.id;
    projectForm.dataset.originalStoragePath = project.storagePath || '';
    projectForm.elements.title.value = project.title || '';
    projectForm.elements.client.value = project.client || '';
    projectForm.elements.category.value = project.category || 'identity';
    projectForm.elements.date.value = project.date || '';
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
    setPreview(project.image || '', project.imageAlt || project.title, project.storagePath || '');
    formHeading.textContent = 'Edit project';
    saveProject.innerHTML = 'Save changes <span>↗</span>';
    cancelEdit.hidden = false;
    projectForm.closest('.admin-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fileIsAccepted = (file) => {
    const mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return mimeTypes.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name || '');
  };
  const mimeFor = (file) => {
    if (file.type) return file.type;
    if (/\.png$/i.test(file.name)) return 'image/png';
    if (/\.webp$/i.test(file.name)) return 'image/webp';
    return 'image/jpeg';
  };
  const storageFilename = (file) => {
    const safe = String(file.name || 'project-image').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    const nonce = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${nonce}-${safe}`;
  };
  const removeStorageObject = async (path) => {
    if (!path || !firebase || !storageSdk) return;
    try { await storageSdk.deleteObject(storageSdk.ref(firebase.storage, path)); }
    catch { /* A stale image should not prevent an otherwise valid project update. */ }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!fileIsAccepted(file)) {
      setMessage(uploadStatus, 'Please choose a JPG, PNG, or WebP image.', true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage(uploadStatus, 'This image is larger than 10 MB.', true);
      return;
    }
    if (!currentUser || !firebase?.isApprovedAdmin(currentUser)) {
      setMessage(uploadStatus, 'Verify the approved Firebase administrator email before uploading.', true);
      return;
    }
    const previousCandidate = projectStoragePath.value;
    const originalPath = projectForm.dataset.originalStoragePath || '';
    if (previousCandidate && previousCandidate !== originalPath) await removeStorageObject(previousCandidate);
    setMessage(uploadStatus, 'Uploading to Firebase Storage…');
    dropzone.classList.add('is-uploading');
    try {
      const path = `projects/${currentUser.uid}/${storageFilename(file)}`;
      const objectRef = storageSdk.ref(firebase.storage, path);
      await storageSdk.uploadBytes(objectRef, file, { contentType: mimeFor(file) });
      const url = await storageSdk.getDownloadURL(objectRef);
      setPreview(url, file.name, path);
      setMessage(uploadStatus, 'Image uploaded and ready to publish.');
      const altField = projectForm.elements.imageAlt;
      if (!altField.value) altField.value = file.name.replace(/[-_]+/g, ' ').replace(/\.[^/.]+$/, '');
    } catch (error) {
      setMessage(uploadStatus, authErrorMessage(error), true);
    } finally {
      dropzone.classList.remove('is-uploading');
    }
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
      image: String(data.get('image') || '').trim(),
      storagePath: String(data.get('storagePath') || '').trim(),
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
    if (!payload.image) {
      setMessage(message, 'Upload or select a project image before saving.', true);
      return;
    }
    const existingId = projectId.value;
    const originalPath = projectForm.dataset.originalStoragePath || '';
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
      if (originalPath && originalPath !== payload.storagePath) await removeStorageObject(originalPath);
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
      if (project.storagePath) await removeStorageObject(project.storagePath);
      if (projectId.value === id) resetForm();
    } catch (error) {
      window.alert(authErrorMessage(error));
      button.disabled = false;
    }
  };

  const importStarterProjects = async () => {
    if (!firebase || !firestore || !currentUser || projects.length || !window.confirm('Import the five existing starter projects into Firestore?')) return;
    seedButton.disabled = true;
    const message = $('[data-seed-message]');
    setMessage(message, 'Importing starter portfolio…');
    try {
      const batch = firestore.writeBatch(firebase.db);
      starterProjects.forEach((project) => {
        const reference = firestore.doc(firebase.db, 'projects', project.id);
        batch.set(reference, { ...project, createdAt: firestore.serverTimestamp(), updatedAt: firestore.serverTimestamp() });
      });
      await batch.commit();
      setMessage(message, 'Starter portfolio imported successfully.');
    } catch (error) {
      setMessage(message, authErrorMessage(error), true);
      seedButton.disabled = false;
    }
  };

  const handleAuthenticatedUser = async (user) => {
    currentUser = user;
    if (!user) {
      stopProjectSubscription();
      stopLeadSubscriptions();
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
    subscribeToProjects();
    subscribeToEnquiries();
    subscribeToSubscribers();
  };

  const bindEvents = () => {
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

    uploadInput?.addEventListener('change', () => uploadFile(uploadInput.files?.[0]));
    ['dragenter', 'dragover'].forEach((eventName) => dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragging');
    }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragging');
    }));
    dropzone?.addEventListener('drop', (event) => uploadFile(event.dataTransfer?.files?.[0]));
    $('[data-clear-image]')?.addEventListener('click', async () => {
      const candidate = projectStoragePath.value;
      const originalPath = projectForm.dataset.originalStoragePath || '';
      setPreview();
      uploadInput.value = '';
      setMessage(uploadStatus);
      if (candidate && candidate !== originalPath) await removeStorageObject(candidate);
    });

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
    seedButton?.addEventListener('click', importStarterProjects);
  };

  (async () => {
    try {
      const [config, authModule, firestoreModule, storageModule] = await Promise.all([
        import('./firebase-config.js'),
        import('https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js'),
      ]);
      firebase = config;
      authSdk = authModule;
      firestore = firestoreModule;
      storageSdk = storageModule;
      bindEvents();
      authSdk.onAuthStateChanged(firebase.auth, handleAuthenticatedUser);
    } catch (error) {
      showMode('login');
      setMessage($('[data-login-message]'), 'Firebase could not load. Check the Firebase project setup or your network connection, then refresh.', true);
    }
  })();
})();
