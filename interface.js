/* ===== Bibliothèque commune des cartes interactives (maths et français) : INTERFACE =====
   Un seul code pour les deux cartes. Rien ici ne connaît les maths ni le français : on lui donne des données.
   - CartesUI.entete({couleur, titre, retour?:{href?,titre?}, etapes:[[emoji,nom],…], courante, fait:[bool], desactivees:[bool], carteHref?, retiens?:bool, enseignante?:bool})
   - CartesUI.entetePage({couleur, pastille, titre, carteHref?, retiens?:bool})
   - CartesUI.accueil({couleur, image, message, sous, total, faites})
   - CartesUI.cartes({couleur, liste:[{id, href?, num, icone, titre, etat:'fait'|'suivant'|'', sous}]})
   - CartesUI.majEtapes(racine, courante, fait)         : met à jour les pastilles des étapes
   - CartesUI.surClic(racine, {carte, etape(i), retiens, activite(id), enseignante})  : un seul écouteur
   - CartesUI.retiens(titre, html, couleur)             : fenêtre « Je retiens » (✕, Échap, clic à côté)
   - CartesUI.reussies(cle)                             : {lire():Set, noter(id), a(id)} gardé sur l'appareil (localStorage) */
window.CartesUI=(()=>{
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const st=c=>c?` style="--z:${c}"`:'';
  function entete(o){
    const carte=o.carteHref?`<a class="cu-ic cu-map" data-cu="carte" href="${esc(o.carteHref)}" title="Carte de la leçon" aria-label="Carte de la leçon">🗺️</a>`:`<button type="button" class="cu-ic cu-map" data-cu="carte" title="Carte de la leçon" aria-label="Carte de la leçon">🗺️</button>`;
    const retour=o.retour?(o.retour.href?`<a class="cu-ic" data-cu="retour" href="${esc(o.retour.href)}" title="${esc(o.retour.titre||'Revenir aux activités')}" aria-label="${esc(o.retour.titre||'Revenir aux activités')}">‹</a>`:`<button type="button" class="cu-ic" data-cu="retour" title="${esc((o.retour&&o.retour.titre)||'Revenir aux activités')}" aria-label="${esc((o.retour&&o.retour.titre)||'Revenir aux activités')}">‹</button>`):'';
    const et=(o.etapes||[]).length?`<div class="cu-etapes" role="group" aria-label="Les étapes">${o.etapes.map(([em,nom],i)=>`<button type="button" class="cu-et${o.fait&&o.fait[i]?' fait':''}" data-cu="etape" data-i="${i}" aria-pressed="${i===(o.courante||0)}"${o.desactivees&&o.desactivees[i]?' disabled':''}><i>${o.fait&&o.fait[i]&&i!==(o.courante||0)?'✓':i+1}</i><span class="cu-em" aria-hidden="true">${em}</span><span class="cu-nom">${esc(nom)}</span></button>`).join('')}</div>`:'<span class="cu-sp"></span>';
    return `<div class="cu-hd"${st(o.couleur)}>${retour}${carte}<h2 class="cu-titre">${esc(o.titre)}</h2>${et}${o.retiens?'<button type="button" class="cu-ic" data-cu="retiens" title="Je retiens">📖<span> Je retiens</span></button>':''}${o.enseignante?'<button type="button" class="cu-ic cu-disc" data-cu="enseignante" aria-label="Enseignante" title="Enseignante">⚙</button>':''}</div>`;
  }
  function entetePage(o){
    const carte=o.carteHref?`<a class="cu-ic" data-cu="carte" href="${esc(o.carteHref)}">🗺️ Carte de la leçon</a>`:`<button type="button" class="cu-ic" data-cu="carte">🗺️ Carte de la leçon</button>`;
    return `<div class="cu-hd cu-hd-page"${st(o.couleur)}><span class="cu-pastille">${esc(o.pastille)}</span><span class="cu-pill">${esc(o.titre)}</span>${o.retiens?'<button type="button" class="cu-ic" data-cu="retiens" title="Je retiens">📖<span> Je retiens</span></button>':''}<span class="cu-sp"></span>${carte}</div>`;
  }
  function accueil(o){
    const tout=o.total>0&&o.faites>=o.total;
    const msg=o.message||(tout?'Bravo, tout est réussi !':o.faites?'Continue avec l’activité '+(o.prochaine||o.faites+1)+' !':'Commence par l’activité 1 !');
    const sous=o.sous!=null?o.sous:(tout?'Tu peux revoir une activité quand tu veux.':'');
    const etoiles=Array.from({length:o.total||0},(_,k)=>`<span class="cu-star${k<(o.faites||0)?' on':''}">★</span>`).join('');
    return `<div class="cu-accueil"${st(o.couleur)}>${o.image?`<img class="cu-av" src="${o.image}" alt="">`:''}<p class="cu-bulle"><b>${msg}</b>${sous?`<span>${esc(sous)}</span>`:''}</p><div class="cu-prog" aria-label="${o.faites||0} réussie(s) sur ${o.total||0}">${etoiles}</div></div>`;
  }
  function cartes(o){
    return `<div class="cu-cartes" role="group" aria-label="Choisis une activité"${st(o.couleur)}>${o.liste.map(c=>{
      const cl=`cu-act${c.etat?' '+c.etat:''}`,in_=`<span class="cu-num">${c.etat==='fait'?'✓':c.num}</span><span class="cu-ci" aria-hidden="true">${c.icone}</span><b>${esc(c.titre)}</b><small>${esc(c.sous!=null?c.sous:(c.etat==='fait'?'Réussi !':c.etat==='suivant'?'À faire maintenant':''))}</small>`;
      return c.href?`<a class="${cl}" data-cu="activite" data-id="${esc(c.id)}" href="${esc(c.href)}">${in_}</a>`:`<button type="button" class="${cl}" data-cu="activite" data-id="${esc(c.id)}">${in_}</button>`;}).join('')}</div>`;
  }
  function majEtapes(racine,courante,fait){
    (racine||document).querySelectorAll('.cu-et').forEach(b=>{const i=+b.dataset.i,cur=i===courante,f=!!(fait&&fait[i]);b.setAttribute('aria-pressed',String(cur));b.classList.toggle('fait',f&&!cur);b.querySelector('i').textContent=f&&!cur?'✓':String(i+1);});
  }
  function surClic(racine,h){
    racine.addEventListener('click',ev=>{const b=ev.target.closest('[data-cu]');if(!b||!racine.contains(b)||b.disabled)return;const k=b.dataset.cu;
      if(k==='etape'&&h.etape){ev.preventDefault();h.etape(+b.dataset.i,b);}
      else if(k==='retiens'&&h.retiens){ev.preventDefault();h.retiens(b);}
      else if(k==='activite'&&h.activite){ if(!b.href) ev.preventDefault(); h.activite(b.dataset.id,b,ev);}
      else if(k==='carte'&&h.carte){ if(!b.href) ev.preventDefault(); h.carte(b,ev);}
      else if(k==='retour'&&h.retour){ if(!b.href) ev.preventDefault(); h.retour(b,ev);}
      else if(k==='enseignante'&&h.enseignante){ev.preventDefault();h.enseignante(b);}
    });
  }
  function retiens(titre,html,couleur){
    const o0=document.getElementById('cu-retiens');if(o0)o0.remove();
    const o=document.createElement('div');o.id='cu-retiens';o.setAttribute('role','dialog');o.setAttribute('aria-label','Je retiens');if(couleur)o.style.setProperty('--z',couleur);
    o.innerHTML=`<div class="cu-f"><button type="button" class="cu-x" aria-label="Fermer">✕</button><h2>📖 ${esc(titre)}</h2><div>${html}</div></div>`;
    const kd=ev=>{if(ev.key==='Escape'){fermer();ev.stopImmediatePropagation();ev.preventDefault();}};
    const fermer=()=>{o.remove();document.removeEventListener('keydown',kd,true);};
    o.addEventListener('click',ev=>{if(ev.target===o||ev.target.closest('.cu-x'))fermer();});
    document.addEventListener('keydown',kd,true);document.body.appendChild(o);o.querySelector('.cu-x').focus();
  }
  function reussies(cle){
    const lireTout=()=>{try{return JSON.parse(localStorage.getItem(cle))||{};}catch(e){return {};}};
    return {lire:groupe=>new Set(lireTout()[groupe]||[]),a:(groupe,id)=>new Set(lireTout()[groupe]||[]).has(id),
      noter:(groupe,id)=>{try{const T=lireTout(),L=new Set(T[groupe]||[]);if(L.has(id))return;L.add(id);T[groupe]=[...L];localStorage.setItem(cle,JSON.stringify(T));}catch(e){}}};
  }
  return {entete,entetePage,accueil,cartes,majEtapes,surClic,retiens,reussies,esc};
})();
