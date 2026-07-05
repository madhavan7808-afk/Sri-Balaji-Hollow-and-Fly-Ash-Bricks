// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Active Navigation Link
const links = document.querySelectorAll('.nav-links a');
links.forEach(link => {
    link.addEventListener('click', () => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (hamburger) {
            navLinks.style.display = 'none';
        }
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Feature Cards Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .product-card, .gallery-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Lightbox Image Gallery
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrevBtn = document.createElement('button');
const lightboxNextBtn = document.createElement('button');

lightboxPrevBtn.className = 'lightbox-nav lightbox-prev';
lightboxNextBtn.className = 'lightbox-nav lightbox-next';
lightboxPrevBtn.innerHTML = '&#8249;';
lightboxNextBtn.innerHTML = '&#8250;';

if (lightbox) {
    const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    let currentIndex = 0;

    const openLightbox = (index) => {
        const button = triggers[index];
        const imageSrc = button.dataset.image;
        const imageTitle = button.dataset.title;
        lightboxImage.src = imageSrc;
        lightboxImage.alt = imageTitle;
        lightbox.classList.add('active');
        currentIndex = index;
    };

    triggers.forEach((button, idx) => {
        button.addEventListener('click', () => openLightbox(idx));
        // set cursor and ensure images lazy load attribute
        const img = button.querySelector('img');
        if (img && !img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    });

    // add nav buttons to lightbox
    const content = lightbox.querySelector('.lightbox-content');
    content.appendChild(lightboxPrevBtn);
    content.appendChild(lightboxNextBtn);

    const showIndex = (i) => {
        if (i < 0) i = triggers.length - 1;
        if (i >= triggers.length) i = 0;
        openLightbox(i);
    };

    lightboxPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex - 1); });
    lightboxNextBtn.addEventListener('click', (e) => { e.stopPropagation(); showIndex(currentIndex + 1); });

    // keyboard support
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') showIndex(currentIndex - 1);
        if (e.key === 'ArrowRight') showIndex(currentIndex + 1);
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });

    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// Replace broken gallery images with a neutral fallback so cards do not duplicate the same valid image
const fallbackSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#f3f3f3" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, Helvetica, sans-serif" font-size="16">Image not available</text></svg>'
);

document.querySelectorAll('.gallery-card img').forEach(img => {
    img.addEventListener('error', () => {
        img.removeAttribute('src');
        img.style.background = '#f0f0f0';
        img.style.width = '100%';
        img.style.height = '140px';
        img.style.objectFit = 'cover';
        img.alt = 'Image not available';
        img.src = fallbackSvg;
    });
});

// Details animation
const details = document.querySelectorAll('details');
details.forEach(detail => {
    detail.addEventListener('click', function () {
        details.forEach(d => {
            if (d !== this) d.open = false;
        });
    });
});
