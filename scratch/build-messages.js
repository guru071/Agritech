const fs = require('fs');
const path = require('path');

const publicDir = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public';

// 1. MESSAGES.HTML
const messagesHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgriHub - Messages & Groups</title>
  <link rel="stylesheet" href="/theme.css">
  <link rel="stylesheet" href="/agrihub-ui.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/agrihub-icons.js" data-agri-icons></script>
  <style>
    body { background-color: #0A0D14; color: #fff; font-family: 'Sora', sans-serif; }
    .chat-sidebar { border-right: 1px solid rgba(255,255,255,0.1); height: calc(100vh - 64px); }
    .chat-main { height: calc(100vh - 64px); display: flex; flex-direction: column; }
    .chat-messages { flex-grow: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .msg-bubble { max-width: 75%; padding: 0.75rem 1rem; border-radius: 1rem; font-size: 0.85rem; }
    .msg-mine { background-color: var(--primary, #10B981); align-self: flex-end; border-bottom-right-radius: 0.2rem; }
    .msg-theirs { background-color: rgba(255,255,255,0.1); align-self: flex-start; border-bottom-left-radius: 0.2rem; }
    .chat-item:hover { background-color: rgba(255,255,255,0.05); }
    .chat-item.active { background-color: rgba(255,255,255,0.1); border-left: 3px solid var(--primary); }
  </style>
</head>
<body class="overflow-hidden">
  
  <header class="agri-nav glass h-16 flex items-center px-6 border-b border-white/10 justify-between">
    <a href="index.html" class="agri-logo">
      <div class="agri-logo-mark">🌾</div>
      <div class="agri-logo-text"><strong>AgriHub</strong><span>Messages</span></div>
    </a>
    <div class="flex gap-4">
      <a href="community.html" class="text-sm font-semibold text-gray-400 hover:text-white">Back to Feed</a>
    </div>
  </header>

  <div class="flex w-full">
    <!-- Sidebar -->
    <aside class="w-80 chat-sidebar flex flex-col bg-black/40">
      <div class="p-4 border-b border-white/10 flex justify-between items-center">
        <h2 class="font-bold">Chats & Groups</h2>
        <button onclick="createGroup()" class="p-2 rounded bg-white/10 hover:bg-white/20" title="New Group">
          <i data-lucide="users" class="w-4 h-4"></i>
        </button>
      </div>
      <div id="chat-list" class="flex-grow overflow-y-auto">
        <div class="p-6 text-center text-gray-500 text-sm">Loading chats...</div>
      </div>
    </aside>

    <!-- Main Chat -->
    <main class="flex-grow chat-main bg-black/20">
      <div id="chat-header" class="h-16 border-b border-white/10 flex items-center px-6 gap-3 bg-black/40 hidden">
        <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400" id="chat-header-icon"></div>
        <div>
          <h3 class="font-bold" id="chat-header-title">Select a chat</h3>
          <p class="text-xs text-gray-400" id="chat-header-sub"></p>
        </div>
      </div>

      <div id="chat-messages" class="chat-messages">
        <div class="h-full flex items-center justify-center text-gray-500">
          Select a conversation from the sidebar to start messaging
        </div>
      </div>

      <form id="chat-form" onsubmit="sendMessage(event)" class="p-4 border-t border-white/10 bg-black/40 flex gap-3 hidden">
        <input type="text" id="msg-input" placeholder="Type a message..." class="flex-grow bg-white/5 border border-white/10 rounded-full px-5 text-sm focus:outline-none focus:border-emerald-500" required>
        <button type="submit" class="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition">
          <i data-lucide="send" class="w-5 h-5 text-white"></i>
        </button>
      </form>
    </main>
  </div>

  <script>
    let token = localStorage.getItem("token");
    let user = JSON.parse(localStorage.getItem("user"));
    let activeChatId = null;
    let pollInterval = null;

    if(!token) window.location.href = "profile.html";

    async function loadChats() {
      try {
        const res = await fetch("/api/chats", { headers: { "Authorization": "Bearer " + token }});
        const chats = await res.json();
        
        const html = chats.map(c => {
          let name = c.name;
          if(!c.isGroup) {
            const other = c.participants.find(p => p._id !== user.id);
            name = other ? other.name : "Unknown User";
          }
          return \`<div class="chat-item p-4 flex gap-3 cursor-pointer items-center border-b border-white/5 \${activeChatId===c._id ? 'active' : ''}" onclick="openChat('\${c._id}', '\${name}', \${c.isGroup})">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white flex-shrink-0">\${name.charAt(0)}</div>
            <div class="overflow-hidden">
              <h4 class="font-bold text-sm truncate text-white">\${name}</h4>
              <p class="text-xs text-gray-400 truncate">\${c.isGroup ? 'Community Group' : 'Direct Message'}</p>
            </div>
          </div>\`;
        }).join("");
        
        document.getElementById("chat-list").innerHTML = html || "<div class='p-4 text-gray-500 text-sm'>No chats yet.</div>";
      } catch(e) { console.error(e); }
    }

    async function openChat(id, name, isGroup) {
      activeChatId = id;
      document.getElementById("chat-header").classList.remove("hidden");
      document.getElementById("chat-form").classList.remove("hidden");
      document.getElementById("chat-header-title").innerText = name;
      document.getElementById("chat-header-icon").innerText = name.charAt(0);
      document.getElementById("chat-header-sub").innerText = isGroup ? "Community Channel" : "Direct Message";
      
      loadChats(); // refresh active state
      await loadMessages();
      
      if(pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(loadMessages, 3000); // Poll every 3s
    }

    async function loadMessages() {
      if(!activeChatId) return;
      try {
        const res = await fetch(\`/api/chats/\${activeChatId}/messages\`, { headers: { "Authorization": "Bearer " + token }});
        const msgs = await res.json();
        
        const container = document.getElementById("chat-messages");
        const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
        
        container.innerHTML = msgs.map(m => {
          const isMine = m.senderId === user.id;
          return \`<div class="msg-bubble \${isMine ? 'msg-mine' : 'msg-theirs'}">
            \${!isMine ? \`<div class="text-[10px] opacity-70 font-bold mb-1">\${m.senderName}</div>\` : ''}
            <div>\${m.text}</div>
            <div class="text-[9px] opacity-50 mt-1 text-right">\${new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>\`;
        }).join("");
        
        if (msgs.length === 0) container.innerHTML = "<div class='text-center text-gray-500 mt-10'>No messages yet. Say hi!</div>";
        
        if(wasAtBottom) container.scrollTop = container.scrollHeight;
      } catch(e) { console.error(e); }
    }

    async function sendMessage(e) {
      e.preventDefault();
      const input = document.getElementById("msg-input");
      const text = input.value.trim();
      if(!text || !activeChatId) return;
      
      input.value = "";
      
      try {
        await fetch(\`/api/chats/\${activeChatId}/messages\`, {
          method: "POST",
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        loadMessages();
        loadChats(); // update order
      } catch(e) { console.error(e); }
    }

    async function createGroup() {
      const name = prompt("Enter new Group Name:");
      if(!name) return;
      try {
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ isGroup: true, name, participantIds: [] })
        });
        loadChats();
      } catch(e) { alert("Failed to create group."); }
    }

    loadChats();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'messages.html'), messagesHtml, 'utf8');


// 2. PUBLIC-PROFILE.HTML
const publicProfileHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgriHub - Public Profile</title>
  <link rel="stylesheet" href="/theme.css">
  <link rel="stylesheet" href="/agrihub-ui.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/agrihub-icons.js" data-agri-icons></script>
</head>
<body class="bg-[#0A0D14] text-white font-['Sora'] min-h-screen">
  
  <header class="agri-nav glass h-16 flex items-center px-6 border-b border-white/10 justify-between">
    <a href="index.html" class="agri-logo">
      <div class="agri-logo-mark">🌾</div>
      <div class="agri-logo-text"><strong>AgriHub</strong><span>Profile</span></div>
    </a>
    <a href="community.html" class="text-sm font-semibold text-gray-400 hover:text-white">Back to Feed</a>
  </header>

  <main class="container mx-auto px-4 py-10 max-w-2xl">
    <div id="profile-container" class="agri-panel glass text-center flex flex-col items-center">
      <i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto text-emerald-500"></i>
    </div>
  </main>

  <script>
    let token = localStorage.getItem("token");
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user")); } catch(e) {}

    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');

    async function loadProfile() {
      if(!profileId) return document.getElementById("profile-container").innerHTML = "No user ID provided.";
      
      try {
        const res = await fetch(\`/api/users/\${profileId}/profile\`);
        if(res.status === 404) return document.getElementById("profile-container").innerHTML = "User not found.";
        
        const data = await res.json();
        const u = data.user;
        
        let imgHtml = \`<div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-emerald-500/20 mb-4">\${u.name.charAt(0)}</div>\`;
        
        if (u.profileImagePath) {
          imgHtml = \`<img src="\${u.profileImagePath}" class="w-32 h-32 mx-auto rounded-full object-cover border-4 border-emerald-500 shadow-xl shadow-emerald-500/20 mb-4">\`;
        }

        document.getElementById("profile-container").innerHTML = \`
          \${imgHtml}
          <h1 class="text-3xl font-bold font-['Fraunces'] text-white">\${u.name}</h1>
          <p class="text-sm text-gray-400 mt-2">\${u.bio || "This user hasn't added a bio yet."}</p>
          <div class="text-[10px] text-emerald-500/60 font-bold tracking-widest uppercase mt-4 mb-8">Joined \${new Date(u.createdAt).getFullYear()}</div>
          
          <button onclick="messageUser('\${u._id}')" class="agri-btn-primary mb-8 px-8 flex items-center gap-2">
            <i data-lucide="message-circle" class="w-4 h-4"></i> Message
          </button>
          
          <div class="w-full text-left border-t border-white/10 pt-6">
            <h3 class="text-lg font-bold mb-4">Recent Stories</h3>
            <div class="flex flex-col gap-4">
              \${data.stories.length > 0 ? data.stories.map(s => \`
                <div class="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-300">
                  \${s.content}
                  <div class="text-[10px] text-gray-500 mt-2">\${new Date(s.createdAt).toLocaleDateString()}</div>
                </div>
              \`).join("") : "<p class='text-gray-500 text-sm'>No stories posted yet.</p>"}
            </div>
          </div>
        \`;
        if(window.AgriIcons) AgriIcons.refresh();
      } catch(e) {
        document.getElementById("profile-container").innerHTML = "Error loading profile.";
      }
    }

    async function messageUser(targetId) {
      if(!token || !user) return alert("Please login to send messages.");
      if(user.id === targetId) return alert("You can't message yourself!");
      
      try {
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ isGroup: false, participantIds: [targetId] })
        });
        window.location.href = "messages.html";
      } catch(e) { alert("Failed to start chat."); }
    }

    loadProfile();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'public-profile.html'), publicProfileHtml, 'utf8');
console.log("Created messages.html and public-profile.html");
