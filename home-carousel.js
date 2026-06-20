// home-carousel.js
import { db, collection, getDocs, query, where } from "./firebase.js";

let currentSlide = 0;
let slides = [];
let autoSlideInterval = null;

async function loadFeaturedCarousel() {
  const container = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!container) return;

  container.innerHTML = '<div class="carousel-loading">Loading featured cars...</div>';

  try {
    // Get all approved listings
    const q = query(collection(db, "listings"), where("status", "==", "approved"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="carousel-empty">
          <p>No cars available yet.</p>
          <a href="browse.html" class="button button-accent" style="margin-top:12px;">Browse All</a>
        </div>
      `;
      return;
    }

    // Collect all approved cars
    const allCars = [];
    querySnapshot.forEach(doc => allCars.push({ id: doc.id, ...doc.data() }));

    // Shuffle and pick 3 random cars
    const shuffled = allCars.sort(() => Math.random() - 0.5);
    slides = shuffled.slice(0, 3);

    // If less than 3 cars, just show what we have
    if (slides.length === 0) return;

    // Build carousel slides
    container.innerHTML = '';
    slides.forEach((car, index) => {
      const slide = buildSlide(car, index);
      container.insertAdjacentHTML('beforeend', slide);
    });

    // Build dots (only show if more than 1 slide)
    if (dotsContainer && slides.length > 1) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
      });
    }

    // Set initial state
    currentSlide = 0;
    updateCarousel();

    // Start auto-rotation
    startAutoSlide();

  } catch (err) {
    console.error('Carousel load failed:', err);
    container.innerHTML = `<div class="carousel-empty" style="color:#f87171;">Error: ${err.message}</div>`;
  }
}

function buildSlide(car, index) {
  const imageUrl = car.imageUrl || '';
  const price = car.price ? `£${car.price.toLocaleString()}` : 'Price on request';
  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Featured Car';
  const year = car.year || '';
  const mileage = car.mileage ? `${car.mileage.toLocaleString()} mi` : '';
  const fuel = car.fuel || '';
  const transmission = car.transmission || '';

  const imageStyle = imageUrl 
    ? `background-image:url('${imageUrl}');` 
    : `background: linear-gradient(135deg, #1e293b 0%, #334155 100%);`;

  return `
    <div class="carousel-slide" data-index="${index}">
      <div class="carousel-slide-image" style="${imageStyle}">
        <div class="carousel-slide-overlay"></div>
        <span class="carousel-slide-badge">Featured</span>
      </div>
      <div class="carousel-slide-content">
        <div class="carousel-slide-info">
          <h3 class="carousel-slide-title">${escapeHtml(title)}</h3>
          <div class="carousel-slide-specs">
            ${year ? `<span class="spec-pill">📅 ${year}</span>` : ''}
            ${mileage ? `<span class="spec-pill">🛣️ ${mileage}</span>` : ''}
            ${fuel ? `<span class="spec-pill">⛽ ${escapeHtml(fuel)}</span>` : ''}
            ${transmission ? `<span class="spec-pill">⚙️ ${escapeHtml(transmission)}</span>` : ''}
          </div>
          <p class="carousel-slide-price">${price}</p>
        </div>
        <a href="browse.html" class="button button-accent carousel-slide-btn">View Details →</a>
      </div>
    </div>
  `;
}

function goToSlide(index) {
  if (slides.length === 0) return;
  currentSlide = (index + slides.length) % slides.length;
  updateCarousel();
  restartAutoSlide();
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  goToSlide(currentSlide - 1);
}

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  
  track.style.transform = `translateX(-${currentSlide * 100}%)`;

  // Update dots
  document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlide);
  });
}

function startAutoSlide() {
  if (slides.length <= 1) return;
  autoSlideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function restartAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  startAutoSlide();
}

// Wire up arrow buttons once DOM is ready
function setupControls() {
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const carousel = document.getElementById('featured-carousel');

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Pause auto-rotation on hover
  if (carousel) {
    carousel.addEventListener('mouseenter', () => {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    });
    carousel.addEventListener('mouseleave', () => {
      startAutoSlide();
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();  // Swipe left → next
        else prevSlide();            // Swipe right → prev
      }
    }, { passive: true });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Expose globally for debugging
window.refreshCarousel = loadFeaturedCarousel;

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    loadFeaturedCarousel();
  });
} else {
  setupControls();
  loadFeaturedCarousel();
}
