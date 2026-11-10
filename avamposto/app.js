/* Avamposto Under 30 – interfaccia. */
(function () {
  "use strict";
  var D = window.AvampostoData;
  var main = document.getElementById("main");
  var nav = document.getElementById("mast-nav");
  var toastEl = document.getElementById("toast");
  var INVITE_KEY = "avamposto-invito";
  var DEMO = false;
  try {
    if (/[?&]demo=1\b/.test(location.search)) sessionStorage.setItem("avamposto-demo", "1");
    if (/[?&]demo=0\b/.test(location.search)) sessionStorage.removeItem("avamposto-demo");
    DEMO = sessionStorage.getItem("avamposto-demo") === "1";
  } catch (e) { DEMO = /[?&]demo=1\b/.test(location.search); }
  // Finché Supabase non è collegato, il pubblico vede solo l'anteprima: niente dati di esempio, niente iscrizioni finte.
  var PREVIEW = !D.live && !DEMO;

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
    team: '<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M7 20a5 5 0 0 1 10 0M1.5 19a3.5 3.5 0 0 1 5-3.2M22.5 19a3.5 3.5 0 0 0-5-3.2"/>',
    chat: '<path d="M4 20l1.4-4A8 8 0 1 1 8 18.6z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
    insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>',
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
      '<a href="#agenda"' + (active === "agenda" ? ' aria-current="page"' : "") + ">Agenda</a>" +
      '<a href="#squadra"' + (active === "squadra" ? ' aria-current="page"' : "") + ">La squadra</a>" +
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
    if (PREVIEW) return viewWelcome();
    var h = (location.hash || "#home").slice(1);
    if (!S.me) {
      if (/^(agenda|repliche|mobilitazione|m-)/.test(h)) { try { localStorage.setItem(AFTER_KEY, h); } catch (e) {} }
      if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
      return viewWelcome();
    }
    if (S.profile === null || !S.profile.full_name || !S.profile.membership || !S.profile.privacy_at) return viewCompleteProfile();
    var after = ""; try { after = localStorage.getItem(AFTER_KEY) || ""; localStorage.removeItem(AFTER_KEY); } catch (e) {}
    if (after && after !== h && (h === "home" || h === "")) { location.hash = "#" + after; return; }
    if (h === "profilo") return viewProfile();
    if (h === "squadra") return viewTeam();
    if (h === "agenda" || h === "mobilitazione") return viewAgenda(h === "mobilitazione" ? "mobilitazione" : "");
    if (h === "repliche") return viewAgenda("repliche");
    if (h.indexOf("m-") === 0) return viewAgenda(h);
    if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
    if (S.admin) {
      if (h === "gestione") return viewAdmin();
      if (h === "g-iscritti") return viewMembers();
      if (h === "g-nuova") return viewEditInitiative(null);
      if (h === "g-squadra") return viewEditTeam();
      if (h === "g-eventi") return viewAdminEvents();
      if (h.indexOf("g-ev-") === 0) return viewEditEvent(h.slice(5));
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
    var catalog = PREVIEW ? [] : S.inits.filter(function (i) { return i.published; });
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
          (PREVIEW ? '<div class="panel soon-panel"><span class="eyebrow">Iscrizioni in arrivo</span><h2>L\'Avamposto apre a breve</h2>' +
              "<p>Stiamo preparando i primi percorsi. Iscriviti alla newsletter o seguici su Instagram: ti avvisiamo appena si parte.</p>" +
              '<div class="btn-row"><a class="btn primary" href="../#unisciti">Avvisami</a><a class="btn quiet" href="https://www.instagram.com/azioneunder30marche/" target="_blank" rel="noopener">Instagram</a></div></div>'
            : '<div class="panel" id="auth-panel">' +
              (invite ? '<p class="form-msg ok">Hai un link d\'invito. Iscriviti o entra: il corso si sbloccherà in automatico.</p>' : "") +
              authForms() +
            "</div>") +
        "</div></section>" +
      '<div class="wrap page"><section class="block"><div class="block-head"><h2>Cosa trovi dentro</h2><span class="note">I corsi «su richiesta» si sbloccano dopo l\'approvazione dello staff.</span></div>' +
      (catalog.length ? '<div class="inits">' + catalog.map(initCard).join("") + "</div>" : '<p class="empty soon">Presto ci saranno nuove iniziative per i corsi.</p>') +
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
      (!visible.length ? '<p class="empty soon">Presto ci saranno nuove iniziative per i corsi.</p>' : "") +
      (visible.length ? '<section class="block"><div class="block-head"><h2>I miei percorsi</h2></div>' +
        (mine.length ? '<div class="inits">' + mine.map(initCard).join("") + "</div>" : '<p class="empty">Non hai ancora corsi attivi. Scegline uno qui sotto.</p>') +
      "</section>" +
      '<section class="block"><div class="block-head"><h2>Catalogo</h2><span class="note">Lo staff riceve la tua richiesta e ti abilita.</span></div>' +
        (others.length ? '<div class="inits">' + others.map(initCard).join("") + "</div>" : '<p class="empty">Sei già dentro a tutte le iniziative disponibili.</p>') +
      "</section>" : ""), "home");
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


  /* ---------------- la squadra ---------------- */
  var T = { units: [], people: [], photos: {} };
  function loadTeam() {
    return Promise.all([D.orgUnits(), D.orgPeople()]).then(function (r) {
      T.units = r[0] || []; T.people = r[1] || [];
      return D.orgPhotoUrls(T.people.map(function (pp) { return pp.photo_path; }));
    }).then(function (urls) { T.photos = urls || {}; });
  }
  function isNA(name) { return !name || /^\s*(n\/?a|da nominare|-+)\s*$/i.test(name); }
  function initials(name) {
    return String(name || "?").replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("") || "?";
  }
  function avatar(pp, big) {
    var u = pp.photo_path && T.photos[pp.photo_path];
    return '<span class="avatar' + (big ? " big" : "") + '">' + (u ? '<img src="' + esc(u) + '" alt="">' : esc(initials(pp.full_name))) + "</span>";
  }
  function igLink(h) {
    h = String(h || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    return /^[\w.]{1,30}$/.test(h) ? '<a class="ig" href="https://www.instagram.com/' + esc(h) + '/" target="_blank" rel="noopener">' + icon("insta") + "@" + esc(h) + "</a>" : "";
  }
  function waButton(u, label) {
    return u ? '<a class="btn small wa" href="' + esc(u) + '" target="_blank" rel="noopener">' + icon("chat") + esc(label || "Entra nel canale WhatsApp") + "</a>" : "";
  }
  function peopleOf(id) { return T.people.filter(function (pp) { return pp.unit_id === id && !isNA(pp.full_name); }); }
  function childrenOf(id) { return T.units.filter(function (u) { return (u.parent_id || null) === id; }); }
  function personRow(pp, big) {
    return '<li class="person">' + avatar(pp, big) + '<span class="who"><b>' + esc(pp.full_name) + "</b>" + (pp.role ? "<span>" + esc(pp.role) + "</span>" : "") + igLink(pp.instagram) + "</span></li>";
  }
  /* nella pagina pubblica una struttura compare solo se ha almeno una persona o un canale WhatsApp */
  function unitVisible(u) { return peopleOf(u.id).length > 0 || !!u.whatsapp_url || childrenOf(u.id).some(unitVisible); }
  function unitCard(u) {
    var pp = peopleOf(u.id);
    return '<article class="unit k-' + esc(u.kind) + '"><h3>' + esc(u.name) + "</h3>" +
      (pp.length ? '<ul class="people">' + pp.map(function (x) { return personRow(x); }).join("") + "</ul>" : "") +
      waButton(u.whatsapp_url) + "</article>";
  }
  function viewTeam() {
    setMain('<div class="page-head"><span class="eyebrow">Avamposto Under 30</span><h1>La squadra</h1><p>Chi coordina Azione Under 30 nelle Marche e chi segue i gruppi di lavoro. Entra nei canali WhatsApp del tuo gruppo e della tua zona.</p></div><div id="team"><p class="loading">Caricamento…</p></div>', "squadra");
    loadTeam().then(function () {
      var box = document.getElementById("team"); if (!box) return;
      var roots = childrenOf(null);
      if (!roots.length) { box.innerHTML = '<p class="empty">La squadra sarà pubblicata a breve.</p>'; return; }
      box.innerHTML = roots.map(function (r) {
        var lead = peopleOf(r.id);
        return '<section class="team-root"><div class="team-lead"><span class="eyebrow">' + esc(r.name) + "</span>" +
          (lead.length ? '<ul class="people lead">' + lead.map(function (x) { return personRow(x, true); }).join("") + "</ul>" : "") +
          waButton(r.whatsapp_url, "Canale WhatsApp regionale") + "</div>" +
          childrenOf(r.id).filter(unitVisible).map(function (a) {
            var coord = peopleOf(a.id), kids = childrenOf(a.id).filter(unitVisible);
            return '<section class="team-area"><div class="area-head"><div><h2>' + esc(a.name) + "</h2>" +
              (coord.length ? '<p class="coord">' + coord.map(function (x) { return "<b>" + esc(x.full_name) + "</b>" + (x.role ? " · " + esc(x.role) : ""); }).join("<br>") + "</p>" : "") + "</div>" +
              waButton(a.whatsapp_url, "Canale WhatsApp") + "</div>" +
              (kids.length ? '<div class="units">' + kids.map(unitCard).join("") + "</div>" : "") + "</section>";
          }).join("") + "</section>";
      }).join("");
    }).catch(function (e) { var box = document.getElementById("team"); if (box) box.innerHTML = '<p class="form-msg err">' + esc(e.message) + "</p>"; });
  }

  /* gestione della squadra */
  var KINDS = { coordinamento: "Coordinamento", area: "Area", gruppo: "Gruppo di lavoro", provincia: "Provincia" };
  function orderedUnits() {
    var out = [];
    (function walk(parent, depth) { childrenOf(parent).forEach(function (u) { out.push({ u: u, depth: depth }); walk(u.id, depth + 1); }); })(null, 0);
    T.units.forEach(function (u) { if (!out.some(function (o) { return o.u.id === u.id; })) out.push({ u: u, depth: 0 }); });
    return out;
  }
  function parentOptions(sel, self) {
    return '<option value="">— nessuna (livello più alto) —</option>' + orderedUnits().filter(function (o) { return o.u.id !== self; }).map(function (o) {
      return '<option value="' + esc(o.u.id) + '"' + (o.u.id === sel ? " selected" : "") + ">" + " ".repeat(o.depth) + esc(o.u.name) + "</option>";
    }).join("");
  }
  function kindOptions(sel) { return Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + KINDS[k] + "</option>"; }).join(""); }
  function personAdmin(pp) {
    var id = esc(pp.id);
    return '<form class="person-edit" data-form="person" data-id="' + id + '" data-unit="' + esc(pp.unit_id) + '" novalidate>' + avatar(pp) +
      '<label class="field" for="pn-' + id + '"><span>Nome e cognome</span><input type="text" id="pn-' + id + '" name="full_name" value="' + esc(pp.full_name) + '"></label>' +
      '<label class="field" for="pr-' + id + '"><span>Ruolo</span><input type="text" id="pr-' + id + '" name="role" value="' + esc(pp.role || "") + '"></label>' +
      '<label class="field" for="pi-' + id + '"><span>Instagram (facoltativo)</span><input type="text" id="pi-' + id + '" name="instagram" placeholder="@nome" value="' + esc(pp.instagram || "") + '"></label>' +
      '<div class="btn-row"><button class="btn small primary" type="submit">Salva</button>' +
      '<label class="btn small quiet" for="pf-' + id + '">' + (pp.photo_path ? "Cambia foto" : "Aggiungi foto") + '</label><input type="file" id="pf-' + id + '" class="visually-hidden" accept="image/jpeg,image/png,image/webp" data-photo="' + id + '">' +
      (pp.photo_path ? '<button class="btn small quiet" type="button" data-action="t-photo-del" data-id="' + id + '">Togli foto</button>' : "") +
      '<button class="btn small danger" type="button" data-action="t-person-del" data-id="' + id + '">' + icon("trash") + "Togli</button></div></form>";
  }
  function unitAdmin(o) {
    var u = o.u, id = esc(u.id), pp = T.people.filter(function (x) { return x.unit_id === u.id; });
    return '<section class="panel unit-admin" style="margin-left:' + Math.min(o.depth, 3) * 18 + 'px">' +
      '<form data-form="unit" data-id="' + id + '" novalidate><h3>' + esc(u.name) + '</h3>' +
        (unitVisible(u) ? "" : '<p class="vacant">Nascosta agli iscritti finché non aggiungi una persona o un link WhatsApp.</p>') + '<div class="grid-2">' +
        '<label class="field" for="un-' + id + '"><span>Nome</span><input type="text" id="un-' + id + '" name="name" value="' + esc(u.name) + '"></label>' +
        '<label class="field" for="ud-' + id + '"><span>Descrizione / ruolo</span><input type="text" id="ud-' + id + '" name="description" value="' + esc(u.description || "") + '"></label>' +
        '<label class="field" for="uw-' + id + '"><span>Link canale WhatsApp</span><input type="url" id="uw-' + id + '" name="whatsapp_url" placeholder="https://chat.whatsapp.com/…" value="' + esc(u.whatsapp_url || "") + '"></label>' +
        '<label class="field" for="uk-' + id + '"><span>Tipo</span><select id="uk-' + id + '" name="kind">' + kindOptions(u.kind) + "</select></label>" +
        '<label class="field" for="up-' + id + '"><span>Fa parte di</span><select id="up-' + id + '" name="parent_id">' + parentOptions(u.parent_id, u.id) + "</select></label>" +
        '<label class="field" for="uo-' + id + '"><span>Ordine</span><input type="number" id="uo-' + id + '" name="position" value="' + esc(u.position || 0) + '"></label>' +
      '</div><div class="btn-row"><button class="btn small primary" type="submit">Salva struttura</button>' +
      '<button class="btn small danger" type="button" data-action="t-unit-del" data-id="' + id + '">' + icon("trash") + "Elimina struttura</button></div></form>" +
      '<div class="people-admin">' + pp.map(personAdmin).join("") +
      '<button class="btn small" type="button" data-action="t-person-new" data-unit="' + id + '">' + icon("plus") + "Aggiungi persona</button></div></section>";
  }
  function viewEditTeam() {
    setMain('<a class="back" href="#gestione">← Gestione</a><div class="page-head"><span class="eyebrow">Area staff</span><h1>La squadra</h1>' +
      '<p>Modifica strutture, persone, foto e link dei canali WhatsApp. La pagina «La squadra» è visibile solo agli iscritti all\'Avamposto. <a href="#squadra">Vedi come la vedono →</a></p></div>' +
      '<div id="team-admin"><p class="loading">Caricamento…</p></div>', "gestione");
    loadTeam().then(function () {
      var box = document.getElementById("team-admin"); if (!box) return;
      box.innerHTML = '<div class="team-admin">' + orderedUnits().map(unitAdmin).join("") +
        '<section class="panel"><h3>Nuova struttura</h3><form data-form="unit" data-id="" novalidate><div class="grid-2">' +
        '<label class="field" for="un-new"><span>Nome</span><input type="text" id="un-new" name="name" placeholder="Es. GdL Formazione"></label>' +
        '<label class="field" for="uk-new"><span>Tipo</span><select id="uk-new" name="kind">' + kindOptions("gruppo") + "</select></label>" +
        '<label class="field" for="up-new"><span>Fa parte di</span><select id="up-new" name="parent_id">' + parentOptions(null, "") + "</select></label>" +
        '<label class="field" for="uw-new"><span>Link canale WhatsApp</span><input type="url" id="uw-new" name="whatsapp_url" placeholder="https://chat.whatsapp.com/…"></label>' +
        '</div><div class="btn-row"><button class="btn small primary" type="submit">' + icon("plus") + "Aggiungi struttura</button></div></form></section></div>";
    }).catch(function (e) { toast(e.message, true); });
  }
  document.addEventListener("submit", function (e) {
    var f = e.target, kind = f.getAttribute && f.getAttribute("data-form");
    if (kind !== "unit" && kind !== "person") return;
    e.preventDefault();
    var val = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ""; };
    var btn = f.querySelector("button[type=submit]"); busy(btn, true);
    var job;
    if (kind === "unit") {
      if (!val("name")) { toast("Scrivi il nome della struttura.", true); busy(btn, false); return; }
      var wa = val("whatsapp_url");
      if (wa && !/^https:\/\/(chat\.whatsapp\.com|(www\.)?whatsapp\.com\/channel|wa\.me)\//.test(wa)) { toast("Il link deve essere un link WhatsApp (chat.whatsapp.com o whatsapp.com/channel).", true); busy(btn, false); return; }
      var cur = T.units.filter(function (u) { return u.id === f.getAttribute("data-id"); })[0] || {};
      job = D.saveUnit({ id: cur.id, name: val("name"), description: val("description") || cur.description || null, whatsapp_url: wa || null,
        kind: val("kind") || "gruppo", parent_id: val("parent_id") || null, position: parseInt(val("position"), 10) || cur.position || childrenOf(val("parent_id") || null).length + 1 });
    } else {
      if (!val("full_name")) { toast("Scrivi nome e cognome.", true); busy(btn, false); return; }
      var pid = f.getAttribute("data-id");
      var pp = T.people.filter(function (x) { return x.id === pid; })[0] || {};
      job = D.savePerson({ id: pp.id, unit_id: f.getAttribute("data-unit"), full_name: val("full_name"), role: val("role"), instagram: val("instagram"), position: pp.position || 99 });
    }
    job.then(function () { toast("Salvato"); viewEditTeam(); }).catch(function (x) { toast(x.message, true); busy(btn, false); });
  });
  document.addEventListener("change", function (e) {
    var id = e.target.getAttribute && e.target.getAttribute("data-photo"); if (!id || !e.target.files[0]) return;
    var pp = T.people.filter(function (x) { return x.id === id; })[0]; if (!pp) return;
    toast("Carico la foto…");
    shrinkImage(e.target.files[0]).then(function (b) { return D.setPersonPhoto(pp, b); }).then(function () { toast("Foto aggiornata"); viewEditTeam(); })
      .catch(function (x) { toast(x.message, true); });
  });

  /* ---------------- agenda: mobilitazione e repliche ---------------- */
  var EV = { events: [], mob: {}, mine: {}, replays: [], signups: [], counts: {} };
  var EKIND = { incontro: "Incontro", aperitivo: "Aperitivo", mobilitazione: "Mobilitazione", diretta: "Diretta", formazione: "Formazione" };
  var EAREA = { marche: "Tutta la regione", pu: "Pesaro-Urbino", an: "Ancona", mc: "Macerata", fm: "Fermo", ap: "Ascoli Piceno", online: "Online", fuori: "Fuori regione" };
  var AFTER_KEY = "avamposto-dopo";
  function evEnd(ev) { return new Date(ev.ends_at || new Date(new Date(ev.starts_at).getTime() + 2 * 3600000)); }
  function evPast(ev) { return evEnd(ev).getTime() < Date.now(); }
  function evWhere(ev) { return [ev.place, ev.city].filter(Boolean).join(" · "); }
  function slotsOf(ev) { var m = EV.mob[ev.id]; return m && m.slots ? m.slots.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean) : []; }
  function loadAgenda(withAdmin) {
    var jobs = [D.events(), D.mobilization(), D.mySignups(), D.replays(), D.signupCounts().catch(function () { return []; })];
    if (withAdmin) jobs.push(D.allSignups());
    return Promise.all(jobs).then(function (r) {
      EV.events = r[0] || [];
      EV.mob = {}; (r[1] || []).forEach(function (m) { EV.mob[m.event_id] = m; });
      EV.mine = {}; (r[2] || []).forEach(function (x) { EV.mine[x.event_id] = x; });
      EV.replays = r[3] || [];
      EV.counts = {}; (r[4] || []).forEach(function (c) { EV.counts[c.event_id] = Number(c.n) || 0; });
      EV.signups = r[5] || [];
    });
  }
  function posterSrc(ev) { return ev && ev.poster_path ? D.posterUrl(ev.poster_path) : ""; }
  function handsCard(ev) {
    var m = EV.mob[ev.id] || {}, mine = EV.mine[ev.id], slots = slotsOf(ev), n = EV.counts[ev.id] || 0, id = esc(ev.id), src = posterSrc(ev);
    var kit = safeHref(m.kit_url);
    return '<article class="hands" id="m-' + id + '">' +
      '<div class="hands-poster">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : icon("evento")) + "</div>" +
      '<div class="hands-body"><div class="hands-top"><span class="pill hands-pill">Serve una mano</span>' + (n ? '<span class="hands-n">' + n + (n === 1 ? " c'è già" : " ci sono già") + "</span>" : "") + "</div>" +
      "<h3>" + esc(ev.title) + "</h3>" +
      '<p class="live-when">' + esc(fmtWhen(ev.starts_at)) + (evWhere(ev) ? " · " + esc(evWhere(ev)) : "") + "</p>" +
      (ev.summary ? "<p>" + esc(ev.summary) + "</p>" : "") +
      (m.meeting_point || m.notes ? '<ul class="hands-info">' + (m.meeting_point ? "<li><b>Ritrovo</b>" + esc(m.meeting_point) + "</li>" : "") + (m.notes ? "<li><b>Da sapere</b>" + esc(m.notes) + "</li>" : "") + "</ul>" : "") +
      (mine
        ? '<div class="hands-yes">' + icon("check") + "<div><b>Ci sei" + (mine.slot ? ": turno " + esc(mine.slot) : "") + "</b><span>Grazie! Lo staff ti scriverà con gli ultimi dettagli.</span></div></div>" +
          '<div class="btn-row">' + (kit ? '<a class="btn small" href="' + esc(kit) + '" target="_blank" rel="noopener">' + icon("download") + "Kit del volontario</a>" : "") +
          '<a class="btn small quiet" href="' + esc(evGcal(ev)) + '" target="_blank" rel="noopener">Aggiungi al calendario</a>' +
          '<button class="btn small quiet" type="button" data-action="su-cancel" data-id="' + id + '">Non posso più</button></div>'
        : '<form class="hands-form" data-form="signup" data-id="' + id + '" novalidate>' +
          (slots.length ? '<fieldset class="slots"><legend>Scegli il turno</legend>' + slots.map(function (s, i) {
            return '<label class="slot"><input type="radio" name="slot" value="' + esc(s) + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(s) + "</span></label>";
          }).join("") + "</fieldset>" : "") +
          '<label class="field" for="sn-' + id + '"><span>Nota per lo staff <small>(facoltativa)</small></span><input type="text" id="sn-' + id + '" name="note" maxlength="300" placeholder="Es. arrivo con un amico, ho la macchina"></label>' +
          '<div class="btn-row"><button class="btn primary" type="submit">' + icon("check") + "Ci sono</button>" +
          (kit ? '<a class="btn small quiet" href="' + esc(kit) + '" target="_blank" rel="noopener">Guarda il kit</a>' : "") + "</div></form>") +
      "</div></article>";
  }
  function evGcal(ev) {
    var f = function (x) { return x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    var m = EV.mob[ev.id] || {}, mine = EV.mine[ev.id];
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(ev.title + (mine && mine.slot ? " (turno " + mine.slot + ")" : "")) +
      "&dates=" + f(new Date(ev.starts_at)) + "/" + f(evEnd(ev)) + "&location=" + encodeURIComponent(m.meeting_point || evWhere(ev)) +
      "&details=" + encodeURIComponent("Azione Under 30 Marche – " + (ev.summary || ""));
  }
  function replayCard(r) {
    var ev = EV.events.filter(function (x) { return x.id === r.event_id; })[0];
    var href = safeHref(r.video_url), em = href ? embedUrl(href) : "";
    var dd = r.recorded_on ? fmtDate(r.recorded_on) : "";
    return '<article class="mat replay" id="r-' + esc(r.id) + '"><div class="mat-ico">' + icon("video") + "</div>" +
      '<div class="mat-kind">Replica' + (dd ? " · " + esc(dd) : "") + (r.published === false ? ' <span class="pill draft">Nascosta</span>' : "") + "</div>" +
      "<h3>" + esc(r.title) + "</h3>" +
      '<div class="mat-content">' +
        (em ? '<div class="video"><iframe src="' + esc(em) + '" title="' + esc(r.title) + '" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
          : href ? '<div class="btn-row"><a class="btn primary" href="' + esc(href) + '" target="_blank" rel="noopener">' + icon("video") + "Guarda la replica</a></div>"
          : '<div class="video-placeholder">Video di esempio: qui comparirà la registrazione.</div>') +
        (r.description ? "<p>" + esc(r.description) + "</p>" : "") +
        (ev ? '<p class="replay-ev">Dall\'evento <a href="../eventi/#evento-' + esc(ev.id) + '">' + esc(ev.title) + "</a></p>" : "") +
      "</div></article>";
  }
  function viewAgenda(focus) {
    setMain('<div class="page-head"><span class="eyebrow">Avamposto Under 30</span><h1>Agenda</h1>' +
      '<p>Dove serve una mano nei prossimi giorni e le repliche delle dirette. Il calendario completo è nella <a href="../eventi/">pagina Eventi</a>.</p>' +
      '<nav class="subnav"><a href="#agenda">' + icon("users") + "Serve una mano</a><a href=\"#repliche\">" + icon("video") + "Repliche</a><a href=\"../eventi/#calendario\">" + icon("evento") + "Calendario ↗</a></nav></div>" +
      '<div id="agenda"><p class="loading">Caricamento…</p></div>', "agenda");
    loadAgenda(false).then(function () {
      var box = document.getElementById("agenda"); if (!box) return;
      var hands = EV.events.filter(function (e) { return e.published !== false && e.needs_hands && !evPast(e); });
      var next = EV.events.filter(function (e) { return e.published !== false && !e.needs_hands && !evPast(e); }).slice(0, 4);
      var mineCount = hands.filter(function (e) { return EV.mine[e.id]; }).length;
      box.innerHTML =
        '<section class="block" id="mobilitazione"><div class="block-head"><h2>Serve una mano</h2><span class="note">' +
          (mineCount ? "Hai detto «Ci sono» a " + mineCount + (mineCount === 1 ? " appuntamento" : " appuntamenti") : "Banchetti, volantinaggi e allestimenti: scegli il turno che ti va") + "</span></div>" +
          (hands.length ? '<div class="hands-list">' + hands.map(handsCard).join("") + "</div>" : '<p class="empty">Per ora non ci sono appuntamenti che cercano volontari. Ti avvisiamo nei canali WhatsApp.</p>') +
        "</section>" +
        (next.length ? '<section class="block"><div class="block-head"><h2>Prossimi eventi</h2><a href="../eventi/">Tutti gli eventi ↗</a></div><div class="next-events">' + next.map(function (ev) {
          var src = posterSrc(ev);
          return '<a class="next-ev" href="../eventi/#evento-' + esc(ev.id) + '">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<span class="ph">' + icon("evento") + "</span>") +
            '<span><small>' + esc(fmtWhen(ev.starts_at)) + "</small><b>" + esc(ev.title) + "</b>" + (evWhere(ev) ? "<em>" + esc(evWhere(ev)) + "</em>" : "") + "</span></a>";
        }).join("") + "</div></section>" : "") +
        '<section class="block" id="repliche"><div class="block-head"><h2>Repliche</h2><span class="note">Le registrazioni delle dirette e degli incontri</span></div>' +
          (EV.replays.length ? '<div class="mats">' + EV.replays.map(replayCard).join("") + "</div>" : '<p class="empty">Ancora nessuna replica. Le registrazioni arriveranno qui dopo le dirette.</p>') +
        "</section>";
      var target = focus && document.getElementById(focus);
      if (target) { target.scrollIntoView({ block: "start" }); target.classList.add("flash"); }
    }).catch(function (e) { var box = document.getElementById("agenda"); if (box) box.innerHTML = '<p class="form-msg err">' + esc(e.message) + "</p>"; });
  }

  /* gestione eventi */
  function viewAdminEvents() {
    setMain('<a class="back" href="#gestione">← Gestione</a><div class="page-head"><span class="eyebrow">Area staff</span><h1>Eventi, mobilitazione e repliche</h1>' +
      '<p>Gli eventi pubblicati compaiono nella <a href="../eventi/">pagina Eventi</a>, visibile a tutti. Turni, kit e adesioni restano nell\'Avamposto; le repliche le vedono solo gli iscritti.</p></div>' +
      '<div id="ev-admin"><p class="loading">Caricamento…</p></div>', "gestione");
    loadAgenda(true).then(function () {
      var box = document.getElementById("ev-admin"); if (!box) return;
      var up = EV.events.filter(function (e) { return !evPast(e); }), past = EV.events.filter(evPast).reverse();
      var row = function (ev) {
        var n = EV.signups.filter(function (s) { return s.event_id === ev.id; }).length;
        return "<tr><td class=\"num\">" + esc(fmtShort(ev.starts_at)) + "</td><td><b>" + esc(ev.title) + '</b><span class="sub">' + esc(EKIND[ev.kind] || "") + " · " + esc(EAREA[ev.area] || "") + "</span></td>" +
          "<td>" + (ev.needs_hands ? '<span class="pill wait">' + n + (n === 1 ? " adesione" : " adesioni") + "</span>" : '<span class="sub">—</span>') + "</td>" +
          "<td>" + (ev.published ? '<span class="pill ok">Pubblicato</span>' : '<span class="pill draft">Bozza</span>') + "</td>" +
          '<td class="actions"><a class="btn small" href="#g-ev-' + esc(ev.id) + '">Gestisci</a></td></tr>';
      };
      var table = function (list) { return '<div class="table-wrap"><table><thead><tr><th>Data</th><th>Evento</th><th>Volontari</th><th>Stato</th><th></th></tr></thead><tbody>' + list.map(row).join("") + "</tbody></table></div>"; };
      box.innerHTML =
        '<section class="block"><div class="block-head"><h2>Prossimi eventi</h2><a class="btn primary small" href="#g-ev-nuovo">' + icon("plus") + "Nuovo evento</a></div>" +
          (up.length ? table(up) : '<p class="empty">Nessun evento in programma.</p>') + "</section>" +
        (past.length ? '<section class="block"><div class="block-head"><h2>Già passati</h2></div>' + table(past.slice(0, 12)) + "</section>" : "") +
        '<section class="block" id="g-repliche"><div class="block-head"><h2>Repliche</h2><span class="note">Link YouTube (anche non in elenco), Vimeo o Google Drive</span></div><div class="team-admin">' +
          EV.replays.map(replayForm).join("") + replayForm(null) + "</div></section>";
    }).catch(function (e) { toast(e.message, true); });
  }
  function eventOptions(sel) {
    return '<option value="">— nessuno —</option>' + EV.events.slice().reverse().map(function (ev) {
      return '<option value="' + esc(ev.id) + '"' + (ev.id === sel ? " selected" : "") + ">" + esc(fmtShort(ev.starts_at) + " · " + ev.title) + "</option>";
    }).join("");
  }
  function replayForm(r) {
    var x = r || { title: "", recorded_on: new Date().toISOString().slice(0, 10), video_url: "", description: "", published: true }, id = esc(r ? r.id : "new");
    return '<section class="panel"><form data-form="replay" data-id="' + (r ? id : "") + '" novalidate><h3>' + (r ? esc(r.title) : "Nuova replica") + '</h3><div class="grid-2">' +
      '<label class="field" for="rt-' + id + '"><span>Titolo</span><input type="text" id="rt-' + id + '" name="title" value="' + esc(x.title) + '"></label>' +
      '<label class="field" for="rv-' + id + '"><span>Link al video</span><input type="url" id="rv-' + id + '" name="video_url" placeholder="https://youtu.be/…" value="' + esc(x.video_url) + '"></label>' +
      '<label class="field" for="rd-' + id + '"><span>Registrata il</span><input type="date" id="rd-' + id + '" name="recorded_on" value="' + esc(x.recorded_on || "") + '"></label>' +
      '<label class="field" for="re-' + id + '"><span>Evento collegato</span><select id="re-' + id + '" name="event_id">' + eventOptions(x.event_id) + "</select></label>" +
      '<label class="field" for="rs-' + id + '" style="grid-column:1/-1"><span>Descrizione breve</span><input type="text" id="rs-' + id + '" name="description" value="' + esc(x.description || "") + '"></label>' +
      '</div><label class="check" for="rp-' + id + '"><input type="checkbox" id="rp-' + id + '" name="published"' + (x.published !== false ? " checked" : "") + "> <span><b>Pubblicata</b> per gli iscritti</span></label>" +
      '<div class="btn-row"><button class="btn small primary" type="submit">' + (r ? "Salva" : "Aggiungi replica") + "</button>" +
      (r ? '<button class="btn small danger" type="button" data-action="rp-del" data-id="' + id + '">' + icon("trash") + "Elimina</button>" : "") + "</div></form></section>";
  }
  function currentEvent() { var h = location.hash.slice(1); return h.indexOf("g-ev-") === 0 ? EV.events.filter(function (e) { return e.id === h.slice(5); })[0] : null; }
  function viewEditEvent(id) {
    setMain('<a class="back" href="#g-eventi">← Eventi</a><div id="ev-edit"><p class="loading">Caricamento…</p></div>', "gestione");
    loadAgenda(true).then(function () {
      var box = document.getElementById("ev-edit"); if (!box) return;
      var ev = id === "nuovo" ? null : EV.events.filter(function (e) { return e.id === id; })[0];
      if (id !== "nuovo" && !ev) { box.innerHTML = '<p class="empty">Evento non trovato.</p>'; return; }
      var x = ev || { title: "", kind: "incontro", area: "marche", starts_at: "", ends_at: "", place: "", city: "", summary: "", description: "", link_url: "", link_label: "", published: true, needs_hands: false };
      var m = (ev && EV.mob[ev.id]) || {};
      var sign = ev ? EV.signups.filter(function (s) { return s.event_id === ev.id; }) : [];
      var opts = function (o, sel) { return Object.keys(o).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + o[k] + "</option>"; }).join(""); };
      var src = posterSrc(ev);
      box.innerHTML = '<div class="page-head"><span class="eyebrow">Area staff · Evento</span><h1>' + (ev ? esc(ev.title) : "Nuovo evento") + "</h1>" +
        (ev ? '<p><a href="../eventi/#evento-' + esc(ev.id) + '" target="_blank">Vedi la pagina pubblica ↗</a></p>' : "") + "</div>" +
        '<div class="ev-edit-grid"><form class="panel" id="f-event" data-form="event" novalidate><h2>Dettagli</h2><div class="grid-2">' +
          '<label class="field" for="ev-title" style="grid-column:1/-1"><span>Titolo</span><input type="text" id="ev-title" name="title" value="' + esc(x.title) + '"></label>' +
          '<label class="field" for="ev-kind"><span>Tipo</span><select id="ev-kind" name="kind">' + opts(EKIND, x.kind) + "</select></label>" +
          '<label class="field" for="ev-area"><span>Zona</span><select id="ev-area" name="area">' + opts(EAREA, x.area) + "</select></label>" +
          '<label class="field" for="ev-start"><span>Inizio</span><input type="datetime-local" id="ev-start" name="starts_at" value="' + esc(toLocalInput(x.starts_at)) + '"></label>' +
          '<label class="field" for="ev-end"><span>Fine <small>(facoltativa)</small></span><input type="datetime-local" id="ev-end" name="ends_at" value="' + esc(toLocalInput(x.ends_at)) + '"></label>' +
          '<label class="field" for="ev-place"><span>Luogo</span><input type="text" id="ev-place" name="place" placeholder="Es. Sala del Consiglio, oppure Online" value="' + esc(x.place || "") + '"></label>' +
          '<label class="field" for="ev-city"><span>Città</span><input type="text" id="ev-city" name="city" value="' + esc(x.city || "") + '"></label>' +
          '<label class="field" for="ev-sum" style="grid-column:1/-1"><span>In una frase</span><input type="text" id="ev-sum" name="summary" maxlength="200" value="' + esc(x.summary || "") + '"></label>' +
          '<label class="field" for="ev-desc" style="grid-column:1/-1"><span>Descrizione <small>(facoltativa)</small></span><textarea id="ev-desc" name="description" rows="4">' + esc(x.description || "") + "</textarea></label>" +
          '<label class="field" for="ev-link"><span>Link per partecipare <small>(facoltativo)</small></span><input type="url" id="ev-link" name="link_url" placeholder="https://…" value="' + esc(x.link_url || "") + '"></label>' +
          '<label class="field" for="ev-ll"><span>Testo del pulsante</span><input type="text" id="ev-ll" name="link_label" placeholder="Partecipa" value="' + esc(x.link_label || "") + '"></label>' +
        "</div>" +
        '<fieldset class="mob-fs"><legend><label class="check" for="ev-hands"><input type="checkbox" id="ev-hands" name="needs_hands"' + (x.needs_hands ? " checked" : "") + "> <span><b>Serve una mano</b>: raccogli le adesioni «Ci sono» nell'Avamposto</span></label></legend>" +
          '<div class="grid-2">' +
          '<label class="field" for="ev-slots"><span>Turni <small>(uno per riga)</small></span><textarea id="ev-slots" name="slots" rows="3" placeholder="10:00 – 11:30&#10;11:30 – 13:00">' + esc(m.slots || "") + "</textarea></label>" +
          '<div class="grid-2" style="grid-template-columns:1fr">' +
          '<label class="field" for="ev-meet"><span>Punto di ritrovo</span><input type="text" id="ev-meet" name="meeting_point" value="' + esc(m.meeting_point || "") + '"></label>' +
          '<label class="field" for="ev-kit"><span>Link al kit del volontario <small>(Drive con volantini, grafiche, testi)</small></span><input type="url" id="ev-kit" name="kit_url" placeholder="https://drive.google.com/…" value="' + esc(m.kit_url || "") + '"></label></div>' +
          '<label class="field" for="ev-notes" style="grid-column:1/-1"><span>Da sapere per i volontari</span><input type="text" id="ev-notes" name="notes" value="' + esc(m.notes || "") + '"></label>' +
          "</div><small class=\"note\">Turni, ritrovo e kit li vedono solo gli iscritti all'Avamposto.</small></fieldset>" +
        '<label class="check" for="ev-pub"><input type="checkbox" id="ev-pub" name="published"' + (x.published !== false ? " checked" : "") + "> <span><b>Pubblicato</b> nella pagina Eventi. Senza spunta resta una bozza.</span></label>" +
        '<div class="btn-row"><button class="btn primary" type="submit">' + (ev ? "Salva" : "Crea evento") + "</button>" +
        (ev ? '<button class="btn danger" type="button" data-action="ev-del" data-id="' + esc(ev.id) + '">' + icon("trash") + "Elimina evento</button>" : "") + "</div></form>" +
        '<div class="ev-side"><section class="panel"><h2>Locandina</h2>' +
          (ev ? (src ? '<img class="poster-prev" src="' + esc(src) + '" alt="Locandina attuale">' : '<p class="empty">Nessuna locandina. Va bene anche verticale (formato Instagram 4:5 o storia).</p>') +
            '<div class="btn-row"><label class="btn small" for="ev-poster">' + (src ? "Cambia locandina" : "Carica locandina") + '</label><input type="file" id="ev-poster" class="visually-hidden" accept="image/jpeg,image/png,image/webp">' +
            (src ? '<button class="btn small quiet" type="button" data-action="poster-del">Togli</button>' : "") + "</div>"
            : '<p class="empty">Salva prima l\'evento, poi carica la locandina.</p>') + "</section>" +
        (ev && ev.needs_hands ? '<section class="panel"><div class="block-head"><h2>Chi c\'è (' + sign.length + ")</h2></div>" +
          (sign.length ? signupTable(ev, sign) + '<div class="btn-row"><button class="btn small" type="button" data-action="su-copy">' + icon("copy") + "Copia elenco per WhatsApp</button>" +
            '<button class="btn small quiet" type="button" data-action="su-csv">' + icon("download") + "CSV</button></div>" : '<p class="empty">Ancora nessuna adesione.</p>') + "</section>" : "") +
        "</div></div>";
    }).catch(function (e) { toast(e.message, true); });
  }
  function signupTable(ev, sign) {
    var slots = slotsOf(ev);
    var groups = slots.length ? slots.concat(sign.some(function (s) { return !s.slot || slots.indexOf(s.slot) < 0; }) ? [""] : []) : [""];
    return groups.map(function (g) {
      var list = sign.filter(function (s) { return slots.length ? (g ? s.slot === g : (!s.slot || slots.indexOf(s.slot) < 0)) : true; });
      return (slots.length ? '<h3 class="slot-h">' + (g ? "Turno " + esc(g) : "Senza turno") + " <span>" + list.length + "</span></h3>" : "") +
        (list.length ? '<ul class="signups">' + list.map(function (s) {
          return "<li><div><b>" + esc(s.full_name || s.email) + "</b><span>" + esc(s.email) + (s.note ? " · " + esc(s.note) : "") + "</span></div>" +
            '<button class="btn small quiet" type="button" data-action="su-remove" data-id="' + esc(s.event_id) + '" data-user="' + esc(s.user_id) + '" aria-label="Togli ' + esc(s.full_name || s.email) + '">' + icon("trash") + "</button></li>";
        }).join("") + "</ul>" : '<p class="sub">Nessuno.</p>');
    }).join("");
  }
  function signupText(ev) {
    var sign = EV.signups.filter(function (s) { return s.event_id === ev.id; }), slots = slotsOf(ev);
    var out = ["*" + ev.title + "*", fmtWhen(ev.starts_at) + (evWhere(ev) ? " · " + evWhere(ev) : ""), ""];
    if (slots.length) slots.forEach(function (g) {
      out.push("Turno " + g + ":"); sign.filter(function (s) { return s.slot === g; }).forEach(function (s) { out.push("– " + (s.full_name || s.email)); }); out.push("");
    }); else sign.forEach(function (s) { out.push("– " + (s.full_name || s.email)); });
    var m = EV.mob[ev.id] || {}; if (m.meeting_point) out.push("Ritrovo: " + m.meeting_point);
    return out.join("\n").trim();
  }

  document.addEventListener("submit", function (e) {
    var f = e.target, kind = f.getAttribute && f.getAttribute("data-form");
    if (kind !== "event" && kind !== "replay" && kind !== "signup") return;
    e.preventDefault();
    var val = function (n) { var el = f.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var on = function (n) { var el = f.elements[n]; return !!(el && el.checked); };
    var btn = f.querySelector("button[type=submit]"); busy(btn, true);
    var stop = function (msg) { toast(msg, true); busy(btn, false); };
    if (kind === "signup") {
      var radio = f.querySelector("input[name=slot]:checked");
      D.signup(f.getAttribute("data-id"), { slot: radio ? radio.value : "", note: val("note"), full_name: (S.profile && S.profile.full_name) || "" })
        .then(function () { toast("Grazie, ci sei!"); viewAgenda("m-" + f.getAttribute("data-id")); }).catch(function (x) { stop(x.message); });
      return;
    }
    if (kind === "replay") {
      if (!val("title")) return stop("Scrivi il titolo della replica.");
      if (!/^https:\/\//.test(val("video_url"))) return stop("Incolla il link al video (deve iniziare con https://).");
      D.saveReplay({ id: f.getAttribute("data-id") || undefined, title: val("title"), video_url: val("video_url"), recorded_on: val("recorded_on") || new Date().toISOString().slice(0, 10),
        event_id: val("event_id") || null, description: val("description"), published: on("published") })
        .then(function () { toast("Replica salvata"); viewAdminEvents(); }).catch(function (x) { stop(x.message); });
      return;
    }
    var ev = currentEvent();
    if (!val("title")) return stop("Scrivi il titolo dell'evento.");
    if (!val("starts_at")) return stop("Indica data e ora di inizio.");
    var start = new Date(val("starts_at")), end = val("ends_at") ? new Date(val("ends_at")) : null;
    if (isNaN(start)) return stop("Data di inizio non valida.");
    if (end && end < start) return stop("La fine non può essere prima dell'inizio.");
    if (val("link_url") && !/^https?:\/\//.test(val("link_url"))) return stop("Il link per partecipare deve iniziare con https://");
    if (val("kit_url") && !/^https:\/\//.test(val("kit_url"))) return stop("Il link al kit deve iniziare con https://");
    var row = { id: ev ? ev.id : undefined, title: val("title"), kind: val("kind"), area: val("area"), starts_at: start.toISOString(), ends_at: end ? end.toISOString() : null,
      place: val("place"), city: val("city"), summary: val("summary"), description: val("description"), link_url: val("link_url"), link_label: val("link_label"),
      needs_hands: on("needs_hands"), published: on("published") };
    var mob = { slots: val("slots"), meeting_point: val("meeting_point"), kit_url: val("kit_url"), notes: val("notes") };
    D.saveEvent(row).then(function (saved) {
      var hasMob = mob.slots || mob.meeting_point || mob.kit_url || mob.notes || (ev && EV.mob[ev.id]);
      return (hasMob ? D.saveMobilization(Object.assign({ event_id: saved.id }, mob)) : Promise.resolve()).then(function () { return saved; });
    }).then(function (saved) {
      toast(ev ? "Evento salvato" : "Evento creato: ora puoi caricare la locandina");
      if (ev) viewEditEvent(saved.id); else location.hash = "#g-ev-" + saved.id;
    }).catch(function (x) { stop(x.message); });
  });
  document.addEventListener("change", function (e) {
    if (e.target.id !== "ev-poster" || !e.target.files[0]) return;
    var ev = currentEvent(); if (!ev) return;
    toast("Carico la locandina…");
    shrinkImage(e.target.files[0]).then(function (b) { return D.setPoster(ev, b); }).then(function () { toast("Locandina aggiornata"); viewEditEvent(ev.id); })
      .catch(function (x) { toast(x.message, true); });
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]"); if (!b) return;
    var act = b.getAttribute("data-action"), id = b.getAttribute("data-id");
    if (act === "su-cancel") { D.cancelSignup(id).then(function () { toast("Adesione tolta"); viewAgenda("m-" + id); }).catch(function (x) { toast(x.message, true); }); }
    else if (act === "su-remove") {
      if (!confirm("Togliere questa persona dall'elenco?")) return;
      D.removeSignup(id, b.getAttribute("data-user")).then(function () { viewEditEvent(id); }).catch(function (x) { toast(x.message, true); });
    } else if (act === "su-copy") {
      var ev = currentEvent(); if (!ev) return; var txt = signupText(ev);
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Elenco copiato: incollalo nel gruppo WhatsApp"); }, function () { toast("Non riesco a copiare", true); });
    } else if (act === "su-csv") {
      var ev2 = currentEvent(); if (!ev2) return;
      var rows = [["Nome", "Email", "Turno", "Nota", "Data adesione"]].concat(EV.signups.filter(function (s) { return s.event_id === ev2.id; }).map(function (s) { return [s.full_name || "", s.email, s.slot || "", s.note || "", fmtDate(s.created_at)]; }));
      var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = "adesioni-" + slugify(ev2.title) + ".csv"; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
    } else if (act === "poster-del") {
      var ev3 = currentEvent(); if (!ev3) return;
      D.setPoster(ev3, null).then(function () { toast("Locandina tolta"); viewEditEvent(ev3.id); }).catch(function (x) { toast(x.message, true); });
    } else if (act === "ev-del") {
      var ev4 = currentEvent(); if (!ev4) return;
      if (!confirm("Eliminare «" + ev4.title + "»? Spariscono anche turni e adesioni. Non si può annullare.")) return;
      D.deleteEvent(ev4).then(function () { toast("Evento eliminato"); location.hash = "#g-eventi"; }).catch(function (x) { toast(x.message, true); });
    } else if (act === "rp-del") {
      if (!confirm("Eliminare questa replica?")) return;
      D.deleteReplay(id).then(function () { toast("Replica eliminata"); viewAdminEvents(); }).catch(function (x) { toast(x.message, true); });
    }
  });

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
        '<a class="stat" href="#g-eventi"><b>' + icon("evento") + "</b><span>Eventi, mobilitazione e repliche</span></a>" +
        '<a class="stat" href="#g-squadra"><b>' + icon("team") + "</b><span>Gestisci la squadra e i canali WhatsApp</span></a>" +
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

    if (act === "t-person-new") {
      var unit = b.getAttribute("data-unit");
      busy(b, true); D.savePerson({ unit_id: unit, full_name: "Nuova persona", role: "", position: 99 }).then(function () { viewEditTeam(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "t-person-del") {
      if (needsConfirm(b, "Conferma: togli")) return;
      var pd = T.people.filter(function (x) { return x.id === id; })[0];
      busy(b, true); D.deletePerson(pd).then(function () { toast("Persona tolta"); viewEditTeam(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "t-photo-del") {
      var ph = T.people.filter(function (x) { return x.id === id; })[0];
      busy(b, true); D.setPersonPhoto(ph, null).then(function () { toast("Foto tolta"); viewEditTeam(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "t-unit-del") {
      if (needsConfirm(b, "Conferma: elimina struttura e persone")) return;
      busy(b, true); D.deleteUnit(id).then(function () { toast("Struttura eliminata"); viewEditTeam(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
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
    if (!D.live && DEMO) document.getElementById("demo-bar").hidden = false;
    if (PREVIEW) { S.ready = true; renderNav = function () { nav.innerHTML = ""; }; viewWelcome(); return; }
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
