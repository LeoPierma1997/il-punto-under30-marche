/* Avamposto Under 30 – accesso ai dati.
   Due motori con la stessa interfaccia:
   - Supabase (reale) quando config.js è compilato;
   - Demo (dati di esempio nel browser) altrimenti. */
(function () {
  "use strict";
  var cfg = window.AVAMPOSTO_CONFIG || {};
  var LIVE = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";

  function lower(s) { return String(s || "").trim().toLowerCase(); }
  function nowIso() { return new Date().toISOString(); }
  function uid() { return "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function code() { return Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10); }

  var ERRORS = [
    [/Signups not allowed|User not found/i, "Questa mail non risulta iscritta all'Avamposto. Usa «Iscriviti»."],
    [/rate limit|over_email_send_rate|For security purposes/i, "Hai chiesto troppi link in poco tempo. Aspetta un minuto e riprova."],
    [/invalid.*email|Unable to validate email/i, "L'indirizzo email non sembra valido. Controllalo e riprova."],
    [/Invito non valido/i, "Questo link d'invito non è valido o è stato disattivato. Chiedi allo staff un link nuovo."],
    [/row-level security|permission denied|Solo gli amministratori/i, "Non hai i permessi per questa operazione."],
    [/duplicate key.*slug|initiatives_slug_key/i, "Esiste già un'iniziativa con questo indirizzo breve. Cambialo."],
    [/Failed to fetch|NetworkError|Load failed/i, "Connessione assente o lenta. Controlla la rete e riprova."],
    [/Payload too large|exceeded the maximum allowed size/i, "Il file è troppo grande: il limite è 50 MB."]
  ];
  function friendly(err) {
    var msg = (err && (err.message || err.error_description || err.msg)) || String(err || "");
    for (var i = 0; i < ERRORS.length; i++) if (ERRORS[i][0].test(msg)) return ERRORS[i][1];
    return "Qualcosa non ha funzionato (" + msg + "). Riprova tra poco.";
  }
  function fail(err) { var e = new Error(friendly(err)); e.raw = err; throw e; }

  /* ================================================================
     Motore Supabase
     ================================================================ */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("Failed to fetch")); };
      document.head.appendChild(s);
    });
  }

  function makeLive() {
    var sb = null, session = null, listeners = [];
    function q(p) { return p.then(function (r) { if (r.error) fail(r.error); return r.data; }); }
    function email() { return lower(session && session.user && session.user.email); }

    return {
      live: true,
      init: function () {
        return loadScript(SUPABASE_JS).then(function () {
          sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
            auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }
          });
          sb.auth.onAuthStateChange(function (_e, s) {
            var before = email(); session = s;
            if (email() !== before) listeners.forEach(function (f) { f(); });
          });
          return sb.auth.getSession().then(function (r) { session = r.data.session; });
        });
      },
      onAuthChange: function (f) { listeners.push(f); },
      me: function () { return session ? { id: session.user.id, email: email() } : null; },
      signUp: function (form, redirectTo) {
        return q(sb.auth.signInWithOtp({
          email: lower(form.email),
          options: { shouldCreateUser: true, emailRedirectTo: redirectTo,
            data: { full_name: form.full_name, membership: form.membership, privacy: form.privacy ? "true" : "false" } }
        }));
      },
      signIn: function (mail, redirectTo) {
        return q(sb.auth.signInWithOtp({ email: lower(mail), options: { shouldCreateUser: false, emailRedirectTo: redirectTo } }));
      },
      signOut: function () { return sb.auth.signOut(); },
      isAdmin: function () { return session ? q(sb.rpc("is_admin")) : Promise.resolve(false); },

      getProfile: function () { return q(sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle()); },
      saveProfile: function (p) {
        return q(sb.from("profiles").upsert({ id: session.user.id, email: email(), full_name: p.full_name,
          membership: p.membership, privacy_at: p.privacy_at || nowIso() }).select().single());
      },

      initiatives: function () {
        return q(sb.from("initiatives").select("*").order("position").order("created_at"));
      },
      myEnrollments: function () { return q(sb.from("enrollments").select("*").eq("email", email())); },
      requestAccess: function (initId) {
        return q(sb.from("enrollments").insert({ initiative_id: initId, email: email() }));
      },
      cancelRequest: function (initId) {
        return q(sb.from("enrollments").delete().eq("initiative_id", initId).eq("email", email()).eq("status", "richiesta"));
      },
      redeemInvite: function (c) { return q(sb.rpc("redeem_invite", { p_code: c })); },
      materials: function (initId) {
        return q(sb.from("materials").select("*").eq("initiative_id", initId).order("position").order("created_at"));
      },
      fileUrl: function (path) {
        return q(sb.storage.from("materiali").createSignedUrl(path, 3600)).then(function (d) { return d.signedUrl; });
      },

      /* --- gestione --- */
      allEnrollments: function () { return q(sb.from("enrollments").select("*").order("created_at", { ascending: false })); },
      allProfiles: function () { return q(sb.from("profiles").select("*").order("created_at", { ascending: false })); },
      invites: function () { return q(sb.from("invites").select("*")); },
      saveInitiative: function (it) {
        var row = { slug: it.slug, title: it.title, summary: it.summary, description: it.description, kind: it.kind,
          access: it.access, starts_on: it.starts_on || null, published: !!it.published, position: it.position || 0 };
        return it.id ? q(sb.from("initiatives").update(row).eq("id", it.id).select().single())
                     : q(sb.from("initiatives").insert(row).select().single());
      },
      deleteInitiative: function (id) {
        return q(sb.storage.from("materiali").list(id, { limit: 1000 })).then(function (files) {
          var paths = (files || []).map(function (f) { return id + "/" + f.name; });
          return paths.length ? q(sb.storage.from("materiali").remove(paths)) : null;
        }).catch(function () { return null; }).then(function () {
          return q(sb.from("initiatives").delete().eq("id", id));
        });
      },
      setInviteActive: function (initId, active) {
        return q(sb.from("invites").update({ active: active, updated_at: nowIso() }).eq("initiative_id", initId));
      },
      regenerateInvite: function (initId) { return q(sb.rpc("regenerate_invite", { p_initiative: initId })); },
      addParticipants: function (initId, emails) {
        var rows = emails.map(function (e) { return { initiative_id: initId, email: lower(e), status: "attiva", source: "manuale", decided_at: nowIso() }; });
        return q(sb.from("enrollments").upsert(rows, { onConflict: "initiative_id,email" }));
      },
      setEnrollment: function (initId, mail, status) {
        return q(sb.from("enrollments").update({ status: status, decided_at: nowIso() }).eq("initiative_id", initId).eq("email", lower(mail)));
      },
      removeEnrollment: function (initId, mail) {
        return q(sb.from("enrollments").delete().eq("initiative_id", initId).eq("email", lower(mail)));
      },
      saveMaterial: function (m) {
        var row = { initiative_id: m.initiative_id, kind: m.kind, title: m.title, body: m.body || null, url: m.url || null,
          file_path: m.file_path || null, live_at: m.live_at || null, position: m.position || 0, published: m.published !== false };
        return m.id ? q(sb.from("materials").update(row).eq("id", m.id).select().single())
                    : q(sb.from("materials").insert(row).select().single());
      },
      deleteMaterial: function (m) {
        var p = m.file_path ? q(sb.storage.from("materiali").remove([m.file_path])).catch(function () { return null; }) : Promise.resolve();
        return p.then(function () { return q(sb.from("materials").delete().eq("id", m.id)); });
      },
      uploadFile: function (initId, file) {
        var safe = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
        var path = initId + "/" + Date.now() + "-" + safe;
        return q(sb.storage.from("materiali").upload(path, file, { contentType: file.type || "application/pdf", upsert: false }))
          .then(function () { return path; });
      }
    };
  }

  /* ================================================================
     Motore dimostrativo (dati di esempio nel browser)
     ================================================================ */
  var DEMO_KEY = "avamposto-demo-v1";
  var DEMO_ADMIN = "staff@esempio.it";

  function seed() {
    var day = 86400000, t = Date.now();
    function iso(offsetDays, h, m) { var d = new Date(t + offsetDays * day); d.setHours(h || 18, m || 0, 0, 0); return d.toISOString(); }
    var I = {
      com: "demo-comunicazione", eu: "demo-europa", spec: "demo-speciali", social: "demo-social"
    };
    return {
      session: null,
      admins: [DEMO_ADMIN],
      users: {
        "mario.rossi@esempio.it": { full_name: "Mario Rossi (esempio)", membership: "tesserato", privacy_at: iso(-20), created_at: iso(-20) },
        "giulia.bianchi@esempio.it": { full_name: "Giulia Bianchi (esempio)", membership: "simpatizzante", privacy_at: iso(-12), created_at: iso(-12) },
        "luca.verdi@esempio.it": { full_name: "Luca Verdi (esempio)", membership: "tesserato", privacy_at: iso(-3), created_at: iso(-3) },
        "staff@esempio.it": { full_name: "Staff Under 30 Marche", membership: "tesserato", privacy_at: iso(-30), created_at: iso(-30) }
      },
      initiatives: [
        { id: I.com, slug: "comunicazione-politica", title: "Corso di comunicazione politica", kind: "corso", access: "su_richiesta", published: true, position: 1,
          starts_on: iso(-7).slice(0, 10), created_at: iso(-25),
          summary: "Scrivere per i social, parlare in pubblico, gestire un'intervista. Quattro incontri con esercitazioni.",
          description: "Un percorso pratico per chi cura i canali social del gruppo o interviene in pubblico.\n\nOgni incontro ha una parte teorica breve e un'esercitazione su casi reali della settimana." },
        { id: I.eu, slug: "europa-istituzioni", title: "Scuola di formazione: Europa e istituzioni", kind: "formazione", access: "su_richiesta", published: true, position: 2,
          starts_on: iso(5).slice(0, 10), created_at: iso(-15),
          summary: "Come funzionano Commissione, Parlamento e Consiglio, e perché contano per le Marche.",
          description: "Ciclo di tre dirette con ospiti, seguite da materiali di approfondimento." },
        { id: I.spec, slug: "contenuti-speciali", title: "Contenuti speciali", kind: "contenuti", access: "aperta", published: true, position: 3,
          created_at: iso(-30),
          summary: "Approfondimenti e materiali riservati a tutti gli iscritti all'Avamposto.",
          description: "Qui trovi i contenuti extra pubblicati dallo staff: schede, dossier e registrazioni degli eventi." },
        { id: I.social, slug: "laboratorio-social", title: "Laboratorio social", kind: "corso", access: "su_richiesta", published: false, position: 4,
          created_at: iso(-1),
          summary: "Bozza: non ancora visibile agli iscritti.",
          description: "Iniziativa in preparazione." }
      ],
      invites: (function () { var o = {}; [I.com, I.eu, I.spec, I.social].forEach(function (id) { o[id] = { initiative_id: id, code: code(), active: true }; }); return o; })(),
      enrollments: [
        { initiative_id: I.com, email: "mario.rossi@esempio.it", status: "attiva", source: "manuale", created_at: iso(-18), decided_at: iso(-18) },
        { initiative_id: I.eu, email: "mario.rossi@esempio.it", status: "richiesta", source: "richiesta", created_at: iso(-1) },
        { initiative_id: I.com, email: "giulia.bianchi@esempio.it", status: "richiesta", source: "richiesta", created_at: iso(-2) },
        { initiative_id: I.eu, email: "luca.verdi@esempio.it", status: "attiva", source: "invito", created_at: iso(-3), decided_at: iso(-3) }
      ],
      materials: [
        { id: uid(), initiative_id: I.com, kind: "video", title: "Lezione 1 – Scrivere un post che si fa leggere", url: "", body: "Durata 25 minuti. Guardala prima della diretta di giovedì.", position: 1, published: true, created_at: iso(-7) },
        { id: uid(), initiative_id: I.com, kind: "pdf", title: "Slide della lezione 1", file_path: "", body: "PDF di esempio.", position: 2, published: true, created_at: iso(-7) },
        { id: uid(), initiative_id: I.com, kind: "diretta", title: "Lezione 2 – Parlare in pubblico (diretta)", url: "https://meet.google.com/", live_at: iso(2, 18, 30), body: "Porta un intervento di due minuti su un tema della rassegna.", position: 3, published: true, created_at: iso(-6) },
        { id: uid(), initiative_id: I.com, kind: "testo", title: "Esercitazione della settimana", body: "Prendi una notizia dalla rassegna di oggi e scrivi:\n\n**1.** un post di massimo 600 caratteri;\n**2.** tre titoli alternativi per una storia Instagram.\n\nCarica il lavoro nel gruppo del corso entro venerdì.", position: 4, published: true, created_at: iso(-5) },
        { id: uid(), initiative_id: I.eu, kind: "diretta", title: "Primo incontro: come nasce una legge europea", url: "https://meet.google.com/", live_at: iso(5, 21, 0), body: "Diretta su Meet, durata circa un'ora.", position: 1, published: true, created_at: iso(-10) },
        { id: uid(), initiative_id: I.spec, kind: "testo", title: "Benvenuto nell'Avamposto", body: "Questa è l'area riservata di Azione Under 30 Marche.\n\nIn **Contenuti speciali** trovi i materiali aperti a tutti gli iscritti. Dal **catalogo** puoi chiedere di partecipare ai corsi: lo staff approva le richieste.", position: 1, published: true, created_at: iso(-30) },
        { id: uid(), initiative_id: I.spec, kind: "link", title: "La rassegna stampa di oggi", url: "../", body: "Il Punto Under 30 – Marche, ogni mattina alle 8.", position: 2, published: true, created_at: iso(-30) }
      ]
    };
  }

  function makeDemo() {
    var S = null, listeners = [];
    function save() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(S)); } catch (e) {} }
    function load() {
      try { var raw = localStorage.getItem(DEMO_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
      return seed();
    }
    function me() { return S.session ? lower(S.session) : ""; }
    function admin() { return S.admins.indexOf(me()) >= 0; }
    function delay(v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 120); }); }
    function deny() { return Promise.reject(new Error(friendly({ message: "permission denied" }))); }
    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    function initById(id) { return S.initiatives.filter(function (i) { return i.id === id; })[0]; }
    function hasAccess(id) {
      var i = initById(id); if (!i) return false;
      if (admin()) return true;
      if (!i.published || !me()) return false;
      if (i.access === "aperta") return true;
      return S.enrollments.some(function (e) { return e.initiative_id === id && e.email === me() && e.status === "attiva"; });
    }
    function setSession(mail) { S.session = mail ? lower(mail) : null; save(); listeners.forEach(function (f) { f(); }); }
    function upsertEnroll(row) {
      var ex = S.enrollments.filter(function (e) { return e.initiative_id === row.initiative_id && e.email === row.email; })[0];
      if (ex) Object.assign(ex, row); else S.enrollments.push(Object.assign({ created_at: nowIso() }, row));
    }

    return {
      live: false,
      demoAdmin: DEMO_ADMIN,
      demoMember: "mario.rossi@esempio.it",
      init: function () { S = load(); save(); return Promise.resolve(); },
      reset: function () { S = seed(); save(); listeners.forEach(function (f) { f(); }); },
      onAuthChange: function (f) { listeners.push(f); },
      me: function () { return S.session ? { id: me(), email: me() } : null; },
      signUp: function (form) {
        var m = lower(form.email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return Promise.reject(new Error(friendly({ message: "invalid email" })));
        if (!S.users[m]) S.users[m] = { full_name: form.full_name, membership: form.membership, privacy_at: form.privacy ? nowIso() : null, created_at: nowIso() };
        save(); return delay({});
      },
      signIn: function (mail) {
        var m = lower(mail);
        if (!S.users[m]) return Promise.reject(new Error(friendly({ message: "Signups not allowed for otp" })));
        return delay({});
      },
      demoOpenLink: function (mail) { setSession(mail); },
      signOut: function () { setSession(null); return Promise.resolve(); },
      isAdmin: function () { return delay(admin()); },

      getProfile: function () {
        var u = S.users[me()]; return delay(u ? Object.assign({ id: me(), email: me() }, clone(u)) : null);
      },
      saveProfile: function (p) {
        S.users[me()] = Object.assign(S.users[me()] || { created_at: nowIso() }, { full_name: p.full_name, membership: p.membership, privacy_at: p.privacy_at || nowIso() });
        save(); return delay(clone(S.users[me()]));
      },
      initiatives: function () {
        var list = S.initiatives.filter(function (i) { return i.published || admin(); });
        list.sort(function (a, b) { return (a.position - b.position) || (a.created_at < b.created_at ? -1 : 1); });
        return delay(clone(list));
      },
      myEnrollments: function () { return delay(clone(S.enrollments.filter(function (e) { return e.email === me(); }))); },
      requestAccess: function (id) {
        if (!me()) return deny();
        if (!S.enrollments.some(function (e) { return e.initiative_id === id && e.email === me(); }))
          S.enrollments.push({ initiative_id: id, email: me(), status: "richiesta", source: "richiesta", created_at: nowIso() });
        save(); return delay({});
      },
      cancelRequest: function (id) {
        S.enrollments = S.enrollments.filter(function (e) { return !(e.initiative_id === id && e.email === me() && e.status === "richiesta"); });
        save(); return delay({});
      },
      redeemInvite: function (c) {
        if (!me()) return deny();
        var inv = Object.keys(S.invites).map(function (k) { return S.invites[k]; }).filter(function (v) { return v.code === c && v.active; })[0];
        var i = inv && initById(inv.initiative_id);
        if (!i || !i.published) return Promise.reject(new Error(friendly({ message: "Invito non valido" })));
        upsertEnroll({ initiative_id: i.id, email: me(), status: "attiva", source: "invito", decided_at: nowIso() });
        save(); return delay(i.slug);
      },
      materials: function (id) {
        if (!hasAccess(id)) return delay([]);
        return delay(clone(S.materials.filter(function (m) { return m.initiative_id === id && (m.published || admin()); })
          .sort(function (a, b) { return (a.position - b.position) || (a.created_at < b.created_at ? -1 : 1); })));
      },
      fileUrl: function (path) {
        if (path && path.indexOf("blob:") === 0) return delay(path);
        return Promise.reject(new Error("Nel prototipo i PDF di esempio non contengono un file vero."));
      },

      allEnrollments: function () { return admin() ? delay(clone(S.enrollments)) : deny(); },
      allProfiles: function () {
        if (!admin()) return deny();
        return delay(Object.keys(S.users).map(function (m) { return Object.assign({ id: m, email: m }, clone(S.users[m])); })
          .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }));
      },
      invites: function () { return admin() ? delay(Object.keys(S.invites).map(function (k) { return clone(S.invites[k]); })) : deny(); },
      saveInitiative: function (it) {
        if (!admin()) return deny();
        if (S.initiatives.some(function (x) { return x.slug === it.slug && x.id !== it.id; }))
          return Promise.reject(new Error(friendly({ message: "initiatives_slug_key" })));
        var row;
        if (it.id) { row = initById(it.id); Object.assign(row, it); }
        else { var fresh = Object.assign({}, it); delete fresh.id; row = Object.assign({ id: uid(), created_at: nowIso() }, fresh); S.initiatives.push(row); S.invites[row.id] = { initiative_id: row.id, code: code(), active: true }; }
        save(); return delay(clone(row));
      },
      deleteInitiative: function (id) {
        if (!admin()) return deny();
        S.initiatives = S.initiatives.filter(function (i) { return i.id !== id; });
        S.enrollments = S.enrollments.filter(function (e) { return e.initiative_id !== id; });
        S.materials = S.materials.filter(function (m) { return m.initiative_id !== id; });
        delete S.invites[id]; save(); return delay({});
      },
      setInviteActive: function (id, active) { if (!admin()) return deny(); S.invites[id].active = active; save(); return delay({}); },
      regenerateInvite: function (id) { if (!admin()) return deny(); S.invites[id].code = code(); S.invites[id].active = true; save(); return delay(S.invites[id].code); },
      addParticipants: function (id, emails) {
        if (!admin()) return deny();
        emails.forEach(function (m) { upsertEnroll({ initiative_id: id, email: lower(m), status: "attiva", source: "manuale", decided_at: nowIso() }); });
        save(); return delay({});
      },
      setEnrollment: function (id, mail, status) {
        if (!admin()) return deny();
        S.enrollments.forEach(function (e) { if (e.initiative_id === id && e.email === lower(mail)) { e.status = status; e.decided_at = nowIso(); } });
        save(); return delay({});
      },
      removeEnrollment: function (id, mail) {
        if (!admin()) return deny();
        S.enrollments = S.enrollments.filter(function (e) { return !(e.initiative_id === id && e.email === lower(mail)); });
        save(); return delay({});
      },
      saveMaterial: function (m) {
        if (!admin()) return deny();
        var row;
        if (m.id) { row = S.materials.filter(function (x) { return x.id === m.id; })[0]; Object.assign(row, m); }
        else { var fm = Object.assign({}, m); delete fm.id; row = Object.assign({ id: uid(), created_at: nowIso(), published: true }, fm); S.materials.push(row); }
        save(); return delay(clone(row));
      },
      deleteMaterial: function (m) {
        if (!admin()) return deny();
        S.materials = S.materials.filter(function (x) { return x.id !== m.id; }); save(); return delay({});
      },
      uploadFile: function (_id, file) {
        if (!admin()) return deny();
        return delay(URL.createObjectURL(file));
      }
    };
  }

  window.AvampostoData = LIVE ? makeLive() : makeDemo();
  window.AvampostoData.friendly = friendly;
})();
