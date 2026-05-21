(function() {
  // Extra safety net just in case:
  if (window.location.href.includes('admin') || window.location.pathname.includes('admin')) return;

  const style = document.createElement('style');
  style.innerHTML = `
    #agrihub-chat-widget {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #agrihub-chat-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10B981, #059669);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    }
    #agrihub-chat-toggle:hover {
      transform: scale(1.05);
    }
    #agrihub-chat-box {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 450px;
      background: rgba(20, 20, 25, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
      pointer-events: none;
    }
    #agrihub-chat-box.open {
      transform: scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    .chat-header {
      padding: 15px 20px;
      background: rgba(16, 185, 129, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chat-header img {
      width: 35px;
      height: 35px;
      border-radius: 50%;
      object-fit: cover;
    }
    .chat-header-info {
      flex: 1;
    }
    .chat-header-title {
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
    }
    .chat-header-status {
      color: #10B981;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0;
    }
    .chat-header-status::before {
      content: "";
      width: 6px;
      height: 6px;
      background: #10B981;
      border-radius: 50%;
      display: inline-block;
    }
    .chat-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 20px;
      cursor: pointer;
    }
    .chat-close:hover { color: #fff; }
    .chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 18px;
      font-size: 13px;
      line-height: 1.4;
      color: #fff;
      word-wrap: break-word;
    }
    .chat-msg.agent {
      background: rgba(255, 255, 255, 0.1);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .chat-msg.user {
      background: #10B981;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .chat-input-area {
      padding: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 10px;
    }
    .chat-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 10px 15px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .chat-input:focus {
      border-color: #10B981;
    }
    .chat-send {
      background: #10B981;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s;
    }
    .chat-send:hover {
      background: #059669;
    }
    @media (max-width: 480px) {
      #agrihub-chat-widget {
        bottom: 70px;
        right: 15px;
      }
      #agrihub-chat-box {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        z-index: 10001;
      }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'agrihub-chat-widget';
  
  container.innerHTML = `
    <div id="agrihub-chat-box">
      <div class="chat-header">
        <img src="https://ui-avatars.com/api/?name=Agri+Support&background=10B981&color=fff" alt="Support">
        <div class="chat-header-info">
          <p class="chat-header-title">AgriHub Support</p>
          <p class="chat-header-status">Usually replies instantly</p>
        </div>
        <button class="chat-close" id="chat-close-btn">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="chat-msg agent">Hello! Welcome to AgriHub. How can we help you today?</div>
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-input" placeholder="Type a message...">
        <button class="chat-send" id="chat-send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
    <button id="agrihub-chat-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    </button>
  `;
  
  document.body.appendChild(container);

  const toggleBtn = document.getElementById('agrihub-chat-toggle');
  const chatBox = document.getElementById('agrihub-chat-box');
  const closeBtn = document.getElementById('chat-close-btn');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const messages = document.getElementById('chat-messages');

  let sessionId = localStorage.getItem('agrihub_chat_session');
  if (!sessionId) {
    sessionId = 'chat-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('agrihub_chat_session', sessionId);
  }

  function renderMessages(msgs) {
    messages.innerHTML = '';
    if (!msgs || !msgs.length) {
      messages.innerHTML = '<div class="chat-msg agent">Hello! Welcome to AgriHub. How can we help you today?</div>';
      return;
    }
    msgs.forEach(m => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg ' + m.sender;
      msgDiv.innerText = m.text;
      messages.appendChild(msgDiv);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  async function fetchMessages() {
    if (!chatBox.classList.contains('open')) return;
    try {
      const res = await fetch('/api/support/message/' + sessionId);
      const data = await res.json();
      if (data && data.messages) {
        renderMessages(data.messages);
      }
    } catch (e) { console.error("Chat sync failed"); }
  }

  toggleBtn.onclick = () => {
    chatBox.classList.add('open');
    fetchMessages();
    setTimeout(() => input.focus(), 300);
  };
  
  closeBtn.onclick = () => chatBox.classList.remove('open');

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // Optimistic UI update
    const uMsg = document.createElement('div');
    uMsg.className = 'chat-msg user';
    uMsg.innerText = text;
    messages.appendChild(uMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    try {
      let userName = "Guest";
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.name) userName = user.name;
      } catch (e) {}
      
      await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: userName, text })
      });
      fetchMessages();
    } catch (e) {
      console.error("Failed to send message", e);
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

  // Poll for admin replies every 5 seconds
  setInterval(fetchMessages, 5000);

})();
