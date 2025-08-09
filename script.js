// Datorteknik Website JavaScript (robust, no inline CSS injection)
document.addEventListener('DOMContentLoaded', function() {
  // 1) Smooth scrolling for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 2) Collect potential nav links from common containers
  const navLinks = Array.from(document.querySelectorAll('header .nav a, .navbar a'))
    // only keep same-page hash links for active-state tracking
    .filter(a => a.getAttribute('href') && a.getAttribute('href').startsWith('#'));

  // 3) Scroll spy: add 'active' to nav link for section in view
  function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + 100;

    let activeId = null;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        activeId = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      if (id && id === activeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Throttle scroll spy with rAF
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        updateActiveNavigation();
        ticking = false;
      });
      ticking = true;
    }
  });
  updateActiveNavigation();

  // 4) Animate cards/resources when entering viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.card, .resource-item').forEach(el => io.observe(el));

  // 5) Keyboard navigation focus handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
  });
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  // 6) Footer year if #y exists
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
