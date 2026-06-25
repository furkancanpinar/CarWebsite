// home-carousel.js — Featured cars carousel (redirects to browse.html with car ID)
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
    // Fetch all approved listings
    const snapshot = await getDocs(
      query(collection(db, "listings"), where("status", "==", "approved"))
    );

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="carousel-empty">
          <p>No cars available yet.</p>
          <a href="browse.html" class="button button-accent" style="margin-top:12px;">Browse All</a>
        </div>
      `;
      return;
    }

    // Collect all approved listings
    const allApproved = [];
    snapshot.forEach(doc => allApproved.push({ id: doc.id, ...doc.data() }));

    // Shuffle and pick 3 random cars
    slides = shuffleArray(allApproved).slice(0, 3);

    container.innerHTML = slides.map((car, i) => buildSlide(car, i)).join('');

    if (dotsContainer && slides.length > 1) {
      dotsContainer.innerHTML = slides.map((_, i) =>
        `<button type="button" class="carousel-dot${i === 0 ? ' active' : ''}" aria-label="Go to slide ${i + 1}"></button>`
      ).join('');
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.addEventListener('click', () => goToSlide(i));
      });
    }

    currentSlide = 0;
    updateCarousel();
    startAutoSlide();
  } catch (err) {
    console.error('Carousel load failed:', err);
    container.innerHTML = `<div class="carousel-empty" style="color:#f87171;">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSlide(car, index) {
  // Use first image from images array, fallback to imageUrl
  const imageUrl = (car.images && car.images[0]) || car.imageUrl || '';
  const imageStyle = imageUrl
    ? `background-image:url('${escapeAttr(imageUrl)}');`
    : `background: linear-gradient(135deg, #1e293b 0%, #334155 100%);`;

  const title = car.title || `${car.make || ''} ${car.model || ''}`.trim() || 'Featured Car';
  const price = car.price ? `£${car.price.toLocaleString()}` : 'Price on request';

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
            ${car.year ? `<span class="spec-pill">📅 ${car.year}</span>` : ''}
            ${car.mileage ? `<span class="spec-pill">🛣️ ${car.mileage.toLocaleString()} mi</span>` : ''}
            ${car.fuel ? `<span class="spec-pill">⛽ ${escapeHtml(car.fuel)}</span>` : ''}
          </div>
          <p class="carousel-slide-price">${price}</p>
        </div>
        <a href="browse.html?car=${escapeAttr(car.id)}" class="button button-accent carousel-slide-btn">View Details →</a>
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

const nextSlide = () => goToSlide(currentSlide + 1);
const prevSlide = () => goToSlide(currentSlide - 1);

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;

  document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlide);
  });
}

function startAutoSlide() {
  if (slides.length <= 1) return;
  stopAutoSlide();
  autoSlideInterval = setInterval(nextSlide, 5000);
}

function stopAutoSlide() {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
    autoSlideInterval = null;
  }
}

function restartAutoSlide() {
  stopAutoSlide();
  startAutoSlide();
}

function setupControls() {
  document.getElementById('carousel-prev')?.addEventListener('click', prevSlide);
  document.getElementById('carousel-next')?.addEventListener('click', nextSlide);

  const carousel = document.getElementById('featured-carousel');
  if (!carousel) return;

  carousel.addEventListener('mouseenter', stopAutoSlide);
  carousel.addEventListener('mouseleave', startAutoSlide);

  // Touch/swipe support
  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
  }, { passive: true });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) { return escapeHtml(str); }

window.refreshCarousel = loadFeaturedCarousel;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    loadFeaturedCarousel();
  });
} else {
  setupControls();
  loadFeaturedCarousel();
}
