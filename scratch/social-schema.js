const fs = require('fs');
const path = require('path');

const serverPath = 'c:/Users/gurup/Downloads/Agritech-main/Agritech-main/artifacts/agrihub-monolith/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Update UserSchema
if (!content.includes('profileImagePath: { type: String')) {
  content = content.replace(
    'ifscCode: { type: String, default: "" }',
    'ifscCode: { type: String, default: "" },\n  profileImagePath: { type: String, default: "" },\n  bio: { type: String, default: "" }'
  );
}

// 2. Add Chat & Message Schema
const chatSchemas = `
const ChatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: "" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessageAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, default: "Unknown" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
`;

if (!content.includes('const ChatSchema')) {
  content = content.replace(
    'const UserSchema = new mongoose.Schema({',
    chatSchemas + '\nconst UserSchema = new mongoose.Schema({'
  );
}

// 3. Add Models
const chatModels = `
const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);
`;
if (!content.includes('const Chat = mongoose.model')) {
  content = content.replace(
    'const User = mongoose.model("User", UserSchema);',
    'const User = mongoose.model("User", UserSchema);\n' + chatModels
  );
}

// 4. Add Routes
const socialRoutes = `
// --- SOCIAL & PROFILE ROUTES --- //

// 1. Get Public Profile
app.get("/api/users/:id/profile", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("name bio profileImagePath createdAt");
    if(!u) return res.status(404).json({error: "User not found"});
    const stories = await Story.find({ authorId: u._id }).sort({createdAt: -1});
    res.json({ user: u, stories });
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 2. Update My Profile (Settings)
app.put("/api/users/me/profile", authenticateToken, upload.single("profileImage"), processImage, async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    let updateData = {};
    if(name) updateData.name = name;
    if(phone) updateData.phone = phone;
    if(bio !== undefined) updateData.bio = bio;
    
    if (req.file) {
      updateData.profileImagePath = "/uploads/" + req.file.filename;
    }
    
    const u = await User.findByIdAndUpdate(req.user.id, updateData, {new: true}).select("-password");
    res.json(u);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 3. Change Password
app.put("/api/users/me/password", authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if(!newPassword || newPassword.length < 6) return res.status(400).json({error: "Password too short"});
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    res.json({ success: true });
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 4. Create Chat (DM or Group)
app.post("/api/chats", authenticateToken, async (req, res) => {
  try {
    const { isGroup, name, participantIds } = req.body;
    // For DM, check if exists
    if(!isGroup && participantIds.length === 1) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: [req.user.id, participantIds[0]], $size: 2 }
      });
      if(existing) return res.json(existing);
    }
    
    const parts = [req.user.id, ...participantIds];
    const chat = new Chat({
      isGroup,
      name: isGroup ? name : "",
      participants: parts,
      adminIds: [req.user.id]
    });
    await chat.save();
    res.json(chat);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 5. Get My Chats
app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    // Ensure "AgriHub General" exists
    let general = await Chat.findOne({ name: "AgriHub General", isGroup: true });
    if (!general) {
      general = new Chat({ isGroup: true, name: "AgriHub General", participants: [], adminIds: [] });
      await general.save();
    }
    
    // Auto-join general if not in it
    if (!general.participants.includes(req.user.id)) {
      general.participants.push(req.user.id);
      await general.save();
    }

    const chats = await Chat.find({ participants: req.user.id }).populate("participants", "name profileImagePath").sort({lastMessageAt: -1});
    res.json(chats);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 6. Get Chat Messages
app.get("/api/chats/:id/messages", authenticateToken, async (req, res) => {
  try {
    const msgs = await Message.find({ chatId: req.params.id }).sort({createdAt: 1});
    res.json(msgs);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});

// 7. Send Message
app.post("/api/chats/:id/messages", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if(!text) return res.status(400).json({error: "Empty message"});
    
    const msg = new Message({
      chatId: req.params.id,
      senderId: req.user.id,
      senderName: req.user.name, // quick denormalization
      text
    });
    await msg.save();
    
    await Chat.findByIdAndUpdate(req.params.id, { lastMessageAt: new Date() });
    res.json(msg);
  } catch(e) { res.status(500).json({error: "Server error"}); }
});
`;

if (!content.includes('// --- SOCIAL & PROFILE ROUTES --- //')) {
  content = content.replace('// Root redirect', socialRoutes + '\n// Root redirect');
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log("Schema injected successfully.");
