// ============================================
// HEALTHCALC.IN - REPORT EMAIL API (UPDATED)
// ============================================

import nodemailer from 'nodemailer';

// ==========================================
// RATE LIMITING
// ==========================================
const rateLimiter = new Map();
const RATE_LIMIT = 5; // 5 reports per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  const now = Date.now();
  const userData = rateLimiter.get(ip) || { 
    count: 0, 
    resetTime: now + RATE_WINDOW,
    reports: [] // Store report IDs for tracking
  };

  if (now > userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + RATE_WINDOW;
    userData.reports = [];
  }

  userData.count++;
  rateLimiter.set(ip, userData);
  return userData.count <= RATE_LIMIT;
}

function getRemainingTime(ip) {
  const userData = rateLimiter.get(ip);
  if (!userData) return 0;
  const now = Date.now();
  if (now > userData.resetTime) return 0;
  return Math.ceil((userData.resetTime - now) / 1000 / 60); // Minutes remaining
}

// ==========================================
// EMAIL TRANSPORTER
// ==========================================
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Email credentials missing');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    // Add timeout and debug options
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Transporter verification failed:', error);
      transporter = null;
    } else {
      console.log('✅ Email transporter ready');
    }
  });

  return transporter;
}

// ==========================================
// SEND CONFIRMATION EMAIL TO USER
// ==========================================
async function sendConfirmationEmail(userEmail, userName, reportId) {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    const mailOptions = {
      from: `"HealthCalc Support" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: `✅ Report Received - #${reportId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #16a34a;">✅ Report Received</h2>
          <p>Dear ${userName || 'User'},</p>
          <p>Thank you for submitting a report to <strong>HealthCalc.in</strong>. We have received your feedback and will look into it as soon as possible.</p>
          
          <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Report ID:</strong> ${reportId}</p>
            <p><strong>Status:</strong> <span style="color: #16a34a;">✓ Received</span></p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will review your report</li>
            <li>We may contact you at <strong>${userEmail}</strong> for more details</li>
            <li>You'll receive a response within 24-48 hours</li>
          </ul>
          
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b;">
            This is an automated confirmation email. Please do not reply to this email.
            <br>If you need immediate assistance, please visit our <a href="https://healthcalc.in/contact.html">Contact Page</a>.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error.message);
    return false;
  }
}

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req, res) {
  // ==========================================
  // CORS HEADERS
  // ==========================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Only POST method allowed'
    });
  }

  // ==========================================
  // RATE LIMIT CHECK
  // ==========================================
  try {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    if (!checkRateLimit(clientIP)) {
      const remainingMinutes = getRemainingTime(clientIP);
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Please wait ${remainingMinutes} minutes before sending another report.`,
        remainingMinutes: remainingMinutes
      });
    }

    // ==========================================
    // VALIDATE REQUEST BODY
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

    // Required fields validation
    const missingFields = [];
    if (!name?.trim()) missingFields.push('Name');
    if (!email?.trim()) missingFields.push('Email');
    if (!description?.trim()) missingFields.push('Description');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Please fill in all required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format. Please enter a valid email address.'
      });
    }

    // ==========================================
    // CHECK EMAIL CONFIGURATION
    // ==========================================
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email credentials missing');
      return res.status(500).json({
        success: false,
        error: 'Email service is temporarily unavailable. Please try again later or contact us directly.'
      });
    }

    // ==========================================
    // GENERATE REPORT ID
    // ==========================================
    const finalReportId = reportId || 
      `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // ==========================================
    // CREATE EMAIL TRANSPORTER
    // ==========================================
    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({
        success: false,
        error: 'Email service is not configured properly. Please contact support.'
      });
    }

    // ==========================================
    // PREPARE EMAIL CONTENT
    // ==========================================
    const urgencyColors = {
      low: '#22c55e',   // Green
      medium: '#eab308', // Yellow
      high: '#ef4444'    // Red
    };

    const urgencyEmojis = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    // Get time and date
    const reportDate = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // ==========================================
    // MAIN EMAIL TO ADMIN
    // ==========================================
    const mailOptions = {
      from: `"HealthCalc Reports" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `${urgencyEmojis[urgency] || '📋'} [${urgency.toUpperCase()}] ${problemType.toUpperCase()} - Report from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
            .field { margin: 12px 0; }
            .label { font-weight: 600; color: #475569; }
            .value { margin-left: 8px; }
            .urgency-badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 9999px; 
              color: white;
              background-color: ${urgencyColors[urgency] || '#64748b'};
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
            }
            .description-box { 
              background: #fef2f2; 
              padding: 12px; 
              border-radius: 8px; 
              border-left: 4px solid #ef4444;
              margin: 12px 0;
            }
            .meta-box { 
              background: #f1f5f9; 
              padding: 12px; 
              border-radius: 8px; 
              font-size: 13px;
              margin: 12px 0;
            }
            .footer { 
              margin-top: 20px; 
              padding-top: 16px; 
              border-top: 1px solid #e2e8f0; 
              font-size: 11px; 
              color: #64748b;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Problem Report</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">📌 Report ID:</span>
                <span class="value"><strong>${finalReportId}</strong></span>
              </div>
              <div class="field">
                <span class="label">📅 Date:</span>
                <span class="value">${reportDate}</span>
              </div>
              <hr style="border: 1px solid #e2e8f0; margin: 16px 0;">
              
              <h3>👤 Reporter Details</h3>
              <div class="field"><span class="label">Name:</span> <span class="value">${name}</span></div>
              <div class="field"><span class="label">Email:</span> <span class="value"><a href="mailto:${email}">${email}</a></span></div>
              
              <h3 style="margin-top: 20px;">📋 Report Details</h3>
              <div class="field">
                <span class="label">Problem Type:</span> 
                <span class="value"><strong>${problemType}</strong></span>
              </div>
              <div class="field">
                <span class="label">Urgency:</span> 
                <span class="value"><span class="urgency-badge">${urgency}</span></span>
              </div>
              <div class="field">
                <span class="label">Page:</span> 
                <span class="value"><a href="${page}" target="_blank">${page || 'Not specified'}</a></span>
              </div>
              
              <h3 style="margin-top: 20px;">📝 Description</h3>
              <div class="description-box">
                ${description.replace(/\n/g, '<br>')}
              </div>
              
              <h3 style="margin-top: 20px;">🖥️ System Information</h3>
              <div class="meta-box">
                <div><span class="label">Country:</span> ${country || 'Unknown'}</div>
                <div><span class="label">Browser:</span> ${browser || 'Unknown'}</div>
                <div><span class="label">Screen Size:</span> ${screenSize || 'Unknown'}</div>
              </div>
              
              ${screenshot ? `
                <h3 style="margin-top: 20px;">📸 Screenshot</h3>
                <div style="background: #fff; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <img src="${screenshot}" style="max-width: 100%; border-radius: 4px;" alt="Screenshot"/>
                </div>
              ` : ''}
              
              <div class="footer">
                Automated email from HealthCalc.in<br>
                This report was submitted via the Problem Report form.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // ==========================================
    // SEND EMAILS
    // ==========================================
    console.log(`📧 Sending report: ${finalReportId}`);
    
    // Send main report email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Report email sent: ${finalReportId}`);

    // Send confirmation email to user (silent fail - don't block main response)
    try {
      await sendConfirmationEmail(email, name, finalReportId);
    } catch (confirmError) {
      console.warn('⚠️ Confirmation email failed but report was sent:', confirmError.message);
    }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,
      reportId: finalReportId,
      message: 'Report sent successfully! We will review it shortly.',
      confirmationSent: true
    });

  } catch (error) {
    console.error('❌ Report API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send report. Please try again or contact us directly.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
