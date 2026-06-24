const { Resend } = require('resend');
const formidable = require('formidable');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_LABELS = {
  online:     'Online Quote',
  inperson:   'In-Person Quote',
  filter:     'Filter Cleaning',
  inspection: 'Inspection Request',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ maxTotalFileSize: 10 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const firstName   = fields.firstName?.[0]   ?? '';
    const lastName    = fields.lastName?.[0]    ?? '';
    const email       = fields.email?.[0]       ?? '';
    const phone       = fields.phone?.[0]       ?? '';
    const address     = fields.address?.[0]     ?? '';
    const serviceType = fields.serviceType?.[0] ?? '';
    const poolGallons = fields.poolGallons?.[0] ?? '';
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
      ${serviceType === 'online' ? '<p style="margin-top:18px;font-family:sans-serif;color:#5C5C5E;font-size:0.88rem;">Pool photos are attached.</p>' : ''}
    `;

    // Collect compressed photo attachments (online quotes only)
    const attachments = [];
    if (serviceType === 'online') {
      for (let i = 0; ; i++) {
        const photo = files[`photo_${i}`]?.[0];
        if (!photo) break;
        attachments.push({
          filename: `pool-photo-${i + 1}.jpg`,
          content: fs.readFileSync(photo.filepath).toString('base64'),
        });
      }
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'coreydd2002@gmail.com',
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
