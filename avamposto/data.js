/* Avamposto Under 30 – accesso ai dati.
   Due motori con la stessa interfaccia:
   - Supabase (reale) quando config.js è compilato;
   - Demo (dati di esempio nel browser) altrimenti. */
(function () {
  "use strict";
  var cfg = window.AVAMPOSTO_CONFIG || {};
  var LIVE = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  // Libreria Supabase ospitata sul sito (avamposto/vendor/). Il CDN serve solo di riserva se il file manca.
  var HERE = (document.currentScript && document.currentScript.src) || location.href;
  var SUPABASE_JS = new URL("vendor/supabase.js", HERE).href;
  var SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";

  function lower(s) { return String(s || "").trim().toLowerCase(); }
  function nowIso() { return new Date().toISOString(); }
  function uid() { return "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function code() { return Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10); }

  var ERRORS = [
    [/PRELANCIO|Database error saving new user/i, "L'Avamposto non è ancora aperto: per ora entra solo il gruppo di prova. Se ne fai parte, usa la mail che hai dato allo staff."],
    [/Signups not allowed|User not found/i, "Questa mail non risulta iscritta all'Avamposto. Usa «Iscriviti»."],
    [/rate limit|over_email_send_rate|For security purposes/i, "Hai chiesto troppi link in poco tempo. Aspetta un minuto e riprova."],
    [/invalid.*email|Unable to validate email/i, "L'indirizzo email non sembra valido. Controllalo e riprova."],
    [/Invito non valido/i, "Questo link d'invito non è valido o è stato disattivato. Chiedi allo staff un link nuovo."],
    [/row-level security|permission denied|Solo gli amministratori/i, "Non hai i permessi per questa operazione."],
    [/events_link_url_check/i, "Il link dell'evento deve iniziare con https://"],
    [/event_replays_video_url_check/i, "Il link al video deve iniziare con https://"],
    [/events_ends_at_check/i, "La fine dell'evento non può essere prima dell'inizio."],
    [/event_mobilization_kit_url_check/i, "Il link al kit deve iniziare con https://"],
    [/voices_body_check/i, "Il testo deve essere tra 20 e 2500 caratteri."],
    [/voices_link_url_check/i, "Il link deve iniziare con https://"],
    [/whatsapp_url_check/i, "Il link deve essere un link WhatsApp (chat.whatsapp.com o whatsapp.com/channel)."],
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
        return loadScript(SUPABASE_JS).catch(function () { return loadScript(SUPABASE_CDN); }).then(function () {
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
      deleteMyAccount: function () { return q(sb.rpc("delete_my_account")).then(function () { return sb.auth.signOut(); }); },

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
      coverUrl: function (path) {
        if (!path) return "";
        if (/^(data:|blob:|\.\.\/|https?:)/.test(path)) return path;
        return cfg.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/copertine/" + path.split("/").map(encodeURIComponent).join("/");
      },
      accessibleMaterials: function () {
        return session ? q(sb.from("materials").select("id,initiative_id,kind,title,live_at,url,published,created_at")) : Promise.resolve([]);
      },
      myViews: function () { return session ? q(sb.from("material_views").select("material_id")) : Promise.resolve([]); },
      markViewed: function (materialId, on) {
        return on ? q(sb.from("material_views").upsert({ user_id: session.user.id, material_id: materialId }, { onConflict: "user_id,material_id", ignoreDuplicates: true }))
                  : q(sb.from("material_views").delete().eq("user_id", session.user.id).eq("material_id", materialId));
      },
      orgUnits: function () { return q(sb.from("org_units").select("*").order("position").order("created_at")); },
      orgPeople: function () { return q(sb.from("org_people").select("*").order("position").order("created_at")); },
      orgPhotoUrls: function (paths) {
        paths = (paths || []).filter(Boolean);
        if (!paths.length) return Promise.resolve({});
        return q(sb.storage.from("squadra").createSignedUrls(paths, 3600)).then(function (list) {
          var o = {}; (list || []).forEach(function (x) { if (x.signedUrl) o[x.path] = x.signedUrl; }); return o;
        });
      },
      saveUnit: function (u) {
        var row = { parent_id: u.parent_id || null, name: u.name, kind: u.kind, description: u.description || null, whatsapp_url: u.whatsapp_url || null, position: u.position || 0 };
        return u.id ? q(sb.from("org_units").update(row).eq("id", u.id).select().single()) : q(sb.from("org_units").insert(row).select().single());
      },
      deleteUnit: function (id) { return q(sb.from("org_units").delete().eq("id", id)); },
      savePerson: function (pp) {
        var row = { unit_id: pp.unit_id, full_name: pp.full_name, role: pp.role || null, instagram: pp.instagram || null, position: pp.position || 0 };
        return pp.id ? q(sb.from("org_people").update(row).eq("id", pp.id).select().single()) : q(sb.from("org_people").insert(row).select().single());
      },
      deletePerson: function (pp) {
        var rm = pp.photo_path ? q(sb.storage.from("squadra").remove([pp.photo_path])).catch(function () { return null; }) : Promise.resolve();
        return rm.then(function () { return q(sb.from("org_people").delete().eq("id", pp.id)); });
      },
      setPersonPhoto: function (pp, blob) {
        var old = pp.photo_path;
        var removeOld = function () { return old ? q(sb.storage.from("squadra").remove([old])).catch(function () { return null; }) : null; };
        if (!blob) return q(sb.from("org_people").update({ photo_path: null }).eq("id", pp.id)).then(removeOld);
        var path = pp.id + "/" + Date.now() + ".jpg";
        return q(sb.storage.from("squadra").upload(path, blob, { contentType: "image/jpeg" }))
          .then(function () { return q(sb.from("org_people").update({ photo_path: path }).eq("id", pp.id)); }).then(removeOld);
      },
      setCover: function (it, blob) {
        var old = it.cover_path;
        var removeOld = function () { return old && !/^(data:|blob:|\.\.\/|https?:)/.test(old) ? q(sb.storage.from("copertine").remove([old])).catch(function () { return null; }) : null; };
        if (!blob) return q(sb.from("initiatives").update({ cover_path: null }).eq("id", it.id)).then(removeOld);
        var path = it.id + "/" + Date.now() + ".jpg";
        return q(sb.storage.from("copertine").upload(path, blob, { contentType: "image/jpeg", upsert: false }))
          .then(function () { return q(sb.from("initiatives").update({ cover_path: path }).eq("id", it.id)); })
          .then(removeOld).then(function () { return path; });
      },

      /* --- eventi e repliche --- */
      events: function () { return q(sb.from("events").select("*").order("starts_at")); },
      posterUrl: function (path) {
        if (!path) return "";
        if (/^(data:|blob:|\.\.\/|https?:)/.test(path)) return path;
        return cfg.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/locandine/" + path.split("/").map(encodeURIComponent).join("/");
      },
      saveEvent: function (ev) {
        var row = { title: ev.title, starts_at: ev.starts_at, ends_at: ev.ends_at || null, place: ev.place || null, city: ev.city || null,
          summary: ev.summary || null, description: ev.description || null, link_url: ev.link_url || null, link_label: ev.link_label || null,
          kind: ev.kind || "incontro", area: ev.area || "marche", needs_hands: !!ev.needs_hands, published: ev.published !== false };
        return ev.id ? q(sb.from("events").update(row).eq("id", ev.id).select().single()) : q(sb.from("events").insert(row).select().single());
      },
      deleteEvent: function (ev) {
        var rm = ev.poster_path && !/^(data:|blob:|\.\.\/|https?:)/.test(ev.poster_path) ? q(sb.storage.from("locandine").remove([ev.poster_path])).catch(function () { return null; }) : Promise.resolve();
        return rm.then(function () { return q(sb.from("events").delete().eq("id", ev.id)); });
      },
      setPoster: function (ev, blob) {
        var old = ev.poster_path;
        var removeOld = function () { return old && !/^(data:|blob:|\.\.\/|https?:)/.test(old) ? q(sb.storage.from("locandine").remove([old])).catch(function () { return null; }) : null; };
        if (!blob) return q(sb.from("events").update({ poster_path: null }).eq("id", ev.id)).then(removeOld);
        var path = ev.id + "/" + Date.now() + ".jpg";
        return q(sb.storage.from("locandine").upload(path, blob, { contentType: "image/jpeg", upsert: false }))
          .then(function () { return q(sb.from("events").update({ poster_path: path }).eq("id", ev.id)); }).then(removeOld);
      },
      mobilization: function () { return session ? q(sb.from("event_mobilization").select("*")) : Promise.resolve([]); },
      saveMobilization: function (m) {
        return q(sb.from("event_mobilization").upsert({ event_id: m.event_id, slots: m.slots || null, meeting_point: m.meeting_point || null,
          kit_url: m.kit_url || null, notes: m.notes || null, updated_at: nowIso() }, { onConflict: "event_id" }));
      },
      signupCounts: function () { return q(sb.rpc("signup_counts")); },
      /* --- pre-lancio --- */
      prelancio: function () { return q(sb.rpc("prelancio")).catch(function () { return false; }); },
      setPrelancio: function (on) { return q(sb.from("site_settings").upsert({ key: "prelancio", value: !!on, updated_at: new Date().toISOString() })); },
      prelaunchList: function () { return q(sb.from("prelaunch_list").select("*").order("created_at", { ascending: false })); },
      addPrelaunch: function (emails, note) {
        return q(sb.from("prelaunch_list").upsert(emails.map(function (m) { return { email: m, note: note || null }; }), { onConflict: "email" }));
      },
      removePrelaunch: function (email) { return q(sb.from("prelaunch_list").delete().eq("email", email)); },
      /* --- voci under 30 --- */
      publicVoices: function (n) { return q(sb.rpc("public_voices", { p_limit: n || 60 })); },
      myVoices: function () { return session ? q(sb.from("voices").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false })) : Promise.resolve([]); },
      saveVoice: function (v) {
        var row = { kind: v.kind, title: v.title || null, body: v.body, topic: v.topic || null, link_url: v.link_url || null, signature: v.signature, city: v.city || null };
        return v.id ? q(sb.from("voices").update(row).eq("id", v.id).select().single()) : q(sb.from("voices").insert(row).select().single());
      },
      deleteVoice: function (id) { return q(sb.from("voices").delete().eq("id", id)); },
      allVoices: function () { return q(sb.from("voices").select("*").order("created_at", { ascending: false })); },
      moderateVoice: function (id, patch) { return q(sb.from("voices").update(patch).eq("id", id).select().single()); },
      mySignups: function () { return session ? q(sb.from("event_signups").select("*").eq("user_id", session.user.id)) : Promise.resolve([]); },
      signup: function (eventId, data) {
        return q(sb.from("event_signups").upsert({ event_id: eventId, user_id: session.user.id, email: email(), full_name: data.full_name || null,
          slot: data.slot || null, note: data.note || null }, { onConflict: "event_id,user_id" }));
      },
      cancelSignup: function (eventId) { return q(sb.from("event_signups").delete().eq("event_id", eventId).eq("user_id", session.user.id)); },
      allSignups: function () { return q(sb.from("event_signups").select("*").order("created_at")); },
      removeSignup: function (eventId, userId) { return q(sb.from("event_signups").delete().eq("event_id", eventId).eq("user_id", userId)); },
      replayList: function () { return q(sb.rpc("replay_list")); },
      replays: function () {
        return session ? q(sb.from("event_replays").select("*").order("recorded_on", { ascending: false }).order("created_at", { ascending: false })) : Promise.resolve([]);
      },
      saveReplay: function (r) {
        var row = { event_id: r.event_id || null, title: r.title, recorded_on: r.recorded_on, video_url: r.video_url, description: r.description || null, published: r.published !== false };
        return r.id ? q(sb.from("event_replays").update(row).eq("id", r.id).select().single()) : q(sb.from("event_replays").insert(row).select().single());
      },
      deleteReplay: function (id) { return q(sb.from("event_replays").delete().eq("id", id)); },

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
          return q(sb.storage.from("copertine").list(id, { limit: 100 })).then(function (files) {
            var paths = (files || []).map(function (f) { return id + "/" + f.name; });
            return paths.length ? q(sb.storage.from("copertine").remove(paths)) : null;
          }).catch(function () { return null; });
        }).then(function () {
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
  var DEMO_KEY = "avamposto-demo-v3";
  var DEMO_ADMIN = "staff@esempio.it";

  function seed() {
    var day = 86400000, t = Date.now();
    function iso(offsetDays, h, m) { var d = new Date(t + offsetDays * day); d.setHours(h || 18, m || 0, 0, 0); return d.toISOString(); }
    var I = {
      com: "demo-comunicazione", eu: "demo-europa", spec: "demo-speciali", social: "demo-social"
    };
    return {
      session: null,
      views: { "mario.rossi@esempio.it": { "demo-m1": iso(-6) } },
      admins: [DEMO_ADMIN],
      users: {
        "mario.rossi@esempio.it": { full_name: "Mario Rossi (esempio)", membership: "tesserato", privacy_at: iso(-20), created_at: iso(-20) },
        "giulia.bianchi@esempio.it": { full_name: "Giulia Bianchi (esempio)", membership: "simpatizzante", privacy_at: iso(-12), created_at: iso(-12) },
        "luca.verdi@esempio.it": { full_name: "Luca Verdi (esempio)", membership: "tesserato", privacy_at: iso(-3), created_at: iso(-3) },
        "staff@esempio.it": { full_name: "Staff Under 30 Marche", membership: "tesserato", privacy_at: iso(-30), created_at: iso(-30) }
      },
      initiatives: [
        { id: I.com, slug: "comunicazione-politica", title: "Corso di comunicazione politica", kind: "corso", access: "su_richiesta", published: true, position: 1, cover_path: "../assets/foto/evento-roma-platea.jpg",
          starts_on: iso(-7).slice(0, 10), created_at: iso(-25),
          summary: "Scrivere per i social, parlare in pubblico, gestire un'intervista. Quattro incontri con esercitazioni.",
          description: "Un percorso pratico per chi cura i canali social del gruppo o interviene in pubblico.\n\nOgni incontro ha una parte teorica breve e un'esercitazione su casi reali della settimana." },
        { id: I.eu, slug: "europa-istituzioni", title: "Scuola di formazione: Europa e istituzioni", kind: "formazione", access: "su_richiesta", published: true, position: 2,
          starts_on: iso(5).slice(0, 10), created_at: iso(-15),
          summary: "Come funzionano Commissione, Parlamento e Consiglio, e perché contano per le Marche.",
          description: "Ciclo di tre dirette con ospiti, seguite da materiali di approfondimento." },
        { id: I.spec, slug: "contenuti-speciali", title: "Contenuti speciali", kind: "contenuti", access: "aperta", published: true, position: 3, cover_path: "../assets/foto/piazza-bandiere.jpg",
          created_at: iso(-30),
          summary: "Approfondimenti e materiali riservati a tutti gli iscritti all'Avamposto.",
          description: "Qui trovi i contenuti extra pubblicati dallo staff: schede, dossier e registrazioni degli eventi." },
        { id: I.social, slug: "laboratorio-social", title: "Laboratorio social", kind: "corso", access: "su_richiesta", published: false, position: 4,
          created_at: iso(-1),
          summary: "Bozza: non ancora visibile agli iscritti.",
          description: "Iniziativa in preparazione." }
      ],
      events: [
        { id: "ev-aperitivo", kind: "aperitivo", area: "an", needs_hands: false, title: "Aperitivo Under 30", starts_at: iso(4, 19, 0), ends_at: iso(4, 21, 30), place: "Bar in centro (esempio)", city: "Ancona",
          summary: "Due chiacchiere, uno spritz e i programmi per i prossimi mesi. Porta un amico.", description: "Ci vediamo per conoscerci, presentare i gruppi di lavoro e raccogliere idee per la primavera.\n\nIngresso libero, consumazione a carico di ciascuno.",
          link_url: "https://www.instagram.com/azioneunder30marche/", link_label: "Segui gli aggiornamenti", poster_path: "../assets/foto/cena.jpg", published: true, created_at: iso(-3) },
        { id: "ev-europa", kind: "incontro", area: "mc", needs_hands: false, title: "Europa, istruzioni per l'uso", starts_at: iso(12, 18, 0), ends_at: iso(12, 20, 0), place: "Sala conferenze (esempio)", city: "Macerata",
          summary: "Come si decide a Bruxelles e perché conta per chi vive nelle Marche.", description: "Incontro aperto a tutti con domande dal pubblico. Al termine, aperitivo insieme.",
          link_url: "https://noi.azione.it/primo-tesseramento/", link_label: "Prenota il posto", poster_path: "../assets/foto/piazza-bandiere.jpg", published: true, created_at: iso(-6) },
        { id: "ev-banchetto", kind: "mobilitazione", area: "pu", needs_hands: true, title: "Banchetto in piazza", starts_at: iso(19, 10, 30), ends_at: iso(19, 13, 0), place: "Piazza centrale (esempio)", city: "Pesaro",
          summary: "Volantinaggio e tesseramento: vieni a darci una mano anche solo per un'ora.", description: "", link_url: "", link_label: "",
          poster_path: "../assets/foto/centro-storico.jpg", published: true, created_at: iso(-2) },
        { id: "ev-volantini", kind: "mobilitazione", area: "an", needs_hands: true, title: "Volantinaggio all'università", starts_at: iso(8, 8, 30), ends_at: iso(8, 11, 0), place: "Ingresso del polo universitario (esempio)", city: "Ancona",
          summary: "Volantini sul tesseramento e sugli eventi del mese. Bastano due ore del tuo tempo.", description: "", link_url: "", link_label: "", poster_path: "../assets/foto/corso-magliette.jpg", published: true, created_at: iso(-1) },
        { id: "ev-bozza", kind: "aperitivo", area: "fm", needs_hands: false, title: "Cena di fine anno (bozza)", starts_at: iso(40, 20, 30), place: "", city: "Fermo", summary: "Ancora da confermare.", poster_path: "", published: false, created_at: iso(-1) },
        { id: "ev-diretta", kind: "diretta", area: "online", needs_hands: false, title: "Diretta: come nasce una legge europea", starts_at: iso(-10, 21, 0), ends_at: iso(-10, 22, 0), place: "Online", city: "",
          summary: "Un'ora per capire il percorso di una legge, dalla Commissione al voto finale.", description: "", poster_path: "../assets/foto/evento-roma-platea.jpg", published: true, created_at: iso(-20) },
        { id: "ev-roma", kind: "incontro", area: "fuori", needs_hands: false, title: "Tutti a Roma", starts_at: iso(-24, 9, 0), place: "Roma", city: "Roma",
          summary: "La trasferta con il gruppo Marche all'evento nazionale.", description: "", poster_path: "../assets/foto/evento-roma-gruppo.jpg", published: true, created_at: iso(-40) }
      ],
      mobilization: [
        { event_id: "ev-banchetto", slots: "10:30 – 11:45\n11:45 – 13:00", meeting_point: "Davanti al municipio, 15 minuti prima del turno", kit_url: "https://drive.google.com/", notes: "Porta la maglietta di Azione se ce l'hai. Il gazebo e i volantini li portiamo noi." },
        { event_id: "ev-volantini", slots: "8:30 – 9:45\n9:45 – 11:00", meeting_point: "Fermata dell'autobus davanti all'ingresso", kit_url: "", notes: "Due persone per turno bastano." }
      ],
      signups: [
        { event_id: "ev-banchetto", user_id: "giulia.bianchi@esempio.it", email: "giulia.bianchi@esempio.it", full_name: "Giulia Bianchi (esempio)", slot: "10:30 – 11:45", note: "", created_at: iso(-1) },
        { event_id: "ev-banchetto", user_id: "luca.verdi@esempio.it", email: "luca.verdi@esempio.it", full_name: "Luca Verdi (esempio)", slot: "11:45 – 13:00", note: "Porto anche un amico", created_at: iso(-1) }
      ],
      replays: [
        { id: "rp-1", event_id: "ev-diretta", title: "Come nasce una legge europea", recorded_on: iso(-10).slice(0, 10), video_url: "", description: "La registrazione completa della diretta, con le domande finali.", published: true, created_at: iso(-9) },
        { id: "rp-2", event_id: null, title: "Q&A con lo staff: come funzionano i gruppi di lavoro", recorded_on: iso(-30).slice(0, 10), video_url: "", description: "Mezz'ora di domande e risposte per chi è appena entrato.", published: true, created_at: iso(-29) }
      ],
      voices: [
        { id: "vo-1", user_id: "giulia.bianchi@esempio.it", kind: "riflessione", title: "Perché resto nelle Marche", body: "Tutti mi chiedono quando me ne vado. Io vorrei restare, ma servono treni che arrivano in orario, affitti accessibili vicino alle università e aziende che assumono chi ha studiato qui. Non chiedo miracoli: chiedo che chi governa la regione smetta di considerarci di passaggio.", topic: "", link_url: "", signature: "nome", author_name: "Giulia Bianchi (esempio)", city: "Macerata", status: "approved", staff_note: "", created_at: iso(-6), published_at: iso(-5) },
        { id: "vo-2", user_id: "luca.verdi@esempio.it", kind: "commento", title: "", body: "Bene che se ne parli, ma la manovra continua a spendere tanto per chi è già in pensione e poco per chi deve ancora entrare nel mondo del lavoro. Un under 30 queste cose le guarda con attenzione.", topic: "Manovra 2027", link_url: "", signature: "completo", author_name: "Luca Verdi (esempio)", city: "Ancona", status: "approved", staff_note: "", created_at: iso(-3), published_at: iso(-2) },
        { id: "vo-3", user_id: "mario.rossi@esempio.it", kind: "nota", title: "", body: "Ieri al banchetto un signore di ottant'anni ci ha detto: finalmente dei giovani che parlano di Europa senza urlare. Ce lo teniamo stretto.", topic: "", link_url: "", signature: "anonimo", author_name: "Mario Rossi (esempio)", city: "Pesaro", status: "approved", staff_note: "", created_at: iso(-2), published_at: iso(-1) },
        { id: "vo-4", user_id: "luca.verdi@esempio.it", kind: "riflessione", title: "Il servizio civile europeo", body: "Proposta: un anno di servizio civile in un altro paese dell'Unione, riconosciuto come credito universitario. Costa poco e costruisce europei veri.", topic: "", link_url: "", signature: "nome", author_name: "Luca Verdi (esempio)", city: "Fermo", status: "pending", staff_note: "", created_at: iso(0), published_at: null }
      ],
      org: (function () {
        var U = function (id, parent, name, kind, desc, pos) { return { id: id, parent_id: parent, name: name, kind: kind, description: desc, whatsapp_url: null, position: pos }; };
        var P = function (id, unit, name, role, pos) { return { id: id, unit_id: unit, full_name: name, role: role, instagram: null, photo_path: null, position: pos }; };
        return {
          units: [U("u-reg", null, "Coordinamento Regionale Marche", "coordinamento", null, 1),
            U("u-gdl", "u-reg", "Gruppi di Lavoro", "area", "Coordinamento Gruppi di Lavoro", 2),
            U("u-prov", "u-reg", "Coordinamenti Provinciali", "area", "Rete Provinciali", 3),
            U("u-com", "u-gdl", "GdL Comunicazione & Social", "gruppo", null, 1),
            U("u-org", "u-gdl", "GdL Organizzazione & Logistica", "gruppo", null, 2),
            U("u-tes", "u-gdl", "GdL Tesoreria & Radicamento", "gruppo", null, 3),
            U("u-pu", "u-prov", "Provincia di Pesaro-Urbino", "provincia", "Referente PU", 1),
            U("u-an", "u-prov", "Provincia di Ancona", "provincia", "Referente AN", 2),
            U("u-mc", "u-prov", "Provincia di Macerata", "provincia", "Referente MC", 3),
            U("u-fm", "u-prov", "Provincia di Fermo", "provincia", "Referente FM", 4),
            U("u-ap", "u-prov", "Provincia di Ascoli Piceno", "provincia", "Referente AP", 5)],
          people: [P("p1", "u-reg", "Nome Cognome (esempio)", "Coordinatore Regionale", 1),
            P("p2", "u-gdl", "Nome Cognome (esempio)", "Coordinamento Gruppi di Lavoro", 1),
            P("p3", "u-prov", "Nome Cognome (esempio)", "Rete Provinciali", 1),
            P("p4", "u-com", "Nome Cognome (esempio)", "Referente Comunicazione", 1),
            P("p5", "u-org", "Nome Cognome (esempio)", "Referente Eventi", 1),
            P("p6", "u-tes", "Nome Cognome (esempio)", "Tesoriere & Referente Radicamento", 1),
            P("p7", "u-tes", "Nome Cognome (esempio)", "Tesoriere & Referente Radicamento", 2)]
        };
      })(),
      invites: (function () { var o = {}; [I.com, I.eu, I.spec, I.social].forEach(function (id) { o[id] = { initiative_id: id, code: code(), active: true }; }); return o; })(),
      enrollments: [
        { initiative_id: I.com, email: "mario.rossi@esempio.it", status: "attiva", source: "manuale", created_at: iso(-18), decided_at: iso(-18) },
        { initiative_id: I.eu, email: "mario.rossi@esempio.it", status: "richiesta", source: "richiesta", created_at: iso(-1) },
        { initiative_id: I.com, email: "giulia.bianchi@esempio.it", status: "richiesta", source: "richiesta", created_at: iso(-2) },
        { initiative_id: I.eu, email: "luca.verdi@esempio.it", status: "attiva", source: "invito", created_at: iso(-3), decided_at: iso(-3) }
      ],
      materials: [
        { id: "demo-m1", initiative_id: I.com, kind: "video", title: "Lezione 1 – Scrivere un post che si fa leggere", url: "", body: "Durata 25 minuti. Guardala prima della diretta di giovedì.", position: 1, published: true, created_at: iso(-7) },
        { id: uid(), initiative_id: I.com, kind: "pdf", title: "Slide della lezione 1", file_path: "", body: "PDF di esempio.", position: 2, published: true, created_at: iso(-7) },
        { id: uid(), initiative_id: I.com, kind: "diretta", title: "Lezione 2 – Parlare in pubblico (diretta)", url: "https://meet.google.com/", live_at: iso(2, 18, 30), body: "Porta un intervento di due minuti su un tema della rassegna.", position: 3, published: true, created_at: iso(-6) },
        { id: uid(), initiative_id: I.com, kind: "testo", title: "Esercitazione della settimana", body: "Prendi una notizia dalla rassegna di oggi e scrivi:\n\n**1.** un post di massimo 600 caratteri;\n**2.** tre titoli alternativi per una storia Instagram.\n\nCarica il lavoro nel gruppo del corso entro venerdì.", position: 4, published: true, created_at: iso(-5) },
        { id: uid(), initiative_id: I.eu, kind: "diretta", title: "Primo incontro: come nasce una legge europea", url: "https://meet.google.com/", live_at: iso(5, 21, 0), body: "Diretta su Meet, durata circa un'ora.", position: 1, published: true, created_at: iso(-10) },
        { id: uid(), initiative_id: I.spec, kind: "testo", title: "Benvenuto nell'Avamposto", body: "Questa è l'area riservata di Azione Under 30 Marche.\n\nIn **Contenuti speciali** trovi i materiali aperti a tutti gli iscritti. Dal **catalogo** puoi chiedere di partecipare ai corsi: lo staff approva le richieste.", position: 1, published: true, created_at: iso(-30) },
        { id: uid(), initiative_id: I.spec, kind: "link", title: "La rassegna stampa di oggi", url: "../rassegna/", body: "Il Punto Under 30 – Marche, ogni mattina alle 8.", position: 2, published: true, created_at: iso(-30) }
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
      init: function () { S = load(); var fresh = null; ["events", "replays", "mobilization", "signups", "voices"].forEach(function (k) { if (!S[k] || (k === "events" && !S.events.some(function (e) { return e.kind; }))) { fresh = fresh || seed(); S[k] = fresh[k]; } }); save(); return Promise.resolve(); },
      reset: function () { S = seed(); save(); listeners.forEach(function (f) { f(); }); },
      onAuthChange: function (f) { listeners.push(f); },
      me: function () { return S.session ? { id: me(), email: me() } : null; },
      signUp: function (form) {
        var m = lower(form.email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return Promise.reject(new Error(friendly({ message: "invalid email" })));
        if (S.prelancio && !S.users[m] && S.admins.indexOf(m) < 0 && !(S.prelaunch || []).some(function (x) { return x.email === m; })) return Promise.reject(new Error(friendly({ message: "PRELANCIO" })));
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
      deleteMyAccount: function () {
        var m = me(); if (!m) return deny();
        delete S.users[m];
        S.enrollments = S.enrollments.filter(function (e) { return e.email !== m; });
        S.signups = (S.signups || []).filter(function (x) { return x.user_id !== m; });
        S.voices = (S.voices || []).filter(function (x) { return x.user_id !== m; });
        if (S.views) delete S.views[m];
        setSession(null); return delay({});
      },

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
      coverUrl: function (path) { return path || ""; },
      orgUnits: function () { return me() ? delay(clone(S.org.units).sort(function (a, b) { return a.position - b.position; })) : deny(); },
      orgPeople: function () { return me() ? delay(clone(S.org.people).sort(function (a, b) { return a.position - b.position; })) : deny(); },
      orgPhotoUrls: function (paths) { var o = {}; (paths || []).forEach(function (p) { if (p) o[p] = p; }); return delay(o); },
      saveUnit: function (u) {
        if (!admin()) return deny();
        if (u.whatsapp_url && !/^https:\/\/(chat\.whatsapp\.com|(www\.)?whatsapp\.com\/channel|wa\.me)\//.test(u.whatsapp_url)) return Promise.reject(new Error("Il link deve essere un link WhatsApp (chat.whatsapp.com o whatsapp.com/channel)."));
        var row;
        if (u.id) { row = S.org.units.filter(function (x) { return x.id === u.id; })[0]; Object.assign(row, u); }
        else { var f = Object.assign({}, u); delete f.id; row = Object.assign({ id: uid() }, f); S.org.units.push(row); }
        save(); return delay(clone(row));
      },
      deleteUnit: function (id) {
        if (!admin()) return deny();
        S.org.units = S.org.units.filter(function (x) { return x.id !== id; });
        S.org.units.forEach(function (x) { if (x.parent_id === id) x.parent_id = null; });
        S.org.people = S.org.people.filter(function (x) { return x.unit_id !== id; });
        save(); return delay({});
      },
      savePerson: function (pp) {
        if (!admin()) return deny();
        var row;
        if (pp.id) { row = S.org.people.filter(function (x) { return x.id === pp.id; })[0]; Object.assign(row, pp); }
        else { var f = Object.assign({}, pp); delete f.id; row = Object.assign({ id: uid(), photo_path: null }, f); S.org.people.push(row); }
        save(); return delay(clone(row));
      },
      deletePerson: function (pp) { if (!admin()) return deny(); S.org.people = S.org.people.filter(function (x) { return x.id !== pp.id; }); save(); return delay({}); },
      setPersonPhoto: function (pp, blob) {
        if (!admin()) return deny();
        var row = S.org.people.filter(function (x) { return x.id === pp.id; })[0];
        if (!blob) { row.photo_path = null; save(); return delay({}); }
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { row.photo_path = fr.result; save(); res({}); }; fr.readAsDataURL(blob); });
      },
      accessibleMaterials: function () {
        if (!me()) return delay([]);
        return delay(clone(S.materials.filter(function (m) { return hasAccess(m.initiative_id) && (m.published || admin()); })));
      },
      myViews: function () {
        var v = (S.views || {})[me()] || {};
        return delay(Object.keys(v).map(function (k) { return { material_id: k }; }));
      },
      markViewed: function (id, on) {
        if (!me()) return deny();
        S.views = S.views || {}; var v = S.views[me()] = S.views[me()] || {};
        if (on) v[id] = nowIso(); else delete v[id];
        save(); return delay({});
      },
      setCover: function (it, blob) {
        if (!admin()) return deny();
        var row = initById(it.id);
        if (!blob) { row.cover_path = null; save(); return delay(null); }
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { row.cover_path = fr.result; save(); res(fr.result); };
          fr.readAsDataURL(blob);
        });
      },
      fileUrl: function (path) {
        if (path && path.indexOf("blob:") === 0) return delay(path);
        return Promise.reject(new Error("Nel prototipo i PDF di esempio non contengono un file vero."));
      },

      events: function () {
        return delay(clone(S.events.filter(function (e) { return e.published || admin(); }).sort(function (a, b) { return a.starts_at < b.starts_at ? -1 : 1; })));
      },
      posterUrl: function (path) { return path || ""; },
      saveEvent: function (ev) {
        if (!admin()) return deny();
        if (ev.link_url && !/^https?:\/\//.test(ev.link_url)) return Promise.reject(new Error("Il link deve iniziare con https://"));
        var row;
        if (ev.id) { row = S.events.filter(function (x) { return x.id === ev.id; })[0]; Object.assign(row, ev); }
        else { var f = Object.assign({}, ev); delete f.id; row = Object.assign({ id: uid(), created_at: nowIso(), poster_path: "" }, f); S.events.push(row); }
        save(); return delay(clone(row));
      },
      deleteEvent: function (ev) {
        if (!admin()) return deny();
        S.events = S.events.filter(function (x) { return x.id !== ev.id; });
        S.replays.forEach(function (r) { if (r.event_id === ev.id) r.event_id = null; });
        S.mobilization = S.mobilization.filter(function (x) { return x.event_id !== ev.id; });
        S.signups = S.signups.filter(function (x) { return x.event_id !== ev.id; });
        save(); return delay({});
      },
      setPoster: function (ev, blob) {
        if (!admin()) return deny();
        var row = S.events.filter(function (x) { return x.id === ev.id; })[0];
        if (!blob) { row.poster_path = ""; save(); return delay({}); }
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { row.poster_path = fr.result; try { save(); } catch (e) {} res({}); }; fr.readAsDataURL(blob); });
      },
      mobilization: function () { return me() ? delay(clone(S.mobilization)) : delay([]); },
      saveMobilization: function (m) {
        if (!admin()) return deny();
        if (m.kit_url && !/^https:\/\//.test(m.kit_url)) return Promise.reject(new Error("Il link al kit deve iniziare con https://"));
        var ex = S.mobilization.filter(function (x) { return x.event_id === m.event_id; })[0];
        if (ex) Object.assign(ex, m); else S.mobilization.push(Object.assign({}, m));
        save(); return delay({});
      },
      signupCounts: function () {
        var o = {}; S.signups.forEach(function (x) { o[x.event_id] = (o[x.event_id] || 0) + 1; });
        return delay(Object.keys(o).map(function (k) { return { event_id: k, n: o[k] }; }));
      },
      prelancio: function () { return delay(!!S.prelancio); },
      setPrelancio: function (on) { if (!admin()) return deny(); S.prelancio = !!on; save(); return delay({}); },
      prelaunchList: function () { return admin() ? delay(clone(S.prelaunch || [])) : deny(); },
      addPrelaunch: function (emails, note) {
        if (!admin()) return deny(); S.prelaunch = S.prelaunch || [];
        emails.forEach(function (m) { if (!S.prelaunch.some(function (x) { return x.email === m; })) S.prelaunch.unshift({ email: m, note: note || "", created_at: nowIso() }); });
        save(); return delay({});
      },
      removePrelaunch: function (email) { if (!admin()) return deny(); S.prelaunch = (S.prelaunch || []).filter(function (x) { return x.email !== email; }); save(); return delay({}); },
      publicVoices: function (n) {
        var shown = function (v) {
          if (v.signature === "anonimo") return null;
          var nm = String(v.author_name || "").replace(/\s*\(esempio\)\s*$/, "").trim();
          if (v.signature === "completo") return v.author_name;
          var parts = nm.split(/\s+/); return parts.length > 1 ? parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + "." + (/(esempio)/.test(v.author_name) ? " (esempio)" : "") : parts[0];
        };
        return delay(S.voices.filter(function (v) { return v.status === "approved"; })
          .sort(function (a, b) { return a.published_at < b.published_at ? 1 : -1; }).slice(0, n || 60)
          .map(function (v) { return { id: v.id, kind: v.kind, title: v.title, body: v.body, topic: v.topic, link_url: v.link_url, display_name: shown(v), city: v.city, published_at: v.published_at }; }));
      },
      myVoices: function () { return delay(clone(S.voices.filter(function (v) { return v.user_id === me(); }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }))); },
      saveVoice: function (v) {
        var m = me(); if (!m) return deny();
        if (!v.body || v.body.trim().length < 20) return Promise.reject(new Error("Scrivi almeno 20 caratteri."));
        if (v.body.length > 2500) return Promise.reject(new Error("Il testo è troppo lungo (massimo 2500 caratteri)."));
        if (v.link_url && !/^https:\/\//.test(v.link_url)) return Promise.reject(new Error("Il link deve iniziare con https://"));
        var name = (S.users[m] || {}).full_name || m, row;
        if (v.id) {
          row = S.voices.filter(function (x) { return x.id === v.id && x.user_id === m; })[0];
          if (!row || row.status === "approved") return deny();
          Object.assign(row, v, { status: "pending", staff_note: "", published_at: null, author_name: name, updated_at: nowIso() });
        } else {
          if (S.voices.filter(function (x) { return x.user_id === m && x.status === "pending"; }).length >= 5) return Promise.reject(new Error("Hai già 5 testi in attesa di approvazione: aspetta che lo staff li legga."));
          var f = Object.assign({}, v); delete f.id;
          row = Object.assign({ id: uid(), user_id: m, created_at: nowIso() }, f, { status: "pending", staff_note: "", published_at: null, author_name: name });
          S.voices.push(row);
        }
        save(); return delay(clone(row));
      },
      deleteVoice: function (id) {
        var m = me(); var row = S.voices.filter(function (x) { return x.id === id; })[0];
        if (!row || (row.user_id !== m && !admin())) return deny();
        S.voices = S.voices.filter(function (x) { return x.id !== id; }); save(); return delay({});
      },
      allVoices: function () { return admin() ? delay(clone(S.voices.slice().sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }))) : deny(); },
      moderateVoice: function (id, patch) {
        if (!admin()) return deny();
        var row = S.voices.filter(function (x) { return x.id === id; })[0];
        if (patch.status === "approved" && row.status !== "approved") patch.published_at = nowIso();
        if (patch.status && patch.status !== "approved") patch.published_at = null;
        Object.assign(row, patch); save(); return delay(clone(row));
      },
      mySignups: function () { return delay(clone(S.signups.filter(function (x) { return x.user_id === me(); }))); },
      signup: function (eventId, data) {
        if (!me()) return deny();
        var ev = S.events.filter(function (e) { return e.id === eventId; })[0];
        if (!ev || !ev.published || !ev.needs_hands) return deny();
        S.signups = S.signups.filter(function (x) { return !(x.event_id === eventId && x.user_id === me()); });
        S.signups.push({ event_id: eventId, user_id: me(), email: me(), full_name: data.full_name || "", slot: data.slot || "", note: data.note || "", created_at: nowIso() });
        save(); return delay({});
      },
      cancelSignup: function (eventId) { S.signups = S.signups.filter(function (x) { return !(x.event_id === eventId && x.user_id === me()); }); save(); return delay({}); },
      allSignups: function () { return admin() ? delay(clone(S.signups)) : deny(); },
      removeSignup: function (eventId, userId) { if (!admin()) return deny(); S.signups = S.signups.filter(function (x) { return !(x.event_id === eventId && x.user_id === userId); }); save(); return delay({}); },
      replayList: function () {
        return delay(S.replays.filter(function (r) { return r.published; }).map(function (r) {
          return { id: r.id, event_id: r.event_id, title: r.title, recorded_on: r.recorded_on, description: r.description };
        }).sort(function (a, b) { return a.recorded_on < b.recorded_on ? 1 : -1; }));
      },
      replays: function () {
        if (!me()) return delay([]);
        return delay(clone(S.replays.filter(function (r) { return r.published || admin(); }).sort(function (a, b) { return a.recorded_on < b.recorded_on ? 1 : -1; })));
      },
      saveReplay: function (r) {
        if (!admin()) return deny();
        if (r.video_url && !/^https:\/\//.test(r.video_url)) return Promise.reject(new Error("Il link al video deve iniziare con https://"));
        var row;
        if (r.id) { row = S.replays.filter(function (x) { return x.id === r.id; })[0]; Object.assign(row, r); }
        else { var f = Object.assign({}, r); delete f.id; row = Object.assign({ id: uid(), created_at: nowIso() }, f); S.replays.push(row); }
        save(); return delay(clone(row));
      },
      deleteReplay: function (id) { if (!admin()) return deny(); S.replays = S.replays.filter(function (x) { return x.id !== id; }); save(); return delay({}); },

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
