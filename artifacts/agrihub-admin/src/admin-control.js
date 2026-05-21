const API_BASE = "/api";
const ORDER_STATUSES = ["Pending", "Accepted", "Packed", "Shipped", "Delivered", "Rejected", "Cancelled"];
const PRODUCT_STATUSES = ["Awaiting_Hub_Delivery", "Received_And_Paid", "Listed_For_Retail"];
const LAND_APPROVAL = ["Pending", "Approved", "Rejected"];
const LAND_STATUSES = ["Available", "Sold"];
const VISIBILITY = ["Public", "Hidden"];

let adminToken = "";
let activeTab = "overview";
let charts = {};

const $ = (id) => document.getElementById(id);
const number = (value) => Number(value || 0).toLocaleString("en-IN");
const money = (value) => `Rs ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
const date = (value) => (value ? new Date(value).toLocaleString() : "-");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function options(values, selected) {
  return values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`).join("");
}

function badge(text, tone = "slate") {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${tones[tone] || tones.slate}">${escapeHtml(text)}</span>`;
}

function statusTone(status) {
  if (["Active", "Premium", "Approved", "Accepted", "Delivered", "Public", "Visible", "Listed_For_Retail", "Available"].includes(status)) return "emerald";
  if (["Pending", "Awaiting_Hub_Delivery", "Packed", "Shipped"].includes(status)) return "amber";
  if (["Suspended", "Rejected", "Hidden", "Cancelled", "Sold"].includes(status)) return "red";
  return "slate";
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

async function api(path, { method = "GET", body, form } = {}) {
  const headers = { "X-Admin-Token": adminToken };
  let payload;
  if (form) payload = form;
  if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  // Guard against HTML error pages (e.g. proxy 404 pages) that are not valid JSON
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned an unexpected response (status ${res.status}). Is the API server running?`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function query(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) qs.set(key, value);
  });
  const text = qs.toString();
  return text ? `?${text}` : "";
}

function setApiStatus(ok) {
  const el = $("api-status");
  el.textContent = ok ? "Connected" : "Disconnected";
  el.className = ok
    ? "rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold"
    : "rounded-full bg-red-700 px-3 py-1 text-xs font-semibold";
}

function statCard(label, value, tone = "emerald") {
  const colors = {
    emerald: "border-emerald-100 text-emerald-700",
    amber: "border-amber-100 text-amber-700",
    blue: "border-blue-100 text-blue-700",
    red: "border-red-100 text-red-700",
    slate: "border-slate-100 text-slate-700",
  };
  return `<div class="rounded-lg border bg-white p-4 shadow-sm ${colors[tone] || colors.slate}">
    <p class="text-xs font-bold uppercase tracking-wide text-slate-400">${escapeHtml(label)}</p>
    <p class="mt-2 text-2xl font-extrabold">${escapeHtml(value)}</p>
  </div>`;
}

function showLoginError(message) {
  const el = $("admin-login-error");
  el.textContent = message;
  el.classList.remove("hidden");
}

async function enterDashboard() {
  try {
    await loadOverview();
    sessionStorage.setItem("agrihub_admin_token", adminToken);
    $("admin-login").classList.add("hidden");
    $("admin-dashboard").classList.remove("hidden");
    setApiStatus(true);
  } catch (err) {
    adminToken = "";
    sessionStorage.removeItem("agrihub_admin_token");
    showLoginError(err.message || "Invalid admin token or API offline.");
    setApiStatus(false);
  }
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("active", active);
    btn.classList.toggle("border-b-[3px]", active);
    btn.classList.toggle("border-emerald-300", active);
    btn.classList.toggle("bg-white/10", active);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  $(`tab-${tab}-content`).classList.remove("hidden");
  loadTab(tab);
}

async function loadTab(tab = activeTab) {
  try {
    setApiStatus(true);
    if (tab === "overview") await loadOverview();
    if (tab === "users") await loadUsers();
    if (tab === "products") await loadProducts();
    if (tab === "orders") await loadOrders();
    if (tab === "community") await loadStories();
    if (tab === "land") await loadLand();
    if (tab === "learning") await loadLearning();
    if (tab === "analytics") await loadAnalytics();
  } catch (err) {
    setApiStatus(false);
    toast(err.message || "Failed to load data");
  }
}

async function loadOverview() {
  const data = await api("/admin/overview");
  $("overview-stats").innerHTML = [
    statCard("Users", number(data.users?.total), "blue"),
    statCard("Premium", number(data.users?.premium), "emerald"),
    statCard("Suspended", number(data.users?.suspended), data.users?.suspended ? "red" : "slate"),
    statCard("Live Products", number(data.commerce?.liveProducts), "emerald"),
    statCard("Pending Orders", number(data.orders?.pending), data.orders?.pending ? "amber" : "slate"),
    statCard("Inventory", money(data.commerce?.inventoryValue), "amber"),
  ].join("");

  $("recent-users").innerHTML = (data.recentUsers || []).length
    ? data.recentUsers.map((u) => `
      <div class="flex items-center justify-between rounded-md border border-slate-100 p-3">
        <div><p class="font-semibold">${escapeHtml(u.name)}</p><p class="text-xs text-slate-500">${escapeHtml(u.email)}</p></div>
        <div class="flex gap-1">${badge(u.subscriptionTier, statusTone(u.subscriptionTier))}${badge(u.accountStatus || "Active", statusTone(u.accountStatus || "Active"))}</div>
      </div>`).join("")
    : empty("No users yet");

  $("recent-orders").innerHTML = (data.recentOrders || []).length
    ? data.recentOrders.map((o) => `
      <div class="flex items-center justify-between rounded-md border border-slate-100 p-3">
        <div><p class="font-semibold">${escapeHtml(o.cropTitle)}</p><p class="text-xs text-slate-500">${escapeHtml(o.buyerName)} - ${number(o.unitsRequested)} units</p></div>
        ${badge(o.status, statusTone(o.status))}
      </div>`).join("")
    : empty("No orders yet");
}

function empty(text) {
  return `<div class="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-400">${escapeHtml(text)}</div>`;
}

async function loadUsers() {
  const data = await api(`/admin/users${query({ q: $("users-q").value, tier: $("users-tier").value, status: $("users-status").value })}`);
  const users = data.users || [];
  $("users-table").innerHTML = users.length ? users.map((u) => `
    <tr class="border-t border-slate-100">
      <td class="px-4 py-3"><p class="font-bold">${escapeHtml(u.name)}</p><p class="text-xs text-slate-500">${escapeHtml(u.email)}</p></td>
      <td class="px-4 py-3">${escapeHtml(u.phone || "-")}</td>
      <td class="px-4 py-3">
        <select data-user-tier="${u._id}" class="rounded-md border border-slate-300 px-2 py-1 text-xs">
          ${options(["Free", "Premium"], u.subscriptionTier || "Free")}
        </select>
      </td>
      <td class="px-4 py-3">
        <select data-user-status="${u._id}" class="rounded-md border border-slate-300 px-2 py-1 text-xs">
          ${options(["Active", "Suspended"], u.accountStatus || "Active")}
        </select>
      </td>
      <td class="px-4 py-3 text-xs text-slate-500">${date(u.createdAt)}</td>
      <td class="px-4 py-3 text-right">
        <button data-action="delete-user" data-id="${u._id}" class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
      </td>
    </tr>`).join("") : `<tr><td colspan="6">${empty("No users found")}</td></tr>`;
}

async function loadProducts() {
  const data = await api(`/admin/products/all${query({ q: $("products-q").value, status: $("products-status").value, source: $("products-source").value, visibility: $("products-visibility").value })}`);
  const products = data.products || [];
  $("products-list").innerHTML = products.length ? products.map((p) => `
    <article class="rounded-lg bg-white p-4 shadow">
      <div class="flex gap-4">
        <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-3xl">
          ${p.imagePath ? `<img src="${escapeHtml(p.imagePath)}" alt="" class="h-full w-full object-cover">` : "AG"}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 class="font-extrabold">${escapeHtml(p.cropTitle)}</h3>
              <p class="text-xs text-slate-500">${escapeHtml(p.sellerName || "AgriHub Official")} - ${number(p.totalWeightKg)} kg</p>
            </div>
            <div class="flex flex-wrap gap-1">${badge(p.isOfficialHubProduct ? "Official" : "Farmer", p.isOfficialHubProduct ? "emerald" : "blue")}${badge(p.visibility || "Public", statusTone(p.visibility || "Public"))}${p.isFeatured ? badge("Featured", "amber") : ""}</div>
          </div>
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <select data-product-status="${p._id}" class="rounded-md border border-slate-300 px-2 py-2 text-xs">${options(PRODUCT_STATUSES, p.adminVerificationStatus)}</select>
            <select data-product-visibility="${p._id}" class="rounded-md border border-slate-300 px-2 py-2 text-xs">${options(VISIBILITY, p.visibility || "Public")}</select>
            <button data-action="product-price" data-id="${p._id}" data-price="${p.pricePerUnit || 0}" class="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white">${money(p.pricePerUnit)} / unit</button>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button data-action="product-feature" data-id="${p._id}" data-featured="${p.isFeatured ? "true" : "false"}" class="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">${p.isFeatured ? "Unfeature" : "Feature"}</button>
            <button data-action="product-delete" data-id="${p._id}" class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>
      </div>
    </article>`).join("") : empty("No products found");
}

async function loadOrders() {
  const data = await api(`/admin/orders/all${query({ q: $("orders-q").value, status: $("orders-status").value })}`);
  const orders = data.orders || [];
  $("orders-list").innerHTML = orders.length ? orders.map((o) => `
    <article class="rounded-lg bg-white p-4 shadow">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-extrabold">${escapeHtml(o.cropTitle)}</h3>${badge(o.status, statusTone(o.status))}
          </div>
          <p class="mt-1 text-sm text-slate-600">Buyer: ${escapeHtml(o.buyerName)} (${escapeHtml(o.buyerPhone)})</p>
          <p class="text-xs text-slate-500">Seller: ${escapeHtml(o.sellerName)} - Units: ${number(o.unitsRequested)} - ${date(o.createdAt)}</p>
          ${o.message ? `<p class="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">${escapeHtml(o.message)}</p>` : ""}
        </div>
        <div class="flex gap-2">
          <select data-order-status="${o._id}" class="rounded-md border border-slate-300 px-3 py-2 text-sm">${options(ORDER_STATUSES, o.status)}</select>
          <button data-action="order-delete" data-id="${o._id}" class="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </article>`).join("") : empty("No orders found");
}

async function loadStories() {
  const data = await api(`/admin/stories/all${query({ q: $("stories-q").value, status: $("stories-status").value })}`);
  const stories = data.stories || [];
  $("stories-list").innerHTML = stories.length ? stories.map((s) => `
    <article class="overflow-hidden rounded-lg bg-white shadow">
      <div class="flex h-44 items-center justify-center bg-slate-100 text-2xl">
        ${s.mediaUrl ? `<img src="${escapeHtml(s.mediaUrl)}" alt="" class="h-full w-full object-cover">` : "Story"}
      </div>
      <div class="space-y-3 p-4">
        <div class="flex items-center justify-between gap-2">
          <div><h3 class="font-bold">${escapeHtml(s.userName || "Farmer")}</h3><p class="text-xs text-slate-500">${date(s.createdAt)}</p></div>
          ${badge(s.moderationStatus || "Visible", statusTone(s.moderationStatus || "Visible"))}
        </div>
        <p class="line-clamp-3 text-sm text-slate-600">${escapeHtml(s.caption || "No caption")}</p>
        <div class="flex gap-2">
          <button data-action="story-toggle" data-id="${s._id}" data-status="${s.moderationStatus || "Visible"}" class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50">${(s.moderationStatus || "Visible") === "Hidden" ? "Show" : "Hide"}</button>
          <button data-action="story-delete" data-id="${s._id}" class="flex-1 rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </article>`).join("") : empty("No stories found");
}

async function loadLand() {
  const data = await api(`/admin/land/all${query({ q: $("land-q").value, approval: $("land-approval").value, status: $("land-status").value, visibility: $("land-visibility").value })}`);
  const listings = data.listings || [];
  $("land-list").innerHTML = listings.length ? listings.map((l) => `
    <article class="rounded-lg bg-white p-4 shadow">
      <div class="flex flex-col gap-4 md:flex-row">
        <div class="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-amber-50 text-2xl md:w-40">
          ${l.imagePath ? `<img src="${escapeHtml(l.imagePath)}" alt="" class="h-full w-full object-cover">` : "Land"}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div><h3 class="font-extrabold">${escapeHtml(l.title)}</h3><p class="text-sm text-slate-600">${escapeHtml(l.location || "-")} - ${number(l.totalAcreage)} acres</p></div>
            <div class="flex flex-wrap gap-1">${badge(l.adminApprovalStatus, statusTone(l.adminApprovalStatus))}${badge(l.status, statusTone(l.status))}${badge(l.visibility || "Public", statusTone(l.visibility || "Public"))}</div>
          </div>
          <p class="mt-2 text-sm font-bold text-amber-700">${money(l.totalPrice)} (${money(l.pricePerSqFt)} / sq.ft)</p>
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <select data-land-approval="${l._id}" class="rounded-md border border-slate-300 px-2 py-2 text-xs">${options(LAND_APPROVAL, l.adminApprovalStatus)}</select>
            <select data-land-status="${l._id}" class="rounded-md border border-slate-300 px-2 py-2 text-xs">${options(LAND_STATUSES, l.status)}</select>
            <select data-land-visibility="${l._id}" class="rounded-md border border-slate-300 px-2 py-2 text-xs">${options(VISIBILITY, l.visibility || "Public")}</select>
          </div>
          <div class="mt-3 flex gap-2">
            <button data-action="land-feature" data-id="${l._id}" data-featured="${l.isFeatured ? "true" : "false"}" class="rounded-md border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">${l.isFeatured ? "Unfeature" : "Feature"}</button>
            <button data-action="land-delete" data-id="${l._id}" class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>
      </div>
    </article>`).join("") : empty("No land listings found");
}

async function loadLearning() {
  const data = await api("/learning/tutorials");
  // API may return a raw array or a wrapped { tutorials: [...] } object
  const tutorials = Array.isArray(data) ? data : (Array.isArray(data?.tutorials) ? data.tutorials : []);
  $("learning-list").innerHTML = tutorials.length ? tutorials.map((t) => `
    <article class="rounded-lg bg-white p-4 shadow flex flex-col justify-between">
      <div>
        <div class="aspect-video w-full rounded bg-slate-100 overflow-hidden relative">
          <iframe class="w-full h-full" src="${escapeHtml(t.videoUrl)}" title="" frameborder="0" allowfullscreen></iframe>
        </div>
        <div class="mt-3 flex items-start justify-between gap-2">
          <div>
            <h3 class="font-extrabold text-slate-800 line-clamp-1">${escapeHtml(t.title)}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(t.category)} • ${badge(t.language, t.language === "EN" ? "blue" : "emerald")}</p>
          </div>
        </div>
        <p class="mt-2 text-sm text-slate-600 line-clamp-2">${escapeHtml(t.description)}</p>
      </div>
      <div class="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <button data-action="learning-edit" data-id="${t._id}" data-title="${escapeHtml(t.title)}" data-category="${escapeHtml(t.category)}" data-video-url="${escapeHtml(t.videoUrl)}" data-language="${escapeHtml(t.language)}" data-description="${escapeHtml(t.description)}" class="flex-1 rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Edit</button>
        <button data-action="learning-delete" data-id="${t._id}" class="flex-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
      </div>
    </article>`).join("") : empty("No tutorials found");
}

async function loadAnalytics() {
  try {
    const data = await api("/admin/analytics/platform");
    $("analytics-cards").innerHTML = [
      statCard("Total Users", number(data.users?.total), "blue"),
      statCard("Premium Users", number(data.users?.premium), "emerald"),
      statCard("Hub Volume Kg", number(data.hub?.totalVolumeKg), "amber"),
      statCard("Pending Land", number(data.hub?.pendingLandListings), "red"),
    ].join("");

    drawChart("volume-chart", "bar", (data.monthlyVolume || []).map((m) => `${m._id.month}/${m._id.year}`), (data.monthlyVolume || []).map((m) => m.volume), "#059669");
    drawChart("crop-chart", "doughnut", (data.cropBreakdown || []).map((c) => c._id), (data.cropBreakdown || []).map((c) => c.totalWeight), ["#059669", "#10b981", "#34d399", "#f59e0b", "#3b82f6", "#8b5cf6"]);
  } catch (err) {
    $("analytics-cards").innerHTML = `<div class="col-span-4 text-sm text-red-500 bg-red-50 rounded-lg p-4">${err.message || "Failed to load analytics"}</div>`;
    toast(err.message || "Analytics unavailable");
  }
}

function drawChart(id, type, labels, values, color) {
  const canvas = $(id);
  if (!canvas || !window.Chart) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(canvas, {
    type,
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: Array.isArray(color) ? color : color, borderColor: "#fff", borderWidth: 2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

async function patchUser(id, body) {
  await api(`/admin/users/${id}`, { method: "PATCH", body });
  toast("User updated");
  await loadUsers();
}

async function patchProduct(id, body) {
  await api(`/admin/products/${id}`, { method: "PATCH", body });
  toast("Product updated");
  await loadProducts();
}

async function patchLand(id, body) {
  await api(`/admin/land/${id}`, { method: "PATCH", body });
  toast("Land listing updated");
  await loadLand();
}

async function patchOrder(id, status) {
  await api(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } });
  toast("Order updated");
  await loadOrders();
}

async function patchStory(id, moderationStatus) {
  await api(`/admin/stories/${id}`, { method: "PATCH", body: { moderationStatus } });
  toast("Story updated");
  await loadStories();
}

async function remove(path, reload, label) {
  if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
  await api(path, { method: "DELETE" });
  toast(`${label} deleted`);
  await reload();
}

async function handleAction(target) {
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action) return;

  if (action === "delete-user") return remove(`/admin/users/${id}`, loadUsers, "user");
  if (action === "product-delete") return remove(`/admin/products/${id}`, loadProducts, "product");
  if (action === "order-delete") return remove(`/admin/orders/${id}`, loadOrders, "order");
  if (action === "story-delete") return remove(`/admin/stories/${id}`, loadStories, "story");
  if (action === "land-delete") return remove(`/admin/land/${id}`, loadLand, "land listing");
  if (action === "learning-delete") return remove(`/learning/tutorials/${id}`, loadLearning, "tutorial");
  
  if (action === "learning-edit") {
    $("learning-id").value = id;
    $("learning-title").value = target.dataset.title;
    $("learning-category").value = target.dataset.category;
    $("learning-videoUrl").value = target.dataset.videoUrl;
    $("learning-language").value = target.dataset.language;
    $("learning-description").value = target.dataset.description;
    
    $("learning-form-title").textContent = "Edit Academy Tutorial";
    $("learning-submit-btn").textContent = "Update Tutorial";
    $("learning-form-container").classList.remove("hidden");
    $("learning-form-container").scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (action === "product-price") {
    const price = prompt("Retail price per unit", target.dataset.price || "0");
    if (price === null) return;
    return patchProduct(id, { pricePerUnit: Number(price) });
  }

  if (action === "product-feature") {
    return patchProduct(id, { isFeatured: target.dataset.featured !== "true" });
  }

  if (action === "land-feature") {
    return patchLand(id, { isFeatured: target.dataset.featured !== "true" });
  }

  if (action === "story-toggle") {
    return patchStory(id, target.dataset.status === "Hidden" ? "Visible" : "Hidden");
  }
}

async function handleChange(target) {
  if (target.dataset.userTier) return patchUser(target.dataset.userTier, { subscriptionTier: target.value });
  if (target.dataset.userStatus) return patchUser(target.dataset.userStatus, { accountStatus: target.value });
  if (target.dataset.productStatus) return patchProduct(target.dataset.productStatus, { adminVerificationStatus: target.value });
  if (target.dataset.productVisibility) return patchProduct(target.dataset.productVisibility, { visibility: target.value });
  if (target.dataset.orderStatus) return patchOrder(target.dataset.orderStatus, target.value);
  if (target.dataset.landApproval) return patchLand(target.dataset.landApproval, { adminApprovalStatus: target.value });
  if (target.dataset.landStatus) return patchLand(target.dataset.landStatus, { status: target.value });
  if (target.dataset.landVisibility) return patchLand(target.dataset.landVisibility, { visibility: target.value });
}

async function submitOfficialProduct(event) {
  event.preventDefault();
  const message = $("store-message");
  message.className = "mt-3 hidden rounded-md px-3 py-2 text-sm font-semibold";
  try {
    const form = new FormData(event.currentTarget);
    const data = await api("/admin/store/official", { method: "POST", form });
    event.currentTarget.reset();
    message.textContent = `${data.product.cropTitle} published to the official store`;
    message.classList.remove("hidden");
    message.classList.add("bg-emerald-50", "text-emerald-700");
    toast("Official product published");
  } catch (err) {
    message.textContent = err.message || "Upload failed";
    message.classList.remove("hidden");
    message.classList.add("bg-red-50", "text-red-700");
  }
}

async function submitLearningTutorial(event) {
  event.preventDefault();
  const message = $("learning-message");
  message.className = "mt-3 hidden rounded-md px-3 py-2 text-sm font-semibold";
  try {
    const id = $("learning-id").value;
    const body = {
      title: $("learning-title").value.trim(),
      category: $("learning-category").value.trim(),
      videoUrl: $("learning-videoUrl").value.trim(),
      language: $("learning-language").value,
      description: $("learning-description").value.trim()
    };
    
    if (id) {
      await api(`/learning/tutorials/${id}`, { method: "PATCH", body });
      toast("Tutorial updated successfully");
    } else {
      await api("/learning/tutorials", { method: "POST", body });
      toast("Tutorial published successfully");
    }
    
    resetLearningForm();
    await loadLearning();
  } catch (err) {
    message.textContent = err.message || "Operation failed";
    message.classList.remove("hidden");
    message.classList.add("bg-red-50", "text-red-700");
  }
}

function resetLearningForm() {
  $("learning-form").reset();
  $("learning-id").value = "";
  $("learning-form-title").textContent = "Add Academy Tutorial";
  $("learning-submit-btn").textContent = "Publish Tutorial";
  $("learning-form-container").classList.add("hidden");
  $("learning-message").classList.add("hidden");
}

function bindEvents() {
  $("learning-form").addEventListener("submit", submitLearningTutorial);
  $("learning-cancel-btn").addEventListener("click", resetLearningForm);
  $("toggle-learning-form-btn").addEventListener("click", () => {
    $("learning-form-container").classList.toggle("hidden");
    if (!$("learning-form-container").classList.contains("hidden")) {
      resetLearningForm();
      $("learning-form-container").classList.remove("hidden");
    }
  });

  $("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    adminToken = $("admin-token-input").value.trim();
    if (!adminToken) return showLoginError("Enter the admin token.");
    enterDashboard();
  });

  $("admin-logout").addEventListener("click", () => {
    adminToken = "";
    sessionStorage.removeItem("agrihub_admin_token");
    $("admin-dashboard").classList.add("hidden");
    $("admin-login").classList.remove("hidden");
  });

  $("refresh-active").addEventListener("click", () => loadTab());
  $("official-store-form").addEventListener("submit", submitOfficialProduct);

  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) return switchTab(tab.dataset.tab);
    const jump = event.target.closest("[data-tab-jump]");
    if (jump) return switchTab(jump.dataset.tabJump);
    const load = event.target.closest("[data-load]");
    if (load) return loadTab(load.dataset.load);
    const action = event.target.closest("[data-action]");
    if (action) handleAction(action).catch((err) => toast(err.message || "Action failed"));
  });

  document.addEventListener("change", (event) => {
    handleChange(event.target).catch((err) => toast(err.message || "Update failed"));
  });
}

bindEvents();
adminToken = sessionStorage.getItem("agrihub_admin_token") || "";
if (adminToken) enterDashboard();
