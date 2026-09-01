// ============================================
// HEALTHCALC.IN - CHAT SYSTEM v2
// Improved with Better Error Handling & UI
// ============================================

class HealthCalcChat {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.inputField = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-button');
    this.messages = [];
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = 2;
    this.lastMessage = '';
    
    this.init();
  }

  init() {
    if (!this.chatContainer || !this.inputField || !this.sendButton) {
      console.warn('Chat elements not found');
      return;
    }

    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.inputField.addEventListener('input', () => {
      this.inputField.style.height = 'auto';
      this.inputField.style.height = Math.min(this.inputField.scrollHeight, 150) + 'px';
    });

    this.inputField.focus();
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    const welcomeMessage = {
      role: 'assistant',
      content: `👋 **Welcome to HealthCalc AI!**

I'm your health assistant. Ask me anything about:
• ❤️ Heart health & risk factors
• ⚖️ Weight management & BMI
• 🤰 Pregnancy & women's health
• 🥗 Nutrition & diet planning
• 💪 Fitness & body composition

**Try our 30+ free calculators:** healthcalc.in

⚠️ *I'm an AI assistant, not a doctor. Always consult a healthcare professional.*`
    };
    
    this.addMessage(welcomeMessage);
  }

  async sendMessage() {
    const message = this.inputField.value.trim();
    
    if (!message) return;
    if (this.isLoading) return;

    this.lastMessage = message;
    this.inputField.value = '';
    this.inputField.style.height = 'auto';

    this.addMessage({ role: 'user', content: message });
    
    this.isLoading = true;
    this.setLoadingState(true);
    
    const responseId = this.addLoadingMessage();

    try {
      const response = await this.callAPI(message);
      
      this.removeMessage(responseId);
      this.addMessage({ 
        role: 'assistant', 
        content: response.reply || response
      });
      
      this.retryCount = 0;
      
    } catch (error) {
      console.error('Chat Error:', error);
      this.removeMessage(responseId);
      this.showError(error.message);
      
    } finally {
      this.isLoading = false;
      this.setLoadingState(false);
      this.inputField.focus();
    }
  }

  async callAPI(message, attempt = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ userMessage: message }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.reply || errorMsg;
        } catch (e) {
          if (response.status === 429) {
            errorMsg = '⚠️ Server is busy. Please wait a moment and try again.';
          } else if (response.status === 503) {
            errorMsg = '⚠️ Service is temporarily unavailable. Please try again in a few minutes.';
          }
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (data.status === 'fallback') {
        console.warn('⚠️ Using fallback response');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (attempt < this.maxRetries && 
          (error.name === 'AbortError' || error.message.includes('network'))) {
        console.log(`🔄 Retry ${attempt + 1}/${this.maxRetries}...`);
        this.updateLoadingMessage('⏳ Connection issue. Retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        return this.callAPI(message, attempt + 1);
      }
      
      if (error.name === 'AbortError') {
        throw new Error('⏰ Request timed out. Please try again.');
      }
      
      throw error;
    }
  }

  // ============================================
  // UI METHODS
  // ============================================

  addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    
    let content = this.formatMessage(message.content);
    
    messageDiv.innerHTML = `
      <div class="message-avatar ${message.role}">
        ${message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div class="message-content">${content}</div>
    `;
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.querySelector('.message-content').appendChild(time);
    
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    return messageDiv;
  }

  addLoadingMessage() {
    const id = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = id;
    messageDiv.className = 'message assistant loading';
    
    messageDiv.innerHTML = `
      <div class="message-avatar assistant">🤖</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="loading-text">Thinking...</div>
      </div>
    `;
    
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    return id;
  }

  updateLoadingMessage(text) {
    const loadingMsg = this.chatContainer.querySelector('.loading .loading-text');
    if (loadingMsg) {
      loadingMsg.textContent = text;
    }
  }

  removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  showError(errorMessage) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant error';
    
    errorDiv.innerHTML = `
      <div class="message-avatar assistant">⚠️</div>
      <div class="message-content error-message">
        <p><strong>${errorMessage || 'Something went wrong'}</strong></p>
        <button class="retry-btn" onclick="healthChat.retryLastMessage()">
          🔄 Try Again
        </button>
        <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 8px;">
          You can also try our free calculators at <a href="/" style="color: #3b82f6;">healthcalc.in</a>
        </p>
      </div>
    `;
    
    this.chatContainer.appendChild(errorDiv);
    this.scrollToBottom();
  }

  async retryLastMessage() {
    if (this.lastMessage) {
      const errorMsg = this.chatContainer.querySelector('.message.assistant.error');
      if (errorMsg) errorMsg.remove();
      
      this.inputField.value = this.lastMessage;
      await this.sendMessage();
    }
  }

  setLoadingState(isLoading) {
    this.sendButton.disabled = isLoading;
    this.sendButton.innerHTML = isLoading ? '⏳' : '➤';
    this.inputField.disabled = isLoading;
  }

  formatMessage(content) {
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• /g, '<li>')
      .replace(/\n•/g, '\n<li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/<li>/g, '<ul><li>');
      const lastUlIndex = formatted.lastIndexOf('</ul>');
      if (lastUlIndex === -1) {
        formatted = formatted.replace(/(<li>.*?)(?=<p>|$)/, '<ul>$1</ul>');
      }
    }
    
    return `<p>${formatted}</p>`;
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }, 100);
  }
}

// ============================================
// INITIALIZE
// ============================================
let healthChat;

document.addEventListener('DOMContentLoaded', () => {
  healthChat = new HealthCalcChat();
});
