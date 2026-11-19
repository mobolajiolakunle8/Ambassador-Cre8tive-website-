(() => {
  const root = document.querySelector('[data-project-root]');
  if (!root) return;

  // These legacy placeholder IDs are kept private from public rendering even if an older
  // Firestore import still exists. The admin dashboard provides a deliberate cleanup action.
  const RETIRED_STARTER_PROJECT_IDS = new Set([
    'orbit-co', 'wealthwise', 'common-ground', 'northstar', 'gather-together',
  ]);
  const query = new URLSearchParams(window.location.search);
  const requestedId = String(query.get('id') || '').trim();
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const categoryLabel = (category) => ({ identity: 'Brand identity', campaign: 'Campaign', digital: 'Digital content', print: 'Print' }[category] || 'Creative work');
  const isStarterAssetImage = (value = '') => /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(String(value));
  const safeProjectImageUrl = (value = '') => {
    const raw = String(value).trim();
    if (isStarterAssetImage(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
    } catch { return ''; }
  };
  const dateLabel = (value) => {
    if (!value) return 'Project case study';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  const getDeliverables = (project) => {
    const supplied = Array.isArray(project.deliverables) ? project.deliverables : String(project.deliverables || '').split(/\r?\n|,/);
    const cleaned = supplied.map((item) => String(item).trim()).filter(Boolean);
    return cleaned.length ? cleaned : ['Creative direction', 'Design development', 'Final working assets'];
  };

  const renderNotFound = () => {
    document.title = 'Project not found — Ambassador Cre8tive';
    root.innerHTML = '<section class="page-section project-not-found"><div class="container"><span class="eyebrow">Project not found</span><h1 class="section-title">That case study is not available.</h1><p>Explore our selected work or tell us about the project you would like to create.</p><div class="project-not-found__actions"><a class="button button--lime" href="portfolio.html">View portfolio <span aria-hidden="true">↗</span></a><a class="text-link" href="contact.html?topic=Discovery%20call">Start a project <span aria-hidden="true">↗</span></a></div></div></section>';
  };

  const renderProject = (project) => {
    const title = project.title || 'Project case study';
    const image = safeProjectImageUrl(project.image) || 'assets/about.jpg';
    const description = project.description || 'A focused creative direction designed to make the next brand touchpoint clearer and more memorable.';
    const challenge = project.challenge || 'Create a clearer, more confident way for this brand to communicate its value.';
    const approach = project.approach || 'We brought strategy, visual direction, and practical design thinking together around one focused idea.';
    const outcome = project.outcome || 'A considered creative foundation designed to support more consistent, confident communication.';
    const deliverables = getDeliverables(project);
    const hasTestimonial = project.testimonial && String(project.testimonial).trim();
    const contactHref = `contact.html?project=${encodeURIComponent(title)}&topic=${encodeURIComponent(`A similar project to ${title}`)}`;

    document.title = `${title} case study — Ambassador Cre8tive`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${title}: ${description.slice(0, 145)}`);
    root.innerHTML = `
      <section class="project-case-hero" aria-labelledby="project-title">
        <div class="container project-case-hero__content reveal is-visible">
          <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="portfolio.html">Portfolio</a><span aria-hidden="true">/</span><span>${escapeHtml(title)}</span></nav>
          <span class="eyebrow eyebrow--lime">Case study · ${escapeHtml(categoryLabel(project.category))}</span>
          <h1 id="project-title">${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
          <dl class="project-case-meta"><div><dt>Focus</dt><dd>${escapeHtml(project.client || categoryLabel(project.category))}</dd></div><div><dt>Completed</dt><dd>${escapeHtml(dateLabel(project.date))}</dd></div><div><dt>Scope</dt><dd>${deliverables.length} key deliverable${deliverables.length === 1 ? '' : 's'}</dd></div></dl>
        </div>
      </section>
      <figure class="project-case-feature"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.imageAlt || title)}" /></figure>
      <section class="project-case-story" aria-labelledby="story-title"><div class="container project-case-story__grid">
        <div class="project-case-story__intro reveal reveal--up"><span class="eyebrow">Project story</span><h2 id="story-title">One clear idea,<br />made <em>useful.</em></h2><p>Every Ambassador Cre8tive project starts with the practical outcome a brand needs—then builds a visual direction that can carry it confidently.</p></div>
        <div class="project-case-story__content reveal reveal--up"><section><span>01</span><h3>The challenge</h3><p>${escapeHtml(challenge)}</p></section><section><span>02</span><h3>Our approach</h3><p>${escapeHtml(approach)}</p></section><section><span>03</span><h3>Designed outcome</h3><p>${escapeHtml(outcome)}</p></section></div>
      </div></section>
      <section class="project-case-scope" aria-labelledby="scope-title"><div class="container project-case-scope__grid"><div class="reveal reveal--up"><span class="eyebrow">Project scope</span><h2 id="scope-title">Built for the<br />next <em>move.</em></h2><p>A clear scope helps every decision hold together, from the first concept through the assets a team uses every day.</p></div><ul class="project-deliverables reveal reveal--up">${deliverables.map((item, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(item)}</li>`).join('')}</ul></div></section>
      ${hasTestimonial ? `<section class="project-testimonial" aria-label="Client testimonial"><div class="container reveal reveal--up"><span class="eyebrow eyebrow--lime">Client perspective</span><blockquote>“${escapeHtml(project.testimonial)}”</blockquote>${project.testimonialAttribution ? `<p>— ${escapeHtml(project.testimonialAttribution)}</p>` : ''}</div></section>` : ''}
      <section class="project-case-next"><div class="container project-case-next__grid"><div class="reveal reveal--up"><span class="eyebrow">Your next project</span><h2>Need a visual direction that works as hard as your idea?</h2></div><div class="reveal reveal--up"><p>Tell us what you are building, where you are starting from, and the outcome you want to create. We will help you define the right creative next step.</p><a class="button button--lime" href="${contactHref}">Request a discovery call <span aria-hidden="true">↗</span></a><a class="text-link" href="portfolio.html">Back to all work <span aria-hidden="true">↗</span></a></div></div></section>
    `;

    const schema = document.querySelector('[data-project-schema]');
    if (schema) {
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CreativeWork', name: title, description,
        image: new URL(image, window.location.href).href,
        dateCreated: project.date || undefined,
        creator: { '@type': 'Organization', name: 'Ambassador Cre8tive' }
      });
    }
  };

  if (!requestedId || RETIRED_STARTER_PROJECT_IDS.has(requestedId)) {
    renderNotFound();
    return;
  }

  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-firestore.js'),
      ]);
      const { doc, onSnapshot } = firestore;
      onSnapshot(doc(db, 'projects', requestedId), (snapshot) => {
        const project = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
        if (project && project.published !== false && !RETIRED_STARTER_PROJECT_IDS.has(project.id)) renderProject(project);
        else renderNotFound();
      }, renderNotFound);
    } catch {
      renderNotFound();
    }
  })();
})();
