/**
 * AgriHub — Lucide icon loader & sizing (fixes broken/missing icons)
 */
(function (global) {
  "use strict";

  var LUCIDE_CDN = "https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js";

  /** Deprecated Lucide names still used in HTML */
  var ICON_ALIASES = {
    "bar-chart-2": "chart-bar",
    "bar-chart": "chart-bar",
    "layout-list": "list",
    "log-out": "log-out"
  };

  function normalizeIconName(el) {
    var name = el.getAttribute("data-lucide");
    if (!name) return;
    if (ICON_ALIASES[name]) el.setAttribute("data-lucide", ICON_ALIASES[name]);
  }

  function parseSizeFromClasses(el) {
    var cls = el.className || "";
    var m = cls.match(/\bw-(\d+(?:\.\d+)?)\b/);
    if (m) return parseFloat(m[1]) * 4;
    m = cls.match(/\bh-(\d+(?:\.\d+)?)\b/);
    if (m) return parseFloat(m[1]) * 4;
    var wrap = el.closest("[data-icon-size]");
    if (wrap) {
      var map = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32, "2xl": 40, "3xl": 48 };
      return map[wrap.getAttribute("data-icon-size")] || 20;
    }
    return null;
  }

  function applySvgSizes(root) {
    var scope = root || document;
    var sizeMap = { xs: 14, sm: 16, md: 20, lg: 24, xl: 32, "2xl": 40, "3xl": 48 };
    scope.querySelectorAll("svg.lucide").forEach(function (svg) {
      var px = null;
      var wrap = svg.closest("[data-icon-size]");
      if (wrap) px = sizeMap[wrap.getAttribute("data-icon-size")];
      if (!px && svg.parentElement) {
        var parsed = parseSizeFromClasses(svg.parentElement);
        if (parsed) px = parsed;
      }
      if (!px) px = 20;
      svg.style.width = px + "px";
      svg.style.height = px + "px";
      svg.style.flexShrink = "0";
      svg.setAttribute("data-icon-px", String(px));
    });
  }

  function refresh(root) {
    if (!global.lucide || typeof global.lucide.createIcons !== "function") {
      return false;
    }
    var scope = root || document;
    scope.querySelectorAll("[data-lucide]").forEach(normalizeIconName);
    try {
      global.lucide.createIcons({
        root: scope,
        attrs: {
          "stroke-width": "1.75",
          "aria-hidden": "true"
        }
      });
    } catch (e) {
      console.warn("[AgriIcons] createIcons failed", e);
      return false;
    }
    applySvgSizes(scope);
    return true;
  }

  function ensureLucide(done) {
    if (global.lucide && global.lucide.createIcons) {
      done();
      return;
    }
    if (document.querySelector("script[data-agri-lucide]")) {
      document.addEventListener("agri-lucide-ready", done, { once: true });
      return;
    }
    var s = document.createElement("script");
    s.src = LUCIDE_CDN;
    s.async = false;
    s.dataset.agriLucide = "1";
    s.onload = function () {
      document.dispatchEvent(new Event("agri-lucide-ready"));
      done();
    };
    s.onerror = function () {
      console.error("[AgriIcons] Failed to load Lucide from CDN");
    };
    document.head.appendChild(s);
  }

  function watchMutations() {
    if (!global.MutationObserver) return;
    var timer;
    var obs = new MutationObserver(function (mutations) {
      var needs = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.addedNodes && m.addedNodes.length) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.matches && (n.matches("[data-lucide]") || n.querySelector("[data-lucide]"))) {
              needs = true;
              break;
            }
          }
        }
        if (needs) break;
      }
      if (!needs) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        refresh(document.body);
      }, 50);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    ensureLucide(function () {
      refresh(document);
      watchMutations();
    });
  }

  global.AgriIcons = { refresh: refresh, init: init, ensureLucide: ensureLucide };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
