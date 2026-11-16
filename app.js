(() => {
  document.documentElement.classList.add('js');

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuClose = document.querySelector('[data-menu-close]');
  const menuScrim = document.querySelector('[data-menu-scrim]');
  const searchDialog = document.querySelector('#search-dialog');
  const searchTrigger = document.querySelector('.search-trigger');

  const setMenu = (open) => {
    body.classList.toggle('menu-is-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    if (open) menuClose?.focus();
    else menuButton?.focus();
  };

  menuButton?.addEventListener('click', () => setMenu(!body.classList.contains('menu-is-open')));
  menuClose?.addEventListener('click', () => setMenu(false));
  menuScrim?.addEventListener('click', () => setMenu(false));
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  // Highlight the current page in desktop and mobile navigation without duplicating state across files.
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const navigationPage = currentPage === 'project.html' ? 'portfolio.html' : (currentPage === 'post.html' ? 'blog.html' : currentPage);
  document.querySelectorAll('.desktop-nav a, .mobile-menu nav a').forEach((link) => {
    const destination = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (destination === navigationPage || (navigationPage === '' && destination === 'index.html')) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  searchTrigger?.addEventListener('click', () => {
    if (typeof searchDialog?.showModal === 'function') {
      searchDialog.showModal();
      window.setTimeout(() => searchDialog.querySelector('input')?.focus(), 30);
    }
  });
  searchDialog?.addEventListener('click', (event) => {
    if (event.target === searchDialog) searchDialog.close();
  });
  document.querySelectorAll('.dialog-close').forEach((button) => {
    button.addEventListener('click', () => searchDialog?.close());
  });
  document.querySelector('[data-search-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    const query = input?.value.trim();
    if (!query) {
      input?.focus();
      return;
    }
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 28);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 75}ms`;
      observer.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  // Preserve the featured treatment on the home-page service tile after hover.
  const serviceCards = [...document.querySelectorAll('.service-card')];
  const defaultFeatured = document.querySelector('.service-card--featured');
  serviceCards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      defaultFeatured?.classList.remove('service-card--featured');
    });
    card.addEventListener('pointerleave', () => {
      if (!serviceCards.some((item) => item.matches(':hover'))) defaultFeatured?.classList.add('service-card--featured');
    });
  });

  // Portfolio and article filters share a small, accessible client-side interaction.
  document.querySelectorAll('[data-filter-control]').forEach((control) => {
    control.addEventListener('click', () => {
      const group = control.closest('[data-filter-group]');
      const filter = control.dataset.filter || 'all';
      group?.querySelectorAll('[data-filter-control]').forEach((item) => {
        const active = item === control;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const scope = control.closest('section, main, .page-content') || document;
      scope.querySelectorAll('[data-filter-item]').forEach((item) => {
        const categories = (item.dataset.filterItem || '').split(' ');
        item.hidden = filter !== 'all' && !categories.includes(filter);
      });
    });
  });

  // Make each journal card usable as a whole link, while retaining its visible link controls.
  document.querySelectorAll('.article-card').forEach((card) => {
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
  });

  // Firebase lead capture, notification, and mailto fallback are handled by contact.js on the contact page.

  // Render useful, local results on the search page.
  const resultsRoot = document.querySelector('[data-search-results]');
  if (resultsRoot) {
    const query = new URLSearchParams(window.location.search).get('q')?.trim().toLowerCase() || '';
    const label = document.querySelector('[data-search-label]');
    const items = [...resultsRoot.querySelectorAll('[data-search-item]')];
    let matches = 0;
    items.forEach((item) => {
      const match = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !match;
      if (match) matches += 1;
    });
    if (label) label.textContent = query
      ? `${matches} result${matches === 1 ? '' : 's'} for “${query}”`
      : 'Browse all pages and services';
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('menu-is-open')) setMenu(false);
  });
})();
