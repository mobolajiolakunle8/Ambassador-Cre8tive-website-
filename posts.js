(() => {
  const root = document.querySelector('[data-post-root]');
  if (!root) return;

  const posts = {
    'brand-viewpoint': {
      category: 'Branding',
      date: '14 May 2026',
      dateTime: '2026-05-14',
      readTime: '4 min read',
      title: 'How a sharper point of view turns a business into a brand',
      intro: 'A memorable identity starts by deciding what you want people to feel, not only what you want them to see. A clear point of view gives every visual decision somewhere to stand.',
      image: 'assets/project_01.jpg',
      imageAlt: 'Printed brand identity materials on a work surface',
      sections: [
        { heading: 'A brand needs a point of view', paragraphs: ['A business can offer a good service and still be hard to remember. Often, the missing ingredient is not a new logo or a louder campaign; it is a clear idea of what the business stands for and why it should matter to the people it serves.', 'A point of view helps you make choices. It gives your language a tone, gives your visuals a purpose, and helps customers recognise the difference between you and the many other businesses offering something similar.'] },
        { heading: 'Start with the feeling, then build the system', paragraphs: ['Before choosing a colour palette or typeface, ask a simpler question: what should someone feel after meeting this brand for the first time? Calm? Energised? Reassured? Inspired? The answer should influence the entire identity.', 'When the desired feeling is clear, visual decisions become more intentional. The logo, photography, layout, and copy stop behaving like separate pieces and begin to work together as one recognisable experience.'] },
        { heading: 'Consistency makes the idea believable', paragraphs: ['A sharper point of view is only useful when it appears consistently. You do not need to say the same thing in the same way every time, but customers should recognise the same personality across every touchpoint.', 'That is why brand guidelines matter. They make the work easier for everyone on the team while protecting the core idea that makes the brand feel distinct.'] }
      ],
      takeaway: 'The most useful identity is not the one with the most elements. It is the one with the clearest idea behind it.'
    },
    'design-systems': {
      category: 'Design',
      date: '21 Apr 2026',
      dateTime: '2026-04-21',
      readTime: '5 min read',
      title: 'Designing a visual system your team can actually use',
      intro: 'A visual system should make everyday communication easier, not turn every flyer, social post, or presentation into a new design problem.',
      image: 'assets/project_02.jpg',
      imageAlt: 'Creative digital design materials displayed in a workspace',
      sections: [
        { heading: 'Systems are built for the everyday', paragraphs: ['A design system is not only for a major launch. Its real value appears in the everyday moments: a team member creating a post, a sales lead preparing a proposal, or a founder putting together a short presentation.', 'The best systems reduce hesitation. They tell people what to use, how to use it, and where there is room for flexibility.'] },
        { heading: 'Give people rules they can remember', paragraphs: ['Pages of brand guidelines are not useful if no one can find the answer they need. Start with the essential decisions: logo use, core colours, type hierarchy, image direction, spacing, and a few adaptable layout examples.', 'These practical rules make it easier for different people to create materials that still feel part of the same brand.'] },
        { heading: 'Build templates around real tasks', paragraphs: ['A strong template is not simply attractive; it is designed around a job the team needs to do repeatedly. That might be an Instagram carousel, a product promo, a sales deck, or a monthly newsletter.', 'Choose a short list of the materials you create most often and make those templates excellent. You can always add more later.'] }
      ],
      takeaway: 'A useful visual system gives your team freedom with guardrails—not a rigid set of rules that slows the work down.'
    },
    'first-impression': {
      category: 'Growth',
      date: '03 Mar 2026',
      dateTime: '2026-03-03',
      readTime: '3 min read',
      title: 'The small details behind an unforgettable first impression',
      intro: 'Attention is earned in seconds. The right hierarchy, colour, and message give people a reason to pause long enough to understand what makes your business relevant.',
      image: 'assets/project_03.jpg',
      imageAlt: 'A styled campaign visual with bold contrast',
      sections: [
        { heading: 'People scan before they read', paragraphs: ['Most audiences do not absorb every word on a page or graphic. They scan for signals: a bold statement, a recognisable mark, a strong image, or a clear call to action.', 'Good hierarchy respects that behaviour. It makes the most important idea obvious first, then gives the viewer a path into the supporting information.'] },
        { heading: 'Clarity is a creative choice', paragraphs: ['Clarity does not make work boring. It gives the creative idea enough space to land. A simple message, an intentional layout, and a focused visual direction can feel far more confident than a crowded design.', 'When an audience immediately understands what is being offered, you have earned the opportunity to show them more.'] },
        { heading: 'Make the next step obvious', paragraphs: ['A first impression should end with momentum. Decide what you want someone to do next: learn more, make an enquiry, visit, buy, save, or share.', 'Then let the design support that action. A clear next step turns attention into something more useful for the business.'] }
      ],
      takeaway: 'A strong first impression is not accidental. It is the result of deciding what matters most and making that idea easy to see.'
    },
    'brand-refresh': {
      category: 'Branding',
      date: '10 Feb 2026',
      dateTime: '2026-02-10',
      readTime: '4 min read',
      title: 'Five signs it may be time to refresh your brand',
      intro: 'A refresh is not about chasing trends. It is about making sure the way your business looks and speaks still reflects where it is going.',
      image: 'assets/project_04.jpg',
      imageAlt: 'A bold visual identity and creative campaign image',
      sections: [
        { heading: 'Your business has outgrown its first look', paragraphs: ['Many brands begin with a simple identity built to get them started. As the business grows, the original logo, colours, or materials may no longer reflect the quality or ambition of the work.', 'That does not mean the first identity failed. It means the business has earned the right to evolve.'] },
        { heading: 'Your communication feels inconsistent', paragraphs: ['If every social post, flyer, proposal, and advert looks as if it came from a different business, customers may struggle to build a clear picture of who you are.', 'A refresh creates an opportunity to bring those materials into one system and make every interaction feel more connected.'] },
        { heading: 'Your audience or offering has changed', paragraphs: ['New services, a new market, or a new kind of customer often need a new visual emphasis. A refresh helps the identity speak to the people you want to reach now, not the audience you had at the beginning.'] }
      ],
      takeaway: 'The right time to refresh is when your visual identity no longer tells the most accurate story about your business.'
    },
    'social-templates': {
      category: 'Design',
      date: '22 Jan 2026',
      dateTime: '2026-01-22',
      readTime: '3 min read',
      title: 'Why useful social templates protect your brand',
      intro: 'Templates do more than make content faster. They make sure every useful, timely message still feels like it comes from the same confident brand.',
      image: 'assets/project_05.jpg',
      imageAlt: 'Campaign and print visual materials arranged on a surface',
      sections: [
        { heading: 'Consistency does not have to feel repetitive', paragraphs: ['A good social media system uses consistent ingredients—type, colours, spacing, image treatments—while allowing the message itself to change.', 'This gives the feed a recognisable rhythm without making every post look identical.'] },
        { heading: 'Templates free up creative attention', paragraphs: ['When the structure already works, your team can focus on the message, the offer, and the audience. That is better than recreating the basic layout every time a new post is needed.', 'Templates are especially useful for recurring content such as promotions, product highlights, event reminders, quotes, and educational posts.'] },
        { heading: 'Design for the people who will use it', paragraphs: ['The best template is designed around the real tools and skills of the people creating content. Simple, clear files are more likely to be used correctly and consistently.', 'A little practical thinking at the start protects the quality of the brand every day.'] }
      ],
      takeaway: 'Social templates are a small investment that make your visual identity easier to protect at scale.'
    },
    'campaign-clarity': {
      category: 'Growth',
      date: '08 Dec 2025',
      dateTime: '2025-12-08',
      readTime: '4 min read',
      title: 'Start every campaign with one clear creative question',
      intro: 'A campaign becomes easier to design when the central question is clear. What should this audience understand, feel, or do after seeing this work?',
      image: 'assets/about2.jpg',
      imageAlt: 'Two colleagues reviewing a creative presentation',
      sections: [
        { heading: 'A question gives the campaign focus', paragraphs: ['Campaigns often have many messages competing for space: product information, pricing, brand storytelling, an event, a new offer, and a call to action.', 'A central question helps decide what belongs. It gives the campaign a single direction instead of asking every visual to do everything at once.'] },
        { heading: 'Use the answer to shape the visual idea', paragraphs: ['Once the campaign question is clear, the creative direction becomes easier to choose. The image, colour, headline, and composition can all support the same idea.', 'This is what makes campaigns feel cohesive across social posts, flyers, digital ads, presentations, and physical materials.'] },
        { heading: 'Keep the goal visible through delivery', paragraphs: ['As a campaign grows, it is easy to add more messages and lose the original focus. Return to the central question whenever a new asset is created.', 'It is a simple way to protect clarity from the first concept to the final output.'] }
      ],
      takeaway: 'One well-defined creative question can keep an entire campaign focused, connected, and easier to remember.'
    },
    'brand-foundations-nigeria': {
      category: 'Growth',
      date: '15 Nov 2026',
      dateTime: '2026-11-15',
      readTime: '5 min read',
      title: 'A practical brand checklist for growing businesses in Nigeria',
      intro: 'For a growing business, a brand is more than a logo. It is the set of signals that helps people understand what you offer, why it matters, and why they should remember you.',
      image: 'assets/about.jpg',
      imageAlt: 'African creative team collaborating around a workspace',
      sections: [
        { heading: 'Start with one useful business sentence', paragraphs: ['Before refining colours, type, or content templates, make sure your business can explain itself in plain language. What do you help people do, who is it for, and what makes your approach worth choosing?', 'That sentence does not need to sound like a slogan. It is a working tool. It keeps your website, pitch, social content, and design decisions connected to the same core idea.'] },
        { heading: 'Make the offer easy to recognise', paragraphs: ['People often discover a business in fragments: a social post, a flyer, a recommendation, a Google result, or a quick conversation. Each moment should make it easier—not harder—to recognise the offer and understand the next step.', 'A clear name, a consistent logo, useful contact details, and a direct call to action do more for trust than an overloaded design ever can.'] },
        { heading: 'Give everyday materials a shared system', paragraphs: ['A brand becomes believable when the essentials work together. Start with the materials your team actually uses: your profile, social graphics, proposal or presentation, flyer, invoice, packaging, or customer message.', 'Choose a manageable set of colours, type rules, image direction, and layout examples. A small system used consistently is more valuable than a large guideline document no one opens.'] },
        { heading: 'Plan visibility beyond the launch', paragraphs: ['A new identity is only the beginning. Plan a simple rhythm for showing the work: explain your offer, share useful insight, show a project process, answer common questions, and point people toward the next action.', 'Consistency does not mean posting constantly. It means every visible piece feels like it belongs to the same thoughtful business.'] }
      ],
      takeaway: 'The strongest brand foundation is not the most complicated one. It is the one your customers can understand and your team can use every day.'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'brand-viewpoint';
  const post = posts[slug];
  const $ = (selector) => root.querySelector(selector);
  const escapeHtml = (value = '') => value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  if (!post) {
    root.innerHTML = '<section class="page-section"><div class="container"><span class="eyebrow">Not found</span><h1 class="section-title">That post is no longer available.</h1><p class="post-not-found">Try the journal for more useful ideas on branding and design.</p><a class="button button--lime" href="blog.html">Visit the journal <span aria-hidden="true">↗</span></a></div></section>';
    return;
  }

  document.title = `${post.title} — Ambassador Cre8tive`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', post.intro.slice(0, 155));
  const postSchema = document.querySelector('[data-post-schema]');
  if (postSchema) {
    postSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.intro,
      image: new URL(post.image, window.location.href).href, datePublished: post.dateTime,
      author: { '@type': 'Organization', name: 'Ambassador Cre8tive' },
      publisher: { '@type': 'Organization', name: 'Ambassador Cre8tive' }
    });
  }
  document.querySelector('[data-post-category]').textContent = post.category;
  document.querySelector('[data-post-date]').textContent = post.date;
  document.querySelector('[data-post-date]').dateTime = post.dateTime;
  document.querySelector('[data-post-read-time]').textContent = post.readTime;
  document.querySelector('[data-post-title]').textContent = post.title;
  document.querySelector('[data-post-intro]').textContent = post.intro;
  const image = document.querySelector('[data-post-image]');
  image.src = post.image;
  image.alt = post.imageAlt;

  const body = $('[data-post-body]');
  body.innerHTML = post.sections.map((section) => `
    <section>
      <h2>${section.heading}</h2>
      ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
    </section>
  `).join('') + `<blockquote>${post.takeaway}</blockquote>`;

  const likesKey = `ambassador-cre8tive:likes:${slug}`;
  const commentsKey = `ambassador-cre8tive:comments:${slug}`;
  const likeButton = $('[data-like-button]');
  const likeCount = $('[data-like-count]');
  const commentsList = $('[data-comments-list]');
  const commentsCount = $('[data-comments-count]');
  const shareButton = $('[data-share-button]');
  const shareStatus = $('[data-share-status]');
  const commentForm = $('[data-comment-form]');

  const getLikes = () => Number(localStorage.getItem(likesKey) || 0);
  const isLiked = () => localStorage.getItem(`${likesKey}:mine`) === 'true';
  const updateLikes = () => {
    const liked = isLiked();
    likeCount.textContent = getLikes();
    likeButton.setAttribute('aria-pressed', String(liked));
    likeButton.classList.toggle('is-liked', liked);
    likeButton.querySelector('[data-like-label]').textContent = liked ? 'Liked' : 'Like';
  };
  try { updateLikes(); } catch { likeCount.textContent = '0'; }

  likeButton?.addEventListener('click', () => {
    try {
      const liked = isLiked();
      localStorage.setItem(`${likesKey}:mine`, String(!liked));
      localStorage.setItem(likesKey, String(Math.max(0, getLikes() + (liked ? -1 : 1))));
      updateLikes();
    } catch {
      if (shareStatus) shareStatus.textContent = 'Likes are unavailable in this browser.';
    }
  });

  shareButton?.addEventListener('click', async () => {
    const shareData = { title: post.title, text: post.intro, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        if (shareStatus) shareStatus.textContent = 'Thanks for sharing this post.';
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        if (shareStatus) shareStatus.textContent = 'Link copied to your clipboard.';
      } else {
        window.prompt('Copy this link:', window.location.href);
      }
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
    commentsCount.textContent = comments.length;
    if (!comments.length) {
      commentsList.innerHTML = '<p class="comments-empty">No comments yet. Be the first to share a thoughtful response.</p>';
      return;
    }
    commentsList.innerHTML = comments.map((comment) => `
      <article class="comment-item">
        <div><strong>${escapeHtml(comment.name)}</strong><time datetime="${escapeHtml(comment.dateTime)}">${escapeHtml(comment.date)}</time></div>
        <p>${escapeHtml(comment.message).replace(/\n/g, '<br>')}</p>
      </article>
    `).join('');
  };
  renderComments();

  commentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!commentForm.checkValidity()) {
      commentForm.reportValidity();
      return;
    }
    const data = new FormData(commentForm);
    const now = new Date();
    const comment = {
      name: String(data.get('name') || '').trim(),
      message: String(data.get('message') || '').trim(),
      date: now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      dateTime: now.toISOString()
    };
    try {
      const comments = getComments();
      comments.unshift(comment);
      localStorage.setItem(commentsKey, JSON.stringify(comments));
      commentForm.reset();
      renderComments();
      const status = $('[data-comment-status]');
      if (status) status.textContent = 'Your comment has been added in this browser.';
    } catch {
      const status = $('[data-comment-status]');
      if (status) status.textContent = 'Your comment could not be saved in this browser.';
    }
  });
})();
