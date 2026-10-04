(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Short branded loading sequence. It never waits for remote libraries.
  const loader = $('.loader');
  const dismissLoader = () => loader?.classList.add('loaded');
  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader, { once: true });
  window.setTimeout(dismissLoader, 250);

  const header = $('#site-header');
  const root = document.documentElement;
  const stepSections = $$('.step-section');
  const currentStep = $('.progress-current');
  const desktopLinks = $$('.desktop-nav a');
  let ticking = false;

  function updatePageUI() {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const percentage = Math.min(100, (y / max) * 100);
    root.style.setProperty('--page-progress', `${percentage}%`);
    header?.classList.toggle('scrolled', y > 80);

    const viewportFocus = window.innerHeight * 0.48;
    let closest = stepSections[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    stepSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      let distance;
      if (rect.top <= viewportFocus && rect.bottom >= viewportFocus) distance = 0;
      else distance = Math.min(Math.abs(rect.top - viewportFocus), Math.abs(rect.bottom - viewportFocus));
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = section;
      }
    });

    if (closest) {
      const step = closest.dataset.step || '01';
      if (currentStep && currentStep.textContent !== step) currentStep.textContent = step;
      desktopLinks.forEach((link) => {
        const target = link.getAttribute('href')?.slice(1);
        link.classList.toggle('active', Boolean(closest.id && target === closest.id));
      });
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updatePageUI);
    }
  }, { passive: true });
  updatePageUI();

  // Accessible, full-screen mobile navigation.
  const menuButton = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const menuLinks = $$('a', mobileMenu || document.createElement('div'));

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (open) window.setTimeout(() => menuLinks[0]?.focus(), 380);
  }

  menuButton?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  // Graceful native smooth-scroll fallback (Lenis handles desktop when available).
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const destination = $(id);
      if (!destination) return;
      event.preventDefault();
      if (window.lenis && !reducedMotion) window.lenis.scrollTo(destination, { offset: -60, duration: 1.15 });
      else destination.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Purposeful reveal treatment for non-pinned content.
  const revealItems = $$('.program-card, .stat-row > div, .contact-card, .enquire-content');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item, index) => {
      item.classList.add('reveal');
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('in-view'));
  }

  // Custom contextual cursor — never enabled for touch users.
  if (finePointer && !reducedMotion) {
    const cursor = $('.cursor');
    const cursorLabel = $('.cursor span');
    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;

    window.addEventListener('pointermove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursor?.classList.remove('is-hidden');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => cursor?.classList.add('is-hidden'));

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.19;
      cursorY += (mouseY - cursorY) * 0.19;
      if (cursor) cursor.style.transform = `translate3d(${cursorX}px,${cursorY}px,0) translate(-50%,-50%)`;
      window.requestAnimationFrame(renderCursor);
    };
    renderCursor();

    $$('a, button, [data-cursor], .classroom-stage').forEach((element) => {
      element.addEventListener('mouseenter', () => {
        const label = element.dataset.cursor || (element.matches('.classroom-stage') ? 'EXPLORE' : '');
        if (cursorLabel) cursorLabel.textContent = label;
        cursor?.classList.add('is-hover');
      });
      element.addEventListener('mouseleave', () => cursor?.classList.remove('is-hover'));
    });

    $$('.magnetic').forEach((element) => {
      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.13;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        element.style.transform = `translate3d(${x}px,${y}px,0)`;
      });
      element.addEventListener('mouseleave', () => { element.style.transform = ''; });
    });
  }

  // Mobile journey cards activate as each step enters the reading zone.
  if (isMobile && 'IntersectionObserver' in window) {
    const journeyCards = $$('.journey-card');
    const journeyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        journeyCards.forEach((card) => card.classList.toggle('active', card === entry.target));
      });
    }, { threshold: 0.62 });
    journeyCards.forEach((card) => journeyObserver.observe(card));
  }

  const canAnimate = !reducedMotion && window.gsap && window.ScrollTrigger;
  if (!canAnimate) {
    root.classList.add('no-motion-engine');
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Weighted scrolling that remains responsive and user-controlled.
  if (window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.08,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.1,
      syncTouch: false
    });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Hero: the next chapter visually takes over the first.
  if (!isMobile) {
    const heroTimeline = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
    heroTimeline
      .to('.hero-symbol', { y: (index) => index % 2 ? 110 : -90, rotate: 22, ease: 'none' }, 0)
      .to('.hero-ring', { y: -70, scale: 1.12, ease: 'none' }, 0)
      .to('.hero-copy', { yPercent: -30, ease: 'none' }, .08)
      .to('.hero-composition', { yPercent: -16, scale: .92, rotate: -1, ease: 'none' }, .12)
      .to('.hero-actions', { autoAlpha: 0, y: -20, ease: 'none' }, .32)
      .to('.hero-stage', { scale: .92, autoAlpha: .08, borderRadius: '0 0 40px 40px', ease: 'none' }, .48);
  }

  // Belief cards compress with depth while the statement remains anchored.
  $$('.belief-card').forEach((card, index, cards) => {
    if (index === cards.length - 1) return;
    gsap.to(card, {
      scale: .91 - index * .02,
      autoAlpha: .48,
      scrollTrigger: {
        trigger: cards[index + 1],
        start: 'top 70%',
        end: 'top 18%',
        scrub: .7
      }
    });
  });

  // Horizontal student journey, driven by vertical scroll.
  if (!isMobile) {
    const journeyTrack = $('.journey-track');
    const journeyCards = $$('.journey-card');
    const journeyCurrent = $('.journey-current');
    const journeyFill = $('.journey-counter i b');
    const journeyDistance = () => Math.max(0, journeyTrack.scrollWidth - window.innerWidth + window.innerWidth * .08);

    gsap.to(journeyTrack, {
      x: () => -journeyDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.journey',
        start: 'top top',
        end: () => `+=${Math.max(window.innerWidth * 2.8, journeyDistance() * 1.45)}`,
        pin: true,
        scrub: .65,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const index = Math.min(journeyCards.length - 1, Math.floor(self.progress * journeyCards.length));
          journeyCards.forEach((card, cardIndex) => card.classList.toggle('active', index === cardIndex));
          if (journeyCurrent) journeyCurrent.textContent = String(index + 1).padStart(2, '0');
          if (journeyFill) journeyFill.style.width = `${(index + 1) * 20}%`;
        }
      }
    });
  }

  // Programs emerge from behind the oversized editorial heading.
  const programsTimeline = gsap.timeline({
    scrollTrigger: { trigger: '.programs', start: 'top 78%', end: 'top 8%', scrub: .8 }
  });
  programsTimeline
    .fromTo('.programs-intro h2 span', { scale: 1.34, y: 90 }, { scale: 1, y: 0, transformOrigin: 'center', ease: 'none' }, 0)
    .fromTo('.programs-intro h2 em', { y: 115, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'none' }, .18)
    .fromTo('.program-grid', { y: 150 }, { y: 0, ease: 'none' }, .35);

  // Sequential feature activation and vertical measure.
  const whyFeatures = $$('.why-feature');
  whyFeatures.forEach((feature, index) => {
    ScrollTrigger.create({
      trigger: feature,
      start: 'top 58%',
      end: 'bottom 42%',
      onEnter: () => activateWhy(index),
      onEnterBack: () => activateWhy(index)
    });
  });
  function activateWhy(index) {
    whyFeatures.forEach((feature, featureIndex) => feature.classList.toggle('active', featureIndex === index));
    root.style.setProperty('--why-progress', `${((index + 1) / whyFeatures.length) * 100}%`);
  }
  gsap.to('.why-orbit', {
    rotate: 130,
    scrollTrigger: { trigger: '.why', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
  });

  // Slow cinematic classroom reveal.
  gsap.fromTo('.classroom-stage img', { scale: 1.15 }, {
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.classroom', start: 'top bottom', end: 'bottom top', scrub: .9 }
  });
  gsap.to('.label-focus', { y: -80, scrollTrigger: { trigger: '.classroom', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to('.label-guidance', { y: 65, scrollTrigger: { trigger: '.classroom', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to('.label-growth', { y: -45, scrollTrigger: { trigger: '.classroom', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // Reviews move horizontally; the focused card gains scale.
  if (!isMobile) {
    const reviewTrack = $('.review-track');
    const reviewCards = $$('.review-card');
    const reviewDistance = () => Math.max(0, reviewTrack.scrollWidth - window.innerWidth + window.innerWidth * .05);
    gsap.to(reviewTrack, {
      x: () => -reviewDistance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.reviews',
        start: 'top top',
        end: () => `+=${Math.max(window.innerWidth * 1.25, reviewDistance() * 1.8)}`,
        pin: true,
        scrub: .75,
        invalidateOnRefresh: true,
        onUpdate: () => {
          const center = window.innerWidth / 2;
          reviewCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const distance = Math.abs(rect.left + rect.width / 2 - center);
            const scale = Math.max(.92, 1.035 - (distance / window.innerWidth) * .12);
            card.style.transform = `scale(${scale})`;
          });
        }
      }
    });
  }

  // Communication and personality panels take turns leading the frame.
  if (!isMobile) {
    const splitTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.split-stage',
        start: 'top top',
        end: '+=190%',
        pin: true,
        scrub: .85
      }
    });
    splitTimeline
      .to('.speak-panel', { flexGrow: 1.55, ease: 'power1.inOut', duration: 1 })
      .to('.grow-panel', { flexGrow: .75, ease: 'power1.inOut', duration: 1 }, '<')
      .to('.speak-panel', { flexGrow: .75, ease: 'power1.inOut', duration: 1 })
      .to('.grow-panel', { flexGrow: 1.55, ease: 'power1.inOut', duration: 1 }, '<')
      .to('.split-panel', { flexGrow: 1, ease: 'power1.inOut', duration: 1 });
  }

  // Verified numbers animate once; no invented claims are introduced.
  const stats = $$('.stat-row strong');
  ScrollTrigger.create({
    trigger: '.stat-row',
    start: 'top 78%',
    once: true,
    onEnter: () => {
      const values = [
        (p) => `${Math.round(5 * p)}–${Math.round(12 * p)}`,
        (p) => `${Math.round(10 * p)}th`,
        (p) => `${Math.round(12 * p)}th`,
        (p) => `${(4.9 * p).toFixed(1)}+<sup>★</sup>`
      ];
      stats.forEach((stat, index) => {
        const state = { progress: 0 };
        gsap.to(state, {
          progress: 1,
          duration: 1.35,
          delay: index * .1,
          ease: 'power3.out',
          onUpdate: () => { stat.innerHTML = values[index](state.progress); }
        });
      });
    }
  });

  // Emotional climax: one thought per scroll, then a bright final decision.
  const futureLines = $$('.future-lines p');
  const futureTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '.future',
      start: 'top top',
      end: '+=360%',
      pin: true,
      scrub: .85
    }
  });

  futureLines.forEach((line, index) => {
    if (index === 0) {
      futureTimeline.to(line, { autoAlpha: 0, yPercent: -140, scale: 1.06, duration: .65, ease: 'none' });
    } else {
      futureTimeline.fromTo(line,
        { autoAlpha: 0, yPercent: 55, scale: .92 },
        { autoAlpha: 1, yPercent: -50, scale: 1, duration: .65, ease: 'none' }, '>-0.05');
      futureTimeline.to(line, { autoAlpha: 0, yPercent: -140, scale: 1.06, duration: .65, ease: 'none' });
    }
  });

  futureTimeline
    .to('.future-stage', { backgroundColor: '#f4f0e7', color: '#07192f', duration: .75, ease: 'none' }, '>-0.1')
    .to('.future-index', { color: 'rgba(7,25,47,.55)', duration: .25 }, '<')
    .to('.future-sun', { autoAlpha: .9, scale: 1, duration: .8, ease: 'power2.out' }, '<')
    .to('.future-finale', { autoAlpha: 1, y: 0, duration: .65, ease: 'power2.out' }, '<.15');

  // Refresh after fonts are ready so horizontal distances and pin spacers are exact.
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();
