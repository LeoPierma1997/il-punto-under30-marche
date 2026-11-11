# Post e reel da Instagram sul sito

La pagina `social/` e l'anteprima «Dal nostro Instagram» in home si riempiono da sole:
ogni due ore il flusso GitHub **«Post e reel da Instagram»** legge gli ultimi 24 contenuti
di @azioneunder30marche, salva le copertine nel sito (`assets/social/`) e scrive `data/social.json`.
Chi visita il sito non contatta Instagram finché non tocca un post.

Finché non è collegato, la pagina Social mostra «I nostri post arrivano presto» e in home la sezione non compare.
Con `?demo=1` si vedono post di esempio.

## Collegare Instagram (una volta, circa 15 minuti)

1. **Account professionale.** Nell'app Instagram: Impostazioni → Tipo di account e strumenti →
   passa ad account professionale (Creator o Business). È gratis e non cambia nulla per chi vi segue.
2. **App su Meta.** Vai su developers.facebook.com, entra con un account Facebook, «Le mie app» → «Crea app».
   Scegli il caso d'uso per gestire contenuti di Instagram e aggiungi il prodotto **Instagram**
   («API con accesso tramite Instagram»). L'app può restare in modalità sviluppo: serve solo a leggere i vostri post.
3. **Token.** Nella configurazione dell'API, sezione «Genera token di accesso», aggiungi l'account
   @azioneunder30marche, accedi e copia il **token** che compare (dura 60 giorni).
   Non incollarlo mai in chat né in un file del sito.
4. **Segreto su GitHub.** Nel repository: Settings → Secrets and variables → Actions → New repository secret.
   Nome `IG_TOKEN`, valore il token.
5. **Rinnovo automatico (consigliato).** Il flusso rinnova il token ogni lunedì. Se Instagram restituisce un token
   diverso, per salvarlo da solo serve un secondo segreto:
   - github.com → Settings (del tuo profilo) → Developer settings → Personal access tokens → Fine-grained tokens → Generate;
   - accesso solo al repository `il-punto-under30-marche`, permesso **Secrets: Read and write**;
   - salvalo nel repository come segreto `GH_PAT`.
   Senza `GH_PAT`, se il token cambia bisogna ripetere il punto 3 prima dei 60 giorni (il registro del flusso lo segnala).
6. **Prima prova.** Actions → «Post e reel da Instagram» → Run workflow. Dopo un paio di minuti i post sono sul sito.

## Note
- Si vedono gli ultimi 24 contenuti; le copertine dei post non più tra gli ultimi 24 vengono tolte dal sito.
- Reel, post e caroselli hanno un'etichetta diversa; nella pagina Social si filtrano con «Reel» e «Post».
- Per togliere un contenuto dal sito basta archiviarlo o eliminarlo su Instagram: sparisce al giro successivo.

## Alternativa: utente di sistema del portfolio business (token senza scadenza)
Se Meta chiede il portfolio business e l'account Instagram non è collegato a una Pagina Facebook:
1. business.facebook.com/settings → Account → **Account Instagram** → Aggiungi → accedi con @azioneunder30marche.
2. Utenti → **Utenti di sistema** → Aggiungi (ruolo Amministratore) → **Assegna risorse**: l'account Instagram (controllo completo) e l'app.
3. **Genera nuovo token** → scegli l'app → scadenza «Mai» → autorizzazione `instagram_basic` → copia il token.
4. Su GitHub salva due segreti: `IG_TOKEN` (il token) e `IG_USER_ID` (l'ID dell'account Instagram, il numero che si vede in Account → Account Instagram).
Con questo token non serve il rinnovo e non serve `GH_PAT`.
