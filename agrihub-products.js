/**
 * AgriHub — unique product card renderer & crop metadata
 */
(function (global) {
  "use strict";

  const CROP_ICONS = {
    Rice: "🌾", Wheat: "🌾", Millet: "🌿", Corn: "🌽", Cotton: "☁️",
    Pulses: "🫘", Vegetables: "🥬", Fruits: "🍎", Seeds: "🌱",
    Fertilizer: "🧪", Tools: "🔧", Harvest: "🌾", Organic: "🍃"
  };

  function inferCategory(title) {
    const t = (title || "").toLowerCase();
    if (/seed|இரவு|விதை/.test(t)) return "Seeds";
    if (/fertil|nutrient|urea|உர/.test(t)) return "Fertilizer";
    if (/tool|implement|plough|tractor|கருவி/.test(t)) return "Tools";
    if (/organic|இயற்கை/.test(t)) return "Organic";
    if (/rice|அரிசி|ponni|paddy/.test(t)) return "Rice";
    if (/wheat|கோதுமை/.test(t)) return "Wheat";
    if (/millet|ragi|கம்பு|சோளம்/.test(t)) return "Millet";
    if (/cotton|பருத்தி/.test(t)) return "Cotton";
    if (/tomato|onion|veg|காய்கறி/.test(t)) return "Vegetables";
    if (/mango|banana|fruit|பழம்/.test(t)) return "Fruits";
    return "Harvest";
  }

  function inferGrade(title, isOfficial) {
    const t = (title || "").toLowerCase();
    if (/organic|premium|grade a\+/i.test(t)) return "Organic";
    if (isOfficial) return "A+";
    if (/export|premium/.test(t)) return "A";
    return "A";
  }

  function stockPercent(units, maxUnits) {
    const max = maxUnits || 50;
    return Math.min(100, Math.round((units / max) * 100)) || 8;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeJs(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  /**
   * @param {object} p - product from API
   * @param {number} index - stagger animation delay
   */
  function renderHarvestCard(p, index) {
    const cat = p.cropCategory || inferCategory(p.cropTitle);
    const grade = p.harvestGrade || inferGrade(p.cropTitle, p.isOfficialHubProduct);
    const hub = p.hubLocation || "Thanjavur";
    const icon = CROP_ICONS[cat] || CROP_ICONS.Harvest;
    const stock = p.calculatedTotalUnits || 0;
    const stockPct = stockPercent(stock, Math.max(stock, 40));
    const img = escapeHtml(p.imagePath || "/uploads/default-crop.jpg");
    const title = escapeHtml(p.cropTitle);
    const id = escapeHtml(p._id);
    const delay = Math.min(index * 0.06, 0.5);

    const sourceBadge = p.isOfficialHubProduct
      ? '<span class="harvest-badge harvest-badge--hub">Hub Verified</span>'
      : '<span class="harvest-badge harvest-badge--farmer">Field Direct</span>';

    return `
      <article class="harvest-card" style="animation-delay:${delay}s">
        <div class="harvest-card-corner" aria-hidden="true"></div>
        <div class="harvest-card-image" style="background-image:url('${img}')">
          <div class="harvest-badges">
            ${sourceBadge}
            <span class="harvest-badge harvest-badge--cat">${icon} ${escapeHtml(cat)}</span>
          </div>
          <div class="harvest-grade-ring" title="Harvest grade ${escapeHtml(grade)}">
            <span>${escapeHtml(grade)}</span>
          </div>
        </div>
        <div class="harvest-card-body">
          <h3 class="harvest-card-title">${title}</h3>
          <div class="harvest-meta-row">
            <span class="harvest-meta-chip">${escapeHtml(p.weightPerUnitKg)} kg · ${escapeHtml(p.packagingUnitType || "unit")}</span>
            <span class="harvest-meta-chip">📍 ${escapeHtml(hub)} Hub</span>
          </div>
          <div class="flex justify-between items-center text-[10px] text-gray-400">
            <span>${stock} units available</span>
            <span>${stockPct}% shelf</span>
          </div>
          <div class="harvest-stock-bar"><div class="harvest-stock-fill" style="width:${stockPct}%"></div></div>
          <div class="harvest-card-footer">
            <div class="harvest-price">
              ₹${p.pricePerUnit}
              <small>per ${escapeHtml((p.packagingUnitType || "unit").split(" ")[0])}</small>
            </div>
            <button type="button" class="harvest-buy" onclick="placeOrder('${id}', '${escapeJs(p.cropTitle)}', ${p.pricePerUnit}, ${stock})">
              Harvest Now
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderSkeletons(count) {
    return Array.from({ length: count || 6 }, () =>
      '<div class="harvest-skeleton" aria-hidden="true"></div>'
    ).join("");
  }

  global.AgriProducts = {
    inferCategory,
    inferGrade,
    renderHarvestCard,
    renderSkeletons,
    CROP_ICONS
  };
})(typeof window !== "undefined" ? window : global);
