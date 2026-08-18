// HealthCalc Report Email API
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

    try {
        const { reportId, name, email, problemType, urgency, page, description, browser, screenSize, country } = req.body;

        if (!name || !email || !description) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            return res.status(500).json({ success: false, error: 'Email not configured' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: `"HealthCalc Reports" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            replyTo: email,
            subject: `🚨 [${urgency.toUpperCase()}] ${problemType.toUpperCase()} - Report from ${name}`,
            html: `
                <h2 style="color:#ef4444;">🚨 New Problem Report</h2>
                <hr>
                <p><strong>Report ID:</strong> ${reportId}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Problem Type:</strong> ${problemType}</p>
                <p><strong>Urgency:</strong> ${urgency}</p>
                <p><strong>Page:</strong> ${page || 'Not specified'}</p>
                <p><strong>Country:</strong> ${country || 'Unknown'}</p>
                <p><strong>Description:</strong></p>
                <div style="background:#fef2f2;padding:12px;border-radius:8px;">${description.replace(/\n/g, '<br>')}</div>
                <hr>
                <p style="font-size:11px;color:#64748b;">Automated email from HealthCalc.in</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Report sent:', info.messageId);

        return res.status(200).json({ success: true, reportId });

    } catch (error) {
        console.error('❌ Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
