const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_LABELS = {
  online:     'Online Quote',
  inperson:   'In-Person Quote',
  filter:     'Filter Cleaning',
  inspection: 'Inspection Request',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, address, serviceType, poolGallons, photos = [] } = await readBody(req);

    const serviceLabel = SERVICE_LABELS[serviceType] || serviceType;

    const row = (label, value, shaded) =>
      `<tr${shaded ? ' style="background:#FFF8F0;"' : ''}>
        <td style="padding:8px 14px;font-weight:600;color:#5C5C5E;width:140px;">${label}</td>
        <td style="padding:8px 14px;">${value}</td>
      </tr>`;

    const html = `
      <h2 style="font-family:sans-serif;color:#1C1C1E;margin-bottom:20px;">
        New ${serviceLabel} — ${firstName} ${lastName}
      </h2>
      <table style="border-collapse:collapse;width:100%;max-width:540px;font-family:sans-serif;font-size:0.95rem;">
        ${row('Service',  serviceLabel)}
        ${row('Name',     `${firstName} ${lastName}`, true)}
        ${row('Email',    `<a href="mailto:${email}">${email}</a>`)}
        ${row('Phone',    `<a href="tel:${phone}">${phone}</a>`, true)}
        ${row('Address',  address)}
        ${serviceType === 'online' ? row('Pool Size', `${poolGallons} gallons`, true) : ''}
      </table>
      ${photos.length ? '<p style="margin-top:18px;font-family:sans-serif;color:#5C5C5E;font-size:0.88rem;">Pool photos are attached.</p>' : ''}
    `;

    const attachments = photos.map((base64, i) => ({
      filename: `pool-photo-${i + 1}.jpg`,
      content:  base64,
    }));

    await resend.emails.send({
      from:    'request@endlesssummerpools.net',
      to:      'beausowards@gmail.com',
      subject: `New ${serviceLabel} — ${firstName} ${lastName}`,
      html,
      attachments,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-quote error:', err);
    return res.status(500).json({ error: 'Failed to send. Please try again.' });
  }
};
