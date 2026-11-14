/* ===== Bibliothèque commune des cartes interactives (maths et français) : MOTEUR D'EXERCICES =====
   Le moteur du français, rendu commun (14/11/2026). Il gère tout ce qui ne dépend pas du contenu :
   la file d'exercices (progression, exercices « à revoir »), le personnage qui commente, les sons, la voix 🔊, l'étoile,
   l'aide (affichée d'emblée en « Avec aide », indice en deux temps ensuite), le passage automatique à l'exercice suivant, le bilan,
   « Refaire une série » et le bouton de l'étape suivante.
   Ce qui dépend du contenu (cliquer des mots, taper un nombre…) est apporté par des « types » d'exercices : chaque carte écrit les siens.

   CartesExo.html()                  : le balisage à mettre dans la page (un bloc .atoi caché, avec ses zones)
   CartesExo.session({box, mode, serie, guide, charger, texteVoix, indiceFinal, apresFait, suites, defi})
        box          : le bloc .atoi
        mode         : 'aide' | 'seul' | 'corrige' (titre et règles d'aide)
        serie        : liste d'exercices ; chacun est un objet libre (au moins .t = son type) ; .revisable = true : sera reproposé après une erreur
        guide        : adresse de l'image du personnage
        charger(ex, ctx)   : affiche l'exercice (consigne dans ctx.ask, énoncé dans ctx.tok, réponses dans ctx.ch)
        texteVoix(ex)      : texte lu par 🔊
        indiceFinal(ex)    : indice rappelé à la fin d'un exercice raté
        apresFait(ex)      : appelé quand un exercice est terminé (enregistrer la réussite…)
        suites(more, info) : ajoute les boutons de fin de série (étape suivante, écran suivant…) ; info = {mode, ok1, total}
        defi(ex)           : vrai si l'exercice porte l'étiquette « défi »
   ctx (donné à charger et aux gestionnaires) :
        ctx.tache({indice})        : début d'une tâche (remet les erreurs à zéro ; en « Avec aide », montre l'aide)
        ctx.bonne({derniere, indice}) : bonne réponse (message, son) ; derniere = vrai si c'est la dernière tâche de l'exercice → exercice fini
        ctx.faux({indice, reponse, reveler}) : mauvaise réponse (1re fois : encouragement + bouton 💡 ; ensuite : la réponse est montrée par reveler())
        ctx.fini()                 : exercice réussi (sans passer par bonne)
        ctx.dire(texte, 'good'|'bad'|''), ctx.son('ok'|'ko'), ctx.erreurs() : erreurs de la tâche
   session.charger(), session.cur(), session.autre(), session.arreter() */
window.CartesExo=(()=>{
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const melange=n=>{const a=[...Array(n).keys()];for(let k=n-1;k>0;k--){const r=Math.floor(Math.random()*(k+1));[a[k],a[r]]=[a[r],a[k]];}return a;};
  const BRAVO=['Bien joué !','Bravo !','Exact !','Super !','Oui, c’est ça !'],ENC=['Presque ! Regarde bien.','Pas tout à fait. Essaie encore !','Oups ! Regarde encore.'],PARFAIT=['Bravo, du premier coup !','Parfait, du premier coup !','Excellent, sans erreur !'];
  const NOTES={ok:[[660,.12],[880,.18]],fin:[[523,.12],[659,.12],[784,.12],[1047,.3]],ko:[[300,.2]]};
  let ac=null;
  function html(titre){return `<div class="atoi" id="atoi" hidden>
      <div class="atoi-top"><h3>${titre||'À toi !'} <span class="ex-num" id="exNum"></span></h3><span class="atoi-outils no-print"><button type="button" id="lireBtn" class="mini" title="Écouter la consigne" aria-label="Écouter la consigne">🔊 Écouter</button><button type="button" id="sonBtn" class="mini" title="Sons de réussite" aria-label="Sons de réussite">🔔</button></span></div>
      <div class="ex-prog" id="exProg" aria-label="Progression de la série"></div>
      <p class="ask" id="ask"></p><p class="phrase tokens" id="tok"></p><div class="choices" id="choices"></div>
      <div class="fb-row"><p class="fb" id="fb" aria-live="polite"></p></div>
      <div class="indice-row" id="indRow"></div></div>`;}
  function session(o){
    const box=o.box,mode=o.mode,q=s=>box.querySelector(s);
    const ask=q('#ask'),tok=q('#tok'),ch=q('#choices'),fb=q('#fb'),indRow=q('#indRow'),prog=q('#exProg');
    const reduit=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const file=o.serie.map(a=>Object.assign({erreurs:0,fait:false,revu:false},a));
    let idx=0,cur=null,errT=0,errEx=0,ok1=0,vivant=true;
    /* voix, sons, personnage */
    if(o.guide){const im=document.createElement('img');im.className='fb-av';im.alt='';im.src=o.guide;q('.fb-row').prepend(im);}
    const say=(m,cls)=>{fb.className='fb'+(cls?' '+cls:'');fb.textContent=m;};
    let son=true;try{son=localStorage.getItem('atoi-son')!=='0';}catch(_){}
    const sonBtn=q('#sonBtn'),majSon=()=>{sonBtn.textContent=son?'🔔':'🔕';sonBtn.setAttribute('aria-pressed',String(son));};majSon();
    sonBtn.onclick=()=>{son=!son;try{localStorage.setItem('atoi-son',son?'1':'0');}catch(_){}majSon();};
    const bip=nom=>{if(!son)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();let tt=ac.currentTime;NOTES[nom].forEach(([f,d])=>{const os=ac.createOscillator(),gn=ac.createGain();os.type='sine';os.frequency.value=f;gn.gain.setValueAtTime(.0001,tt);gn.gain.exponentialRampToValueAtTime(.18,tt+.02);gn.gain.exponentialRampToValueAtTime(.0001,tt+d);os.connect(gn);gn.connect(ac.destination);os.start(tt);os.stop(tt+d+.02);tt+=d;});}catch(_){}};
    const etoile=()=>{if(reduit)return;const r=q('.fb-row'),s2=document.createElement('span');s2.className='etoile-pop';s2.textContent='⭐';r.appendChild(s2);setTimeout(()=>s2.remove(),1000);};
    const lireBtn=q('#lireBtn');if(!('speechSynthesis' in window))lireBtn.hidden=true;
    lireBtn.onclick=()=>{try{const txt=(o.texteVoix?o.texteVoix(cur):ask.textContent);speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='fr-FR';u.rate=.9;speechSynthesis.speak(u);}catch(_){}};
    /* progression */
    const majNum=()=>{q('#exNum').textContent=file.length>1?`· exercice ${idx+1} sur ${file.length}${cur.revu?' · à revoir':''}${o.defi&&o.defi(cur)?' · défi':''}`:'';};
    const majProg=()=>{majNum();prog.innerHTML=file.map((x,k)=>`<span class="pt${x.fait?(x.erreurs?' ok':' o1'):''}${k===idx?' cur':''}${x.revu?' revu':''}">${x.fait?(x.erreurs?'✓':'★'):k+1}</span>`).join('');};
    const ctx={box,ask,tok,ch,ind:indRow,mode,dire:say,son:bip,erreurs:()=>errT,
      tache(p){errT=0;indRow.innerHTML='';if(mode==='aide'&&p&&p.indice)say('💡 Aide : '+p.indice,'');},
      bonne(p){p=p||{};say(errT>0?'Oui, c’est ça ! '+(p.indice?'Je retiens : '+p.indice:''):(p.derniere?'Oui !':pick(BRAVO)),'good');bip('ok');if(p.derniere)fini();},
      faux(p){p=p||{};errT++;errEx++;bip('ko');
        if(errT===1&&mode!=='aide'){say(pick(ENC),'bad');indRow.innerHTML='<button type="button" class="btn ghost" id="indBtn">💡 Un indice</button>';
          q('#indBtn').onclick=()=>{say('Indice : '+(p.indice||'relis bien la consigne.'),'bad');indRow.innerHTML='';};}
        else{indRow.innerHTML='';say('Regarde : '+(p.indice?p.indice+' ':'')+(p.reponse?`La bonne réponse est « ${p.reponse} ».`:'Les mots à trouver sont colorés.'),'bad');if(p.reveler)p.reveler();}},
      faute(msg){errEx++;bip('ko');say(msg,'bad');},    /* erreur qui ne suit pas le protocole de l'indice (ex. « a-t-il raison ? ») */
      fini};
    function fini(){
      cur.fait=true;cur.erreurs=errEx;
      if(errEx===0)ok1++;else if(!cur.revu&&cur.revisable&&mode!=='aide')file.splice(Math.min(idx+3,file.length),0,Object.assign({},cur,{erreurs:0,fait:false,revu:true}));
      ask.textContent='';ch.innerHTML='';indRow.innerHTML='';
      const ind=o.indiceFinal?o.indiceFinal(cur):'';
      say(errEx===0?pick(PARFAIT):('Bien joué !'+(ind?' Je retiens : '+ind:'')),'good');
      etoile();bip(file.every(x=>x.fait)?'fin':'ok');
      if(o.apresFait)o.apresFait(cur);
      majProg();
      const tout=file.every(x=>x.fait);
      if(!tout){const me=cur;setTimeout(()=>{if(vivant&&!box.hidden&&cur===me&&me.fait)autre();},1600);return;}
      const more=document.createElement('div');more.className='after';
      more.innerHTML=`<p class="bilan">⭐ ${ok1} réussite${ok1>1?'s':''} du premier coup sur ${file.length}</p><button type="button" class="btn ghost ex-autre">↻ Refaire une série</button>`;
      if(o.suites)o.suites(more,{mode,ok1,total:file.length});
      box.appendChild(more);more.querySelector('.ex-autre').onclick=autre;
    }
    function charger(){
      cur=file[idx];errT=0;errEx=0;
      box.querySelectorAll('.after').forEach(x=>x.remove());indRow.innerHTML='';say('');
      majProg();o.charger(cur,ctx);
    }
    function autre(){
      if(file.every(x=>x.fait)){for(let k=file.length-1;k>=0;k--)if(file[k].revu)file.splice(k,1);file.forEach(x=>{x.fait=false;x.erreurs=0;});ok1=0;idx=0;}
      else{let n=idx+1;while(n<file.length&&file[n].fait)n++;if(n>=file.length)n=file.findIndex(x=>!x.fait);idx=n<0?0:n;}
      charger();
    }
    const sess={charger,autre,cur:()=>cur,file,arreter:()=>{vivant=false;},ctx};
    CartesExo.derniere=sess;   /* pour les tests automatiques */
    return sess;
  }
  return {html,session,pick,melange,esc,derniere:null};
})();
