/* Griglia dei post Instagram, usata dalla pagina Social e dall'anteprima in home.
   Legge data/social.json, scritto ogni due ore dal flusso GitHub «Post e reel da Instagram». */
(function () {
  "use strict";
  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var LABEL = { reel: "Reel", post: "Post", carosello: "Carosello" };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function demoOn() {
    try {
      if (/[?&]demo=1\b/.test(location.search)) sessionStorage.setItem("avamposto-demo", "1");
      if (/[?&]demo=0\b/.test(location.search)) sessionStorage.removeItem("avamposto-demo");
      return sessionStorage.getItem("avamposto-demo") === "1";
    } catch (e) { return /[?&]demo=1\b/.test(location.search); }
  }
  function firstLine(c) {
    var t = String(c || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean)[0] || "";
    t = t.replace(/(^|\s)#[\p{L}\d_]+/gu, "").trim();
    return t.length > 140 ? t.slice(0, 137).replace(/\s+\S*$/, "") + "…" : t;
  }
  function when(ts) {
    var d = new Date(ts); if (isNaN(d)) return "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "");
  }
  var ICON = {
    reel: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5M10 12l5 3-5 3z"/></svg>',
    post: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    carosello: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="14" height="14" rx="3"/><path d="M17 3H6a3 3 0 0 0-3 3v11"/></svg>'
  };
  function tile(p, base) {
    var k = p.type === "reel" ? "reel" : p.type === "carosello" ? "carosello" : "post";
    var text = firstLine(p.caption);
    var img = /^https?:|^\.\.\//.test(p.image) ? p.image : base + p.image;
    return '<a class="post ' + k + '" href="' + esc(p.permalink) + '" target="_blank" rel="noopener" aria-label="' + esc(LABEL[k] + ": " + (text || "apri su Instagram")) + '">' +
      '<img src="' + esc(img) + '" alt="" loading="lazy">' +
      '<span class="kind">' + ICON[k] + LABEL[k] + "</span>" +
      (k === "reel" ? '<span class="post-play" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>' : "") +
      '<span class="txt"><small>' + esc(when(p.timestamp)) + "</small>" + (text ? "<span>" + esc(text) + "</span>" : "") + "</span></a>";
  }
  function demoPosts(base) {
    var now = Date.now(), d = function (n) { return new Date(now - n * 86400000).toISOString(); };
    var f = function (n) { return base + "assets/foto/" + n + ".jpg"; };
    var ig = "https://www.instagram.com/azioneunder30marche/";
    return [
      { id: "d1", type: "reel", caption: "Un anno di Azione Under 30 Marche in 60 secondi (esempio)", permalink: "https://www.instagram.com/reel/DXPXZmQjT95/", timestamp: d(1), image: f("copertina-reel") },
      { id: "d2", type: "carosello", caption: "Tutti a Roma: le foto della trasferta (esempio)", permalink: ig, timestamp: d(4), image: f("evento-roma-gruppo") },
      { id: "d3", type: "post", caption: "Fiaccolata per l'Ucraina: grazie a chi c'era (esempio)", permalink: ig, timestamp: d(9), image: f("fiaccolata-ucraina") },
      { id: "d4", type: "reel", caption: "Il banchetto in piazza visto da dentro (esempio)", permalink: ig, timestamp: d(13), image: f("centro-storico") },
      { id: "d5", type: "post", caption: "Cena di gruppo: si parla di Europa, si mangia bene (esempio)", permalink: ig, timestamp: d(18), image: f("cena") },
      { id: "d6", type: "post", caption: "Le magliette sono arrivate (esempio)", permalink: ig, timestamp: d(25), image: f("corso-magliette") },
      { id: "d7", type: "reel", caption: "In piazza con le bandiere dell'Europa (esempio)", permalink: ig, timestamp: d(31), image: f("piazza-bandiere") },
      { id: "d8", type: "carosello", caption: "La platea dell'evento nazionale (esempio)", permalink: ig, timestamp: d(40), image: f("evento-roma-platea") }
    ];
  }
  function load(base) {
    var demo = demoOn();
    return fetch(base + "data/social.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { var p = (j && j.posts) || []; if (!p.length && demo) return { posts: demoPosts(base), demo: true }; return { posts: p, updated: j.aggiornato }; })
      .catch(function () { return demo ? { posts: demoPosts(base), demo: true } : { posts: [] }; });
  }
  function render(o) {
    var base = o.base || "";
    return load(base).then(function (res) {
      if (res.demo && o.demoBar) o.demoBar.hidden = false;
      var posts = res.posts.slice(0, o.limit || 24);
      if (!posts.length) {
        if (o.onEmpty) return o.onEmpty();
        o.box.outerHTML = '<p class="empty"><b>I nostri post arrivano presto.</b>Intanto ci trovi su <a href="https://www.instagram.com/azioneunder30marche/" target="_blank" rel="noopener">Instagram</a>.</p>';
        return;
      }
      var draw = function (f) { o.box.innerHTML = posts.filter(function (p) { return !f || (f === "post" ? p.type !== "reel" : p.type === f); }).map(function (p) { return tile(p, base); }).join(""); };
      draw("");
      if (o.chips) {
        o.chips.hidden = false;
        o.chips.addEventListener("click", function (e) {
          var b = e.target.closest("[data-f]"); if (!b) return;
          o.chips.querySelectorAll("[data-f]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          draw(b.getAttribute("data-f"));
        });
      }
      if (o.updated && res.updated) {
        var d = new Date(res.updated);
        o.updated.textContent = "Aggiornato il " + d.toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }) + ".";
      }
      if (o.onReady) o.onReady(posts);
    });
  }
  window.SocialFeed = { render: render };
})();
