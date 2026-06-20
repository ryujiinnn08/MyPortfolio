/* ===================================================================
   Watermark & Security Module
   Renders canvas-based watermarks on portfolio images
   and applies client-side protection measures.
   =================================================================== */

const Watermark = (() => {
  const WATERMARK_TEXT = 'Francis Aaron R. Ruzgal';
  const WATERMARK_OPACITY = 0.3;
  const WATERMARK_FONT_SIZE = 24;
  const WATERMARK_ANGLE = -30;
  const WATERMARK_SPACING = 140;

  /**
   * Draw a repeating diagonal watermark on a canvas context
   */
  function applyWatermark(ctx, width, height, opts = {}) {
    const text = opts.text || WATERMARK_TEXT;
    const opacity = opts.opacity || WATERMARK_OPACITY;
    const fontSize = opts.fontSize || WATERMARK_FONT_SIZE;
    const angle = opts.angle || WATERMARK_ANGLE;
    const spacing = opts.spacing || WATERMARK_SPACING;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `700 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    // Rotate canvas
    const radians = (angle * Math.PI) / 180;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(radians);

    // Calculate coverage area (larger than canvas due to rotation)
    const diagonal = Math.sqrt(width * width + height * height);
    const startX = -diagonal / 2;
    const startY = -diagonal / 2;
    const endX = diagonal / 2;
    const endY = diagonal / 2;

    for (let y = startY; y < endY; y += spacing) {
      for (let x = startX; x < endX; x += spacing + ctx.measureText(text).width) {
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
    }

    ctx.restore();
  }

  /**
   * Render an image onto a canvas element with watermark
   */
  function renderImageToCanvas(canvas, img, opts = {}) {
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match image aspect ratio within container
    const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 340;
    const containerHeight = canvas.parentElement ? canvas.parentElement.clientHeight : 420;

    // Use device pixel ratio for crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';

    ctx.scale(dpr, dpr);

    // Draw image covering the canvas (object-fit: cover behavior)
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = containerWidth / containerHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > canvasRatio) {
      drawHeight = containerHeight;
      drawWidth = containerHeight * imgRatio;
      drawX = (containerWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = containerWidth;
      drawHeight = containerWidth / imgRatio;
      drawX = 0;
      drawY = (containerHeight - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Apply watermark
    applyWatermark(ctx, containerWidth, containerHeight, opts);

    return canvas;
  }

  /**
   * Render an image for lightbox (larger, with watermark)
   */
  function renderLightboxImage(canvas, img, maxWidth, maxHeight) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Calculate dimensions to fit within max bounds
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let displayWidth, displayHeight;

    if (img.naturalWidth / maxWidth > img.naturalHeight / maxHeight) {
      displayWidth = Math.min(img.naturalWidth, maxWidth);
      displayHeight = displayWidth / imgRatio;
    } else {
      displayHeight = Math.min(img.naturalHeight, maxHeight);
      displayWidth = displayHeight * imgRatio;
    }

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Apply watermark with larger font for lightbox
    applyWatermark(ctx, displayWidth, displayHeight, {
      fontSize: 28,
      opacity: 0.25,
      spacing: 160
    });

    return canvas;
  }

  /**
   * Apply security measures to the document
   */
  function applySecurity() {
    // Prevent right-click on gallery and lightbox
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.gallery-track-container') ||
          e.target.closest('.lightbox') ||
          e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    });

    // Prevent drag on all images and canvases
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    });

    // Console warning
    console.log(
      '%c⚠ NOTICE',
      'color: #1A1A1A; font-size: 20px; font-weight: 800;'
    );
    console.log(
      '%cAll designs on this portfolio are the intellectual property of Francis Aaron R. Ruzgal.\nUnauthorized reproduction or distribution is prohibited.',
      'color: #555; font-size: 13px;'
    );

    // Prevent keyboard shortcuts for saving
    document.addEventListener('keydown', (e) => {
      // Block Ctrl+S on gallery/lightbox focus
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (document.querySelector('.lightbox.active')) {
          e.preventDefault();
        }
      }
    });
  }

  return {
    applyWatermark,
    renderImageToCanvas,
    renderLightboxImage,
    applySecurity
  };
})();
