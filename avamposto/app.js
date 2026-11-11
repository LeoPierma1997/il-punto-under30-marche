/* Avamposto Under 30 – interfaccia. */
(function () {
  "use strict";
  var D = window.AvampostoData;
  var main = document.getElementById("main");
  var nav = document.getElementById("mast-nav");
  var toastEl = document.getElementById("toast");
  var DEMO = false;
  try {
    if (/[?&]demo=1\b/.test(location.search)) sessionStorage.setItem("avamposto-demo", "1");
    if (/[?&]demo=0\b/.test(location.search)) sessionStorage.removeItem("avamposto-demo");
    DEMO = sessionStorage.getItem("avamposto-demo") === "1";
  } catch (e) { DEMO = /[?&]demo=1\b/.test(location.search); }
  // Finché Supabase non è collegato, il pubblico vede solo l'anteprima: niente dati di esempio, niente iscrizioni finte.
  var PREVIEW = !D.live && !DEMO;

  var NO_PASS = { entry: false, courses: [], valid: [] };
  var S = { me: null, admin: false, pass: NO_PASS, inits: [], amats: [], views: {}, ready: false };
  var A = { codes: [] }; // dati di gestione

  /* ---------------- utilità ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ICONS = {
    voce: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
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
  // Dentro l'Avamposto si sta con un codice valido salvato sul telefono, oppure da staff (accesso con mail).
  function inside() { return S.admin || !!S.pass.entry; }
  function unlocked(it) { return (S.pass.courses || []).indexOf(it.id) >= 0; }
  function hasAccess(it) {
    if (S.admin) return true;
    if (!S.pass.entry || !it.published) return false;
    return it.access === "aperta" || unlocked(it);
  }
  function redirectUrl() { return location.origin + location.pathname + "#gestione"; }

  /* ---------------- dati ---------------- */
  function refresh() {
    S.me = D.me();
    var tasks = [
      D.initiatives().then(function (r) { S.inits = r || []; }),
      D.pass().then(function (p) { S.pass = p || NO_PASS; }).catch(function () { S.pass = NO_PASS; })
    ];
    if (S.me) tasks.push(D.isAdmin().then(function (a) { S.admin = !!a; })); else S.admin = false;
    return Promise.all(tasks).then(function () {
      if (!inside()) { S.amats = []; S.views = {}; return; }
      return Promise.all([
        (S.admin ? D.accessibleMaterials() : D.passMaterials()).then(function (r) { S.amats = r || []; }),
        D.myViews().then(function (r) { S.views = {}; (r || []).forEach(function (v) { S.views[v.material_id] = true; }); }),
        S.admin ? D.listCodes().then(function (r) { A.codes = r || []; }) : null
      ]);
    });
  }
  function reload() { return refresh().then(route).catch(function (e) { toast(e.message, true); route(); }); }

  /* ---------------- Voci Under 30 ---------------- */
  var VKIND = { riflessione: "Riflessione", commento: "Commento", nota: "Nota breve" };
  var VSTATUS = { pending: ["wait", "In attesa"], approved: ["ok", "Pubblicato"], rejected: ["no", "Non pubblicato"] };
  function voiceSignPreview(sig, name, city) {
    var n = String(name || "").replace(/\s*\(esempio\)\s*$/, "").trim(), parts = n.split(/\s+/);
    var who = sig === "anonimo" || !n ? "Un under 30 di Azione Marche" : sig === "completo" ? n : (parts.length > 1 ? parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + "." : parts[0]);
    return who + (city ? " · " + city : "");
  }
  function voiceSig(v) {
    if (v.signed_name) return v.signed_name + (v.city ? " · " + v.city : "");
    return voiceSignPreview(v.signature, v.author_name, v.city);
  }
  function viewVoice() {
    setMain('<p class="loading">Carico…</p>', "voce");
    D.myVoices().then(function (list) {
      var radio = function (n, val, label) {
        return '<label class="choice"><input type="radio" name="' + n + '" value="' + val + '"' + (val === "riflessione" ? " checked" : "") + "> <span>" + label + "</span></label>";
      };
      setMain(
        '<div class="page-head"><span class="eyebrow">Voci Under 30</span><h1>Di\' la tua</h1>' +
          "<p>Una riflessione, un commento a una notizia, una nota dopo un banchetto: scrivi quello che pensi. Lo staff legge tutto e pubblica sul sito i testi che rispettano lo spirito del gruppo: idee, rispetto, niente insulti. " +
          '<a href="../voci/">Leggi le voci pubblicate →</a></p></div>' +
        '<div class="voice-layout">' +
        '<form class="panel voice-form" data-form="voice" novalidate>' +
          "<h2>Scrivi</h2>" +
          '<fieldset class="field"><legend>Che cos\'è</legend><div class="choice-row">' +
            radio("kind", "riflessione", "Riflessione") + radio("kind", "commento", "Commento a una notizia") + radio("kind", "nota", "Nota breve") +
          "</div></fieldset>" +
          '<label class="field"><span>Titolo <small>(facoltativo)</small></span><input type="text" name="title" maxlength="120"></label>' +
          '<div class="grid-2"><label class="field"><span>A proposito di <small>(facoltativo)</small></span><input type="text" name="topic" maxlength="100" placeholder="Es. la manovra, il consiglio regionale"></label>' +
          '<label class="field"><span>Link alla notizia <small>(facoltativo)</small></span><input name="link_url" type="url" inputmode="url" placeholder="https://"></label></div>' +
          '<label class="field"><span>Il tuo testo</span><textarea name="body" rows="9" maxlength="2500" required placeholder="Scrivi qui. Bastano poche righe."></textarea><small class="counter" data-counter>0 / 2500</small></label>' +
          '<div class="grid-2"><label class="field"><span>Firma <small>(facoltativa)</small></span><input type="text" name="signed_name" maxlength="60" placeholder="Es. Giulia, oppure Giulia R."></label>' +
          '<label class="field"><span>Città <small>(facoltativa)</small></span><input type="text" name="city" maxlength="60"></label></div>' +
          '<p class="vi-sign" data-sign-preview>Comparirà firmato: <b>Un under 30 di Azione Marche</b></p>' +
          '<label class="check"><input type="checkbox" name="consent"> <span>Acconsento alla pubblicazione del testo sul sito di Azione Under 30 Marche con la firma che ho scritto (o senza firma). So che una firma può far capire chi sono e il mio orientamento politico. <a href="privacy.html" target="_blank">Privacy</a></span></label>' +
          '<div class="btn-row"><button class="btn primary" type="submit">' + icon("voce") + "Invia allo staff</button></div>" +
          '<p class="fine">Non ti chiediamo mail né account. Lo stato del testo lo vedi qui, solo da questo telefono.</p>' +
        "</form>" +
        '<section class="voice-mine"><h2>I tuoi testi</h2>' +
          (list.length ? list.map(function (x) {
            var st = VSTATUS[x.status] || VSTATUS.pending;
            return '<article class="voice-item"><div class="vi-head"><span class="pill ' + st[0] + '">' + st[1] + "</span><small>" + esc(VKIND[x.kind] || "") + " · " + esc(fmtShort(x.created_at)) + "</small></div>" +
              (x.title ? "<h3>" + esc(x.title) + "</h3>" : "") +
              "<p>" + esc(x.body.length > 220 ? x.body.slice(0, 217) + "…" : x.body) + "</p>" +
              (x.status === "rejected" && x.staff_note ? '<p class="vi-note">Nota dello staff: ' + esc(x.staff_note) + "</p>" : "") +
              '<div class="btn-row">' + (x.status === "approved" ? '<a class="btn small quiet" href="../voci/#v-' + esc(x.id) + '">Vedi sul sito</a>' : "") +
              '<button class="btn small danger" type="button" data-action="voice-del" data-id="' + esc(x.id) + '">' + (x.status === "approved" ? "Ritira dal sito" : "Ritira") + "</button></div></article>";
          }).join("") : '<p class="empty-note">Non hai ancora scritto nulla da questo telefono. Il primo testo è sempre il più difficile: prova con una nota breve.</p>') +
          (list.some(function (x) { return x.status === "rejected"; }) ? '<p class="fine">Per correggere un testo non pubblicato, ritiralo e mandane uno nuovo.</p>' : "") +
        "</section></div>", "voce");
      var ta = main.querySelector("textarea[name=body]"), ct = main.querySelector("[data-counter]");
      var upd = function () { var n = ta.value.length; ct.textContent = n + " / 2500" + (n && n < 20 ? " · almeno 20" : ""); };
      ta.addEventListener("input", upd); upd();
      var sn = main.querySelector("input[name=signed_name]"), cy = main.querySelector("input[name=city]"), pv = main.querySelector("[data-sign-preview] b");
      var sig = function () { pv.textContent = voiceSig({ signed_name: sn.value.trim(), city: cy.value.trim(), signature: "anonimo" }); };
      sn.addEventListener("input", sig); cy.addEventListener("input", sig);
    }).catch(function (x) { setMain('<p class="form-msg err">' + esc(x.message) + "</p>", "voce"); });
  }

  function viewAdminVoices() {
    setMain('<p class="loading">Carico…</p>', "gestione");
    D.allVoices().then(function (all) {
      var pend = all.filter(function (v) { return v.status === "pending"; });
      var pub = all.filter(function (v) { return v.status === "approved"; }).sort(function (a, b) { return a.published_at < b.published_at ? 1 : -1; });
      var rej = all.filter(function (v) { return v.status === "rejected"; });
      var card = function (v) {
        return '<article class="panel voice-mod" id="vm-' + esc(v.id) + '">' +
          '<div class="vi-head"><span class="pill wait">' + esc(VKIND[v.kind] || "") + "</span><small>Inviato il " + esc(fmtDate(v.created_at)) + (v.user_id || v.signed_name ? " da <b>" + esc(v.signed_name || v.author_name || "—") + "</b>" : " senza firma") + "</small></div>" +
          (v.title ? "<h3>" + esc(v.title) + "</h3>" : "") +
          (v.topic || v.link_url ? '<p class="vi-topic">A proposito di: ' + esc(v.topic || "") + (safeHref(v.link_url) ? ' <a href="' + esc(safeHref(v.link_url)) + '" target="_blank" rel="noopener">link</a>' : "") + "</p>" : "") +
          '<label class="field"><span>Testo <small>(puoi correggere refusi prima di pubblicare)</small></span><textarea name="body" rows="7" maxlength="2500">' + esc(v.body) + "</textarea></label>" +
          '<p class="vi-sign">Comparirà firmato: <b>' + esc(voiceSig(v)) + "</b></p>" +
          '<label class="field"><span>Nota per chi ha scritto <small>(se non lo pubblichi)</small></span><input type="text" name="note" maxlength="500" placeholder="Es. troppo personale verso una persona: prova a parlare delle idee"></label>' +
          '<div class="btn-row"><button class="btn primary small" type="button" data-action="voice-ok" data-id="' + esc(v.id) + '">' + icon("check") + "Pubblica</button>" +
          '<button class="btn small quiet" type="button" data-action="voice-no" data-id="' + esc(v.id) + '">Non pubblicare</button></div></article>';
      };
      setMain(
        '<p><a class="back" href="#gestione">← Gestione</a></p>' +
        '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Voci Under 30</h1><p>I testi mandati dall\'Avamposto arrivano qui, senza nome né mail (solo la firma, se l\'hanno scritta). Si pubblicano sul sito solo quando li approvi; chi scrive vede lo stato e la tua eventuale nota dal suo telefono. <a href="../voci/">Vedi la pagina pubblica →</a></p></div>' +
        '<div id="ev-admin">' +
        '<section><div class="block-head"><h2>Da leggere</h2><span class="note">' + pend.length + (pend.length === 1 ? " testo" : " testi") + "</span></div>" +
          (pend.length ? '<div class="voice-queue">' + pend.map(card).join("") + "</div>" : '<p class="empty-note">Niente in attesa. Ottimo lavoro.</p>') + "</section>" +
        '<section><div class="block-head"><h2>Pubblicate</h2><span class="note">' + pub.length + "</span></div>" +
          (pub.length ? '<div class="table-wrap"><table><thead><tr><th>Testo</th><th>Firma</th><th>Pubblicata</th><th></th></tr></thead><tbody>' + pub.map(function (v) {
            return "<tr><td>" + esc(v.title || (v.body.length > 70 ? v.body.slice(0, 67) + "…" : v.body)) + "</td><td>" + esc(voiceSig(v)) + '</td><td class="num">' + esc(fmtShort(v.published_at)) + "</td>" +
              '<td><button class="btn small quiet" type="button" data-action="voice-hide" data-id="' + esc(v.id) + '">Togli dal sito</button></td></tr>';
          }).join("") + "</tbody></table></div>" : '<p class="empty-note">Ancora nessuna voce pubblicata.</p>') + "</section>" +
        (rej.length ? '<details class="panel rp-edit"><summary><span><b>Non pubblicate</b><small>' + rej.length + " testi</small></span><span class=\"btn small\">Mostra</span></summary>" +
          '<div style="padding:14px 18px;display:grid;gap:10px">' + rej.map(function (v) {
            return '<div class="vi-row"><span>' + esc(v.title || v.body.slice(0, 80)) + "<small>" + esc(v.signed_name || v.author_name || "senza firma") + (v.staff_note ? " · nota: " + esc(v.staff_note) : "") + '</small></span><button class="btn small quiet" type="button" data-action="voice-ok" data-id="' + esc(v.id) + '">Pubblica</button></div>';
          }).join("") + "</div></details>" : "") +
        "</div>", "gestione");
    }).catch(function (x) { setMain('<p class="form-msg err">' + esc(x.message) + "</p>", "gestione"); });
  }

  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f.getAttribute || f.getAttribute("data-form") !== "voice") return;
    e.preventDefault();
    var val = function (n) { var el = f.elements[n]; return el ? String(el.value || "").trim() : ""; };
    var pick = function (n) { var c = f.querySelector("input[name=" + n + "]:checked"); return c ? c.value : ""; };
    if (val("body").length < 20) { toast("Scrivi almeno 20 caratteri.", true); return; }
    if (!f.elements.consent.checked) { toast("Per inviare serve il consenso alla pubblicazione.", true); return; }
    var btn = f.querySelector("button[type=submit]"); busy(btn, true);
    D.saveVoice({ kind: pick("kind") || "riflessione", signed_name: val("signed_name"),
      title: val("title"), topic: val("topic"), link_url: val("link_url"), body: val("body"), city: val("city") })
      .then(function () { toast("Inviato! Lo staff lo leggerà presto: trovi lo stato qui sotto."); if (location.hash === "#voce") viewVoice(); else location.hash = "#voce"; })
      .catch(function (x) { toast(x.message, true); busy(btn, false); });
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action^='voice-']"); if (!b) return;
    var act = b.getAttribute("data-action"), id = b.getAttribute("data-id");
    if (act === "voice-del") {
      if (b.getAttribute("data-sure") !== "1") { b.setAttribute("data-sure", "1"); b.textContent = "Sicuro? Tocca di nuovo"; return; }
      busy(b, true); D.deleteVoice(id).then(function () { toast("Testo ritirato."); viewVoice(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    var box = document.getElementById("vm-" + id);
    var patch;
    if (act === "voice-ok") { patch = { status: "approved", staff_note: null }; if (box) patch.body = box.querySelector("textarea[name=body]").value.trim(); }
    if (act === "voice-no") { patch = { status: "rejected", staff_note: box ? box.querySelector("input[name=note]").value.trim() || null : null }; }
    if (act === "voice-hide") { patch = { status: "rejected", staff_note: "Tolta dal sito dallo staff." }; }
    if (!patch) return;
    if (patch.body !== undefined && patch.body.length < 20) { toast("Il testo deve avere almeno 20 caratteri.", true); return; }
    busy(b, true);
    D.moderateVoice(id, patch).then(function () { toast(act === "voice-ok" ? "Pubblicata sul sito." : "Fatto."); viewAdminVoices(); })
      .catch(function (x) { toast(x.message, true); busy(b, false); });
  });

  /* nella tessera di Gestione mostra quante voci aspettano */
  var viewAdminBase = viewAdmin;
  viewAdmin = function () {
    viewAdminBase();
    D.allVoices().then(function (all) {
      var n = all.filter(function (v) { return v.status === "pending"; }).length, t = document.getElementById("stat-voci");
      if (t && n) { t.classList.add("alert"); t.querySelector("b").textContent = n; }
    }).catch(function () {});
  };

  /* ---------------- menu ---------------- */
  function renderNav(active) {
    var a = function (h, k, label) { return '<a href="#' + h + '"' + (active === k ? ' aria-current="page"' : "") + ">" + label + "</a>"; };
    if (!inside()) { nav.innerHTML = a("home", "home", "Entra"); return; }
    nav.innerHTML = a("home", "home", "Corsi") + a("agenda", "agenda", "Agenda") + a("voce", "voce", "La tua voce") + a("squadra", "squadra", "La squadra") +
      a("dispositivo", "dispositivo", S.admin && !S.pass.entry ? "Esci" : "Il tuo telefono") +
      (S.admin ? '<a class="staff" href="#gestione"' + (active === "gestione" ? ' aria-current="page"' : "") + ">" + icon("shield") + "Gestione</a>" : "");
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
    if (h === "staff") return S.admin ? go("#gestione") : viewStaffLogin();
    if (!inside()) {
      if (/^(agenda|repliche|mobilitazione|m-|voce|squadra)/.test(h)) { try { localStorage.setItem(AFTER_KEY, h); } catch (e) {} }
      if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
      return viewWelcome();
    }
    var after = ""; try { after = localStorage.getItem(AFTER_KEY) || ""; localStorage.removeItem(AFTER_KEY); } catch (e) {}
    if (after && after !== h && (h === "home" || h === "")) { location.hash = "#" + after; return; }
    if (h === "dispositivo" || h === "profilo") return viewDevice();
    if (h === "squadra") return viewTeam();
    if (h === "voce" || h.indexOf("voce-") === 0) return viewVoice();
    if (h === "agenda" || h === "mobilitazione") return viewAgenda(h === "mobilitazione" ? "mobilitazione" : "");
    if (h === "repliche") return viewAgenda("repliche");
    if (h.indexOf("m-") === 0) return viewAgenda(h);
    if (h.indexOf("i-") === 0) return viewInitiative(h.slice(2));
    if (S.admin) {
      if (h === "gestione") return viewAdmin();
      if (h === "g-codici") return viewCodes();
      if (h === "g-numeri") return viewNumbers();
      if (h === "g-nuova") return viewEditInitiative(null);
      if (h === "g-squadra") return viewEditTeam();
      if (h === "g-eventi") return viewAdminEvents();
      if (h === "g-voci") return viewAdminVoices();
      if (h.indexOf("g-ev-") === 0) return viewEditEvent(h.slice(5));
      if (h.indexOf("g-") === 0) return viewEditInitiative(h.slice(2));
    }
    return viewHome();
  }

  /* ---------------- schede iniziativa ---------------- */
  function statusPill(it) {
    if (!it.published) return '<span class="pill draft">Bozza</span>';
    if (it.access === "aperta") return '<span class="pill open">Aperto a tutti</span>';
    if (unlocked(it)) return '<span class="pill ok">' + icon("check") + "Sbloccato</span>";
    return '<span class="pill lock">' + icon("lock") + "Con codice del corso</span>";
  }
  function actionFor(it) {
    if (!inside()) return '<a class="btn small" href="#home" data-action="focus-code">Entra con il codice</a>';
    if (hasAccess(it)) return '<a class="btn small primary" href="#i-' + esc(it.slug) + '">Apri</a>';
    return '<button class="btn small" type="button" data-action="focus-course-code">Ho il codice</button>';
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
  function codeForm(id, label, button, hint) {
    return '<form class="code-form" data-form="code" id="' + id + '" novalidate>' +
      '<label class="field" for="' + id + '-in"><span>' + label + '</span><input type="text" id="' + id + '-in" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + esc(hint || "Es. AVAMPOSTO-2027") + '" maxlength="40"></label>' +
      '<p class="form-msg err" hidden></p>' +
      '<button class="btn primary" type="submit">' + icon("check") + esc(button) + "</button></form>";
  }
  function viewWelcome() {
    var catalog = PREVIEW ? [] : S.inits.filter(function (i) { return i.published; });
    setMain(
      '<section class="ava-hero"><div class="ava-hero-bg" aria-hidden="true"><img src="../assets/foto/evento-roma-platea.jpg" alt=""></div>' +
        '<div class="wrap ava-hero-in">' +
          '<div class="hero-copy">' +
            '<span class="eyebrow">Avamposto Under 30 · Marche</span>' +
            "<h1>Qui si impara a <em>fare politica.</em></h1>" +
            "<p>Corsi pratici, dirette con ospiti e materiali che non trovi altrove, per chi gira intorno ad Azione Under 30 Marche: tesserati, simpatizzanti, curiosi. Si entra con un codice: niente iscrizione, niente mail, niente password.</p>" +
            '<ul class="points">' +
              "<li>" + icon("corso") + "<span><b>Corsi</b> con video, slide ed esercitazioni</span></li>" +
              "<li>" + icon("diretta") + "<span><b>Dirette su Meet</b> con ospiti e domande dal vivo</span></li>" +
              "<li>" + icon("users") + "<span><b>«Ci sono»</b> per dare una mano ai banchetti e agli eventi</span></li>" +
            "</ul>" +
          "</div>" +
          (PREVIEW ? '<div class="panel soon-panel"><span class="eyebrow">In arrivo</span><h2>L\'Avamposto apre a breve</h2>' +
              "<p>Stiamo preparando i primi percorsi. Iscriviti alla newsletter o seguici su Instagram: ti avvisiamo appena si parte.</p>" +
              '<div class="btn-row"><a class="btn primary" href="../#unisciti">Avvisami</a><a class="btn quiet" href="https://www.instagram.com/azioneunder30marche/" target="_blank" rel="noopener">Instagram</a></div></div>'
            : '<div class="panel door" id="auth-panel"><span class="eyebrow">Entra</span><h2>Hai il codice?</h2>' +
              codeForm("door", "Codice dell'Avamposto", "Entra") +
              '<p class="fine">Il codice te lo dà chi ti ha parlato dell\'Avamposto, oppure scrivici su <a href="https://www.instagram.com/azioneunder30marche/" target="_blank" rel="noopener">Instagram</a> o a <a href="mailto:azioneunder30marche@gmail.com">azioneunder30marche@gmail.com</a>. ' +
              'Resta salvato su questo telefono: la prossima volta entri direttamente.</p>' +
              '<p class="tester-link"><a href="#staff">Sei dello staff? Accedi con la mail</a></p></div>') +
        "</div></section>" +
      '<div class="wrap page"><section class="block"><div class="block-head"><h2>Cosa trovi dentro</h2><span class="note">Alcuni corsi chiedono un secondo codice, che lo staff dà a chi partecipa.</span></div>' +
      (catalog.length ? '<div class="inits">' + catalog.map(initCard).join("") + "</div>" : '<p class="empty soon">Presto ci saranno nuove iniziative per i corsi.</p>') +
      "</section></div>", "home", true);
  }
  function viewStaffLogin() {
    setMain(
      '<a class="back" href="#home">← Avamposto</a>' +
      '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Accesso staff</h1><p>Solo per chi gestisce l\'Avamposto. Ti mandiamo un link per entrare: niente password.</p></div>' +
      '<div class="panel" id="auth-panel" style="max-width:520px">' +
        '<form id="f-signin" novalidate>' +
          '<label class="field" for="si-email"><span>Mail dello staff</span><input type="email" id="si-email" autocomplete="email" inputmode="email" required></label>' +
          '<p class="form-msg err" id="si-err" hidden></p>' +
          '<button class="btn primary" type="submit">' + icon("mail") + "Mandami il link per entrare</button>" +
        "</form>" +
        '<div class="sent" id="sent" hidden></div>' +
      "</div>", "home");
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
    document.getElementById("f-signin").hidden = true;
    var box = document.getElementById("sent");
    box.innerHTML = icon("mail") + "<h3>Controlla la posta</h3>" +
      "<p>Abbiamo mandato un link a <b>" + esc(mail) + "</b>. Aprilo per entrare: vale per un'ora. Se non lo trovi, guarda nello spam.</p>" +
      (D.live ? "" : '<p class="form-msg ok">Nel prototipo nessuna mail parte davvero.</p><button class="btn primary" type="button" data-action="demo-open" data-email="' + esc(mail) + '">Apri il link di prova</button>') +
      '<button class="btn quiet small" type="button" data-action="auth-again">Usa un\'altra mail</button>';
    box.hidden = false;
  }
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f.getAttribute || f.getAttribute("data-form") !== "code") return;
    e.preventDefault();
    var input = f.elements.code, err = f.querySelector(".form-msg"), btn = f.querySelector("button[type=submit]");
    if (!input.value.trim()) { err.textContent = "Scrivi il codice."; err.hidden = false; input.focus(); return; }
    var before = S.pass.entry, courses = (S.pass.courses || []).slice();
    err.hidden = true; busy(btn, true);
    D.addCode(input.value).then(function () { return refresh(); }).then(function () {
      var fresh = S.inits.filter(function (i) { return unlocked(i) && courses.indexOf(i.id) < 0; });
      if (!before) { D.hit("ingresso", "avamposto"); toast("Benvenuto nell'Avamposto"); }
      else toast(fresh.length ? "Sbloccato: " + fresh.map(function (i) { return i.title; }).join(", ") : "Codice salvato");
      if (fresh.length === 1 && before) location.hash = "#i-" + fresh[0].slug; else if (location.hash === "#home" || !location.hash) route(); else location.hash = "#home";
    }).catch(function (x) { err.textContent = x.message; err.hidden = false; busy(btn, false); });
  });

  /* ---------------- area di chi entra ---------------- */
  function viewHome() {
    var visible = S.inits.filter(function (i) { return i.published; });
    var mine = visible.filter(hasAccess);
    var others = visible.filter(function (i) { return mine.indexOf(i) < 0; });
    var unseen = mine.reduce(function (n, it) { return n + progressOf(it).unseen; }, 0);
    setMain(
      '<div class="page-head"><span class="eyebrow">Avamposto Under 30</span><h1>Bentornato nell\'Avamposto</h1><p>' +
        (unseen ? "Hai <b>" + unseen + (unseen === 1 ? " materiale nuovo" : " materiali nuovi") + "</b> da vedere nei tuoi corsi." : mine.length ? "Sei in pari con tutti i tuoi corsi." : "Qui trovi corsi, dirette e materiali.") + "</p></div>" +
      nextLiveCard() +
      (!visible.length ? '<p class="empty soon">Presto ci saranno nuove iniziative per i corsi.</p>' : "") +
      (visible.length ? '<section class="block"><div class="block-head"><h2>I tuoi corsi</h2></div>' +
        (mine.length ? '<div class="inits">' + mine.map(initCard).join("") + "</div>" : '<p class="empty">Non ci sono ancora corsi aperti a tutti. Se hai il codice di un corso, inseriscilo qui sotto.</p>') +
      "</section>" : "") +
      (others.length ? '<section class="block" id="altri-corsi"><div class="block-head"><h2>Corsi con codice</h2><span class="note">Lo staff dà il codice a chi partecipa al corso.</span></div>' +
        '<div class="inits">' + others.map(initCard).join("") + "</div>" +
        '<div class="panel course-code">' + codeForm("course-code", "Hai il codice di un corso?", "Sblocca", "Es. EUROPA-4K7PQ") + "</div>" +
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

  function viewDevice() {
    var codes = D.codes(), staffOnly = S.admin && !S.pass.entry;
    var whatOpens = function (c) {
      if (S.admin) return "";
      var its = S.inits.filter(function (i) { return unlocked(i); });
      return its.length ? "Corsi sbloccati: " + its.map(function (i) { return esc(i.title); }).join(", ") + "." : "";
    };
    setMain(
      '<div class="page-head"><span class="eyebrow">Avamposto Under 30</span><h1>' + (staffOnly ? "Il tuo accesso" : "Il tuo telefono") + "</h1>" +
        "<p>Nell'Avamposto non hai un account: quello che serve resta su questo telefono, e lo puoi cancellare quando vuoi.</p></div>" +
      (codes.length ? '<section class="panel" style="max-width:640px"><h2>Codici salvati</h2>' +
        '<ul class="code-list">' + codes.map(function (c) { return "<li><code>" + esc(c) + "</code></li>"; }).join("") + "</ul>" +
        (whatOpens() ? '<p class="note">' + whatOpens() + "</p>" : "") +
        codeForm("device-code", "Aggiungi il codice di un corso", "Aggiungi", "Es. EUROPA-4K7PQ") + "</section>" : "") +
      '<section class="panel privacy-panel" style="max-width:640px;margin-top:22px"><h2>Cosa resta su questo telefono</h2>' +
        "<ul class=\"plain\"><li>i codici che hai inserito;</li><li>i materiali che hai segnato come visti;</li><li>gli appuntamenti a cui hai detto «Ci sono»;</li><li>il riferimento ai testi che hai mandato in «La tua voce», per vederne lo stato.</li></ul>" +
        "<p>Allo staff arrivano solo numeri complessivi (quante persone sono entrate, quanti «Ci sono» per turno), mai chi sei. I testi di «La tua voce» arrivano con la firma che scrivi tu, se la scrivi. <a href=\"privacy.html\">Informativa privacy</a></p>" +
        (codes.length ? '<div class="btn-row"><button class="btn danger" type="button" data-action="forget-device">' + icon("trash") + "Dimentica tutto su questo telefono</button></div>" +
          '<div id="forget-confirm" hidden><p class="form-msg err" style="margin-top:14px">Confermi? Per rientrare ti servirà di nuovo il codice. I testi già mandati restano allo staff: se vuoi ritirarli, fallo prima da «La tua voce».</p>' +
          '<div class="btn-row"><button class="btn danger" type="button" data-action="forget-yes">Sì, dimentica</button><button class="btn quiet" type="button" data-action="forget-no">Annulla</button></div></div>' : "") +
      "</section>" +
      (S.me ? '<section class="panel" style="max-width:640px;margin-top:22px"><h2>Staff</h2><p>Sei entrato come <b>' + esc(S.me.email) + "</b>.</p>" +
        '<div class="btn-row"><button class="btn quiet" type="button" data-action="signout">Esci dall\'area staff</button></div></section>' : ""),
      "dispositivo");
  }

  function viewInitiative(slug) {
    var it = initBySlug(slug);
    if (!it) { setMain('<a class="back" href="#home">← Torna ai percorsi</a><p class="empty">Questa iniziativa non esiste o non è più disponibile.</p>', "home"); return; }
    var access = hasAccess(it);
    var pr = access ? progressOf(it) : { total: 0 };
    setMain(
      '<a class="back" href="#home">← ' + (inside() ? "I tuoi corsi" : "Avamposto") + "</a>" +
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
        '<div class="panel course-code">' + (inside() ? '<p class="note">' + icon("lock") + " I materiali di questo corso si aprono con il codice del corso, che lo staff dà a chi partecipa.</p>" + codeForm("course-code", "Codice del corso", "Sblocca", "Es. EUROPA-4K7PQ")
          : '<p class="note">' + icon("lock") + " Per vedere i materiali entra nell'Avamposto con il codice.</p>" + codeForm("door", "Codice dell'Avamposto", "Entra")) + "</div>"),
      "home");
    if (access && !S.admin) D.hit("apertura", it.id);
    var load = S.admin ? D.materials(it.id) : Promise.resolve(S.amats.filter(function (m) { return m.initiative_id === it.id; }));
    if (access) load.then(function (list) {
      var box = document.getElementById("mats"); if (!box) return;
      box.innerHTML = list.length ? list.map(function (m, i) { return materialCard(m, i + 1); }).join("") : '<p class="empty">Lo staff non ha ancora pubblicato materiali. Torna presto.</p>';
    }).catch(function (e) { var box = document.getElementById("mats"); if (box) box.innerHTML = '<p class="form-msg err">' + esc(e.message) + "</p>"; });
  }

  /* Il player esterno (YouTube, Vimeo, Drive) si carica solo quando la persona preme «Guarda»:
     prima del clic nessun dato parte verso quei servizi. */
  function videoHost(u) { return /youtube/.test(u) ? "YouTube" : /vimeo/.test(u) ? "Vimeo" : /google/.test(u) ? "Google Drive" : "il servizio video"; }
  function videoFrame(em, title) {
    return '<div class="video video-gate"><button type="button" data-action="play-video" data-src="' + esc(em) + '" data-title="' + esc(title) + '">' +
      '<span class="vg-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>' +
      '<span class="vg-txt"><b>Guarda il video</b><small>Si apre il player di ' + esc(videoHost(em)) + ", che può usare cookie propri.</small></span></button></div>";
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
      c = em ? videoFrame(em, m.title)
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
    var seenBtn = inside() ? '<button class="seen-btn" type="button" data-action="seen" data-mid="' + esc(m.id) + '" aria-pressed="' + seen + '">' +
      (seen ? icon("check") + "Visto" : "Segna come visto") + "</button>" : "";
    return '<article class="mat' + (seen ? " seen" : "") + '" data-mid="' + esc(m.id) + '"><div class="mat-ico">' + (seen ? icon("check") : icon(m.kind)) + "</div>" +
      '<div class="mat-kind">' + (n ? '<span class="mat-num">' + n + "</span>" : "") + esc(MAT[m.kind] || "") + (m.published === false ? ' <span class="pill draft">Nascosto</span>' : "") + seenBtn + "</div>" +
      "<h3>" + esc(m.title) + "</h3>" +
      '<div class="mat-content">' + (m.kind === "testo" ? body : c + body) + "</div></article>";
  }


  /* ---------------- la squadra ---------------- */
  var T = { units: [], people: [], photos: {} };
  function loadTeam() {
    var get = S.admin ? Promise.all([D.orgUnits(), D.orgPeople()]) : D.passTeam().then(function (t) { return [t && t.units, t && t.people]; });
    return get.then(function (r) {
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
        (unitVisible(u) ? "" : '<p class="vacant">Nascosta nell\'Avamposto finché non aggiungi una persona o un link WhatsApp.</p>') + '<div class="grid-2">' +
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
      '<p>Modifica strutture, persone, foto e link dei canali WhatsApp. La pagina «La squadra» la vede solo chi entra nell\'Avamposto con il codice. <a href="#squadra">Vedi come la vedono →</a></p></div>' +
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
  var EV = { events: [], mob: {}, mine: {}, replays: [], hands: [], counts: {} };
  var EKIND = { incontro: "Incontro", aperitivo: "Aperitivo", mobilitazione: "Mobilitazione", diretta: "Diretta", formazione: "Formazione" };
  var EAREA = { marche: "Tutta la regione", pu: "Pesaro-Urbino", an: "Ancona", mc: "Macerata", fm: "Fermo", ap: "Ascoli Piceno", online: "Online", fuori: "Fuori regione" };
  var AFTER_KEY = "avamposto-dopo";
  function evEnd(ev) { return new Date(ev.ends_at || new Date(new Date(ev.starts_at).getTime() + 2 * 3600000)); }
  function evPast(ev) { return evEnd(ev).getTime() < Date.now(); }
  function evWhere(ev) { return [ev.place, ev.city].filter(Boolean).join(" · "); }
  function slotsOf(ev) { var m = EV.mob[ev.id]; return m && m.slots ? m.slots.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean) : []; }
  function loadAgenda(withAdmin) {
    var jobs = [D.events(), S.admin ? D.mobilization() : D.passMobilization(), D.mySignups(), S.admin ? D.replays() : D.passReplays(),
      D.signupCounts().catch(function () { return []; })];
    if (withAdmin) jobs.push(D.counts().then(function (r) { return (r || []).filter(function (c) { return c.kind === "cisono"; }); }));
    return Promise.all(jobs).then(function (r) {
      EV.events = r[0] || [];
      EV.mob = {}; (r[1] || []).forEach(function (m) { EV.mob[m.event_id] = m; });
      EV.mine = {}; (r[2] || []).forEach(function (x) { EV.mine[x.event_id] = x; });
      EV.replays = r[3] || [];
      EV.counts = {}; (r[4] || []).forEach(function (c) { EV.counts[c.event_id] = Number(c.n) || 0; });
      EV.hands = r[5] || [];
    });
  }
  function posterSrc(ev) { return ev && ev.poster_path ? D.posterUrl(ev.poster_path) : ""; }
  function handsCard(ev) {
    var m = EV.mob[ev.id] || {}, mine = EV.mine[ev.id], slots = slotsOf(ev), n = EV.counts[ev.id] || 0, id = esc(ev.id), src = posterSrc(ev);
    var kit = safeHref(m.kit_url), wa = mine && safeHref(mine.wa);
    return '<article class="hands" id="m-' + id + '">' +
      '<div class="hands-poster">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : icon("evento")) + "</div>" +
      '<div class="hands-body"><div class="hands-top"><span class="pill hands-pill">Serve una mano</span>' + (n ? '<span class="hands-n">' + n + (n === 1 ? " c'è già" : " ci sono già") + "</span>" : "") + "</div>" +
      "<h3>" + esc(ev.title) + "</h3>" +
      '<p class="live-when">' + esc(fmtWhen(ev.starts_at)) + (evWhere(ev) ? " · " + esc(evWhere(ev)) : "") + "</p>" +
      (ev.summary ? "<p>" + esc(ev.summary) + "</p>" : "") +
      (m.meeting_point || m.notes ? '<ul class="hands-info">' + (m.meeting_point ? "<li><b>Ritrovo</b>" + esc(m.meeting_point) + "</li>" : "") + (m.notes ? "<li><b>Da sapere</b>" + esc(m.notes) + "</li>" : "") + "</ul>" : "") +
      (mine
        ? '<div class="hands-yes">' + icon("check") + "<div><b>Ci sei" + (mine.slot ? ": turno " + esc(mine.slot) : "") + "</b><span>" +
            (wa ? "Grazie! Entra nel gruppo WhatsApp dell'evento: lì vi organizzate e lo staff dà gli ultimi dettagli." : "Grazie! Gli ultimi dettagli arrivano nei canali WhatsApp della tua zona.") + "</span></div></div>" +
          '<div class="btn-row">' + waButton(wa, "Gruppo WhatsApp dell'evento") + (kit ? '<a class="btn small" href="' + esc(kit) + '" target="_blank" rel="noopener">' + icon("download") + "Kit del volontario</a>" : "") +
          '<a class="btn small quiet" href="' + esc(evGcal(ev)) + '" target="_blank" rel="noopener">Aggiungi al calendario</a>' +
          '<button class="btn small quiet" type="button" data-action="su-cancel" data-id="' + id + '">Non posso più</button></div>'
        : '<form class="hands-form" data-form="signup" data-id="' + id + '" novalidate>' +
          (slots.length ? '<fieldset class="slots"><legend>Scegli il turno</legend>' + slots.map(function (s, i) {
            return '<label class="slot"><input type="radio" name="slot" value="' + esc(s) + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(s) + "</span></label>";
          }).join("") + "</fieldset>" : "") +
          '<div class="btn-row"><button class="btn primary" type="submit">' + icon("check") + "Ci sono</button>" +
          (kit ? '<a class="btn small quiet" href="' + esc(kit) + '" target="_blank" rel="noopener">Guarda il kit</a>' : "") + "</div>" +
          '<p class="fine">Non ti chiediamo il nome: contiamo solo quante persone ci sono per turno. Dopo il «Ci sono» trovi il link al gruppo WhatsApp dell\'evento.</p></form>') +
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
    var poster = ev ? posterSrc(ev) : "";
    var media = em ? videoFrame(em, r.title)
      : href ? '<a class="rp-ph" href="' + esc(href) + '" target="_blank" rel="noopener">' + (poster ? '<img src="' + esc(poster) + '" alt="">' : "") + '<span class="vg-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span><b>Guarda la replica ↗</b></a>'
      : '<div class="rp-ph">' + (poster ? '<img src="' + esc(poster) + '" alt="">' : "") + "<b>Video di esempio</b><small>Qui comparirà la registrazione</small></div>";
    return '<article class="rp-card" id="r-' + esc(r.id) + '">' + media +
      '<div class="rp-body"><span class="rp-date">' + esc(dd) + (r.published === false ? ' <span class="pill draft">Nascosta</span>' : "") + "</span>" +
      "<h3>" + esc(r.title) + "</h3>" +
      (r.description ? "<p>" + esc(r.description) + "</p>" : "") +
      (ev ? '<a class="rp-ev" href="../eventi/#evento-' + esc(ev.id) + '">' + icon("evento") + esc(ev.title) + "</a>" : "") +
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
          (EV.replays.length ? '<div class="rp-grid">' + EV.replays.map(replayCard).join("") + "</div>" : '<p class="empty">Ancora nessuna replica. Le registrazioni arriveranno qui dopo le dirette.</p>') +
        "</section>";
      var target = focus && document.getElementById(focus);
      if (target) { target.scrollIntoView({ block: "start" }); target.classList.add("flash"); }
    }).catch(function (e) { var box = document.getElementById("agenda"); if (box) box.innerHTML = '<p class="form-msg err">' + esc(e.message) + "</p>"; });
  }

  /* gestione eventi */
  function viewAdminEvents() {
    setMain('<a class="back" href="#gestione">← Gestione</a><div class="page-head"><span class="eyebrow">Area staff</span><h1>Eventi, mobilitazione e repliche</h1>' +
      '<p>Gli eventi pubblicati compaiono nella <a href="../eventi/">pagina Eventi</a>, visibile a tutti. Turni, kit e gruppo WhatsApp restano nell\'Avamposto, come le repliche.</p></div>' +
      '<div id="ev-admin"><p class="loading">Caricamento…</p></div>', "gestione");
    loadAgenda(true).then(function () {
      var box = document.getElementById("ev-admin"); if (!box) return;
      var up = EV.events.filter(function (e) { return !evPast(e); }), past = EV.events.filter(evPast).reverse();
      var row = function (ev) {
        var n = handsOf(ev).total;
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
    var head = r ? '<summary><span><b>' + esc(r.title) + "</b><small>" + esc(r.recorded_on ? fmtDate(r.recorded_on) : "") + (r.published === false ? " · nascosta" : "") + (r.video_url ? "" : " · manca il link") + '</small></span><span class="btn small">Modifica</span></summary>' : "";
    return (r ? '<details class="panel rp-edit">' + head : '<section class="panel">') + '<form data-form="replay" data-id="' + (r ? id : "") + '" novalidate>' + (r ? "" : "<h3>Nuova replica</h3>") + '<div class="grid-2">' +
      '<label class="field" for="rt-' + id + '"><span>Titolo</span><input type="text" id="rt-' + id + '" name="title" value="' + esc(x.title) + '"></label>' +
      '<label class="field" for="rv-' + id + '"><span>Link al video</span><input type="url" id="rv-' + id + '" name="video_url" placeholder="https://youtu.be/…" value="' + esc(x.video_url) + '"></label>' +
      '<label class="field" for="rd-' + id + '"><span>Registrata il</span><input type="date" id="rd-' + id + '" name="recorded_on" value="' + esc(x.recorded_on || "") + '"></label>' +
      '<label class="field" for="re-' + id + '"><span>Evento collegato</span><select id="re-' + id + '" name="event_id">' + eventOptions(x.event_id) + "</select></label>" +
      '<label class="field" for="rs-' + id + '" style="grid-column:1/-1"><span>Descrizione breve</span><input type="text" id="rs-' + id + '" name="description" value="' + esc(x.description || "") + '"></label>' +
      '</div><label class="check" for="rp-' + id + '"><input type="checkbox" id="rp-' + id + '" name="published"' + (x.published !== false ? " checked" : "") + "> <span><b>Pubblicata</b> nell'Avamposto</span></label>" +
      '<div class="btn-row"><button class="btn small primary" type="submit">' + (r ? "Salva" : "Aggiungi replica") + "</button>" +
      (r ? '<button class="btn small danger" type="button" data-action="rp-del" data-id="' + id + '">' + icon("trash") + "Elimina</button>" : "") + "</div></form>" + (r ? "</details>" : "</section>");
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
      var hs = ev ? handsOf(ev) : { total: 0, by: {} };
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
          '<label class="field" for="ev-wa" style="grid-column:1/-1"><span>Link al gruppo WhatsApp dell\'evento <small>(compare dopo «Ci sono»)</small></span><input type="url" id="ev-wa" name="whatsapp_url" placeholder="https://chat.whatsapp.com/…" value="' + esc(m.whatsapp_url || "") + '"></label>' +
          "</div><small class=\"note\">Turni, ritrovo, kit e gruppo WhatsApp li vede solo chi entra nell'Avamposto con il codice. Chi dice «Ci sono» resta anonimo: qui vedi solo quanti sono.</small></fieldset>" +
        '<label class="check" for="ev-pub"><input type="checkbox" id="ev-pub" name="published"' + (x.published !== false ? " checked" : "") + "> <span><b>Pubblicato</b> nella pagina Eventi. Senza spunta resta una bozza.</span></label>" +
        '<div class="btn-row"><button class="btn primary" type="submit">' + (ev ? "Salva" : "Crea evento") + "</button>" +
        (ev ? '<button class="btn danger" type="button" data-action="ev-del" data-id="' + esc(ev.id) + '">' + icon("trash") + "Elimina evento</button>" : "") + "</div></form>" +
        '<div class="ev-side"><section class="panel"><h2>Locandina</h2>' +
          (ev ? (src ? '<img class="poster-prev" src="' + esc(src) + '" alt="Locandina attuale">' : '<p class="empty">Nessuna locandina. Va bene anche verticale (formato Instagram 4:5 o storia).</p>') +
            '<div class="btn-row"><label class="btn small" for="ev-poster">' + (src ? "Cambia locandina" : "Carica locandina") + '</label><input type="file" id="ev-poster" class="visually-hidden" accept="image/jpeg,image/png,image/webp">' +
            (src ? '<button class="btn small quiet" type="button" data-action="poster-del">Togli</button>' : "") + "</div>"
            : '<p class="empty">Salva prima l\'evento, poi carica la locandina.</p>') + "</section>" +
        (ev && ev.needs_hands ? '<section class="panel"><div class="block-head"><h2>Quanti ci sono</h2><span class="note">' + hs.total + " in tutto</span></div>" +
          (hs.total ? '<ul class="slot-counts">' + Object.keys(hs.by).map(function (k) {
            return "<li><span>" + (k ? "Turno " + esc(k) : "Senza turno") + "</span><b>" + hs.by[k] + "</b></li>";
          }).join("") + "</ul>" : '<p class="empty">Ancora nessun «Ci sono».</p>') +
          '<p class="fine">Sono numeri anonimi: per sapere chi viene, guardate il gruppo WhatsApp dell\'evento.</p></section>' : "") +
        "</div></div>";
    }).catch(function (e) { toast(e.message, true); });
  }
  function handsOf(ev) {
    var by = {}, total = 0;
    slotsOf(ev).forEach(function (sl) { by[sl] = 0; });
    EV.hands.forEach(function (c) {
      var parts = String(c.ref).split("|"); if (parts[0] !== ev.id) return;
      var sl = parts.slice(1).join("|"); by[sl] = (by[sl] || 0) + (Number(c.n) || 0); total += Number(c.n) || 0;
    });
    return { total: total, by: by };
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
      D.signup(f.getAttribute("data-id"), { slot: radio ? radio.value : "" })
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
    if (val("whatsapp_url") && !/^https:\/\/(chat\.whatsapp\.com|(www\.)?whatsapp\.com\/channel|wa\.me)\//.test(val("whatsapp_url"))) return stop("Il link del gruppo deve essere un link WhatsApp (chat.whatsapp.com/…).");
    var row = { id: ev ? ev.id : undefined, title: val("title"), kind: val("kind"), area: val("area"), starts_at: start.toISOString(), ends_at: end ? end.toISOString() : null,
      place: val("place"), city: val("city"), summary: val("summary"), description: val("description"), link_url: val("link_url"), link_label: val("link_label"),
      needs_hands: on("needs_hands"), published: on("published") };
    var mob = { slots: val("slots"), meeting_point: val("meeting_point"), kit_url: val("kit_url"), notes: val("notes"), whatsapp_url: val("whatsapp_url") };
    D.saveEvent(row).then(function (saved) {
      var hasMob = mob.slots || mob.meeting_point || mob.kit_url || mob.notes || mob.whatsapp_url || (ev && EV.mob[ev.id]);
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
    if (act === "su-cancel") { D.cancelSignup(id).then(function () { toast("Tolto da questo telefono. Se eri già nel gruppo WhatsApp, avvisa lì."); viewAgenda("m-" + id); }).catch(function (x) { toast(x.message, true); }); }
    else if (act === "poster-del") {
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
  function codeLink(c) { return location.origin + location.pathname + "?codice=" + encodeURIComponent(c); }
  function randomCode(prefix) {
    var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "", i;
    for (i = 0; i < 5; i++) out += abc.charAt(Math.floor(Math.random() * abc.length));
    return (prefix || "AVAMPOSTO") + "-" + out;
  }
  function coursePrefix(it) {
    var skip = ["corso", "scuola", "formazione", "laboratorio", "percorso", "della", "delle", "degli"];
    return (slugify(it.title).split("-").filter(function (w) { return w.length > 3 && skip.indexOf(w) < 0; })[0] || "CORSO").toUpperCase().slice(0, 14);
  }
  function codesFor(id) { return A.codes.filter(function (c) { return c.initiative_id === id; }); }

  function viewAdmin() {
    var pub = S.inits.filter(function (i) { return i.published; });
    var entryCodes = A.codes.filter(function (c) { return c.kind === "ingresso" && c.active; });
    setMain(
      '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Gestione</h1><p>Codici d\'accesso, corsi e materiali, eventi, squadra e Voci. Chi entra con il codice resta anonimo: qui vedi solo numeri complessivi.</p></div>' +
      '<div class="stats">' +
        '<a class="stat' + (entryCodes.length ? "" : " alert") + '" href="#g-codici"><b>' + (entryCodes.length ? icon("lock") : "!") + "</b><span>" + (entryCodes.length ? "Codici d'accesso" : "Crea il codice d'ingresso") + "</span></a>" +
        '<a class="stat" href="#g-numeri"><b>' + icon("users") + "</b><span>Numeri dell'Avamposto</span></a>" +
        '<div class="stat"><b>' + pub.length + "</b><span>Iniziative pubblicate</span></div>" +
        '<a class="stat" href="#g-eventi"><b>' + icon("evento") + "</b><span>Eventi, mobilitazione e repliche</span></a>" +
        '<a class="stat" href="#g-squadra"><b>' + icon("team") + "</b><span>Gestisci la squadra e i canali WhatsApp</span></a>" +
        '<a class="stat" href="#g-voci" id="stat-voci"><b>' + icon("voce") + "</b><span>Voci Under 30 da approvare</span></a>" +
      "</div>" +
      (entryCodes.length ? "" : '<p class="form-msg err">Non c\'è un codice d\'ingresso attivo: per ora nell\'Avamposto entra solo lo staff. <a href="#g-codici">Crealo qui</a>.</p>') +
      '<section class="block"><div class="block-head"><h2>Iniziative</h2><a class="btn primary small" href="#g-nuova">' + icon("plus") + "Nuova iniziativa</a></div>" +
        (S.inits.length ? '<div class="table-wrap"><table><thead><tr><th>Iniziativa</th><th>Chi la vede</th><th>Stato</th><th></th></tr></thead><tbody>' +
          S.inits.map(function (it) {
            var n = codesFor(it.id).filter(function (c) { return c.active; }).length;
            return "<tr><td><b>" + esc(it.title) + '</b><span class="sub">' + esc(KIND[it.kind] || "") + "</span></td>" +
              "<td>" + (it.access === "aperta" ? '<span class="pill open">Tutti nell\'Avamposto</span>'
                : '<span class="pill lock">Con codice del corso</span>' + (n ? "" : ' <span class="pill wait">manca il codice</span>')) + "</td>" +
              "<td>" + (it.published ? '<span class="pill ok">Pubblicata</span>' : '<span class="pill draft">Bozza</span>') + "</td>" +
              '<td class="actions"><a class="btn small" href="#g-' + esc(it.slug) + '">Gestisci</a></td></tr>';
          }).join("") + "</tbody></table></div>"
          : '<p class="empty">Nessuna iniziativa. Crea la prima.</p>') +
      "</section>", "gestione");
  }

  /* codici d'accesso */
  function codeRow(c) {
    var it = c.initiative_id && initById(c.initiative_id), id = esc(c.id);
    return "<tr" + (c.active ? "" : ' class="off"') + "><td><code>" + esc(c.code) + "</code>" + (c.label ? '<span class="sub">' + esc(c.label) + "</span>" : "") + "</td>" +
      "<td>" + (c.kind === "ingresso" ? "Avamposto" : "Avamposto + " + esc(it ? it.title : "corso eliminato")) + "</td>" +
      "<td>" + (c.active ? '<span class="pill ok">Attivo</span>' : '<span class="pill draft">Disattivato</span>') + "</td>" +
      '<td class="actions"><div class="btn-row" style="justify-content:flex-end">' +
        (c.active ? '<button class="btn small" type="button" data-action="code-copy" data-code="' + esc(c.code) + '">' + icon("copy") + "Copia link</button>" : "") +
        '<button class="btn small quiet" type="button" data-action="code-toggle" data-id="' + id + '">' + (c.active ? "Disattiva" : "Riattiva") + "</button>" +
        '<button class="btn small danger" type="button" data-action="code-del" data-id="' + id + '" aria-label="Elimina ' + esc(c.code) + '">' + icon("trash") + "</button>" +
      "</div></td></tr>";
  }
  function viewCodes() {
    setMain('<p class="loading">Carico…</p>', "gestione");
    D.listCodes().then(function (list) {
      A.codes = list || [];
      var courses = S.inits.filter(function (i) { return i.access !== "aperta"; });
      var pre = location.hash === "#g-codici" ? "" : "";
      setMain(
        '<a class="back" href="#gestione">← Gestione</a>' +
        '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Codici d\'accesso</h1>' +
          "<p>Il <b>codice d'ingresso</b> apre l'Avamposto: corsi aperti, Agenda, La squadra, repliche e La tua voce. Puoi darlo a chi vuoi: tesserati, simpatizzanti, amici. " +
          "I <b>codici dei corsi</b> sbloccano in più un corso «con codice» e fanno entrare anche da soli. Il link «?codice=» fa entrare con un tocco: comodo nei gruppi WhatsApp.</p>" +
          '<p class="fine">Se un codice gira dove non deve, disattivalo e creane uno nuovo: chi aveva il vecchio dovrà inserire quello nuovo.</p></div>' +
        '<div id="ev-admin">' +
        '<section><div class="block-head"><h2>Codici</h2><span class="note">' + A.codes.filter(function (c) { return c.active; }).length + " attivi</span></div>" +
          (A.codes.length ? '<div class="table-wrap"><table class="codes"><thead><tr><th>Codice</th><th>Apre</th><th>Stato</th><th></th></tr></thead><tbody>' + A.codes.map(codeRow).join("") + "</tbody></table></div>"
            : '<p class="empty-note">Nessun codice. Crea il codice d\'ingresso qui sotto.</p>') + "</section>" +
        '<section class="panel"><form data-form="newcode" novalidate><h2>Nuovo codice</h2><div class="grid-2">' +
          '<label class="field" for="nc-kind"><span>Che cosa apre</span><select id="nc-kind" name="kind"><option value="ingresso">L\'Avamposto (codice d\'ingresso)</option>' +
            (courses.length ? '<option value="corso">Un corso con codice</option>' : "") + "</select></label>" +
          '<label class="field" for="nc-course" data-for="corso" hidden><span>Corso</span><select id="nc-course" name="initiative_id">' +
            courses.map(function (i) { return '<option value="' + esc(i.id) + '">' + esc(i.title) + "</option>"; }).join("") + "</select></label>" +
          '<label class="field" for="nc-code"><span>Codice <small>(lettere, numeri e trattini)</small></span><input type="text" id="nc-code" name="code" maxlength="40" autocomplete="off" value="' + esc(randomCode()) + '"></label>' +
          '<label class="field" for="nc-label"><span>Nota per lo staff <small>(facoltativa)</small></span><input type="text" id="nc-label" name="label" maxlength="80" placeholder="Es. dato al banchetto di Pesaro"></label>' +
        '</div><div class="btn-row"><button class="btn primary" type="submit">' + icon("plus") + 'Crea codice</button><button class="btn quiet small" type="button" data-action="code-gen">Generane un altro</button></div></form></section>' +
        "</div>", "gestione");
      var kindSel = document.getElementById("nc-kind"), courseBox = main.querySelector("[data-for=corso]"), codeIn = document.getElementById("nc-code");
      kindSel.addEventListener("change", function () {
        courseBox.hidden = kindSel.value !== "corso";
        var it = initById(document.getElementById("nc-course").value);
        codeIn.value = randomCode(kindSel.value === "corso" && it ? coursePrefix(it) : "AVAMPOSTO");
      });
    }).catch(function (x) { setMain('<p class="form-msg err">' + esc(x.message) + "</p>", "gestione"); });
  }
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f.getAttribute || f.getAttribute("data-form") !== "newcode") return;
    e.preventDefault();
    var btn = f.querySelector("button[type=submit]"); busy(btn, true);
    D.saveCode({ code: f.elements.code.value, kind: f.elements.kind.value, initiative_id: f.elements.initiative_id ? f.elements.initiative_id.value : null, label: f.elements.label.value.trim() })
      .then(function (c) { toast("Codice " + c.code + " creato"); return refresh(); }).then(function () { if (location.hash === "#g-codici") viewCodes(); else route(); })
      .catch(function (x) { toast(/duplicate|unique/i.test((x.raw && x.raw.message) || "") ? "Questo codice esiste già: scegline un altro." : x.message, true); busy(btn, false); });
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action^='code-']"); if (!b) return;
    var act = b.getAttribute("data-action"), id = b.getAttribute("data-id"), c = A.codes.filter(function (x) { return x.id === id; })[0];
    if (act === "code-gen") { var k = document.getElementById("nc-kind"), it = initById((document.getElementById("nc-course") || {}).value); document.getElementById("nc-code").value = randomCode(k.value === "corso" && it ? coursePrefix(it) : "AVAMPOSTO"); return; }
    if (act === "code-copy") {
      var link = codeLink(b.getAttribute("data-code"));
      var done = function () { toast("Link copiato: chi lo apre entra direttamente"); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { window.prompt("Copia il link:", link); });
      else window.prompt("Copia il link:", link);
      return;
    }
    if (act === "code-quick") {
      var itq = initById(id); if (!itq) return; busy(b, true);
      D.saveCode({ code: randomCode(coursePrefix(itq)), kind: "corso", initiative_id: itq.id, label: itq.title })
        .then(function (cq) { toast("Codice " + cq.code + " creato"); return refresh(); }).then(route).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (!c) return;
    if (act === "code-toggle") {
      busy(b, true); D.saveCode(Object.assign({}, c, { active: !c.active })).then(function () { toast(c.active ? "Codice disattivato: chi lo usava non entra più" : "Codice riattivato"); return refresh(); })
        .then(function () { if (location.hash === "#g-codici") viewCodes(); else route(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (act === "code-del") {
      if (needsConfirm(b, "Sicuro? Tocca di nuovo")) return;
      busy(b, true); D.deleteCode(c.id).then(function () { toast("Codice eliminato"); return refresh(); })
        .then(function () { if (location.hash === "#g-codici") viewCodes(); else route(); }).catch(function (x) { toast(x.message, true); busy(b, false); });
    }
  });

  /* numeri anonimi */
  function viewNumbers() {
    setMain('<p class="loading">Carico…</p>', "gestione");
    Promise.all([D.counts(), D.events().catch(function () { return []; })]).then(function (r) {
      var rows = r[0] || [], events = r[1] || [];
      var today = new Date(); today.setHours(12, 0, 0, 0);
      var dayKey = function (n) { return new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10); };
      var since = function (n) { var k = dayKey(n - 1); return rows.filter(function (c) { return c.day >= k; }); };
      var sum = function (list, kind, ref) { return list.filter(function (c) { return c.kind === kind && (!ref || c.ref === ref); }).reduce(function (t, c) { return t + (Number(c.n) || 0); }, 0); };
      var visits = function (list) { return sum(list, "ingresso", "visita"); }, newcomers = function (list) { return sum(list, "ingresso", "avamposto"); };
      var group = function (kind) {
        var o = {}; rows.filter(function (c) { return c.kind === kind; }).forEach(function (c) { o[c.ref] = (o[c.ref] || 0) + (Number(c.n) || 0); });
        return Object.keys(o).map(function (k) { return { ref: k, n: o[k] }; }).sort(function (a, b) { return b.n - a.n; });
      };
      var days = [], maxV = 1, i;
      for (i = 29; i >= 0; i--) { var k = dayKey(i), v = rows.filter(function (c) { return c.day === k && c.kind === "ingresso"; }).reduce(function (t, c) { return t + (Number(c.n) || 0); }, 0); days.push({ k: k, v: v }); if (v > maxV) maxV = v; }
      var matTitle = function (id) { var m = S.amats.filter(function (x) { return x.id === id; })[0]; return m ? m.title : "Materiale non più presente"; };
      var evTitle = function (id) { var ev = events.filter(function (x) { return x.id === id; })[0]; return ev ? ev.title + " · " + fmtShort(ev.starts_at) : "Evento non più presente"; };
      var opens = group("apertura"), seen = group("visto").slice(0, 10), hands = group("cisono");
      var table = function (list, label) {
        return list.length ? '<div class="table-wrap"><table><tbody>' + list.map(function (x) { return "<tr><td>" + esc(label(x.ref)) + '</td><td class="num"><b>' + x.n + "</b></td></tr>"; }).join("") + "</tbody></table></div>"
          : '<p class="empty-note">Ancora niente.</p>';
      };
      setMain(
        '<a class="back" href="#gestione">← Gestione</a>' +
        '<div class="page-head"><span class="eyebrow">Area staff</span><h1>Numeri dell\'Avamposto</h1>' +
          "<p>Contatori anonimi degli ultimi quattro mesi: contano le azioni, non le persone, e non sappiamo chi le ha fatte. Bastano per capire cosa funziona.</p></div>" +
        '<div class="stats">' +
          '<div class="stat"><b>' + newcomers(since(30)) + "</b><span>Nuovi telefoni entrati con il codice (30 giorni)</span></div>" +
          '<div class="stat"><b>' + visits(since(7)) + "</b><span>Visite negli ultimi 7 giorni</span></div>" +
          '<div class="stat"><b>' + visits(since(30)) + "</b><span>Visite negli ultimi 30 giorni</span></div>" +
          '<div class="stat"><b>' + sum(rows, "cisono") + "</b><span>«Ci sono» in totale</span></div>" +
        "</div>" +
        '<section class="panel"><h2>Ingressi giorno per giorno</h2><div class="spark" role="img" aria-label="Ingressi negli ultimi 30 giorni">' +
          days.map(function (x) { return '<span title="' + esc(fmtShort(x.k)) + ": " + x.v + '" style="height:' + Math.max(4, Math.round(x.v / maxV * 100)) + '%"></span>'; }).join("") +
          '</div><p class="fine">Ultimi 30 giorni, oggi a destra.</p></section>' +
        '<div class="grid-2 numbers-grid">' +
          '<section class="panel"><h2>Corsi aperti</h2>' + table(opens, function (id) { var it = initById(id); return it ? it.title : "Corso non più presente"; }) + "</section>" +
          '<section class="panel"><h2>Materiali segnati come visti</h2>' + table(seen, matTitle) + "</section>" +
          '<section class="panel" style="grid-column:1/-1"><h2>«Ci sono» per evento e turno</h2>' + table(hands, function (ref) {
            var parts = ref.split("|"); return evTitle(parts[0]) + (parts[1] ? " — turno " + parts.slice(1).join("|") : "");
          }) + "</section>" +
        "</div>", "gestione");
    }).catch(function (x) { setMain('<p class="form-msg err">' + esc(x.message) + "</p>", "gestione"); });
  }

  function viewEditInitiative(slug) {
    var it = slug ? initBySlug(slug) : null;
    if (slug && !it) { setMain('<a class="back" href="#gestione">← Gestione</a><p class="empty">Iniziativa non trovata.</p>', "gestione"); return; }
    var x = it || { title: "", slug: "", summary: "", description: "", kind: "corso", access: "su_richiesta", starts_on: "", published: false, position: S.inits.length + 1 };
    var kindOpts = Object.keys(KIND).map(function (k) { return '<option value="' + k + '"' + (x.kind === k ? " selected" : "") + ">" + KIND[k] + "</option>"; }).join("");
    setMain(
      '<a class="back" href="#gestione">← Gestione</a>' +
      '<div class="page-head"><span class="eyebrow">' + (it ? "Gestisci iniziativa" : "Nuova iniziativa") + "</span><h1>" + esc(it ? it.title : "Nuova iniziativa") + "</h1>" +
        (it ? '<p><a href="#i-' + esc(it.slug) + '">Vedi la pagina del corso →</a></p>' : "") + "</div>" +
      '<section class="panel"><h2>Dettagli</h2><form id="f-init" novalidate>' +
        '<label class="field" for="in-title"><span>Titolo</span><input type="text" id="in-title" value="' + esc(x.title) + '" required></label>' +
        '<div class="grid-2">' +
          '<label class="field" for="in-kind"><span>Tipo</span><select id="in-kind">' + kindOpts + "</select></label>" +
          '<label class="field" for="in-start"><span>Data di inizio (facoltativa)</span><input type="date" id="in-start" value="' + esc(x.starts_on || "") + '"></label>' +
        "</div>" +
        '<fieldset class="field"><legend>Chi può vederla</legend><div class="choice-row">' +
          '<label class="choice" for="in-acc-r"><input type="radio" name="in-acc" id="in-acc-r" value="su_richiesta"' + (x.access !== "aperta" ? " checked" : "") + "> Solo con il codice del corso</label>" +
          '<label class="choice" for="in-acc-a"><input type="radio" name="in-acc" id="in-acc-a" value="aperta"' + (x.access === "aperta" ? " checked" : "") + "> Tutti quelli che entrano nell'Avamposto</label>" +
        "</div></fieldset>" +
        '<label class="field" for="in-summary"><span>Presentazione breve</span><input type="text" id="in-summary" maxlength="200" value="' + esc(x.summary || "") + '"><small>Compare nel catalogo, anche a chi non è ancora entrato.</small></label>' +
        '<label class="field" for="in-desc"><span>Descrizione completa</span><textarea id="in-desc">' + esc(x.description || "") + "</textarea><small>Una riga vuota separa i paragrafi. **testo** diventa grassetto.</small></label>" +
        '<label class="field" for="in-slug"><span>Indirizzo breve</span><input type="text" id="in-slug" value="' + esc(x.slug) + '"' + (it ? " disabled" : "") + '><small>' + (it ? "Non si cambia dopo la creazione, così i link già mandati continuano a funzionare." : "Si compila dal titolo. Solo lettere minuscole, numeri e trattini.") + "</small></label>" +
        '<label class="check" for="in-pub"><input type="checkbox" id="in-pub"' + (x.published ? " checked" : "") + "> <span><b>Pubblicata</b>: visibile nel catalogo. Se togli la spunta resta una bozza visibile solo allo staff.</span></label>" +
        '<p class="form-msg err" id="in-err" hidden></p>' +
        '<div class="btn-row"><button class="btn primary" type="submit">' + (it ? "Salva le modifiche" : "Crea iniziativa") + "</button>" +
        (it ? '<button class="btn danger small" type="button" data-action="del-init" data-id="' + esc(it.id) + '">' + icon("trash") + "Elimina iniziativa</button>" : "") + "</div>" +
      "</form></section>" +
      (it ? coverSection(it) + courseCodeSection(it) + '<section class="panel" id="mat-panel"><div class="block-head"><h2>Materiali</h2>' +
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

  function courseCodeSection(it) {
    if (it.access === "aperta") return '<section class="panel"><h2>Chi lo vede</h2><p>Tutti quelli che entrano nell\'Avamposto con il codice d\'ingresso. Per riservarlo a chi partecipa, scegli «Solo con il codice del corso» qui sopra.</p></section>';
    var list = codesFor(it.id);
    return '<section class="panel"><div class="block-head"><h2>Codici del corso</h2><a class="note" href="#g-codici">Tutti i codici →</a></div>' +
      "<p>Dai il codice (o il link) a chi partecipa al corso: lo inserisce nell'Avamposto e il corso si sblocca. Non serve sapere chi è.</p>" +
      (list.length ? '<div class="table-wrap"><table class="codes"><tbody>' + list.map(codeRow).join("") + "</tbody></table></div>" : '<p class="form-msg err">Questo corso non ha ancora un codice: per ora non lo vede nessuno, a parte lo staff.</p>') +
      '<div class="btn-row"><button class="btn small primary" type="button" data-action="code-quick" data-id="' + esc(it.id) + '">' + icon("plus") + "Crea un codice per questo corso</button></div></section>";
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
          '<button class="icon-btn" type="button" title="' + (m.published === false ? "Mostra nel corso" : "Nascondi nel corso") + '" aria-label="' + (m.published === false ? "Mostra" : "Nascondi") + '" data-action="mat-vis" data-i="' + i + '">' + icon(m.published === false ? "eyeoff" : "eye") + "</button>" +
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
      diretta: "Il pulsante per entrare compare nel corso 15 minuti prima. Dopo la diretta puoi aggiungere la registrazione come Video.",
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
    if (!inside() || !mid || !!S.views[mid] === on) return Promise.resolve();
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

    if (act === "forget-device") { document.getElementById("forget-confirm").hidden = false; return; }
    if (act === "forget-no") { document.getElementById("forget-confirm").hidden = true; return; }
    if (act === "forget-yes") {
      D.forgetDevice(); S.pass = NO_PASS; S.views = {};
      toast("Fatto: su questo telefono non resta più nulla dell'Avamposto.");
      refresh().then(function () { go("#home"); });
      return;
    }
    if (act === "focus-code" || act === "focus-course-code") {
      e.preventDefault();
      var inp = document.getElementById(act === "focus-code" ? "door-in" : "course-code-in");
      if (inp) { inp.scrollIntoView({ block: "center" }); inp.focus(); } else go("#home");
      return;
    }
    if (act === "play-video") {
      var src = b.getAttribute("data-src"); if (!/^https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com|drive\.google\.com)\//.test(src)) return;
      var fr = document.createElement("iframe");
      fr.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "autoplay=1"; fr.title = b.getAttribute("data-title") || "Video";
      fr.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; fr.allowFullscreen = true;
      var box = b.parentNode; box.classList.remove("video-gate"); box.innerHTML = ""; box.appendChild(fr); return;
    }
    if (act === "demo-as") {
      if (b.getAttribute("data-who") === "admin") { D.demoOpenLink(D.demoAdmin); location.hash = "#gestione"; return; }
      if (S.me) D.signOut();
      D.addCode(D.demoCode).then(refresh).then(function () { toast("Entrato con il codice " + D.demoCode); go("#home"); });
      return;
    }
    if (act === "demo-reset") { D.reset(); toast("Dati di esempio ripristinati"); location.hash = "#home"; return; }
    if (act === "demo-open") { D.demoOpenLink(mail); return; }
    if (act === "auth-again") { viewStaffLogin(); return; }
    if (act === "signout") { D.signOut().then(function () { location.hash = "#home"; }); return; }

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

    if (act === "del-init") {
      if (needsConfirm(b, "Conferma: elimina iniziativa, materiali e codici del corso")) return;
      busy(b, true);
      D.deleteInitiative(id).then(function () { toast("Iniziativa eliminata"); return refresh(); }).then(function () { go("#gestione"); })
        .catch(function (x) { toast(x.message, true); busy(b, false); });
      return;
    }
    if (!it) return;
    var i = parseInt(b.getAttribute("data-i"), 10), m = adminMats[i];
    if (act === "mat-new") { openMaterialForm(it, null); return; }
    if (act === "mat-cancel") { document.getElementById("mat-form-slot").innerHTML = ""; return; }
    if (act === "mat-edit") { openMaterialForm(it, m); document.getElementById("mat-panel").scrollIntoView({ block: "start" }); return; }
    if (act === "mat-vis") { busy(b, true); m.published = m.published === false; D.saveMaterial(m).then(function () { toast(m.published ? "Ora è visibile nel corso" : "Nascosto nel corso"); return loadAdminMaterials(it); }).catch(function (x) { toast(x.message, true); busy(b, false); }); return; }
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

  /* ---------------- avvio ---------------- */
  function welcomeFromLink(raw) {
    var had = D.codes().length > 0;
    return D.addCode(raw).then(function () {
      if (!had) D.hit("ingresso", "avamposto");
      return true;
    }).catch(function (x) { toast(x.message, true); return false; });
  }
  function countVisit() {
    if (S.admin || !S.pass.entry) return;
    try { if (sessionStorage.getItem("avamposto-visita")) return; sessionStorage.setItem("avamposto-visita", "1"); } catch (e) {}
    D.hit("ingresso", "visita");
  }

  function start() {
    var params = new URLSearchParams(location.search), linkCode = params.get("codice");
    if (linkCode || params.get("invito")) history.replaceState(null, "", location.pathname + location.hash);
    if (!D.live && DEMO) document.getElementById("demo-bar").hidden = false;
    if (PREVIEW) { S.ready = true; renderNav = function () { nav.innerHTML = ""; }; viewWelcome(); return; }
    D.init().then(function () { return linkCode ? welcomeFromLink(linkCode) : false; }).then(function (ok) {
      return refresh().then(function () {
        S.ready = true; countVisit();
        if (ok) toast("Codice salvato: benvenuto nell'Avamposto");
      });
    }).then(route)
      .catch(function (e) { S.ready = true; main.innerHTML = '<div class="wrap page"><p class="form-msg err">' + esc(D.friendly(e)) + "</p></div>"; });
    D.onAuthChange(function () {
      S.ready = false;
      main.innerHTML = '<div class="wrap page"><p class="loading">Caricamento…</p></div>';
      refresh().then(function () { S.ready = true; }).then(route).catch(function (e) { S.ready = true; toast(e.message, true); route(); });
    });
    window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });
  }
  start();
})();
