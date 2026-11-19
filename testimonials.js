(() => {
  const section = document.querySelector('[data-client-proof-section]');
  const root = document.querySelector('[data-client-proof]');
  if (!section || !root) return;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const publishedTestimonials = (records) => records
    .filter((testimonial) => testimonial
      && testimonial.published === true
      && String(testimonial.quote || '').trim()
      && String(testimonial.attribution || '').trim())
    .sort((a, b) => Number(b.featured) - Number(a.featured)
      || Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
      || String(a.attribution || '').localeCompare(String(b.attribution || '')))
    .slice(0, 4);

  const render = (testimonials) => {
    if (!testimonials.length) {
      root.innerHTML = '';
      section.hidden = true;
      return;
    }
    root.innerHTML = testimonials.map((testimonial) => {
      const context = [String(testimonial.role || '').trim(), String(testimonial.project || '').trim()].filter(Boolean).join(' · ');
      return `<article class="client-proof__quote reveal is-visible"><blockquote>“${escapeHtml(testimonial.quote)}”</blockquote><p>— ${escapeHtml(testimonial.attribution)}${context ? ` <span>${escapeHtml(context)}</span>` : ''}</p></article>`;
    }).join('');
    section.hidden = false;
  };

  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-firestore.js'),
      ]);
      const { collection, onSnapshot, query, where } = firestore;
      onSnapshot(query(collection(db, 'testimonials'), where('published', '==', true)), (snapshot) => {
        render(publishedTestimonials(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }))));
      }, () => render([]));
    } catch {
      render([]);
    }
  })();
})();
