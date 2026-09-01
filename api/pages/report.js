// ============================================
// HEALTHCALC.IN - REPORT EMAIL API v2
// Improved: Rate Limiting, Screenshot Support, Better Error Handling
// ============================================

import nodemailer from 'nodemailer';

// ============================================
// RATE LIMITING (Simple In-Memory)
// ============================================
const rateLimiter = new Map();
const RATE_LIMIT = 5; // Max 5 reports per IP per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

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

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ 
    success: false, 
    error: 'Only POST method allowed' 
  });

  try {
    // ==========================================
    // RATE LIMITING
    // ==========================================
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.socket?.remoteAddress || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. Please wait before sending another report.',
        limit: RATE_LIMIT,
        window: '1 hour'
      });
    }

    // ==========================================
    // VALIDATION
    // ==========================================
    const { 
      reportId, 
      name, 
      email, 
      problemType, 
      urgency, 
      page, 
      description, 
      browser, 
      screenSize, 
      country,
      screenshot
    } = req.body;

    const missingFields = [];
    if (!name?.trim()) missingFields.push('name');
    if (!email?.trim()) missingFields.push('email');
    if (!description?.trim()) missingFields.push('description');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // ==========================================
    // EMAIL CONFIG CHECK
    // ==========================================
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email credentials missing');
      return res.status(500).json({ 
        success: false, 
        error: 'Email service not configured. Please contact support.' 
      });
    }

    // ==========================================
    // EMAIL TRANSPORTER
    // ==========================================
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });

    try {
      await transporter.verify();
      console.log('✅ Email transporter ready');
    } catch (verifyError) {
      console.error('❌ Email verification failed:', verifyError);
      return res.status(500).json({ 
        success: false, 
        error: 'Email service unavailable. Please try again later.' 
      });
    }

    // ==========================================
    // GENERATE REPORT ID
    // ==========================================
    const finalReportId = reportId || `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // ==========================================
    // EMAIL OPTIONS
    // ==========================================
    const urgencyColors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };
    const color = urgencyColors[urgency] || '#64748b';
    const pageName = page ? page.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .container { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid ${color}; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; font-size: 20px; color: #1e293b; }
          .badge { background: ${color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .field { margin: 12px 0; }
          .label { font-weight: 600; color: #475569; font-size: 13px; display: block; margin-bottom: 4px; }
          .value { color: #1e293b; font-size: 15px; }
          .description-box { background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid ${color}; margin: 12px 0; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media (max-width: 480px) { .meta-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Problem Report</h1>
            <span class="badge">${urgency.toUpperCase()}</span>
          </div>

          <div class="field">
            <span class="label">📋 Report ID</span>
            <div class="value"><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${finalReportId}</code></div>
          </div>

          <div class="field">
            <span class="label">👤 Reporter</span>
            <div class="value"><strong>${name}</strong> (${email})</div>
          </div>

          <div class="field">
            <span class="label">🔴 Problem Type</span>
            <div class="value">${problemType || 'Not specified'}</div>
          </div>

          <div class="field">
            <span class="label">📄 Page</span>
            <div class="value"><a href="https://healthcalc.in${page}" style="color:#3b82f6;">${pageName}</a></div>
          </div>

          <div class="field">
            <span class="label">📝 Description</span>
            <div class="description-box">${description.replace(/\n/g, '<br>')}</div>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

          <div style="font-size: 14px; color: #64748b;">
            <p style="margin: 0 0 8px 0;"><strong>Technical Details:</strong></p>
            <div class="meta-grid">
              <div><span style="font-weight:600;">🌍 Country:</span> ${country || 'Unknown'}</div>
              <div><span style="font-weight:600;">🔧 Browser:</span> ${browser || 'Unknown'}</div>
              <div><span style="font-weight:600;">📱 Screen:</span> ${screenSize || 'Unknown'}</div>
              <div><span style="font-weight:600;">⏱️ Time:</span> ${new Date().toLocaleString()}</div>
            </div>
          </div>

          ${screenshot ? `
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <div>
            <p style="font-weight:600;color:#475569;font-size:13px;">📸 Screenshot</p>
            <img src="${screenshot}" alt="Screenshot" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;"/>
          </div>
          ` : ''}

          <div class="footer">
            Automated report from <a href="https://healthcalc.in" style="color:#3b82f6;">HealthCalc.in</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"HealthCalc Reports" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `🚨 [${urgency.toUpperCase()}] ${problemType.toUpperCase()} - Report from ${name}`,
      html: htmlContent,
      text: `
        Problem Report
        Report ID: ${finalReportId}
        Name: ${name}
        Email: ${email}
        Problem: ${problemType}
        Urgency: ${urgency}
        Page: ${page}
        Description: ${description}
        Country: ${country}
        Browser: ${browser}
        Screen: ${screenSize}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Report sent: ${finalReportId} (${info.messageId})`);

    return res.status(200).json({ 
      success: true, 
      reportId: finalReportId,
      message: 'Report sent successfully. We will review it shortly.'
    });

  } catch (error) {
    console.error('❌ Report API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send report. Please try again or contact support directly.',
      reference: Date.now().toString(36)
    });
  }
}

// ============================================
// CLEANUP RATE LIMITER
// ============================================
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimiter) {
      if (now > data.resetTime) {
        rateLimiter.delete(ip);
      }
    }
  }, 60 * 60 * 1000);
}
