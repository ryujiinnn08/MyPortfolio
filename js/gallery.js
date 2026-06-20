/* ===================================================================
   Gallery Module
   Horizontal scrolling showroom with auto-scroll, drag/swipe,
   and lightbox integration.
   =================================================================== */

const Gallery = (() => {
  // Design files (web-optimized)
  const DESIGNS = [
    { src: 'photos/designs/web/ACTIVITY-1.jpg', alt: 'Design 1' },
    { src: 'photos/designs/web/ACTIVITY-2.jpg', alt: 'Design 2' },
    { src: 'photos/designs/web/Bulletin_JBECP.jpg', alt: 'Design 3' },
    { src: 'photos/designs/web/INVITE.jpg', alt: 'Design 4' },
    { src: 'photos/designs/web/NSTP4.jpg', alt: 'Design 5' },
    { src: 'photos/designs/web/QRJBECP.jpg', alt: 'Design 6' },
    { src: 'photos/designs/web/ZERO-POINT.jpg', alt: 'Design 7' },
  ];

  // State
  let track = null;
  let container = null;
  let images = [];
  let autoScrollSpeed = 0.5;
  const SPEED_NORMAL = 0.5;
  const SPEED_SLOW = 0.12;
  let autoScrollPosition = 0;
  let isAutoScrolling = true;
  let isDragging = false;
  let dragStartX = 0;
  let dragScrollLeft = 0;
  let animationFrame = null;
  let currentLightboxIndex = 0;
  let loadedImages = new Map();
  let hasDragged = false;

  /**
   * Initialize the gallery
   */
  function init() {
    track = document.getElementById('galleryTrack');
    container = document.getElementById('galleryContainer');

    if (!track || !container) return;

    // Build skeleton items first
    buildSkeletons();

    // Load all images, then build gallery
    loadAllImages().then(() => {
      buildGalleryItems();
      setupAutoScroll();
      setupDragScroll();
      setupTouchScroll();
      setupLightbox();
    });
  }

  /**
   * Show skeleton loaders while images load
   */
  function buildSkeletons() {
    track.innerHTML = '';
    for (let i = 0; i < DESIGNS.length; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'gallery-item skeleton skeleton-gallery-item';
      skeleton.id = `gallery-skeleton-${i}`;
      track.appendChild(skeleton);
    }
  }

  /**
   * Load all images with caching
   */
  async function loadAllImages() {
    const cacheAvailable = 'caches' in window;
    let cache = null;

    if (cacheAvailable) {
      try {
        cache = await caches.open('portfolio-designs-v1');
      } catch (e) {
        // Cache API not available, proceed without
      }
    }

    const promises = DESIGNS.map(async (design, index) => {
      return new Promise(async (resolve) => {
        const img = new Image();

        // Try loading from cache first
        if (cache) {
          try {
            const cachedResponse = await cache.match(design.src);
            if (cachedResponse) {
              const blob = await cachedResponse.blob();
              img.src = URL.createObjectURL(blob);
              img.onload = () => {
                loadedImages.set(index, img);
                resolve();
              };
              img.onerror = () => {
                // Fallback to network
                loadFromNetwork(img, design.src, cache, index, resolve);
              };
              return;
            }
          } catch (e) {
            // Fallback to network
          }
        }

        loadFromNetwork(img, design.src, cache, index, resolve);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Load image from network and cache it
   */
  function loadFromNetwork(img, src, cache, index, resolve) {
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = async () => {
      loadedImages.set(index, img);

      // Cache the image
      if (cache) {
        try {
          const response = await fetch(src);
          await cache.put(src, response);
        } catch (e) {
          // Caching failed, not critical
        }
      }

      resolve();
    };

    img.onerror = () => {
      console.warn(`Failed to load: ${src}`);
      resolve();
    };
  }

  /**
   * Build the gallery items with watermarked canvases
   */
  function buildGalleryItems() {
    track.innerHTML = '';

    // Create items for original + duplicated set (for seamless loop)
    const totalSets = 3;

    for (let set = 0; set < totalSets; set++) {
      DESIGNS.forEach((design, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.index = index;
        item.dataset.set = set;

        const canvas = document.createElement('canvas');
        canvas.setAttribute('draggable', 'false');

        const img = loadedImages.get(index);
        if (img) {
          item.appendChild(canvas);

          // Render after DOM insertion
          requestAnimationFrame(() => {
            Watermark.renderImageToCanvas(canvas, img);
          });
        }

        // View indicator
        const indicator = document.createElement('div');
        indicator.className = 'view-indicator';
        indicator.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        `;
        item.appendChild(indicator);

        track.appendChild(item);
      });
    }
  }

  /**
   * Auto-scroll animation
   */
  function setupAutoScroll() {
    function animate() {
      if (isAutoScrolling && !isDragging) {
        autoScrollPosition += autoScrollSpeed;

        // Calculate the width of one full set of items
        const itemWidth = 300 + 32; // item width + gap
        const oneSetWidth = DESIGNS.length * itemWidth;

        // Reset position when past the first set to create infinite loop
        if (autoScrollPosition >= oneSetWidth) {
          autoScrollPosition -= oneSetWidth;
        }

        track.style.transform = `translateX(-${autoScrollPosition}px)`;
      }

      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    // Slow down on hover instead of stopping
    container.addEventListener('mouseenter', () => {
      autoScrollSpeed = SPEED_SLOW;
    });

    container.addEventListener('mouseleave', () => {
      if (!isDragging) {
        autoScrollSpeed = SPEED_NORMAL;
      }
    });
  }

  /**
   * Mouse drag scrolling (PC)
   */
  function setupDragScroll() {
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasDragged = false;
      isAutoScrolling = false;
      autoScrollSpeed = SPEED_SLOW;
      dragStartX = e.pageX;
      dragScrollLeft = autoScrollPosition;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.pageX - dragStartX;
      if (Math.abs(deltaX) > 5) {
        hasDragged = true;
      }
      autoScrollPosition = dragScrollLeft - deltaX;

      // Clamp to prevent negative scroll
      const itemWidth = 300 + 32;
      const oneSetWidth = DESIGNS.length * itemWidth;
      const maxScroll = oneSetWidth * 2;

      if (autoScrollPosition < 0) autoScrollPosition = 0;
      if (autoScrollPosition > maxScroll) autoScrollPosition = maxScroll;

      track.style.transform = `translateX(-${autoScrollPosition}px)`;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      // Resume auto-scroll after a delay
      setTimeout(() => {
        isAutoScrolling = true;
        if (!container.matches(':hover')) {
          autoScrollSpeed = SPEED_NORMAL;
        } else {
          autoScrollSpeed = SPEED_SLOW;
        }
      }, 500);
    });
  }

  /**
   * Touch/swipe scrolling (Mobile)
   */
  function setupTouchScroll() {
    let touchStartX = 0;
    let touchScrollLeft = 0;

    container.addEventListener('touchstart', (e) => {
      isAutoScrolling = false;
      autoScrollSpeed = SPEED_SLOW;
      hasDragged = false;
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = autoScrollPosition;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].pageX - touchStartX;
      if (Math.abs(deltaX) > 5) {
        hasDragged = true;
      }
      autoScrollPosition = touchScrollLeft - deltaX;

      const itemWidth = 300 + 32;
      const oneSetWidth = DESIGNS.length * itemWidth;
      const maxScroll = oneSetWidth * 2;

      if (autoScrollPosition < 0) autoScrollPosition = 0;
      if (autoScrollPosition > maxScroll) autoScrollPosition = maxScroll;

      track.style.transform = `translateX(-${autoScrollPosition}px)`;
    }, { passive: true });

    container.addEventListener('touchend', () => {
      setTimeout(() => {
        isAutoScrolling = true;
        autoScrollSpeed = SPEED_NORMAL;
      }, 2000);
    }, { passive: true });
  }

  /**
   * Lightbox setup
   */
  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxCanvas = document.getElementById('lightboxCanvas');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');

    // Click on gallery item to open lightbox
    container.addEventListener('click', (e) => {
      // Don't open if user was dragging
      if (hasDragged) return;

      const item = e.target.closest('.gallery-item');
      if (!item) return;

      const index = parseInt(item.dataset.index);
      if (isNaN(index)) return;

      openLightbox(index);
    });

    function openLightbox(index) {
      currentLightboxIndex = index;
      renderLightboxDesign(index);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      updateCounter();
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function renderLightboxDesign(index) {
      const img = loadedImages.get(index);
      if (!img) return;

      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.85;

      Watermark.renderLightboxImage(lightboxCanvas, img, maxWidth, maxHeight);
    }

    function updateCounter() {
      lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${DESIGNS.length}`;
    }

    function navigate(direction) {
      currentLightboxIndex = (currentLightboxIndex + direction + DESIGNS.length) % DESIGNS.length;
      renderLightboxDesign(currentLightboxIndex);
      updateCounter();
    }

    // Event listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigate(-1));
    lightboxNext.addEventListener('click', () => navigate(1));

    // Click outside to close
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          navigate(-1);
          break;
        case 'ArrowRight':
          navigate(1);
          break;
      }
    });
  }

  return { init };
})();
