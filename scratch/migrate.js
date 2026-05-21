const fs = require('fs');
const path = require('path');

const dashPath = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/admin-public/dashboard.html';
const suppPath = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/admin-public/support.html';

let dashHtml = fs.readFileSync(dashPath, 'utf8');

// 1. ADD DELETE USER TO DASHBOARD
dashHtml = dashHtml.replace(
  '<td class="py-3">\n          <button onclick="upgradeTier(',
  '<td class="py-3 flex gap-2">\n          <button onclick="upgradeTier('
);
dashHtml = dashHtml.replace(
  '${isPremium ? "↓ Downgrade" : "↑ Upgrade"}\n          </button>\n        </td>',
  '${isPremium ? "↓ Downgrade" : "↑ Upgrade"}\n          </button>\n          <button onclick="deleteUser(\'${u._id}\')" class="btn-action btn-red">✕ Delete</button>\n        </td>'
);

const deleteUserFunc = `
  async function deleteUser(id) {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    const res = await safeFetch(\`/api/admin/users/\${id}\`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken }
    });
    if (res.error) { toast(res.error, "error"); return; }
    toast("User deleted successfully ✓");
    loadUsers();
  }

  // ─── SUPPORT TICKETS`;
dashHtml = dashHtml.replace('// ─── SUPPORT TICKETS', deleteUserFunc);

// 2. CREATE SUPPORT.HTML
// Let's create a minimal standalone support page using the same theme/header as dashboard.
const supportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="/theme.css">
  <script>(function(){const h=new Date().getHours();const t=h>=5&&h<=10?"morning":h>=11&&h<=16?"afternoon":h>=17&&h<=20?"evening":"night";document.documentElement.setAttribute("data-time",t);})();</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Care - AgriHub Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #080B11; color: #E2E8F0; }
    .glass { background: rgba(17,24,39,0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); }
    .filter-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; padding: 0.5rem 0.9rem; font-size: 0.75rem; color: white; outline: none; }
    .filter-input:focus { border-color: #f97316; }
    #toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 9999; padding: 1rem 1.25rem; border-radius: 0.875rem; font-size: 0.8rem; font-weight: 600; backdrop-filter: blur(16px); transform: translateY(20px); opacity: 0; transition: all 0.3s; pointer-events: none; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #6ee7b7; }
    #toast.show { transform: translateY(0); opacity: 1; }
    #toast.error { background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); color: #fca5a5; }
  </style>
</head>
<body class="min-h-screen flex flex-col h-screen">

<div id="toast">
  <span id="toast-msg"></span>
</div>

<header class="glass sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-2xl">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg font-extrabold text-white">⚙</div>
    <span class="text-lg font-extrabold text-white">AgriHub Customer Care</span>
  </div>
  <a href="/admin/dashboard.html" class="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded transition">Back to Dashboard</a>
</header>

<main class="flex-grow p-6 overflow-hidden flex flex-col h-full">
  <div class="flex-1 min-h-0 flex flex-col md:flex-row gap-4 h-full">
    <!-- Tickets List -->
    <div class="w-full md:w-1/3 glass rounded-2xl flex flex-col overflow-hidden h-full">
      <div class="p-3 border-b border-white/5 font-bold text-white text-sm bg-black/20 flex justify-between items-center">
        Open Chats
        <button onclick="loadSupportTickets()" class="text-gray-400 hover:text-white text-xs">↻ Refresh</button>
      </div>
      <div id="support-ticket-list" class="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        <div class="text-center text-gray-500 text-xs mt-4">Loading...</div>
      </div>
    </div>
    
    <!-- Active Chat Window -->
    <div class="flex-1 glass rounded-2xl flex flex-col overflow-hidden relative h-full">
      <div id="support-chat-header" class="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 hidden">
        <div>
          <div class="font-bold text-white text-sm" id="support-active-name">Select a chat</div>
          <div class="text-[10px] text-gray-400 font-mono" id="support-active-session"></div>
        </div>
      </div>
      
      <div id="support-chat-messages" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div class="text-center text-gray-500 mt-10 text-sm">Select a ticket from the left to view the conversation.</div>
      </div>
      
      <form id="support-reply-form" class="p-3 border-t border-white/5 bg-black/20 flex gap-2 hidden" onsubmit="replyToTicket(event)">
        <input type="text" id="support-reply-text" required placeholder="Type reply here..." class="filter-input flex-1">
        <button type="submit" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded text-black font-bold text-sm">Send</button>
      </form>
    </div>
  </div>
</main>

<script>
  let adminToken = localStorage.getItem("adminToken");
  if (!adminToken) {
    alert("Unauthorized. Login via Admin Dashboard first.");
    window.location.href = "/admin/dashboard.html";
  }

  function toast(msg, type = "success") {
    const el = document.getElementById("toast");
    document.getElementById("toast-msg").innerText = msg;
    if (type === "error") { el.classList.add("error"); } else { el.classList.remove("error"); }
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3000);
  }

  async function safeFetch(url, options = {}) {
    try {
      const r = await fetch(url, options);
      if (r.status === 401 || r.status === 403) { alert("Unauthorized."); return { error: "Auth failed" }; }
      const text = await r.text();
      try { return JSON.parse(text); } catch { return { error: "Parse error" }; }
    } catch {
      return { error: "Network error" };
    }
  }

  let allSupportChats = [];
  let activeSessionId = null;

  async function loadSupportTickets() {
    const list = document.getElementById("support-ticket-list");
    list.innerHTML = \`<div class="text-center text-gray-500 text-xs mt-4">Loading...</div>\`;
    const data = await safeFetch("/api/admin/support", { headers: { "x-admin-token": adminToken } });
    if (data.error) { list.innerHTML = \`<div class="text-red-400 text-xs p-2">\${data.error}</div>\`; return; }
    allSupportChats = data;
    renderSupportList();
    if (activeSessionId) openChat(activeSessionId);
  }

  function renderSupportList() {
    const list = document.getElementById("support-ticket-list");
    if (!allSupportChats.length) {
      list.innerHTML = \`<div class="text-center text-gray-500 text-xs mt-4">No support messages.</div>\`;
      return;
    }
    list.innerHTML = allSupportChats.map(c => {
      const lastMsg = c.messages[c.messages.length - 1];
      const preview = lastMsg ? lastMsg.text : "No messages";
      const isUnread = lastMsg && lastMsg.sender === 'user';
      return \`
        <div class="p-3 rounded-lg border border-white/5 cursor-pointer transition \${activeSessionId === c.sessionId ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10'}" onclick="openChat('\${c.sessionId}')">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-white text-xs \${isUnread ? 'text-emerald-400' : ''}">\${c.name}</span>
            <span class="text-[9px] text-gray-500">\${new Date(c.updatedAt).toLocaleTimeString()}</span>
          </div>
          <div class="text-[11px] text-gray-400 truncate">\${preview}</div>
        </div>
      \`;
    }).join("");
  }

  function openChat(sessionId) {
    activeSessionId = sessionId;
    renderSupportList();
    const chat = allSupportChats.find(c => c.sessionId === sessionId);
    if (!chat) return;

    document.getElementById("support-chat-header").classList.remove("hidden");
    document.getElementById("support-reply-form").classList.remove("hidden");
    document.getElementById("support-active-name").innerText = chat.name;
    document.getElementById("support-active-session").innerText = "ID: " + chat.sessionId;

    const msgsBox = document.getElementById("support-chat-messages");
    if (!chat.messages.length) {
      msgsBox.innerHTML = \`<div class="text-center text-gray-500 text-xs mt-4">No messages.</div>\`;
    } else {
      msgsBox.innerHTML = chat.messages.map(m => {
        const isUser = m.sender === 'user';
        return \`
          <div class="max-w-[85%] p-2.5 rounded-xl text-xs \${isUser ? 'bg-white/10 text-gray-300 self-start' : 'bg-emerald-500/20 text-emerald-100 self-end'}">
            \${m.text}
            <div class="text-[8px] opacity-50 mt-1 \${isUser ? 'text-left' : 'text-right'}">\${new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        \`;
      }).join("");
      msgsBox.scrollTop = msgsBox.scrollHeight;
    }
  }

  async function replyToTicket(e) {
    e.preventDefault();
    const textInput = document.getElementById("support-reply-text");
    const text = textInput.value.trim();
    if (!text || !activeSessionId) return;
    
    const res = await safeFetch("/api/admin/support/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ sessionId: activeSessionId, text })
    });
    if (res.error) { toast(res.error, "error"); return; }
    textInput.value = "";
    loadSupportTickets();
  }

  loadSupportTickets();
</script>
</body>
</html>`;
fs.writeFileSync(suppPath, supportHtml, 'utf8');

// 3. REMOVE SUPPORT FROM DASHBOARD
const suppPaneRegex = /<!-- ═══ SUPPORT TICKETS ═══ -->[\s\S]*?<!-- ═══ PLATFORM ANALYTICS ═══ -->/;
dashHtml = dashHtml.replace(suppPaneRegex, '<!-- ═══ PLATFORM ANALYTICS ═══ -->');

const suppJsRegex = /\/\/ ─── SUPPORT TICKETS ────────────────────────────────────────[\s\S]*?\/\/ ─── ANALYTICS ────────────────────────────────────────/;
dashHtml = dashHtml.replace(suppJsRegex, '// ─── ANALYTICS ────────────────────────────────────────');

// Replace sidebar button with a normal anchor tag linking to support.html
dashHtml = dashHtml.replace(
  '<button class="sidebar-btn" id="tab-btn-support" onclick="switchTab(\'support\')">💬 Support Tickets</button>',
  '<a href="/admin/support.html" class="sidebar-btn block" target="_blank" style="text-decoration:none">💬 Support Tickets ↗</a>'
);

fs.writeFileSync(dashPath, dashHtml, 'utf8');
console.log('Migration completed successfully!');
