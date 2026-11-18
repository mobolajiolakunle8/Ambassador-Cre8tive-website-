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

  // A short, brand-led welcome appears on every public page load. It is intentionally not
  // persisted in local storage, so visitors see it again after navigating or refreshing.
  const showWelcomeNote = () => {
    if (body.dataset.disableWelcome === 'true' || document.querySelector('[data-welcome-note]')) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const note = document.createElement('section');
    note.className = 'welcome-note';
    note.dataset.welcomeNote = '';
    note.setAttribute('role', 'dialog');
    note.setAttribute('aria-modal', 'true');
    note.setAttribute('aria-labelledby', 'welcome-note-title');
    note.setAttribute('aria-describedby', 'welcome-note-copy');
    note.innerHTML = `
      <div class="welcome-note__card">
        <span class="welcome-note__spark welcome-note__spark--one" aria-hidden="true"></span>
        <span class="welcome-note__spark welcome-note__spark--two" aria-hidden="true"></span>
        <button class="welcome-note__close" type="button" data-welcome-close aria-label="Continue to the Ambassador Cre8tive website"><span aria-hidden="true">×</span></button>
        <p class="welcome-note__eyebrow">Ambassador Cre8tive</p>
        <h2 id="welcome-note-title">Welcome to the <em>studio.</em></h2>
        <p id="welcome-note-copy">Fresh perspective, purposeful design, and a clearer way for your next idea to show up.</p>
        <div class="welcome-note__actions"><a class="welcome-note__primary" href="portfolio.html">Explore selected work <span aria-hidden="true">↗</span></a><a class="welcome-note__secondary" href="contact.html?topic=Discovery%20call">Start a project <span aria-hidden="true">↗</span></a></div>
        <p class="welcome-note__foot">Ibadan, Nigeria · Working with ambitious ideas everywhere</p>
      </div>
    `;

    let isClosing = false;
    const closeWelcomeNote = () => {
      if (isClosing) return;
      isClosing = true;
      note.classList.remove('is-visible');
      body.classList.remove('welcome-is-open');
      document.removeEventListener('keydown', handleKeydown);
      window.setTimeout(() => {
        note.remove();
        if (previouslyFocused && previouslyFocused !== document.body && document.contains(previouslyFocused)) previouslyFocused.focus({ preventScroll: true });
      }, 240);
    };
    const focusables = () => [...note.querySelectorAll('button:not([disabled]), a[href]')];
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWelcomeNote();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    note.addEventListener('click', (event) => {
      if (event.target === note || event.target.closest('[data-welcome-close]')) closeWelcomeNote();
    });
    note.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeWelcomeNote));
    document.addEventListener('keydown', handleKeydown);
    document.body.append(note);
    window.requestAnimationFrame(() => {
      body.classList.add('welcome-is-open');
      note.classList.add('is-visible');
      note.querySelector('[data-welcome-close]')?.focus({ preventScroll: true });
    });
  };
  window.setTimeout(showWelcomeNote, 140);

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
