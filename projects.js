(() => {
  const gallery = document.querySelector('[data-project-gallery]');
  const featuredRoot = document.querySelector('[data-featured-projects]');
  const testimonialRoot = document.querySelector('[data-client-proof]');
  const testimonialSection = document.querySelector('[data-client-proof-section]');
  if (!gallery && !featuredRoot && !testimonialRoot) return;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const categoryLabel = (category) => ({
    identity: 'Brand identity',
    campaign: 'Campaign',
    digital: 'Digital content',
    print: 'Print',
  }[category] || 'Creative work');
  const publishedProjects = (projects) => projects
    .filter((project) => project && project.published !== false && project.image && project.title && project.id)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.date || '').localeCompare(String(a.date || '')));
  const projectHref = (project) => `project.html?id=${encodeURIComponent(project.id)}`;
  const projectLabel = (project) => [categoryLabel(project.category), project.client].filter(Boolean).join(' · ');

  const renderGallery = (projects) => {
    if (!gallery || !projects.length) return;
    gallery.innerHTML = projects.map((project) => `
      <article class="portfolio-item reveal is-visible" data-filter-item="${escapeHtml(project.category)}">
        <a class="portfolio-card" href="${projectHref(project)}">
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt || project.title)}" loading="lazy" decoding="async" />
          <span class="portfolio-card__caption"><span><small>${escapeHtml(projectLabel(project))}</small><strong>${escapeHtml(project.title)}</strong></span><i aria-hidden="true">↗</i></span>
        </a>
      </article>
    `).join('');
  };

  const renderFeatured = (projects) => {
    if (!featuredRoot || !projects.length) return;
    const selected = projects.filter((project) => project.featured);
    const cards = [...selected, ...projects.filter((project) => !project.featured)].slice(0, 3);
    featuredRoot.innerHTML = cards.map((project, index) => `
      <a class="project-card ${index === 0 ? 'project-card--large' : ''} reveal is-visible" href="${projectHref(project)}">
        <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt || project.title)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} />
        <span class="project-card__meta"><small>${escapeHtml(categoryLabel(project.category))}</small><strong>${escapeHtml(project.title)}</strong><i aria-hidden="true">↗</i></span>
      </a>
    `).join('');
  };

  const renderTestimonials = (projects) => {
    if (!testimonialRoot || !testimonialSection) return;
    const quotes = projects.filter((project) => String(project.testimonial || '').trim()).slice(0, 2);
    if (!quotes.length) return;
    testimonialRoot.innerHTML = quotes.map((project) => `
      <article class="client-proof__quote reveal is-visible"><blockquote>“${escapeHtml(project.testimonial)}”</blockquote><p>— ${escapeHtml(project.testimonialAttribution || 'Client perspective')}</p></article>
    `).join('');
    testimonialSection.hidden = false;
  };

  // Firebase provides a real-time published-project feed. If Firebase has not been enabled yet,
  // the semantic static cards in each page remain visible as a graceful fallback.
  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js'),
      ]);
      const { collection, onSnapshot, query, where } = firestore;
      const publishedQuery = query(collection(db, 'projects'), where('published', '==', true));
      onSnapshot(publishedQuery, (snapshot) => {
        const projects = publishedProjects(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
        // Keep local starter cards until the administrator imports or creates Firebase projects.
        if (!projects.length) return;
        renderGallery(projects);
        renderFeatured(projects);
        renderTestimonials(projects);
      }, () => {
        // Firebase setup may be incomplete during local preview; static fallback remains available.
      });
    } catch {
      // Network-restricted previews and pre-Firebase deployments retain the static fallback.
    }
  })();
})();
