const app=document.getElementById('app');const envelope=document.getElementById('envelope');const seal=document.getElementById('seal');const invitation=document.getElementById('invitation');
function openEnvelope(){app.classList.add('open-envelope');}
function enterSite(){app.classList.add('site-open');invitation.classList.add('site-ready');document.getElementById('landing').setAttribute('aria-hidden','false');}
seal.addEventListener('click',e=>{e.stopPropagation();openEnvelope()});envelope.addEventListener('click',openEnvelope);envelope.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openEnvelope()}});invitation.addEventListener('click',enterSite);invitation.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enterSite()}});
if(new URLSearchParams(location.search).get('site')==='1'){app.classList.add('site-open');document.getElementById('landing').setAttribute('aria-hidden','false')}
