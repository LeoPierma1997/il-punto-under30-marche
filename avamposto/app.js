/* Avamposto Under 30 – interfaccia. */
(function () {
  "use strict";
  var D = window.AvampostoData;
  var main = document.getElementById("main");
  var nav = document.getElementById("mast-nav");
  var toastEl = document.getElementById("toast");
  var INVITE_KEY = "avamposto-invito";

  var S = { me: null, admin: false, profile: null, inits: [], mine: {}, amats: [], views: {}, ready: false };
  var A = { enrollments: [], profiles: [], invites: {} }; // dati di gestione

  /* ---------------- utilità ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ICONS = {
    corso: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v5"/>',
    formazione: '<path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/>',
    contenuti: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    evento: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    diretta: '<circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    pdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    testo: '<path d="M4 6h16M4 10h16M4 14h11M4 18h8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.3-1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'
  };
  function icon(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.testo) + "</svg>"; }
  var KIND = { corso: "Corso", formazione: "Formazione", contenuti: "Contenuti speciali", evento: "Evento" };
  var MAT = { video: "Video", diretta: "Diretta Meet", pdf: "PDF", testo: "Testo", link: "Link" };
  var MONTHS = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  var DAYS = ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
  function d(v) { return v ? new Date(v.length === 10 ? v + "T12:00:00" : v) : null; }
  function fmtDate(v) { var x = d(v); return x ? x.getDate() + " " + MONTHS[x.getMonth()] + " " + x.getFullYear() : ""; }
  function fmtShort(v) { var x = d(v); return x ? x.getDate() + " " + MONTHS[x.getMonth()].slice(0, 3) : ""; }
  function fmtWhen(v) {
    var x = d(v); if (!x) return "";
    return DAYS[x.getDay()] + " " + x.getDate() + " " + MONTHS[x.getMonth()] + ", ore " + String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0");
  }
  function toLocalInput(v) {
    var x = d(v); if (!x) return "";
    var p = function (n) { return String(n).padStart(2, "0"); };
    return x.getFullYear() + "-" + p(x.getMonth() + 1) + "-" + p(x.getDate()) + "T" + p(x.getHours()) + ":" + p(x.getMinutes());
  }
  function slugify(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "iniziativa";
  }
  function safeHref(u) {
    u = String(u || "").trim();
    if (/^https?:\/\//i.test(u) || /^\.\.?\//.test(u)) return u;
    return "";
  }
  function prose(t) {
    var html = esc(t || "");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return html.split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function toast(msg, isErr) {
    toastEl.textContent = msg; toastEl.className = "toast" + (isErr ? " err" : ""); toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, isErr ? 6000 : 3500);
  }
  function busy(btn, on) { if (btn) { btn.disabled = on; if (on) btn.setAttribute("aria-busy", "true"); else btn.removeAttribute("aria-busy"); } }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function initBySlug(slug) { return S.inits.filter(function (i) { return i.slug === slug; })[0]; }
  function initById(id) { return S.inits.filter(function (i) { return i.id === id; })[0]; }
  function hasAccess(it) {
    if (!S.me) return false;
    if (S.admin) return true;
    if (!it.published) return false;
    if (it.access === "aperta") return true;
    var e = S.mine[it.id]; return !!(e && e.status === "attiva");
  }
  function redirectUrl() {
    var inv = pendingInvite();
    return location.origin + location.pathname + (inv ? "?invito=" + encodeURIComponent(inv) : "");
  }
  function pendingInvite() { try { return localStorage.getItem(INVITE_KEY) || ""; } catch (e) { return ""; } }
  function setPendingInvite(v) { try { if (v) localStorage.setItem(INVITE_KEY, v); else localStorage.removeItem(INVITE_KEY); } catch (e) {} }
  function emailsFrom(text) {
    var found = String(text || "").toLowerCase().match(/[^\s,;<>()"']+@[^\s,;<>()"']+\.[a-z]{2,}/g) || [];
    return found.filter(function (m, i) { return found.indexOf(m) === i; });
  }

  /* ---------------- dati ---------------- */
  function refresh() {
    S.me = D.me();
    var tasks = [D.initiatives().then(function (r) { S.inits = r || []; })];
    if (S.me) {
      tasks.push(D.isAdmin().then(function (a) { S.admin = !!a; }));
      tasks.push(D.getProfile().then(function (p) { S.profile = p; }));
      tasks.push(D.myEnrollments().then(function (r) {
        S.mine = {}; (r || []).forEach(function (e) { S.mine[e.initiative_id] = e; });
      }));
      tasks.push(D.accessibleMaterials().then(function (r) { S.amats = r || []; }));
      tasks.push(D.myViews().then(function (r) { S.views = {}; (r || []).forEach(function (v) { S.views[v.material_id] = true; }); }));
    } else { S.admin = false; S.profile = null; S.mine = {}; S.amats = []; S.views = {}; }
    return Promise.all(tasks).then(function () {
      if (!S.admin) return;
      return Promise.all([D.allEnrollments(), D.allProfiles(), D.invites()]).then(function (r) {
        A.enrollments = r[0] || []; A.profiles = r[1] || [];
        A.invites = {}; (r[2] || []).forEach(function (v) { A.invites[v.initiative_id] = v; });
      });
    });
  }
  function reload() { return refresh().then(route).catch(function (e) { toast(e.message, true); route(); }); }

  /* ---------------- menu ---------------- */
  function renderNav(active) {
    if (!S.me) { nav.innerHTML = '<a href="#home"' + (active === "home" ? ' aria-current="page"' : "") + ">Entra</a>"; return; }
    var pending = S.admin ? A.enrollments.filter(function (e) { return e.status === "richiesta"; }).length : 0;
    nav.innerHTML =
      '<a href="#home"' + (active === "home" ? ' aria-current="page"' : "") + ">I miei percorsi</a>" +
      '<a href="#profilo"' + (active === "profilo" ? ' aria-current="page"' : "") + ">Profilo</a>" +
      (S.admin ? '<a class="staff" href="#gestione"' + (active === "gestione" ? ' aria-current="page"' : "") + ">" + icon("shield") + "Gestione" +
        (pending ? ' <span class="count" aria-label="' + pending + ' richieste">' + pending + "</span>" : "") + "</a>" : "");
  }
  function setMain(html, active, bare) {
    renderNav(active);
    main.innerHTML = bare ? html : '<div class="wrap page">' + html + "</div>";
  }

  /* ---------------- router ---------------- */
  function route() {
    if (!S.ready) return;
    var h = (location.hash || "#home").slice(1);
    if (!S.me) {
      if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
      return viewWelcome();
    }
    if (S.profile === null || !S.profile.full_name || !S.profile.membership || !S.profile.privacy_at) return viewCompleteProfile();
    if (h === "profilo") return viewProfile();
    if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
    if (S.admin) {
      if (h === "gestione") return viewAdmin();
      if (h === "g-iscritti") return viewMembers();
      if (h === "g-nuova") return viewEditInitiative(null);
      if (h.indexOf("g-") === 0) return viewEditInitiative(h.slice(2));
    }
    return viewHome();
  }

  /* ---------------- schede iniziativa ---------------- */
  function statusPill(it) {
    if (!it.published) return '<span class="pill draft">Bozza</span>';
    if (it.access === "aperta") return '<span class="pill open">Aperta a tutti</span>';
    var e = S.mine[it.id];
    if (e && e.status === "attiva") return '<span class="pill ok">' + icon("check") + "Accesso attivo</span>";
    if (e && e.status === "richiesta") return '<span class="pill wait">Richiesta inviata</span>';
    if (e && e.status === "rifiutata") return '<span class="pill no">Non accolta</span>';
    return '<span class="pill lock">' + icon("lock") + "Su richiesta</span>";
  }
  function actionFor(it) {
    if (!S.me) return '<a class="btn small" href="#home" data-action="focus-signup">Entra per partecipare</a>';
    if (hasAccess(it)) return '<a class="btn small primary" href="#i-' + esc(it.slug) + '">Apri</a>';
    var e = S.mine[it.id];
    if (e && e.status === "richiesta") return '<button class="btn small quiet" type="button" data-action="cancel" data-id="' + esc(it.id) + '">Annulla richiesta</button>';
    if (e && e.status === "rifiutata") return '<span class="note">Per informazioni scrivi allo staff</span>';
    return '<button class="btn small primary" type="button" data-action="request" data-id="' + esc(it.id) + '">Chiedi di partecipare</button>';
  }
  function band(it) {
    var when = it.starts_on ? "Dal " + fmtShort(it.starts_on) : "";
    return '<div class="init-band k-' + esc(it.kind) + '">' + icon(it.kind) + '<span class="kind">' + esc(KIND[it.kind] || "Iniziativa") + "</span>" +
      (when ? '<span class="when">' + esc(when) + "</span>" : "") + "</div>";
  }
  function coverHtml(it, cls) {
    var u = it.cover_path ? D.coverUrl(it.cover_path) : "";
    if (u) return '<div class="cover ' + (cls || "") + '"><img src="' + esc(u) + '" alt="" loading="lazy"></div>';
    return '<div class="cover auto k-' + esc(it.kind) + " " + (cls || "") + '" aria-hidden="true"><span class="cover-ico">' + icon(it.kind) +
      '</span><span class="cover-title">' + esc(it.title) + '</span><span class="cover-mark">Avamposto</span></div>';
  }
  function progressOf(it) {
    var list = S.amats.filter(function (m) { return m.initiative_id === it.id && m.published !== false; });
    var seen = list.filter(function (m) { return S.views[m.id]; }).length;
    return { total: list.length, seen: seen, unseen: list.length - seen };
  }
  function progressBar(pr, big) {
    if (!pr.total) return "";
    var pct = Math.round(pr.seen / pr.total * 100);
    return '<div class="progress' + (big ? " big" : "") + '"><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + pr.total + '" aria-valuenow="' + pr.seen + '" aria-label="Materiali visti">' +
      '<span style="width:' + pct + '%"></span></div><span class="progress-txt">' + (pr.seen === pr.total ? "Tutto visto" : pr.seen + " di " + pr.total + " visti") + "</span></div>";
  }
  function initCard(it) {
    var access = hasAccess(it), pr = access ? progressOf(it) : { total: 0, seen: 0, unseen: 0 };
    var when = it.starts_on ? "Dal " + fmtShort(it.starts_on) : "";
    return '<article class="init"><a class="init-cover" href="#i-' + esc(it.slug) + '" tabindex="-1" aria-hidden="true">' + coverHtml(it) +
      '<span class="cover-kind">' + icon(it.kind) + esc(KIND[it.kind] || "Iniziativa") + (when ? " · " + esc(when) : "") + "</span>" +
      (access && pr.unseen ? '<span class="badge-new">' + pr.unseen + (pr.unseen === 1 ? " nuovo" : " nuovi") + "</span>" : "") + "</a>" +
      '<div class="init-body"><h3><a href="#i-' + esc(it.slug) + '">' + esc(it.title) + "</a></h3>" +
      (it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
      (access ? progressBar(pr) : "") +
      '<div class="init-foot">' + statusPill(it) + actionFor(it) + "</div></div></article>";
  }

  /* ---------------- benvenuto e accesso ---------------- */
  function viewWelcome() {
    var invite = pendingInvite();
    var catalog = S.inits.filter(function (i) { return i.published; });
    setMain(
      '<section class="ava-hero"><div class="ava-hero-bg" aria-hidden="true"><img src="../assets/foto/evento-roma-platea.jpg" alt=""></div>' +
        '<div class="wrap ava-hero-in">' +
          '<div class="hero-copy">' +
            '<span class="eyebrow">Avamposto Under 30 · Marche</span>' +
            "<h1>Qui si impara a <em>fare politica.</em></h1>" +
            "<p>Corsi pratici, dirette con ospiti e materiali che non trovi altrove, riservati a tesserati e simpatizzanti. Entri gratis, con la tua mail e senza password.</p>" +
            '<ul class="points">' +
              "<li>" + icon("corso") + "<span><b>Corsi</b> con video, slide ed esercitazioni</span></li>" +
              "<li>" + icon("diretta") + "<span><b>Dirette su Meet</b> con ospiti e domande dal vivo</span></li>" +
              "<li>" + icon("check") + "<span><b>Segni cosa hai visto</b> e riprendi da dove eri rimasto</span></li>" +
            "</ul>" +
          "</div>" +
          '<div class="panel" id="auth-panel">' +
            (invite ? '<p class="form-msg ok">Hai un link d\'invito. Iscriviti o entra: il corso si sbloccherà in automatico.</p>' : "") +
            authForms() +
          "</div>" +
        "</div></section>" +
      '<div class="wrap page"><section class="block"><div class="block-head"><h2>Cosa trovi dentro</h2><span class="note">I corsi «su richiesta» si sbloccano dopo l\'approvazione dello staff.</span></div>' +
      (catalog.length ? '<div class="inits">' + catalog.map(initCard).join("") + "</div>" : '<p class="empty">Le prime iniziative sono in arrivo.</p>') +
      "</section></div>", "home", true);
    bindAuth();
  }
  function authForms() {
    return '<div class="tabs" role="tablist">' +
        '<button type="button" role="tab" aria-selected="true" data-tab="signup" id="tab-signup">Iscriviti</button>' +
        '<button type="button" role="tab" aria-selected="false" data-tab="signin" id="tab-signin">Sono già iscritto</button>' +
      "</div>" +
      '<form id="f-signup" novalidate>' +
        '<label class="field" for="su-name"><span>Nome e cognome</span><input type="text" id="su-name" autocomplete="name" required></label>' +
        '<label class="field" for="su-email"><span>Email</span><input type="email" id="su-email" autocomplete="email" inputmode="email" required></label>' +
        '<fieldset class="field"><legend>Sei</legend><div class="choice-row">' +
          '<label class="choice" for="su-t"><input type="radio" name="membership" id="su-t" value="tesserato"> Tesserato</label>' +
          '<label class="choice" for="su-s"><input type="radio" name="membership" id="su-s" value="simpatizzante"> Simpatizzante</label>' +
        "</div></fieldset>" +
        '<label class="check" for="su-privacy"><input type="checkbox" id="su-privacy"> <span>Ho letto l\'<a href="privacy.html" target="_blank">informativa privacy</a> e acconsento al trattamento dei miei dati, compresa l\'indicazione di tesserato o simpatizzante.</span></label>' +
        '<p class="form-msg err" id="su-err" hidden></p>' +
        '<button class="btn primary" type="submit">' + icon("mail") + "Mandami il link per entrare</button>" +
      "</form>" +
      '<form id="f-signin" novalidate hidden>' +
        '<label class="field" for="si-email"><span>Email con cui ti sei iscritto</span><input type="email" id="si-email" autocomplete="email" inputmode="email" required></label>' +
        '<p class="form-msg err" id="si-err" hidden></p>' +
        '<button class="btn primary" type="submit">' + icon("mail") + "Mandami il link per entrare</button>" +
      "</form>" +
      '<div class="sent" id="sent" hidden></div>';
  }
  function bindAuth() {
    var panel = document.getElementById("auth-panel"); if (!panel) return;
    panel.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]"); if (!t) return;
      var su = t.getAttribute("data-tab") === "signup";
      document.getElementById("tab-signup").setAttribute("aria-selected", su);
      document.getElementById("tab-signin").setAttribute("aria-selected", !su);
      document.getElementById("f-signup").hidden = !su;
      document.getElementById("f-signin").hidden = su;
    });
    document.getElementById("f-signup").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("su-err"), btn = e.target.querySelector("button[type=submit]");
      var m = document.querySelector('input[name="membership"]:checked');
      var form = { full_name: document.getElementById("su-name").value.trim(), email: document.getElementById("su-email").value.trim(),
        membership: m ? m.value : "", privacy: document.getElementById("su-privacy").checked };
      var problem = !form.full_name ? "Scrivi nome e cognome." : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) ? "Scrivi un indirizzo email valido." :
        !form.membership ? "Indica se sei tesserato o simpatizzante." : !form.privacy ? "Per iscriverti serve il consenso all'informativa privacy." : "";
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      err.hidden = true; busy(btn, true);
      D.signUp(form, redirectUrl()).then(function () { showSent(form.email); })
        .catch(function (x) { err.textContent = x.message; err.hidden = false; }).then(function () { busy(btn, false); });
    });
    document.getElementById("f-signin").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("si-err"), btn = e.target.querySelector("button[type=submit]");
      var mail = document.getElementById("si-email").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { err.textContent = "Scrivi un indirizzo email valido."; err.hidden = false; return; }
      err.hidden = true; busy(btn, true);
      D.signIn(mail, redirectUrl()).then(function () { showSent(mail); })
        .catch(function (x) { err.textContent = x.message; err.hidden = false; }).then(function () { busy(btn, false); });
    });
  }
  function showSent(mail) {
    document.getElementById("f-signup").hidden = true;
    document.getElementById("f-signin").hidden = true;
    document.querySelector("#auth-panel .tabs").hidden = true;
    var box = document.getElementById("sent");
    box.innerHTML = icon("mail") + "<h3>Controlla la posta</h3>" +
      "<p>Abbiamo mandato un link a <b>" + esc(mail) + "</b>. Aprilo per entrare: vale per un'ora. Se non lo trovi, guarda nello spam.</p>" +
      (D.live ? "" : '<p class="form-msg ok">Nel prototipo nessuna mail parte davvero.</p><button class="btn primary" type="button" data-action="demo-open" data-email="' + esc(mail) + '">Apri il link di prova</button>') +
      '<button class="btn quiet small" type="button" data-action="auth-again">Usa un\'altra mail</button>';
    box.hidden = false;
  }

  function viewCompleteProfile() {
    var p = S.profile || {};
    setMain(
      '<div class="page-head"><span class="eyebrow">Un ultimo passo</span><h1>Completa il profilo</h1><p>Ci servono questi dati per gestire i corsi e le iscrizioni.</p></div>' +
      '<div class="panel" style="max-width:560px">' + profileForm(p, true) + "</div>", "home");
    bindProfileForm(true);
  }
  function profileForm(p, first) {
    return '<form id="f-profile" novalidate>' +
      '<label class="field" for="pf-name"><span>Nome e cognome</span><input type="text" id="pf-name" autocomplete="name" value="' + esc(p.full_name || "") + '"></label>' +
      '<label class="field" for="pf-email"><span>Email</span><input type="email" id="pf-email" value="' + esc(S.me.email) + '" disabled></label>' +
      '<fieldset class="field"><legend>Sei</legend><div class="choice-row">' +
        '<label class="choice" for="pf-t"><input type="radio" name="pf-m" id="pf-t" value="tesserato"' + (p.membership === "tesserato" ? " checked" : "") + "> Tesserato</label>" +
        '<label class="choice" for="pf-s"><input type="radio" name="pf-m" id="pf-s" value="simpatizzante"' + (p.membership === "simpatizzante" ? " checked" : "") + "> Simpatizzante</label>" +
      "</div></fieldset>" +
      (first || !p.privacy_at ? '<label class="check" for="pf-privacy"><input type="checkbox" id="pf-privacy"' + (p.privacy_at ? " checked" : "") + '> <span>Ho letto l\'<a href="privacy.html" target="_blank">informativa privacy</a> e acconsento al trattamento dei miei dati.</span></label>' :
        '<p class="note" style="margin:0;color:var(--muted);font-size:.88rem">Consenso privacy dato il ' + esc(fmtDate(p.privacy_at)) + ".</p>") +
      '<p class="form-msg err" id="pf-err" hidden></p>' +
      '<div class="btn-row"><button class="btn primary" type="submit">' + (first ? "Entra nell'Avamposto" : "Salva") + "</button></div>" +
      "</form>";
  }
  function bindProfileForm(first) {
    document.getElementById("f-profile").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("pf-err"), btn = e.target.querySelector("button[type=submit]");
      var m = document.querySelector('input[name="pf-m"]:checked');
      var pv = document.getElementById("pf-privacy");
      var data = { full_name: document.getElementById("pf-name").value.trim(), membership: m ? m.value : "",
        privacy_at: (S.profile && S.profile.privacy_at) || (pv && pv.checked ? new Date().toISOString() : null) };
      var problem = !data.full_name ? "Scrivi nome e cognome." : !data.membership ? "Indica se sei tesserato o simpatizzante." : !data.privacy_at ? "Serve il consenso all'informativa privacy." : "";
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      busy(btn, true);
      D.saveProfile(data).then(function () { toast(first ? "Benvenuto nell'Avamposto" : "Profilo salvato"); return reload(); })
        .catch(function (x) { err.textContent = x.message; err.hidden = false; busy(btn, false); });
    });
  }

  /* ---------------- area iscritto ---------------- */
  function viewHome() {
    var visible = S.inits.filter(function (i) { return i.published; });
    var mine = visible.filter(function (i) { return i.access === "aperta" || (S.mine[i.id] && S.mine[i.id].status === "attiva"); });
    var others = visible.filter(function (i) { return mine.indexOf(i) < 0; });
    var first = (S.profile.full_name || "").split(" ")[0];
    var unseen = mine.reduce(function (n, it) { return n + progressOf(it).unseen; }, 0);
    setMain(
      '<div class="page-head"><span class="eyebrow">Avamposto Under 30</span><h1>Ciao ' + esc(first) + "!</h1><p>" +
        (unseen ? "Hai <b>" + unseen + (unseen === 1 ? " materiale nuovo" : " materiali nuovi") + "</b> da vedere nei tuoi percorsi." : "Sei in pari con tutti i tuoi percorsi.") + "</p></div>" +
      nextLiveCard() +
      '<section class="block"><div class="block-head"><h2>I miei percorsi</h2></div>' +
        (mine.length ? '<div class="inits">' + mine.map(initCard).join("") + "</div>" : '<p class="empty">Non hai ancora corsi attivi. Scegline uno qui sotto.</p>') +
      "</section>" +
      '<section class="block"><div class="block-head"><h2>Catalogo</h2><span class="note">Lo staff riceve la tua richiesta e ti abilita.</span></div>' +
        (others.length ? '<div class="inits">' + others.map(initCard).join("") + "</div>" : '<p class="empty">Sei già dentro a tutte le iniziative disponibili.</p>') +
      "</section>", "home");
  }

  function nextLiveCard() {
    var now = Date.now();
    var lives = S.amats.filter(function (m) {
      var t = d(m.live_at); return m.kind === "diretta" && m.published !== false && t && t.getTime() + 3 * 3600000 >= now;
    }).sort(function (a, b) { return a.live_at < b.live_at ? -1 : 1; });
    if (!lives.length) return "";
    var m = lives[0], it = initById(m.initiative_id), st = liveState(m), href = safeHref(m.url);
    return '<section class="next-live" aria-label="Prossima diretta"><div class="next-live-ico">' + icon("diretta") + "</div>" +
      '<div class="next-live-txt"><span class="eyebrow">' + (st === "live" ? "In diretta ora" : "Prossima diretta") + "</span>" +
      "<h2>" + esc(m.title) + "</h2><p>" + esc(fmtWhen(m.live_at)) + (it ? " · " + esc(it.title) : "") + "</p></div>" +
      '<div class="btn-row">' +
        (st === "live" && href ? '<a class="btn yellow" href="' + esc(href) + '" target="_blank" rel="noopener" data-mid="' + esc(m.id) + '">' + icon("diretta") + "Entra ora</a>"
          : '<a class="btn on-dark" href="' + esc(gcalLink(m)) + '" target="_blank" rel="noopener">Aggiungi al calendario</a>') +
        (it ? '<a class="btn on-dark quiet" href="#i-' + esc(it.slug) + '">Vai al corso</a>' : "") +
      "</div></section>";
  }

  function viewProfile() {
    setMain(
      '<div class="page-head"><span class="eyebrow">Il tuo account</span><h1>Profilo</h1></div>' +
      '<div class="panel" style="max-width:560px">' + profileForm(S.profile, false) + "</div>" +
      '<div class="btn-row"><button class="btn quiet" type="button" data-action="signout">Esci dall\'Avamposto</button></div>', "profilo");
    bindProfileForm(false);
  }

  function viewInitiative(slug) {
    var it = initBySlug(slug);
    if (!it) { setMain('<a class="back" href="#home">← Torna ai percorsi</a><p class="empty">Questa iniziativa non esiste o non è più disponibile.</p>', "home"); return; }
    var access = hasAccess(it);
    var pr = access ? progressOf(it) : { total: 0 };
    setMain(
      '<a class="back" href="#home">← ' + (S.me ? "I miei percorsi" : "Avamposto") + "</a>" +
      '<header class="init-head"><div class="course-cover">' + coverHtml(it, "big") +
        '<span class="cover-kind">' + icon(it.kind) + esc(KIND[it.kind] || "Iniziativa") + (it.starts_on ? " · dal " + esc(fmtShort(it.starts_on)) : "") + "</span></div>" +
        '<div class="init-head-body">' +
        '<div class="btn-row">' + statusPill(it) + (S.admin ? '<a class="btn small quiet" href="#g-' + esc(it.slug) + '">' + icon("edit") + "Gestisci</a>" : "") + "</div>" +
        "<h1>" + esc(it.title) + "</h1>" +
        (access ? '<div id="course-progress">' + progressBar(pr, true) + "</div>" : "") +
        (it.description ? '<div class="prose">' + prose(it.description) + "</div>" : it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
        (access ? "" : '<div class="btn-row">' + actionFor(it) + "</div>") +
      "</div></header>" +
      (access ? '<section class="block"><div class="block-head"><h2>Materiali</h2></div><div class="mats" id="mats"><p class="loading">Caricamento dei materiali…</p></div></section>' :
        '<p class="empty">' + icon("lock") + " I materiali di questa iniziativa sono visibili a chi partecipa." + (S.me ? "" : " Entra nell'Avamposto per chiedere l'accesso.") + "</p>"),
      "home");
    if (access) D.materials(it.id).then(function (list) {
      var box = document.getElementById("mats"); if (!box) return;
      box.innerHTML = list.length ? list.map(function (m, i) { return materialCard(m, i + 1); }).join("") : '<p class="empty">Lo staff non ha ancora pubblicato materiali. Torna presto.</p>';
    }).catch(function (e) { var box = document.getElementById("mats"); if (box) box.innerHTML = '<p class="form-msg err">' + esc(e.message) + "</p>"; });
  }

  function embedUrl(u) {
    var m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/))) return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0";
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/))) return "https://player.vimeo.com/video/" + m[1] + (m[2] ? "?h=" + m[2] : "");
    if ((m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return "https://drive.google.com/file/d/" + m[1] + "/preview";
    return "";
  }
  function liveState(m) {
    var t = d(m.live_at); if (!t) return "nodate";
    var now = Date.now(), start = t.getTime();
    if (now < start - 15 * 60000) return "soon";
    if (now <= start + 3 * 3600000) return "live";
    return "past";
  }
  function gcalLink(m) {
    var t = d(m.live_at); if (!t) return "";
    var f = function (x) { return x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    var end = new Date(t.getTime() + 3600000);
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(m.title) +
      "&dates=" + f(t) + "/" + f(end) + "&details=" + encodeURIComponent("Avamposto Under 30 – link alla diretta nella pagina del corso.");
  }
  function materialCard(m, n) {
    var c = "", href = safeHref(m.url), seen = !!S.views[m.id];
    if (m.kind === "video") {
      var em = href ? embedUrl(href) : "";
      c = em ? '<div class="video"><iframe src="' + esc(em) + '" title="' + esc(m.title) + '" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
        : href ? '<div class="btn-row"><a class="btn primary" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon("video") + "Guarda il video</a></div>"
        : '<div class="video-placeholder">Video di esempio: qui comparirà il video registrato.</div>';
    } else if (m.kind === "diretta") {
      var st = liveState(m);
      c = (m.live_at ? '<p class="live-when">' + esc(fmtWhen(m.live_at)) + "</p>" : "") +
        (st === "live" && href ? '<div class="btn-row"><a class="btn primary" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon("diretta") + "Entra nella diretta</a></div>" :
         st === "soon" ? '<div class="btn-row"><a class="btn quiet small" href="' + esc(gcalLink(m)) + '" target="_blank" rel="noopener">Aggiungi a Google Calendar</a><span style="color:var(--muted);font-size:.86rem">Il pulsante per entrare compare 15 minuti prima dell\'inizio.</span></div>' :
         st === "past" ? '<p style="margin:0;color:var(--muted)">Diretta conclusa.</p>' :
         href ? '<div class="btn-row"><a class="btn primary" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon("diretta") + "Entra nella diretta</a></div>" : "");
    } else if (m.kind === "pdf") {
      c = '<div class="btn-row"><button class="btn primary" type="button" data-action="open-file" data-path="' + esc(m.file_path || "") + '"' + (m.file_path ? "" : " disabled") + ">" + icon("pdf") + "Apri il PDF</button></div>";
    } else if (m.kind === "link") {
      c = href ? '<div class="btn-row"><a class="btn primary" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon("link") + "Apri il link</a></div>" : "";
    }
    var body = m.body ? (m.kind === "testo" ? '<div class="prose">' + prose(m.body) + "</div>" : "<p>" + esc(m.body) + "</p>") : "";
    var seenBtn = S.me ? '<button class="seen-btn" type="button" data-action="seen" data-mid="' + esc(m.id) + '" aria-pressed="' + seen + '">' +
      (seen ? icon("check") + "Visto" : "Segna come visto") + "</button>" : "";
    return '<article class="mat' + (seen ? " seen" : "") + '" data-mid="' + esc(m.id) + '"><div class="mat-ico">' + (seen ? icon("check") : icon(m.kind)) + "</div>" +
      '<div class="mat-kind">' + (n ? '<span class="mat-num">' + n + "</span>" : "") + esc(MAT[m.kind] || "") + (m.published === false ? ' <span class="pill draft">Nascosto</span>' : "") + seenBtn + "</div>" +
      "<h3>" + esc(m.title) + "</h3>" +
      '<div class="mat-content">' + (m.kind === "testo" ? body : c + body) + "</div></article>";
  }

  /* ---------------- gestione ---------------- */
  function profileByEmail(mail) { return A.profiles.filter(function (p) { return p.email === mail; })[0]; }
  function personCell(mail) {
    var p = profileByEmail(mail);
    return p && p.full_name ? esc(p.full_name) + '<span class="sub">' + esc(mail) + (p.membership ? " · " + esc(p.membership) : "") + "</span>"
      : esc(mail) + '<span class="sub">non ancora iscritto all\'Avamposto</span>';
  }

  function viewAdmin() {
    var reqs = A.enrollments.filter(function (e) { return e.status === "richiesta"; });
    var active = A.enrollments.filter(function (e) { return e.status === "attiva"; });
    var pub = S.inits.filter(function (i) { return i.published; });
    setMain(
      '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Gestione</h1><p>Approva le richieste, crea iniziative, carica i materiali e abilita le persone ai corsi.</p></div>' +
      '<div class="stats">' +
        '<a class="stat" href="#g-iscritti"><b>' + A.profiles.length + "</b><span>Iscritti all'Avamposto</span></a>" +
        '<a class="stat' + (reqs.length ? " alert" : "") + '" href="#richieste"><b>' + reqs.length + "</b><span>Richieste da approvare</span></a>" +
        '<div class="stat"><b>' + pub.length + "</b><span>Iniziative pubblicate</span></div>" +
        '<div class="stat"><b>' + active.length + "</b><span>Accessi attivi ai corsi</span></div>" +
      "</div>" +
      '<section class="block" id="richieste"><div class="block-head"><h2>Richieste da approvare</h2></div>' +
        (reqs.length ? '<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Iniziativa</th><th>Richiesta il</th><th></th></tr></thead><tbody>' +
          reqs.map(function (e) {
            var it = initById(e.initiative_id);
            return "<tr><td>" + personCell(e.email) + "</td><td>" + esc(it ? it.title : "—") + '</td><td class="num">' + esc(fmtShort(e.created_at)) + "</td>" +
              '<td class="actions"><div class="btn-row" style="justify-content:flex-end">' +
              '<button class="btn small primary" type="button" data-action="decide" data-status="attiva" data-id="' + esc(e.initiative_id) + '" data-email="' + esc(e.email) + '">Approva</button>' +
              '<button class="btn small quiet" type="button" data-action="decide" data-status="rifiutata" data-id="' + esc(e.initiative_id) + '" data-email="' + esc(e.email) + '">Rifiuta</button>' +
              "</div></td></tr>";
          }).join("") + "</tbody></table></div>"
          : '<p class="empty">Nessuna richiesta in attesa.</p>') +
      "</section>" +
      '<section class="block"><div class="block-head"><h2>Iniziative</h2><a class="btn primary small" href="#g-nuova">' + icon("plus") + "Nuova iniziativa</a></div>" +
        (S.inits.length ? '<div class="table-wrap"><table><thead><tr><th>Iniziativa</th><th>Accesso</th><th>Partecipanti</th><th>Stato</th><th></th></tr></thead><tbody>' +
          S.inits.map(function (it) {
            var n = A.enrollments.filter(function (e) { return e.initiative_id === it.id && e.status === "attiva"; }).length;
            var r = A.enrollments.filter(function (e) { return e.initiative_id === it.id && e.status === "richiesta"; }).length;
            return "<tr><td><b>" + esc(it.title) + '</b><span class="sub">' + esc(KIND[it.kind] || "") + "</span></td>" +
              "<td>" + (it.access === "aperta" ? '<span class="pill open">Aperta a tutti</span>' : '<span class="pill lock">Su richiesta</span>') + "</td>" +
              '<td class="num">' + (it.access === "aperta" ? "Tutti" : n) + (r ? ' <span class="pill wait">' + r + " in attesa</span>" : "") + "</td>" +
              "<td>" + (it.published ? '<span class="pill ok">Pubblicata</span>' : '<span class="pill draft">Bozza</span>') + "</td>" +
              '<td class="actions"><a class="btn small" href="#g-' + esc(it.slug) + '">Gestisci</a></td></tr>';
          }).join("") + "</tbody></table></div>"
          : '<p class="empty">Nessuna iniziativa. Crea la prima.</p>') +
      "</section>", "gestione");
  }

  function viewMembers() {
    setMain(
      '<a class="back" href="#gestione">← Gestione</a>' +
      '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Iscritti</h1><p>Tutte le persone iscritte all\'Avamposto e i percorsi a cui hanno accesso.</p></div>' +
      '<div class="toolbar"><input type="search" id="m-search" placeholder="Cerca per nome o email" aria-label="Cerca iscritti">' +
      '<button class="btn small quiet" type="button" data-action="export">' + icon("download") + "Scarica elenco (CSV)</button></div>" +
      '<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Tipo</th><th>Iscritto il</th><th>Percorsi attivi</th></tr></thead><tbody id="m-body"></tbody></table></div>', "gestione");
    var body = document.getElementById("m-body");
    function draw(q) {
      q = (q || "").toLowerCase();
      var rows = A.profiles.filter(function (p) { return !q || (p.email + " " + (p.full_name || "")).toLowerCase().indexOf(q) >= 0; });
      body.innerHTML = rows.length ? rows.map(function (p) {
        var act = A.enrollments.filter(function (e) { return e.email === p.email && e.status === "attiva"; })
          .map(function (e) { var it = initById(e.initiative_id); return it ? esc(it.title) : ""; }).filter(Boolean);
        return "<tr><td>" + esc(p.full_name || "—") + '<span class="sub">' + esc(p.email) + "</span></td><td>" + esc(p.membership || "—") +
          '</td><td class="num">' + esc(fmtShort(p.created_at)) + "</td><td>" + (act.length ? act.join("<br>") : '<span class="sub">Solo contenuti aperti</span>') + "</td></tr>";
      }).join("") : '<tr><td colspan="4">Nessun risultato.</td></tr>';
    }
    draw("");
    document.getElementById("m-search").addEventListener("input", function (e) { draw(e.target.value); });
  }
  function exportCsv() {
    var head = ["Nome", "Email", "Tipo", "Iscritto il", "Consenso privacy", "Percorsi attivi"];
    var rows = A.profiles.map(function (p) {
      var act = A.enrollments.filter(function (e) { return e.email === p.email && e.status === "attiva"; })
        .map(function (e) { var it = initById(e.initiative_id); return it ? it.title : ""; }).join(" | ");
      return [p.full_name || "", p.email, p.membership || "", fmtDate(p.created_at), fmtDate(p.privacy_at), act];
    });
    var csv = [head].concat(rows).map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "iscritti-avamposto-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function viewEditInitiative(slug) {
    var it = slug ? initBySlug(slug) : null;
    if (slug && !it) { setMain('<a class="back" href="#gestione">← Gestione</a><p class="empty">Iniziativa non trovata.</p>', "gestione"); return; }
    var x = it || { title: "", slug: "", summary: "", description: "", kind: "corso", access: "su_richiesta", starts_on: "", published: false, position: S.inits.length + 1 };
    var kindOpts = Object.keys(KIND).map(function (k) { return '<option value="' + k + '"' + (x.kind === k ? " selected" : "") + ">" + KIND[k] + "</option>"; }).join("");
    setMain(
      '<a class="back" href="#gestione">← Gestione</a>' +
      '<div class="page-head"><span class="eyebrow">' + (it ? "Gestisci iniziativa" : "Nuova iniziativa") + "</span><h1>" + esc(it ? it.title : "Nuova iniziativa") + "</h1>" +
        (it ? '<p><a href="#i-' + esc(it.slug) + '">Vedi come la vedono gli iscritti →</a></p>' : "") + "</div>" +
      '<section class="panel"><h2>Dettagli</h2><form id="f-init" novalidate>' +
        '<label class="field" for="in-title"><span>Titolo</span><input type="text" id="in-title" value="' + esc(x.title) + '" required></label>' +
        '<div class="grid-2">' +
          '<label class="field" for="in-kind"><span>Tipo</span><select id="in-kind">' + kindOpts + "</select></label>" +
          '<label class="field" for="in-start"><span>Data di inizio (facoltativa)</span><input type="date" id="in-start" value="' + esc(x.starts_on || "") + '"></label>' +
        "</div>" +
        '<fieldset class="field"><legend>Chi può vederla</legend><div class="choice-row">' +
          '<label class="choice" for="in-acc-r"><input type="radio" name="in-acc" id="in-acc-r" value="su_richiesta"' + (x.access !== "aperta" ? " checked" : "") + "> Solo chi abilitate (su richiesta)</label>" +
          '<label class="choice" for="in-acc-a"><input type="radio" name="in-acc" id="in-acc-a" value="aperta"' + (x.access === "aperta" ? " checked" : "") + "> Tutti gli iscritti all'Avamposto</label>" +
        "</div></fieldset>" +
        '<label class="field" for="in-summary"><span>Presentazione breve</span><input type="text" id="in-summary" maxlength="200" value="' + esc(x.summary || "") + '"><small>Compare nel catalogo, anche a chi non è ancora iscritto.</small></label>' +
        '<label class="field" for="in-desc"><span>Descrizione completa</span><textarea id="in-desc">' + esc(x.description || "") + "</textarea><small>Una riga vuota separa i paragrafi. **testo** diventa grassetto.</small></label>" +
        '<label class="field" for="in-slug"><span>Indirizzo breve</span><input type="text" id="in-slug" value="' + esc(x.slug) + '"' + (it ? " disabled" : "") + '><small>' + (it ? "Non si cambia dopo la creazione, così i link già mandati continuano a funzionare." : "Si compila dal titolo. Solo lettere minuscole, numeri e trattini.") + "</small></label>" +
        '<label class="check" for="in-pub"><input type="checkbox" id="in-pub"' + (x.published ? " checked" : "") + "> <span><b>Pubblicata</b>: visibile nel catalogo. Se togli la spunta resta una bozza visibile solo allo staff.</span></label>" +
        '<p class="form-msg err" id="in-err" hidden></p>' +
        '<div class="btn-row"><button class="btn primary" type="submit">' + (it ? "Salva le modifiche" : "Crea iniziativa") + "</button>" +
        (it ? '<button class="btn danger small" type="button" data-action="del-init" data-id="' + esc(it.id) + '">' + icon("trash") + "Elimina iniziativa</button>" : "") + "</div>" +
      "</form></section>" +
      (it ? coverSection(it) + inviteSection(it) + participantsSection(it) + '<section class="panel" id="mat-panel"><div class="block-head"><h2>Materiali</h2>' +
        '<button class="btn small primary" type="button" data-action="mat-new">' + icon("plus") + 'Aggiungi materiale</button></div><div id="mat-form-slot"></div><div class="mat-admin" id="mat-list"><p class="loading">Caricamento…</p></div></section>' : ""),
      "gestione");

    var title = document.getElementById("in-title"), slugIn = document.getElementById("in-slug");
    if (!it) title.addEventListener("input", function () { if (!slugIn.dataset.touched) slugIn.value = slugify(title.value); });
    if (!it) slugIn.addEventListener("input", function () { slugIn.dataset.touched = "1"; });
    document.getElementById("f-init").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("in-err"), btn = e.target.querySelector("button[type=submit]");
      var acc = document.querySelector('input[name="in-acc"]:checked');
      var row = { id: it ? it.id : undefined, title: title.value.trim(), slug: it ? it.slug : slugify(slugIn.value || title.value),
        kind: document.getElementById("in-kind").value, starts_on: document.getElementById("in-start").value || null,
        access: acc ? acc.value : "su_richiesta", summary: document.getElementById("in-summary").value.trim(),
        description: document.getElementById("in-desc").value.trim(), published: document.getElementById("in-pub").checked, position: x.position || 0 };
      if (!row.title) { err.textContent = "Scrivi il titolo."; err.hidden = false; return; }
      busy(btn, true);
      D.saveInitiative(row).then(function (saved) {
        toast(it ? "Modifiche salvate" : "Iniziativa creata");
        return refresh().then(function () { go("#g-" + (saved && saved.slug || row.slug)); });
      }).catch(function (x2) { err.textContent = x2.message; err.hidden = false; busy(btn, false); });
    });
    if (it) loadAdminMaterials(it);
  }

  function coverSection(it) {
    return '<section class="panel"><h2>Copertina</h2>' +
      '<div class="cover-admin"><div class="cover-admin-prev">' + coverHtml(it) + "</div>" +
      '<div class="cover-admin-txt"><p style="margin:0;color:var(--muted)">' +
        (it.cover_path ? "Questa è la copertina caricata da voi." : "Ora c'è la copertina automatica, con titolo e icona. Puoi sostituirla con una grafica o una foto.") +
        " Formato consigliato: orizzontale 16:9, per esempio 1600×900 (Canva: «Presentazione 16:9»). JPG o PNG fino a 5 MB.</p>" +
      '<label class="btn small primary" for="cv-file" style="align-self:flex-start">' + icon("plus") + (it.cover_path ? "Sostituisci copertina" : "Carica copertina") + "</label>" +
      '<input type="file" id="cv-file" accept="image/jpeg,image/png,image/webp" class="visually-hidden">' +
      (it.cover_path ? '<button class="btn small danger" type="button" data-action="cover-remove" style="align-self:flex-start">' + icon("trash") + "Usa quella automatica</button>" : "") +
      '<p class="form-msg err" id="cv-err" hidden></p></div></div></section>';
  }
  function shrinkImage(file) {
    return new Promise(function (res, rej) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return rej(new Error("Scegli un'immagine JPG o PNG."));
      if (file.size > 15 * 1024 * 1024) return rej(new Error("L'immagine è troppo pesante: massimo 15 MB prima del caricamento."));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 1600 / w);
        var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error("Non riesco a leggere l'immagine.")); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Non riesco a leggere l'immagine.")); };
      img.src = url;
    });
  }
  document.addEventListener("change", function (e) {
    if (e.target.id !== "cv-file" || !e.target.files[0]) return;
    var it = currentInit(), err = document.getElementById("cv-err"); if (!it) return;
    err.hidden = true; toast("Carico la copertina…");
    shrinkImage(e.target.files[0]).then(function (blob) { return D.setCover(it, blob); })
      .then(function () { toast("Copertina aggiornata"); return reload(); })
      .catch(function (x) { err.textContent = x.message; err.hidden = false; });
  });

  function inviteUrl(c) { return location.origin + location.pathname + "?invito=" + encodeURIComponent(c); }
  function inviteSection(it) {
    var inv = A.invites[it.id];
    if (!inv) return "";
    return '<section class="panel"><h2>Link d\'invito</h2>' +
      "<p style=\"margin:0;color:var(--muted)\">Chi apre questo link e si iscrive (o entra) ottiene subito l'accesso, senza approvazione. Mandalo per mail o nel gruppo del corso. Se finisce dove non deve, generane uno nuovo: il vecchio smette di funzionare.</p>" +
      '<div class="invite-box' + (inv.active ? "" : " invite-off") + '"><code id="inv-url">' + esc(inviteUrl(inv.code)) + "</code>" +
      '<button class="btn small" type="button" data-action="copy-invite"' + (inv.active ? "" : " disabled") + ">" + icon("copy") + "Copia</button></div>" +
      '<div class="btn-row">' + (inv.active ? '<span class="pill ok">Attivo</span>' : '<span class="pill no">Disattivato</span>') +
      '<button class="btn small quiet" type="button" data-action="inv-toggle" data-id="' + esc(it.id) + '" data-active="' + (inv.active ? "0" : "1") + '">' + (inv.active ? "Disattiva" : "Riattiva") + "</button>" +
      '<button class="btn small quiet" type="button" data-action="inv-new" data-id="' + esc(it.id) + '">Genera un link nuovo</button></div></section>';
  }

  function participantsSection(it) {
    var rows = A.enrollments.filter(function (e) { return e.initiative_id === it.id; })
      .sort(function (a, b) { var o = { richiesta: 0, attiva: 1, rifiutata: 2 }; return (o[a.status] - o[b.status]) || (a.created_at < b.created_at ? 1 : -1); });
    var SRC = { richiesta: "Richiesta dal sito", manuale: "Inserito dallo staff", invito: "Link d'invito" };
    var ST = { richiesta: '<span class="pill wait">In attesa</span>', attiva: '<span class="pill ok">Attivo</span>', rifiutata: '<span class="pill no">Rifiutato</span>' };
    return '<section class="panel"><h2>Partecipanti</h2>' +
      (it.access === "aperta" ? '<p class="form-msg ok">Questa iniziativa è aperta: tutti gli iscritti all\'Avamposto vedono già i materiali. Le persone qui sotto contano solo se la rendi «su richiesta».</p>' : "") +
      '<form id="f-add" novalidate><label class="field" for="add-emails"><span>Aggiungi persone a mano</span>' +
        '<textarea id="add-emails" style="min-height:80px" placeholder="nome.cognome@gmail.com, altra@mail.it"></textarea>' +
        "<small>Incolla una o più email, separate da virgola o a capo. Funziona anche se la persona non si è ancora iscritta: appena entra con quella mail, trova il corso sbloccato.</small></label>" +
        '<p class="form-msg err" id="add-err" hidden></p>' +
        '<div class="btn-row"><button class="btn primary small" type="submit">' + icon("plus") + "Abilita</button></div></form>" +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Stato</th><th>Come</th><th></th></tr></thead><tbody>' +
        rows.map(function (e) {
          var a = ' data-id="' + esc(it.id) + '" data-email="' + esc(e.email) + '"';
          return "<tr><td>" + personCell(e.email) + "</td><td>" + ST[e.status] + '</td><td><span class="sub" style="color:var(--fg)">' + esc(SRC[e.source] || "") + '</span><span class="sub">' + esc(fmtShort(e.created_at)) + "</span></td>" +
            '<td class="actions"><div class="btn-row" style="justify-content:flex-end">' +
            (e.status !== "attiva" ? '<button class="btn small primary" type="button" data-action="decide" data-status="attiva"' + a + ">Approva</button>" : "") +
            (e.status === "richiesta" ? '<button class="btn small quiet" type="button" data-action="decide" data-status="rifiutata"' + a + ">Rifiuta</button>" : "") +
            (e.status === "attiva" ? '<button class="btn small danger" type="button" data-action="remove-enr"' + a + ">Togli accesso</button>" : "") +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="empty">Nessun partecipante per ora.</p>') +
      "</section>";
  }

  var adminMats = [];
  function loadAdminMaterials(it) {
    return D.materials(it.id).then(function (list) {
      adminMats = list || [];
      var box = document.getElementById("mat-list"); if (!box) return;
      box.innerHTML = adminMats.length ? adminMats.map(function (m, i) {
        var meta = MAT[m.kind] + (m.kind === "diretta" && m.live_at ? " · " + fmtWhen(m.live_at) : "") + (m.published === false ? " · nascosto" : "");
        return '<div class="mat-row">' + icon(m.kind) + '<div class="t"><b>' + esc(m.title) + "</b><span>" + esc(meta) + "</span></div>" +
          '<div class="btn-row">' +
          '<button class="icon-btn" type="button" title="Sposta su" aria-label="Sposta su" data-action="mat-move" data-i="' + i + '" data-dir="-1"' + (i === 0 ? " disabled" : "") + ">" + icon("up") + "</button>" +
          '<button class="icon-btn" type="button" title="Sposta giù" aria-label="Sposta giù" data-action="mat-move" data-i="' + i + '" data-dir="1"' + (i === adminMats.length - 1 ? " disabled" : "") + ">" + icon("down") + "</button>" +
          '<button class="icon-btn" type="button" title="' + (m.published === false ? "Mostra agli iscritti" : "Nascondi agli iscritti") + '" aria-label="' + (m.published === false ? "Mostra" : "Nascondi") + '" data-action="mat-vis" data-i="' + i + '">' + icon(m.published === false ? "eyeoff" : "eye") + "</button>" +
          '<button class="icon-btn" type="button" title="Modifica" aria-label="Modifica" data-action="mat-edit" data-i="' + i + '">' + icon("edit") + "</button>" +
          '<button class="icon-btn" type="button" title="Elimina" aria-label="Elimina" data-action="mat-del" data-i="' + i + '">' + icon("trash") + "</button>" +
          "</div></div>";
      }).join("") : '<p class="empty">Ancora nessun materiale. Aggiungi il primo.</p>';
    }).catch(function (e) { toast(e.message, true); });
  }

  function materialForm(it, m) {
    m = m || { kind: "video", title: "", url: "", body: "", live_at: "", file_path: "" };
    var opts = Object.keys(MAT).map(function (k) { return '<option value="' + k + '"' + (m.kind === k ? " selected" : "") + ">" + MAT[k] + "</option>"; }).join("");
    return '<form id="f-mat" class="panel" style="box-shadow:none;background:var(--surface-2)" novalidate>' +
      "<h3>" + (m.id ? "Modifica materiale" : "Nuovo materiale") + "</h3>" +
      '<div class="grid-2"><label class="field" for="mt-kind"><span>Tipo</span><select id="mt-kind">' + opts + "</select></label>" +
      '<label class="field" for="mt-title"><span>Titolo</span><input type="text" id="mt-title" value="' + esc(m.title) + '"></label></div>' +
      '<label class="field" data-for="video link diretta" for="mt-url"><span id="mt-url-lbl">Indirizzo</span><input type="url" id="mt-url" value="' + esc(m.url || "") + '" placeholder="https://"><small id="mt-url-help"></small></label>' +
      '<label class="field" data-for="diretta" for="mt-when"><span>Data e ora della diretta</span><input type="datetime-local" id="mt-when" value="' + esc(toLocalInput(m.live_at)) + '"></label>' +
      '<label class="field" data-for="pdf" for="mt-file"><span>File PDF</span><input type="file" id="mt-file" accept="application/pdf,.pdf"><small>' + (m.file_path ? "C'è già un file caricato: scegline uno solo se vuoi sostituirlo. " : "") + "Massimo 50 MB.</small></label>" +
      '<label class="field" for="mt-body"><span id="mt-body-lbl">Nota (facoltativa)</span><textarea id="mt-body" style="min-height:90px">' + esc(m.body || "") + "</textarea></label>" +
      '<p class="form-msg err" id="mt-err" hidden></p>' +
      '<div class="btn-row"><button class="btn primary" type="submit">' + (m.id ? "Salva" : "Aggiungi") + '</button><button class="btn quiet" type="button" data-action="mat-cancel">Annulla</button></div>' +
      "</form>";
  }
  function syncMatFields() {
    var k = document.getElementById("mt-kind").value;
    document.querySelectorAll("#f-mat [data-for]").forEach(function (el) { el.hidden = el.getAttribute("data-for").split(" ").indexOf(k) < 0; });
    var lbl = { video: "Link del video", link: "Indirizzo della pagina", diretta: "Link di Google Meet" }[k] || "Indirizzo";
    var help = { video: "YouTube (anche «non in elenco»), Vimeo o Google Drive: il video si vede direttamente nella pagina.",
      diretta: "Il pulsante per entrare compare agli iscritti 15 minuti prima. Dopo la diretta puoi aggiungere la registrazione come Video.",
      link: "Un sito, un documento Google, un modulo…" }[k] || "";
    document.getElementById("mt-url-lbl").textContent = lbl;
    document.getElementById("mt-url-help").textContent = help;
    document.getElementById("mt-body-lbl").textContent = k === "testo" ? "Testo" : "Nota (facoltativa)";
    document.getElementById("mt-body").style.minHeight = k === "testo" ? "200px" : "90px";
  }
  function openMaterialForm(it, m) {
    var slot = document.getElementById("mat-form-slot");
    slot.innerHTML = materialForm(it, m);
    syncMatFields();
    document.getElementById("mt-kind").addEventListener("change", syncMatFields);
    document.getElementById("mt-title").focus();
    document.getElementById("f-mat").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("mt-err"), btn = e.target.querySelector("button[type=submit]");
      var k = document.getElementById("mt-kind").value;
      var row = { id: m && m.id, initiative_id: it.id, kind: k, title: document.getElementById("mt-title").value.trim(),
        url: document.getElementById("mt-url").value.trim(), body: document.getElementById("mt-body").value.trim(),
        live_at: document.getElementById("mt-when").value ? new Date(document.getElementById("mt-when").value).toISOString() : null,
        file_path: m && m.file_path || "", position: m && m.id ? m.position : adminMats.length + 1, published: m ? m.published !== false : true };
      if (k !== "video" && k !== "link" && k !== "diretta") row.url = "";
      if (k !== "diretta") row.live_at = null;
      var file = document.getElementById("mt-file").files[0];
      var problem = !row.title ? "Scrivi il titolo." :
        (k === "video" || k === "link") && !/^https?:\/\//i.test(row.url) ? "Inserisci un indirizzo che inizia con https://" :
        k === "diretta" && !row.live_at ? "Indica data e ora della diretta." :
        k === "diretta" && !/^https?:\/\//i.test(row.url) ? "Inserisci il link di Meet (https://meet.google.com/…)." :
        k === "pdf" && !file && !row.file_path ? "Scegli il file PDF." :
        k === "pdf" && file && file.size > 50 * 1024 * 1024 ? "Il file supera i 50 MB." :
        k === "testo" && !row.body ? "Scrivi il testo." : "";
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      err.hidden = true; busy(btn, true);
      var up = k === "pdf" && file ? D.uploadFile(it.id, file) : Promise.resolve(row.file_path);
      up.then(function (path) {
        if (k === "pdf") row.file_path = path; else row.file_path = null;
        return D.saveMaterial(row);
      }).then(function () {
        toast(m && m.id ? "Materiale aggiornato" : "Materiale aggiunto");
        document.getElementById("mat-form-slot").innerHTML = "";
        return loadAdminMaterials(it);
      }).catch(function (x) { err.textContent = x.message; err.hidden = false; busy(btn, false); });
    });
  }

  /* ---------------- azioni (delega degli eventi) ---------------- */
  var confirmTimer = null;
  function needsConfirm(btn, label) {
    if (btn.classList.contains("confirm")) return false;
    var old = btn.innerHTML;
    btn.classList.add("confirm"); btn.textContent = label;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(function () { btn.classList.remove("confirm"); btn.innerHTML = old; }, 4000);
    return true;
  }
  function currentInit() { var h = location.hash.slice(1); return h.indexOf("g-") === 0 ? initBySlug(h.slice(2)) : null; }

  function setSeen(mid, on) {
    if (!S.me || !mid || !!S.views[mid] === on) return Promise.resolve();
    if (on) S.views[mid] = true; else delete S.views[mid];
    refreshSeenUI(mid);
    return D.markViewed(mid, on).catch(function (x) {
      if (on) delete S.views[mid]; else S.views[mid] = true;
      refreshSeenUI(mid); toast(x.message, true);
    });
  }
  function refreshSeenUI(mid) {
    var card = document.querySelector('.mat[data-mid="' + mid + '"]'), on = !!S.views[mid];
    if (card) {
      card.classList.toggle("seen", on);
      var btn = card.querySelector(".seen-btn");
      if (btn) { btn.setAttribute("aria-pressed", on); btn.innerHTML = on ? icon("check") + "Visto" : "Segna come visto"; }
      var mi = card.querySelector(".mat-ico"), m = S.amats.filter(function (x) { return x.id === mid; })[0];
      if (mi) mi.innerHTML = on ? icon("check") : icon(m ? m.kind : "testo");
    }
    var it = initBySlug((location.hash.match(/^#i-(.+)$/) || [])[1] || "");
    var box = document.getElementById("course-progress");
    if (it && box) box.innerHTML = progressBar(progressOf(it), true);
  }
  // Aprire un PDF, un link, un video esterno o entrare in diretta conta come "visto"
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".mat a[href], .mat [data-action='open-file'], .next-live a[data-mid]");
    if (!a) return;
    var host = a.closest("[data-mid]");
    var mid = a.getAttribute("data-mid") || (host && host.getAttribute("data-mid"));
    if (mid) setSeen(mid, true);
  }, true);

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]"); if (!b) return;
    var act = b.getAttribute("data-action"), id = b.getAttribute("data-id"), mail = b.getAttribute("data-email");
    var it = currentInit();

    if (act === "demo-as") { D.demoOpenLink(b.getAttribute("data-who") === "admin" ? D.demoAdmin : D.demoMember); location.hash = b.getAttribute("data-who") === "admin" ? "#gestione" : "#home"; return; }
    if (act === "demo-reset") { D.reset(); toast("Dati di esempio ripristinati"); location.hash = "#home"; return; }
    if (act === "demo-open") { D.demoOpenLink(mail); return; }
    if (act === "auth-again") { viewWelcome(); return; }
    if (act === "focus-signup") { e.preventDefault(); var f = document.getElementById("su-name"); if (f) { f.scrollIntoView({ block: "center" }); f.focus(); } else go("#home"); return; }
    if (act === "signout") { D.signOut().then(function () { location.hash = "#home"; }); return; }

    if (act === "request") { busy(b, true); D.requestAccess(id).then(function () { toast("Richiesta inviata allo staff"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return; }
    if (act === "cancel") { busy(b, true); D.cancelRequest(id).then(function () { toast("Richiesta annullata"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return; }

    if (act === "seen") { setSeen(b.getAttribute("data-mid"), b.getAttribute("aria-pressed") !== "true"); return; }
    if (act === "cover-remove") {
      if (needsConfirm(b, "Conferma: togli la copertina")) return;
      var itc = currentInit(); if (!itc) return;
      busy(b, true); D.setCover(itc, null).then(function () { toast("Copertina tolta: torna quella automatica"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "open-file") {
      var path = b.getAttribute("data-path"); if (!path) return;
      var w = null; try { w = window.open("", "_blank"); } catch (x) {}
      busy(b, true);
      D.fileUrl(path).then(function (u) { if (w) w.location.href = u; else location.href = u; })
        .catch(function (x) { if (w) w.close(); toast(x.message, true); }).then(function () { busy(b, false); });
      return;
    }

    if (act === "decide") {
      var st = b.getAttribute("data-status"); busy(b, true);
      D.setEnrollment(id, mail, st).then(function () { toast(st === "attiva" ? "Accesso approvato" : "Richiesta rifiutata"); return reload(); })
        .catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "remove-enr") {
      if (needsConfirm(b, "Conferma: togli accesso")) return;
      busy(b, true);
      D.removeEnrollment(id, mail).then(function () { toast("Accesso tolto"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "del-init") {
      if (needsConfirm(b, "Conferma: elimina iniziativa, materiali e partecipanti")) return;
      busy(b, true);
      D.deleteInitiative(id).then(function () { toast("Iniziativa eliminata"); return refresh(); }).then(function () { go("#gestione"); })
        .catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "copy-invite") {
      var text = document.getElementById("inv-url").textContent;
      var done = function () { toast("Link copiato"); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { selectText("inv-url"); });
      else selectText("inv-url");
      return;
    }
    if (act === "inv-toggle") { busy(b, true); D.setInviteActive(id, b.getAttribute("data-active") === "1").then(function () { toast("Link aggiornato"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return; }
    if (act === "inv-new") {
      if (needsConfirm(b, "Conferma: il vecchio link smette di funzionare")) return;
      busy(b, true); D.regenerateInvite(id).then(function () { toast("Nuovo link pronto"); return reload(); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return;
    }
    if (act === "export") { exportCsv(); return; }

    if (!it) return;
    var i = parseInt(b.getAttribute("data-i"), 10), m = adminMats[i];
    if (act === "mat-new") { openMaterialForm(it, null); return; }
    if (act === "mat-cancel") { document.getElementById("mat-form-slot").innerHTML = ""; return; }
    if (act === "mat-edit") { openMaterialForm(it, m); document.getElementById("mat-panel").scrollIntoView({ block: "start" }); return; }
    if (act === "mat-vis") { busy(b, true); m.published = m.published === false; D.saveMaterial(m).then(function () { toast(m.published ? "Ora è visibile agli iscritti" : "Nascosto agli iscritti"); return loadAdminMaterials(it); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return; }
    if (act === "mat-del") {
      if (!b.classList.contains("confirm")) { b.classList.add("confirm"); b.style.background = "var(--no)"; b.style.color = "#fff"; b.title = "Tocca di nuovo per eliminare"; toast("Tocca di nuovo il cestino per eliminare «" + m.title + "»"); return; }
      busy(b, true); D.deleteMaterial(m).then(function () { toast("Materiale eliminato"); return loadAdminMaterials(it); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return;
    }
    if (act === "mat-move") {
      var j = i + parseInt(b.getAttribute("data-dir"), 10); if (j < 0 || j >= adminMats.length) return;
      var list = adminMats.slice(); var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
      busy(b, true);
      Promise.all(list.map(function (x, k) { if (x.position === k + 1) return null; x.position = k + 1; return D.saveMaterial(x); }))
        .then(function () { return loadAdminMaterials(it); }).catch(function (x) { toast(x.message, true); busy(b, false); });
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.id !== "f-add") return;
    e.preventDefault();
    var it = currentInit(); if (!it) return;
    var err = document.getElementById("add-err"), btn = e.target.querySelector("button[type=submit]");
    var list = emailsFrom(document.getElementById("add-emails").value);
    if (!list.length) { err.textContent = "Non trovo indirizzi email validi nel testo."; err.hidden = false; return; }
    busy(btn, true);
    D.addParticipants(it.id, list).then(function () { toast(list.length === 1 ? "Persona abilitata" : list.length + " persone abilitate"); return reload(); })
      .catch(function (x) { err.textContent = x.message; err.hidden = false; busy(btn, false); });
  });

  function selectText(id) {
    var el = document.getElementById(id), r = document.createRange();
    r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    toast("Link selezionato: copialo con Copia");
  }

  /* ---------------- avvio ---------------- */
  function handleInvite() {
    var inv = pendingInvite();
    if (!S.me || !inv) return Promise.resolve();
    return D.redeemInvite(inv).then(function (slug) {
      setPendingInvite("");
      return refresh().then(function () {
        var it = initBySlug(slug);
        toast("Invito accettato" + (it ? ": " + it.title : ""));
        location.hash = "#i-" + slug;
      });
    }).catch(function (e) { setPendingInvite(""); toast(e.message, true); });
  }

  function start() {
    var params = new URLSearchParams(location.search);
    if (params.get("invito")) {
      setPendingInvite(params.get("invito"));
      history.replaceState(null, "", location.pathname + location.hash);
    }
    if (!D.live) document.getElementById("demo-bar").hidden = false;
    D.init().then(refresh).then(function () { S.ready = true; return handleInvite(); }).then(route)
      .catch(function (e) { S.ready = true; main.innerHTML = '<div class="wrap page"><p class="form-msg err">' + esc(D.friendly(e)) + "</p></div>"; });
    D.onAuthChange(function () {
      S.ready = false;
      main.innerHTML = '<div class="wrap page"><p class="loading">Caricamento…</p></div>';
      refresh().then(function () { S.ready = true; return handleInvite(); }).then(route).catch(function (e) { S.ready = true; toast(e.message, true); route(); });
    });
    window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });
  }
  start();
})();
