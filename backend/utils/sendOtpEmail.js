async function sendOtpEmail(toEmail, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM_EMAIL || 'pk201929@gmail.com';
  const senderName = process.env.MAIL_FROM_NAME || 'MediQueue';

  if (!apiKey) {
    console.warn('BREVO_API_KEY missing; OTP generated:', otp);
    return { sent: false };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail }],
      subject: 'Your MediQueue Verification OTP',
      htmlContent: `<p>Your MediQueue verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errText}`);
  }

  return { sent: true };
}

module.exports = sendOtpEmail;