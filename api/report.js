// ============================================
// HEALTHCALC.IN - REPORT EMAIL API
// ============================================

import nodemailer from 'nodemailer';

const rateLimiter = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const userData = rateLimiter.get(ip) || { count: 0, resetTime: now + RATE_WINDOW };

  if (now > userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + RATE_WINDOW;
  }

  userData.count++;
  rateLimiter.set(ip, userData);
  return userData.count <= RATE_LIMIT;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Only POST allowed' });
  }

  try {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait before sending another report.'
      });
    }

    const { reportId, name, email, problemType, urgency, page, description, browser, screenSize, country, screenshot } = req.body;

    if (!name?.trim() || !email?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all required fields.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format.'
      });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email credentials missing');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured. Please contact support.'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const finalReportId = reportId || `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const mailOptions = {
      from: `"HealthCalc Reports" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `🚨 [${urgency.toUpperCase()}] ${problemType.toUpperCase()} - Report from ${name}`,
      html: `
        <h2 style="color:#ef4444;">🚨 New Problem Report</h2>
        <hr>
        <p><strong>Report ID:</strong> ${finalReportId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Problem Type:</strong> ${problemType}</p>
        <p><strong>Urgency:</strong> ${urgency}</p>
        <p><strong>Page:</strong> ${page || 'Not specified'}</p>
        <p><strong>Country:</strong> ${country || 'Unknown'}</p>
        <p><strong>Browser:</strong> ${browser || 'Unknown'}</p>
        <p><strong>Screen Size:</strong> ${screenSize || 'Unknown'}</p>
        <p><strong>Description:</strong></p>
        <div style="background:#fef2f2;padding:12px;border-radius:8px;">${description.replace(/\n/g, '<br>')}</div>
        ${screenshot ? `<hr><p><strong>Screenshot:</strong></p><img src="${screenshot}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;"/>` : ''}
        <hr>
        <p style="font-size:11px;color:#64748b;">Automated email from HealthCalc.in</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Report sent: ${finalReportId}`);

    return res.status(200).json({
      success: true,
      reportId: finalReportId,
      message: 'Report sent successfully!'
    });

  } catch (error) {
    console.error('❌ Report API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send report. Please try again.'
    });
  }
}
