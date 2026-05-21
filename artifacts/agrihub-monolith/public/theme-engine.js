/**
 * AgriHub Pro — Time Theme Engine v4.0
 * Auto-detects time → morning/afternoon/evening/night
 * Glass shine color adapts via CSS variables — NO orb/ball
 */
(function () {
  "use strict";

  var ICONS = {
    sunrise: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m4.93 10.93 2.83 2.83"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m16.24 13.76 2.83-2.83"/><path d="M12 18a6 6 0 0 0 0-12"/><path d="M2 22h20"/></svg>',
    sun:     '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    sunset:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10V2"/><path d="m4.93 13.07 2.83-2.83"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m16.24 10.24 2.83 2.83"/><path d="M12 18a6 6 0 0 1 0-12"/><path d="M2 22h20"/></svg>',
    moon:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };

  var LABELS = {
    morning:   { label: "Morning",   icon: "sunrise" },
    afternoon: { label: "Afternoon", icon: "sun"     },
    evening:   { label: "Evening",   icon: "sunset"  },
    night:     { label: "Night",     icon: "moon"    }
  };

  function getTheme(h) {
    if (h >= 5  && h <= 10) return "morning";
    if (h >= 11 && h <= 16) return "afternoon";
    if (h >= 17 && h <= 20) return "evening";
    return "night";
  }

  function setTheme(name, animate) {
    var html = document.documentElement;
    var old = html.getAttribute("data-time");
    if (old === name) return;

    if (animate) {
      var ov = document.getElementById("theme-overlay");
      if (ov) {
        ov.classList.add("flash");
        setTimeout(function() { ov.classList.remove("flash"); }, 450);
      }
    }
    html.setAttribute("data-time", name);
    updateBadge(name);
  }

  function updateBadge(name) {
    var badge = document.getElementById("time-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "time-badge";
      badge.title = "Click to cycle time theme";
      badge.addEventListener("click", cycleTheme);
      document.body.appendChild(badge);
    }
    var info = LABELS[name];
    badge.innerHTML = ICONS[info.icon] + "<span>" + info.label + "</span>";
  }

  function ensureOverlay() {
    if (document.getElementById("theme-overlay")) return;
    var el = document.createElement("div");
    el.id = "theme-overlay";
    document.body.appendChild(el);
  }

  // Remove any leftover orb from previous versions
  function removeOrb() {
    var orb = document.getElementById("sky-orb");
    if (orb) orb.remove();
  }

  var ORDER = ["morning", "afternoon", "evening", "night"];
  function cycleTheme() {
    var cur = document.documentElement.getAttribute("data-time") || "night";
    var idx = ORDER.indexOf(cur);
    setTheme(ORDER[(idx + 1) % 4], true);
  }

  function autoDetect() {
    setTheme(getTheme(new Date().getHours()), false);
  }

  function initCustomerCare() {
    if (window.location.href.includes('admin') || window.location.pathname.includes('admin')) return;
    var script = document.createElement('script');
    script.src = '/customer-care.js';
    document.body.appendChild(script);
  }

  function ensureAgriUi() {
    if (!document.querySelector('link[href="/agrihub-ui.css"]')) {
      var u = document.createElement("link");
      u.rel = "stylesheet";
      u.href = "/agrihub-ui.css";
      document.head.appendChild(u);
    }
  }

  function ensurePwaMeta() {
    if (!document.querySelector('link[rel="manifest"]')) {
      var m = document.createElement("link");
      m.rel = "manifest";
      m.href = "/manifest.json";
      document.head.appendChild(m);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      var t = document.createElement("meta");
      t.name = "theme-color";
      t.content = "#10B981";
      document.head.appendChild(t);
    }
    if (!document.querySelector('link[rel="icon"]')) {
      var f = document.createElement("link");
      f.rel = "icon";
      f.type = "image/svg+xml";
      f.href = "/favicon.svg";
      document.head.appendChild(f);
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/service-worker.js").catch(function () {});
  }

  function ensureIconScripts() {
    if (document.querySelector("script[data-agri-icons]") || window.AgriIcons) return;
    var s = document.createElement("script");
    s.src = "/agrihub-icons.js";
    s.dataset.agriIcons = "1";
    document.head.appendChild(s);
  }

  function init() {
    removeOrb();
    ensureOverlay();
    ensureAgriUi();
    ensurePwaMeta();
    ensureIconScripts();
    autoDetect();
    initCustomerCare();
    registerServiceWorker();
    setInterval(autoDetect, 600000);
  }

  // Set immediately to prevent flash
  document.documentElement.setAttribute("data-time", getTheme(new Date().getHours()));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
