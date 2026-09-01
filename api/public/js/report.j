// ============================================
// HEALTHCALC.IN - REPORT FORM HANDLER v2
// ============================================

class ReportHandler {
  constructor() {
    this.form = document.getElementById('report-form');
    this.submitBtn = document.getElementById('submit-report');
    this.statusMessage = document.getElementById('report-status');
    this.screenshotData = null;
    this.isSubmitting = false;
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    const screenshotBtn = document.getElementById('capture-screenshot');
    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => this.captureScreenshot());
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.isSubmitting) return;
    
    const name = document.getElementById('report-name')?.value?.trim();
    const email = document.getElementById('report-email')?.value?.trim();
    const description = document.getElementById('report-description')?.value?.trim();
    
    if (!name || !email || !description) {
      this.showStatus('Please fill in all required fields.', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showStatus('Please enter a valid email address.', 'error');
      return;
    }

    const data = {
      reportId: `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: name,
      email: email,
      problemType: document.getElementById('report-problem-type')?.value || 'Other',
      urgency: document.getElementById('report-urgency')?.value || 'medium',
      page: window.location.pathname,
      description: description,
      browser: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      country: await this.getCountry(),
      screenshot: this.screenshotData
    };

    this.isSubmitting = true;
    this.setLoading(true);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showStatus('✅ Report sent successfully! We\'ll review it shortly.', 'success');
        this.form.reset();
        this.screenshotData = null;
      } else {
        this.showStatus(`❌ ${result.error || 'Failed to send report'}`, 'error');
      }
    } catch (error) {
      this.showStatus('❌ Network error. Please check your connection and try again.', 'error');
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  }

  async getCountry() {
    try {
      const response = await fetch('https://ipapi.co/country_name/');
      if (response.ok) return await response.text();
    } catch (e) {}
    return 'Unknown';
  }

  async captureScreenshot() {
    try {
      if (typeof html2canvas !== 'undefined') {
        const canvas = await html2canvas(document.body);
        this.screenshotData = canvas.toDataURL('image/png');
        this.showStatus('📸 Screenshot captured!', 'success');
      } else {
        this.showStatus('⚠️ html2canvas library not loaded', 'warning');
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      this.showStatus('⚠️ Could not capture screenshot', 'warning');
    }
  }

  showStatus(message, type) {
    if (!this.statusMessage) return;
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-${type}`;
    this.statusMessage.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        this.statusMessage.style.display = 'none';
      }, 5000);
    }
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    this.submitBtn.innerHTML = isLoading ? '⏳ Sending...' : '📧 Send Report';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ReportHandler();
});
