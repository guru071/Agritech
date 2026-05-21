const fs = require('fs');
const path = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/public/profile.html';
let content = fs.readFileSync(path, 'utf8');

const profileModalHtml = `
  <!-- Edit Profile Modal -->
  <div id="edit-profile-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
    <div class="glass w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 class="font-bold text-white">Edit Public Profile</h3>
        <button onclick="closeEditProfileModal()" class="text-gray-400 hover:text-white transition"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <form id="edit-profile-form" onsubmit="saveProfile(event)" class="p-6 flex flex-col gap-4">
        
        <div class="flex flex-col items-center gap-3">
          <div class="w-20 h-20 rounded-full bg-zinc-800 border-2 border-emerald-500 overflow-hidden flex items-center justify-center relative group cursor-pointer" onclick="document.getElementById('profile-image-input').click()">
            <img id="profile-preview" src="" class="w-full h-full object-cover hidden">
            <i data-lucide="camera" id="profile-camera-icon" class="w-8 h-8 text-gray-500 absolute group-hover:text-white transition"></i>
            <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-[10px] font-bold">CHANGE</div>
          </div>
          <input type="file" id="profile-image-input" accept="image/*" class="hidden" onchange="previewProfileImage(this)">
          <p class="text-xs text-gray-400">Click to upload avatar</p>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
          <input type="text" id="edit-profile-name" required class="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition">
        </div>
        
        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Public Bio</label>
          <textarea id="edit-profile-bio" rows="2" placeholder="Tell the community about your farm..." class="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition resize-none"></textarea>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
          <input type="text" id="edit-profile-phone" required class="w-full bg-black/40 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition">
        </div>

        <button type="submit" id="save-profile-btn" class="agri-btn-primary w-full justify-center mt-2 py-3">Save Profile Settings</button>
      </form>
    </div>
  </div>
`;

const profileScript = `
  function openEditProfileModal() {
    if(!user) return;
    document.getElementById("edit-profile-name").value = user.name || "";
    document.getElementById("edit-profile-phone").value = user.phone || "";
    
    // fetch full profile to get bio and image
    fetch("/api/users/" + user.id + "/profile")
      .then(r => r.json())
      .then(data => {
        if(data.user) {
          document.getElementById("edit-profile-bio").value = data.user.bio || "";
          if(data.user.profileImagePath) {
            document.getElementById("profile-preview").src = data.user.profileImagePath;
            document.getElementById("profile-preview").classList.remove("hidden");
            document.getElementById("profile-camera-icon").classList.add("hidden");
          }
        }
      });
      
    document.getElementById("edit-profile-modal").classList.remove("hidden");
  }

  function closeEditProfileModal() {
    document.getElementById("edit-profile-modal").classList.add("hidden");
  }

  function previewProfileImage(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById("profile-preview").src = e.target.result;
        document.getElementById("profile-preview").classList.remove("hidden");
        document.getElementById("profile-camera-icon").classList.add("hidden");
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById("save-profile-btn");
    btn.innerText = "Saving...";
    btn.disabled = true;
    
    const formData = new FormData();
    formData.append("name", document.getElementById("edit-profile-name").value);
    formData.append("phone", document.getElementById("edit-profile-phone").value);
    formData.append("bio", document.getElementById("edit-profile-bio").value);
    
    const imgFile = document.getElementById("profile-image-input").files[0];
    if(imgFile) formData.append("profileImage", imgFile);
    
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Authorization": "Bearer " + token },
        body: formData
      });
      const data = await res.json();
      if(data.error) alert(data.error);
      else {
        user.name = data.name;
        user.phone = data.phone;
        localStorage.setItem("user", JSON.stringify(user));
        alert("Profile updated successfully!");
        closeEditProfileModal();
        window.location.reload();
      }
    } catch(err) {
      alert("Failed to update profile.");
    } finally {
      btn.innerText = "Save Profile Settings";
      btn.disabled = false;
    }
  }
`;

// Inject HTML Modal
if (!content.includes('id="edit-profile-modal"')) {
  content = content.replace('<!-- Edit Bank Details Modal -->', profileModalHtml + '\n  <!-- Edit Bank Details Modal -->');
}

// Inject Javascript
if (!content.includes('function openEditProfileModal')) {
  content = content.replace('</script>\n</body>', profileScript + '\n</script>\n</body>');
}

// Add the "Edit Profile" button to the UI
if (!content.includes('openEditProfileModal()')) {
  // We'll replace the existing Settings button next to Edit Bank Details
  content = content.replace(
    '<button onclick="openSettingsModal()" class="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded transition border border-white/10 flex items-center justify-center">\n              <i data-lucide="settings" class="w-4 h-4 text-white"></i>\n            </button>',
    '<button onclick="openEditProfileModal()" class="px-6 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded transition border border-white/10">Edit Profile</button>\n            <button onclick="openSettingsModal()" class="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded transition border border-white/10 flex items-center justify-center">\n              <i data-lucide="settings" class="w-4 h-4 text-white"></i>\n            </button>'
  );
}

// Update the user avatar rendering on profile load
if (!content.includes('data.user.profileImagePath')) {
  const avatarReplacement = `
          if (data.user && data.user.profileImagePath) {
            document.querySelector(".story-ring").innerHTML = \`<img src="\${data.user.profileImagePath}" class="w-32 h-32 rounded-full object-cover border-4 border-[#0B0F19]">\`;
          }
  `;
  content = content.replace(
    'document.getElementById("user-display-email").innerText = user.email;',
    'document.getElementById("user-display-email").innerText = user.email;\n' + avatarReplacement
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated profile.html successfully.");
