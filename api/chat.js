/* ============================================
   CHAT SYSTEM STYLES
   ============================================ */

/* Chat Container */
.chat-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 12px;
  scroll-behavior: smooth;
}

/* Individual Messages */
.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: fadeIn 0.3s ease;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #e2e8f0;
}

.message-avatar.user {
  background: #3b82f6;
  color: white;
}

.message-avatar.assistant {
  background: #10b981;
  color: white;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #3b82f6;
  color: white;
  border-radius: 12px 4px 12px 12px;
}

.message.assistant .message-content {
  background: white;
  border-radius: 4px 12px 12px 12px;
}

.message-content p {
  margin: 0 0 8px 0;
}

.message-content p:last-child {
  margin-bottom: 0;
}

.message-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.message-content li {
  margin-bottom: 4px;
}

.message-content strong {
  color: #0ea5e9;
}

.message.user .message-content strong {
  color: #b3d9ff;
}

.message-time {
  font-size: 10px;
  opacity: 0.5;
  margin-top: 4px;
  text-align: right;
}

/* Loading Animation */
.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.loading-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Error Message */
.message.error .message-content {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 8px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

/* Input Area */
.chat-input-wrapper {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #e2e8f0;
  background: white;
  border-radius: 0 0 12px 12px;
}

.chat-input-wrapper textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  min-height: 44px;
  max-height: 150px;
  transition: border-color 0.2s;
}

.chat-input-wrapper textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chat-input-wrapper textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-input-wrapper button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.chat-input-wrapper button:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.02);
}

.chat-input-wrapper button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar */
.chat-container::-webkit-scrollbar {
  width: 4px;
}

.chat-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.chat-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

/* Responsive */
@media (max-width: 640px) {
  .message {
    max-width: 95%;
  }
  
  .message-content {
    font-size: 13px;
    padding: 10px 12px;
  }
}
