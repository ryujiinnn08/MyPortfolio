/* ===================================================================
   Main Module
   Page loader, skeleton loaders, scroll reveal, and initialization.
   =================================================================== */

(function () {
  'use strict';

  // ---------- Page Loader ----------
  function initPageLoader() {
    const loader = document.getElementById('pageLoader');

    // Hide loader when everything is ready
    window.addEventListener('load', () => {
      // Small delay so the animation is visible
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 800);
    });

    // Safety fallback — hide after 4 seconds max
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 4000);
  }

  // ---------- Skeleton Loaders ----------
  function initSkeletonLoaders() {
    const heroPhoto = document.getElementById('heroPhoto');
    const heroPhotoSkeleton = document.getElementById('heroPhotoSkeleton');

    if (heroPhoto && heroPhotoSkeleton) {
      // If image is already cached/loaded
      if (heroPhoto.complete && heroPhoto.naturalHeight !== 0) {
        showHeroPhoto();
      } else {
        heroPhoto.addEventListener('load', showHeroPhoto);
        heroPhoto.addEventListener('error', () => {
          // Keep skeleton visible on error
          heroPhotoSkeleton.style.display = 'block';
        });
      }
    }

    function showHeroPhoto() {
      heroPhotoSkeleton.style.display = 'none';
      heroPhoto.style.display = 'block';
      heroPhoto.style.animation = 'fadeIn 0.5s ease forwards';
    }
  }

  // ---------- Scroll Reveal ----------
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // ---------- Navigation ----------
  function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const nav = document.getElementById('mainNav');

    // Mobile menu toggle
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
      });

      // Close menu on link click
      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navToggle.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }

    // Scroll-based nav styling
    let lastScrollY = 0;

    window.addEventListener(
      'scroll',
      () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 80) {
          nav.style.boxShadow = '0 1px 20px rgba(0,0,0,0.04)';
        } else {
          nav.style.boxShadow = 'none';
        }

        lastScrollY = currentScrollY;
      },
      { passive: true }
    );
  }

  // ---------- Smooth Scroll for Nav Links ----------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const navHeight = document.getElementById('mainNav').offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      });
    });
  }

  // ---------- Add fadeIn keyframes dynamically ----------
  function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- Initialize Everything ----------
  function init() {
    addDynamicStyles();
    initPageLoader();
    initSkeletonLoaders();
    initNavigation();
    initSmoothScroll();

    // Delay scroll reveal slightly so initial elements are positioned
    requestAnimationFrame(() => {
      initScrollReveal();
    });

    // Initialize gallery
    Gallery.init();

    // Apply security measures
    Watermark.applySecurity();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
