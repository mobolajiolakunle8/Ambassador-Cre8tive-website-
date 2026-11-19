(() => {
  const gallery = document.querySelector('[data-project-gallery]');
  const featuredRoot = document.querySelector('[data-featured-projects]');
  const testimonialRoot = document.querySelector('[data-client-proof]');
  const testimonialSection = document.querySelector('[data-client-proof-section]');
  const galleryEmpty = document.querySelector('[data-project-gallery-empty]');
  const featuredEmpty = document.querySelector('[data-featured-projects-empty]');
  const filterBar = document.querySelector('[data-project-filters]');
  if (!gallery && !featuredRoot && !testimonialRoot) return;

  // Do not publicly reintroduce the former placeholder portfolio if an older Firebase import
  // still exists. The verified admin can remove these legacy records from the dashboard.
  const RETIRED_STARTER_PROJECT_IDS = new Set([
    'orbit-co', 'wealthwise', 'common-ground', 'northstar', 'gather-together',
  ]);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const categoryLabel = (category) => ({
    identity: 'Brand identity',
    campaign: 'Campaign',
    digital: 'Digital content',
    print: 'Print',
  }[category] || 'Creative work');
  const isStarterAssetImage = (value = '') => /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(String(value));
  const safeProjectImageUrl = (value = '') => {
    const raw = String(value).trim();
    if (isStarterAssetImage(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
    } catch { return ''; }
  };
  const imageSource = (project) => safeProjectImageUrl(project.image) || 'assets/about.jpg';
  const publishedProjects = (projects) => projects
    .filter((project) => (
      project
      && !RETIRED_STARTER_PROJECT_IDS.has(project.id)
      && project.published !== false
      && safeProjectImageUrl(project.image)
      && project.title
      && project.id
    ))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.date || '').localeCompare(String(a.date || '')));
  const projectHref = (project) => `project.html?id=${encodeURIComponent(project.id)}`;
  const projectLabel = (project) => [categoryLabel(project.category), project.client].filter(Boolean).join(' · ');

  const renderGallery = (projects) => {
    if (!gallery) return;
    const hasProjects = projects.length > 0;
    gallery.hidden = !hasProjects;
    if (galleryEmpty) galleryEmpty.hidden = hasProjects;
    if (filterBar) filterBar.hidden = !hasProjects;
    if (!hasProjects) {
      gallery.innerHTML = '';
      return;
    }
    gallery.innerHTML = projects.map((project) => `
      <article class="portfolio-item reveal is-visible" data-filter-item="${escapeHtml(project.category)}">
        <a class="portfolio-card" href="${projectHref(project)}">
          <img src="${escapeHtml(imageSource(project))}" alt="${escapeHtml(project.imageAlt || project.title)}" loading="lazy" decoding="async" />
          <span class="portfolio-card__caption"><span><small>${escapeHtml(projectLabel(project))}</small><strong>${escapeHtml(project.title)}</strong></span><i aria-hidden="true">↗</i></span>
        </a>
      </article>
    `).join('');
  };

  const renderFeatured = (projects) => {
    if (!featuredRoot) return;
    const hasProjects = projects.length > 0;
    featuredRoot.hidden = !hasProjects;
    if (featuredEmpty) featuredEmpty.hidden = hasProjects;
    if (!hasProjects) {
      featuredRoot.innerHTML = '';
      return;
    }
    const selected = projects.filter((project) => project.featured);
    const cards = [...selected, ...projects.filter((project) => !project.featured)].slice(0, 3);
    featuredRoot.innerHTML = cards.map((project, index) => `
      <a class="project-card ${index === 0 ? 'project-card--large' : ''} reveal is-visible" href="${projectHref(project)}">
        <img src="${escapeHtml(imageSource(project))}" alt="${escapeHtml(project.imageAlt || project.title)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} />
        <span class="project-card__meta"><small>${escapeHtml(categoryLabel(project.category))}</small><strong>${escapeHtml(project.title)}</strong><i aria-hidden="true">↗</i></span>
      </a>
    `).join('');
  };

  const renderTestimonials = (projects) => {
    if (!testimonialRoot || !testimonialSection) return;
    const quotes = projects.filter((project) => String(project.testimonial || '').trim()).slice(0, 2);
    if (!quotes.length) {
      testimonialSection.hidden = true;
      return;
    }
    testimonialRoot.innerHTML = quotes.map((project) => `
      <article class="client-proof__quote reveal is-visible"><blockquote>“${escapeHtml(project.testimonial)}”</blockquote><p>— ${escapeHtml(project.testimonialAttribution || 'Client perspective')}</p></article>
    `).join('');
    testimonialSection.hidden = false;
  };

  // Firebase provides the only public portfolio feed. Empty states remain truthful until real,
  // published case studies are added through the verified dashboard.
  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-firestore.js'),
      ]);
      const { collection, onSnapshot, query, where } = firestore;
      const publishedQuery = query(collection(db, 'projects'), where('published', '==', true));
      onSnapshot(publishedQuery, (snapshot) => {
        const projects = publishedProjects(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
        renderGallery(projects);
        renderFeatured(projects);
        renderTestimonials(projects);
      }, () => {
        // Keep the honest static empty state if Firebase is unavailable.
      });
    } catch {
      // Keep the honest static empty state in network-restricted previews.
    }
  })();
})();
