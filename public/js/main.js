// Circular favicon
(function () {
  const img = new Image();
  img.onload = function () {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const scaled = size * 1.3;
    const offset = (size - scaled) / 2;
    ctx.drawImage(img, offset, offset, scaled, scaled);
    const link = document.querySelector("link[rel='icon']");
    link.href = canvas.toDataURL('image/png');
  };
  img.src = 'public/images/EndlessSummerLogo.png';
})();

// Active nav highlighting via IntersectionObserver
const navLinks = document.querySelectorAll('.nav-link, .nav-quote-btn');
const sections = document.querySelectorAll('section[id]');
const hero = document.querySelector('section.hero');

const clearNav = () => navLinks.forEach(l => l.classList.remove('active'));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      clearNav();
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(section => sectionObserver.observe(section));

// Clear highlights when hero is back in view
if (hero) {
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) clearNav();
  }, { threshold: 0.1 });
  heroObserver.observe(hero);
}

// Quote type selection
const quoteTypeCards = document.querySelectorAll('.quote-type-card');
const formPanels = document.querySelectorAll('.quote-form-panel');

quoteTypeCards.forEach(card => {
  card.addEventListener('click', () => {
    const targetId = card.dataset.form;

    quoteTypeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    formPanels.forEach(panel => panel.classList.remove('visible'));
    const target = document.getElementById(targetId);
    target.classList.add('visible');
  });
});

// Hot tub dimensions toggle
document.querySelectorAll('input[name="hotTub"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('hotTubDimensions').classList.toggle('visible', radio.value === 'yes');
  });
});

// Presence preference / calendar toggle
document.querySelectorAll('input[name="presence"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('scheduleTime').classList.toggle('visible', radio.value === 'yes');
  });
});

// Photo upload label feedback
const photoInput = document.getElementById('poolPhotos');
if (photoInput) {
  photoInput.addEventListener('change', () => {
    const uploadText = photoInput.closest('.photo-upload-area').querySelector('.upload-text');
    const count = photoInput.files.length;
    uploadText.textContent = count > 0
      ? `${count} photo${count !== 1 ? 's' : ''} selected`
      : 'Click to upload or drag photos here';
  });
}
