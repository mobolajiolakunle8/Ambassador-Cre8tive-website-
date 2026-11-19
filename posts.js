(() => {
  const journalGrid = document.querySelector('[data-journal-grid]');
  const journalEmpty = document.querySelector('[data-journal-empty]');
  const journalFilters = document.querySelector('[data-journal-filter-group]');
  const homeInsights = document.querySelector('[data-home-insights]');
  const homeInsightsEmpty = document.querySelector('[data-home-insights-empty]');
  const postRoot = document.querySelector('[data-post-root]');
  if (!journalGrid && !homeInsights && !postRoot) return;

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&quot;' })[char]);
  const CATEGORY_LABELS = Object.freeze({ branding: 'Branding', design: 'Design', growth: 'Growth', studio: 'Studio' });
  const isLocalImage = (value = '') => /^assets\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(String(value));
  const safeImageUrl = (value = '') => {
    const raw = String(value).trim();
    if (isLocalImage(raw)) return raw;
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : '';
    } catch { return ''; }
  };
  const dateValue = (value = '') => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : '';
  const readableDate = (value = '') => {
    const date = dateValue(value) ? new Date(`${value}T12:00:00`) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Studio note';
  };
  const categoryLabel = (value = '') => CATEGORY_LABELS[value] || 'Studio';
  const postUrl = (post) => `post.html?id=${encodeURIComponent(post.id)}`;

  const publishedPosts = (records) => records
    .filter((post) => (
      post
      && post.published === true
      && post.id
      && String(post.title || '').trim()
      && String(post.excerpt || '').trim()
      && String(post.body || '').trim()
      && safeImageUrl(post.image)
      && dateValue(post.date)
      && CATEGORY_LABELS[post.category]
    ))
    .sort((a, b) => Number(b.featured) - Number(a.featured)
      || String(b.date || '').localeCompare(String(a.date || ''))
      || String(a.title || '').localeCompare(String(b.title || '')));

  const cardMarkup = (post) => `
    <article class="article-card reveal is-visible" data-filter-item="${escapeHtml(post.category)}">
      <a class="article-card__image" href="${postUrl(post)}"><img src="${escapeHtml(safeImageUrl(post.image))}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" /></a>
      <div class="article-card__body"><time datetime="${escapeHtml(post.date)}">${escapeHtml(categoryLabel(post.category))} · ${escapeHtml(readableDate(post.date))}</time><h2><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p><a class="article-card__more" href="${postUrl(post)}">Read full post <span aria-hidden="true">↗</span></a></div>
    </article>
  `;

  const bindArticleCard = (card) => {
    if (card.dataset.cardBound === 'true') return;
    card.dataset.cardBound = 'true';
    const destination = card.querySelector('.article-card__more')?.href;
    if (!destination) return;
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.addEventListener('click', (event) => {
      if (!event.target.closest('a, button, input, textarea, select')) window.location.href = destination;
    });
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('a, button, input, textarea, select')) {
        event.preventDefault();
        window.location.href = destination;
      }
    });
  };

  const renderJournal = (posts) => {
    if (!journalGrid) return;
    const hasPosts = posts.length > 0;
    journalGrid.hidden = !hasPosts;
    if (journalEmpty) journalEmpty.hidden = hasPosts;
    if (journalFilters) journalFilters.hidden = !hasPosts;
    if (!hasPosts) {
      journalGrid.innerHTML = '';
      return;
    }
    journalGrid.innerHTML = posts.map(cardMarkup).join('');
    journalGrid.querySelectorAll('.article-card').forEach(bindArticleCard);
  };

  const renderHomeInsights = (posts) => {
    if (!homeInsights) return;
    const selected = posts.slice(0, 3);
    const hasPosts = selected.length > 0;
    homeInsights.hidden = !hasPosts;
    if (homeInsightsEmpty) homeInsightsEmpty.hidden = hasPosts;
    if (!hasPosts) {
      homeInsights.innerHTML = '';
      return;
    }
    homeInsights.innerHTML = selected.map((post, index) => `
      <a href="${postUrl(post)}" class="insight reveal is-visible"><span>${String(index + 1).padStart(2, '0')}</span><time datetime="${escapeHtml(post.date)}">${escapeHtml(readableDate(post.date))}</time><strong>${escapeHtml(post.title)}</strong><i aria-hidden="true">↗</i></a>
    `).join('');
  };

  const postBodyMarkup = (body = '', takeaway = '') => {
    const blocks = String(body).trim().split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
    const content = blocks.map((block) => {
      if (/^##\s+/.test(block)) return `<h2>${escapeHtml(block.replace(/^##\s+/, ''))}</h2>`;
      return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
    }).join('');
    return content + (String(takeaway).trim() ? `<blockquote>${escapeHtml(takeaway)}</blockquote>` : '');
  };

  let postActionsBound = false;
  const renderPost = (post) => {
    if (!postRoot) return;
    document.title = `${post.title} — Ambassador Cre8tive`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', String(post.excerpt).slice(0, 155));
    const schema = document.querySelector('[data-post-schema]');
    if (schema) {
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: new URL(safeImageUrl(post.image), window.location.href).href,
        datePublished: post.date,
        author: { '@type': 'Organization', name: 'Ambassador Cre8tive' },
        publisher: { '@type': 'Organization', name: 'Ambassador Cre8tive' },
      });
    }
    postRoot.querySelectorAll('[data-post-category]').forEach((element) => { element.textContent = categoryLabel(post.category); });
    const date = postRoot.querySelector('[data-post-date]');
    if (date) { date.textContent = readableDate(post.date); date.dateTime = post.date; }
    const readTime = postRoot.querySelector('[data-post-read-time]');
    if (readTime) readTime.textContent = String(post.readTime || 'Studio note');
    const title = postRoot.querySelector('[data-post-title]');
    if (title) title.textContent = post.title;
    const intro = postRoot.querySelector('[data-post-intro]');
    if (intro) intro.textContent = post.excerpt;
    const image = postRoot.querySelector('[data-post-image]');
    if (image) { image.src = safeImageUrl(post.image); image.alt = post.imageAlt || post.title; }
    const body = postRoot.querySelector('[data-post-body]');
    if (body) body.innerHTML = postBodyMarkup(post.body, post.takeaway);
    if (!postActionsBound) {
      postActionsBound = true;
      bindPostActions(post.id, post.title, post.excerpt);
    }
  };

  const renderPostNotFound = () => {
    if (!postRoot) return;
    postRoot.innerHTML = '<section class="page-section"><div class="container"><span class="eyebrow">Not found</span><h1 class="section-title">That post is no longer available.</h1><p class="post-not-found">Try the journal for more useful ideas on branding and design.</p><a class="button button--lime" href="blog.html">Visit the journal <span aria-hidden="true">↗</span></a></div></section>';
  };

  const bindPostActions = (postId, title, excerpt) => {
    const likesKey = `ambassador-cre8tive:likes:${postId}`;
    const commentsKey = `ambassador-cre8tive:comments:${postId}`;
    const likeButton = postRoot.querySelector('[data-like-button]');
    const likeCount = postRoot.querySelector('[data-like-count]');
    const commentsList = postRoot.querySelector('[data-comments-list]');
    const commentsCount = postRoot.querySelector('[data-comments-count]');
    const shareButton = postRoot.querySelector('[data-share-button]');
    const shareStatus = postRoot.querySelector('[data-share-status]');
    const commentForm = postRoot.querySelector('[data-comment-form]');
    const getLikes = () => Number(localStorage.getItem(likesKey) || 0);
    const isLiked = () => localStorage.getItem(`${likesKey}:mine`) === 'true';
    const updateLikes = () => {
      const liked = isLiked();
      if (likeCount) likeCount.textContent = getLikes();
      likeButton?.setAttribute('aria-pressed', String(liked));
      likeButton?.classList.toggle('is-liked', liked);
      const label = likeButton?.querySelector('[data-like-label]');
      if (label) label.textContent = liked ? 'Liked' : 'Like';
    };
    try { updateLikes(); } catch { if (likeCount) likeCount.textContent = '0'; }
    likeButton?.addEventListener('click', () => {
      try {
        const liked = isLiked();
        localStorage.setItem(`${likesKey}:mine`, String(!liked));
        localStorage.setItem(likesKey, String(Math.max(0, getLikes() + (liked ? -1 : 1))));
        updateLikes();
      } catch { if (shareStatus) shareStatus.textContent = 'Likes are unavailable in this browser.'; }
    });
    shareButton?.addEventListener('click', async () => {
      const shareData = { title, text: excerpt, url: window.location.href };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          if (shareStatus) shareStatus.textContent = 'Thanks for sharing this post.';
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          if (shareStatus) shareStatus.textContent = 'Link copied to your clipboard.';
        } else window.prompt('Copy this link:', window.location.href);
      } catch (error) {
        if (error?.name !== 'AbortError' && shareStatus) shareStatus.textContent = 'Unable to share right now. You can copy the page link from your browser.';
      }
    });
    const getComments = () => {
      try { return JSON.parse(localStorage.getItem(commentsKey) || '[]'); }
      catch { return []; }
    };
    const renderComments = () => {
      const comments = getComments();
      if (commentsCount) commentsCount.textContent = comments.length;
      if (!commentsList) return;
      if (!comments.length) {
        commentsList.innerHTML = '<p class="comments-empty">No comments yet. Be the first to share a thoughtful response.</p>';
        return;
      }
      commentsList.innerHTML = comments.map((comment) => `<article class="comment-item"><div><strong>${escapeHtml(comment.name)}</strong><time datetime="${escapeHtml(comment.dateTime)}">${escapeHtml(comment.date)}</time></div><p>${escapeHtml(comment.message).replace(/\n/g, '<br />')}</p></article>`).join('');
    };
    renderComments();
    commentForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!commentForm.checkValidity()) { commentForm.reportValidity(); return; }
      const data = new FormData(commentForm);
      const now = new Date();
      const comment = {
        name: String(data.get('name') || '').trim(),
        message: String(data.get('message') || '').trim(),
        date: now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
        dateTime: now.toISOString(),
      };
      try {
        const comments = getComments();
        comments.unshift(comment);
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        commentForm.reset();
        renderComments();
        const status = postRoot.querySelector('[data-comment-status]');
        if (status) status.textContent = 'Your comment has been added in this browser.';
      } catch {
        const status = postRoot.querySelector('[data-comment-status]');
        if (status) status.textContent = 'Your comment could not be saved in this browser.';
      }
    });
  };

  (async () => {
    try {
      const [{ db }, firestore] = await Promise.all([
        import('./firebase-config.js'),
        import('./firebase-firestore.js'),
      ]);
      const { collection, doc, getDoc, onSnapshot, query, where } = firestore;
      if (journalGrid || homeInsights) {
        const publishedQuery = query(collection(db, 'journalPosts'), where('published', '==', true));
        onSnapshot(publishedQuery, (snapshot) => {
          const posts = publishedPosts(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
          renderJournal(posts);
          renderHomeInsights(posts);
        }, () => {
          renderJournal([]);
          renderHomeInsights([]);
        });
      }
      if (postRoot) {
        const params = new URLSearchParams(window.location.search);
        const id = String(params.get('id') || params.get('slug') || '').trim();
        if (!id || id.length > 160) { renderPostNotFound(); return; }
        onSnapshot(doc(db, 'journalPosts', id), (snapshot) => {
          if (!snapshot.exists()) { renderPostNotFound(); return; }
          const posts = publishedPosts([{ ...snapshot.data(), id: snapshot.id }]);
          if (!posts.length) { renderPostNotFound(); return; }
          renderPost(posts[0]);
        }, renderPostNotFound);
      }
    } catch {
      renderJournal([]);
      renderHomeInsights([]);
      if (postRoot) renderPostNotFound();
    }
  })();
})();
