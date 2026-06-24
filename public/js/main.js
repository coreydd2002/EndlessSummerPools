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

// Service type selection
const serviceTypeCards = document.querySelectorAll('.service-type-card');
const serviceTypeInput = document.getElementById('serviceType');
const extraOnline      = document.getElementById('extraOnline');

serviceTypeCards.forEach(card => {
  card.addEventListener('click', () => {
    serviceTypeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const service = card.dataset.service;
    serviceTypeInput.value = service;
    extraOnline.classList.toggle('visible', service === 'online');
    const svcErr = document.getElementById('serviceTypeError');
    if (svcErr) svcErr.textContent = '';
  });
});

// Photo upload — count feedback
const photoInput = document.getElementById('q-photos');
if (photoInput) {
  photoInput.addEventListener('change', () => {
    const count = photoInput.files.length;
    photoInput.closest('.photo-upload-area').querySelector('.upload-text').textContent =
      count > 0 ? `${count} photo${count !== 1 ? 's' : ''} selected` : 'Click to upload or drag photos here';

    const el = document.getElementById('photoCount');
    if (count === 0) {
      el.textContent = '';
      el.className = 'upload-count';
    } else if (count >= 4 && count <= 5) {
      el.textContent = `${count} photos selected — looks good!`;
      el.className = 'upload-count upload-count--valid';
    } else if (count < 4) {
      el.textContent = `${count} photo${count !== 1 ? 's' : ''} selected — please add ${4 - count} more.`;
      el.className = 'upload-count upload-count--invalid';
    } else {
      el.textContent = `${count} photos selected — maximum is 5, please remove ${count - 5}.`;
      el.className = 'upload-count upload-count--invalid';
    }
  });
}

// === VALIDATION HELPERS ===

function showError(input, msg) {
  input.classList.add('input-invalid');
  let err = input.closest('.form-group').querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    input.closest('.form-group').appendChild(err);
  }
  err.textContent = msg;
}

function clearError(input) {
  input.classList.remove('input-invalid');
  const err = input.closest('.form-group')?.querySelector('.field-error');
  if (err) err.textContent = '';
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidPhone(v) { return v.replace(/\D/g, '').length >= 10; }

// Clear field errors on input
document.querySelectorAll('#quoteForm input:not([type=hidden]):not([type=file])').forEach(input => {
  input.addEventListener('input', () => clearError(input));
});

// === IMAGE COMPRESSION ===

function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = url;
  });
}

// === FORM SUBMISSION ===

document.getElementById('quoteForm').addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;

  const f = {
    firstName: document.getElementById('q-firstName'),
    lastName:  document.getElementById('q-lastName'),
    email:     document.getElementById('q-email'),
    phone:     document.getElementById('q-phone'),
    address:   document.getElementById('q-address'),
  };

  if (!f.firstName.value.trim())       { showError(f.firstName, 'First name is required.');       valid = false; } else clearError(f.firstName);
  if (!f.lastName.value.trim())        { showError(f.lastName,  'Last name is required.');        valid = false; } else clearError(f.lastName);
  if (!isValidEmail(f.email.value))    { showError(f.email,     'Enter a valid email address.');  valid = false; } else clearError(f.email);
  if (!isValidPhone(f.phone.value))    { showError(f.phone,     'Enter a valid phone number.');   valid = false; } else clearError(f.phone);
  if (!f.address.value.trim())         { showError(f.address,   'Home address is required.');     valid = false; } else clearError(f.address);

  // Service type error
  let svcErr = document.getElementById('serviceTypeError');
  if (!svcErr) {
    svcErr = document.createElement('span');
    svcErr.id = 'serviceTypeError';
    svcErr.className = 'field-error';
    document.querySelector('.service-type-grid').insertAdjacentElement('afterend', svcErr);
  }
  if (!serviceTypeInput.value) {
    svcErr.textContent = 'Please select a service.';
    valid = false;
  } else {
    svcErr.textContent = '';
  }

  const isOnline = serviceTypeInput.value === 'online';

  if (isOnline) {
    const gallons = document.getElementById('q-gallons');
    if (!gallons.value || Number(gallons.value) <= 0) {
      showError(gallons, 'Please enter your pool size in gallons.');
      valid = false;
    } else {
      clearError(gallons);
    }

    const photos     = document.getElementById('q-photos');
    const photoCount = photos.files.length;
    const countEl    = document.getElementById('photoCount');
    if (photoCount < 4 || photoCount > 5) {
      countEl.textContent = photoCount < 4
        ? `${photoCount} photo${photoCount !== 1 ? 's' : ''} selected — please add ${4 - photoCount} more.`
        : `${photoCount} photos selected — maximum is 5, please remove ${photoCount - 5}.`;
      countEl.className = 'upload-count upload-count--invalid';
      valid = false;
    }
  }

  if (!valid) return;

  const submitBtn = document.querySelector('#quoteForm .btn-submit');
  let compressedImages = [];

  if (isOnline) {
    submitBtn.textContent = 'Compressing photos…';
    submitBtn.disabled = true;
    const files = document.getElementById('q-photos').files;
    compressedImages = await Promise.all(Array.from(files).map(file => compressImage(file)));
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  }

  // Build FormData payload (not sent yet)
  const payload = new FormData();
  payload.append('firstName',   f.firstName.value.trim());
  payload.append('lastName',    f.lastName.value.trim());
  payload.append('email',       f.email.value.trim());
  payload.append('phone',       f.phone.value.trim());
  payload.append('address',     f.address.value.trim());
  payload.append('serviceType', serviceTypeInput.value);
  if (isOnline) {
    payload.append('poolGallons', document.getElementById('q-gallons').value);
    compressedImages.forEach((blob, i) => payload.append(`photo_${i}`, blob, `photo_${i}.jpg`));
  }

  // Send to API
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/submit-quote', { method: 'POST', body: payload });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');

    document.getElementById('quoteForm').innerHTML = `
      <div class="form-success">
        <p class="form-success-icon">✓</p>
        <h3>Request Sent!</h3>
        <p>Thanks ${f.firstName.value.trim()}, we'll be in touch shortly.</p>
      </div>
    `;
  } catch (err) {
    submitBtn.textContent = 'Submit Request';
    submitBtn.disabled = false;
    const errEl = document.getElementById('formSubmitError');
    if (errEl) {
      errEl.textContent = 'Something went wrong — please try again or call us directly.';
      errEl.classList.add('visible');
    }
  }
});
