export const notice = 'Pacotes promocionais para combos a partir de 3 noites';
const tiers = [[3,5],[5,8],[7,12],[15,15]];
const changes = [
  ["['2026-12-26','2026-12-28',750,0]", "['2026-12-01','2026-12-28',750,0]"],
  ["['2026-12-29','2027-01-02',0,8490]", "['2026-12-29','2027-01-02',1698,0]"],
  ["['2027-02-05','2027-02-09',0,3500]", "['2027-02-05','2027-02-09',700,0]"],
  [/Date\.parse\('2026-12-26'\)/g, "Date.parse('2026-12-01')"],
  ["const current = new Date(Math.min(minimum,lastNight));", "const current = new Date(Math.min(Math.max(minimum,seasonStart),lastNight));"],
  ["maximumFractionDigits:0", "maximumFractionDigits:2"],
  ["let start = null, end = null, selectionError = '';", "let start = null, end = null, anchor = null, selectionError = '', previousTier = 0;"],
  [/function quoteStay\(first,last\)\{[\s\S]*?\n\}/, `function quoteStay(first,last){
    let subtotal=0;
    for(let stamp=first;stamp<=last;stamp+=day){
      const offer=offers.find(item=>stamp>=item.a&&stamp<=item.b);
      if(!offer||occupied(stamp))return {error:'O intervalo inclui uma noite indisponível.'};
      subtotal+=offer.rate*100;
    }
    const count=(last-first)/day+1;
    const [threshold,percent]=${JSON.stringify(tiers)}.filter(([limit])=>count>=limit).at(-1)||[0,0];
    const discount=Math.round(subtotal*percent/100);
    return {subtotal:subtotal/100,discount:discount/100,total:(subtotal-discount)/100,threshold,percent};
  }`],
  [/function selectNight\(stamp\)\{[\s\S]*?(?=\nfunction renderCalendar)/, `function selectNight(stamp){
    if(stamp<minimum||stamp>lastNight||occupied(stamp))return;
    selectionError='';
    if(anchor===null){anchor=stamp;start=stamp;end=null;renderCalendar(stamp);return;}
    if(stamp===anchor){
      if(end===null){anchor=null;start=null;}else{start=anchor;end=null;}
      renderCalendar(stamp);
      return;
    }
    const from=Math.min(anchor,stamp), to=Math.max(anchor,stamp);
    for(let night=from;night<=to;night+=day){
      if(occupied(night)){
        selectionError='Esse intervalo inclui uma noite indisponível. Escolha outro.';
        renderCalendar(stamp);
        return;
      }
    }
    start=from;end=to;renderCalendar(stamp);
  }
  function celebrateCombo(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    document.querySelector('.combo-fireworks')?.remove();
    const effect=document.createElement('div');
    effect.className='combo-fireworks';
    effect.setAttribute('aria-hidden','true');
    for(let burst=0;burst<3;burst++){
      for(let i=0;i<18;i++){
        const spark=document.createElement('i');
        const angle=i*Math.PI/9;
        const distance=28+(i%5)*11;
        spark.style.left=[23,50,76][burst]+'%';
        spark.style.top=[57,31,56][burst]+'%';
        spark.style.setProperty('--dx',Math.cos(angle)*distance+'px');
        spark.style.setProperty('--dy',Math.sin(angle)*distance+'px');
        spark.style.setProperty('--delay',burst*155+'ms');
        spark.style.background=['#b66916','#138c72','#d84b63','#287fbc'][i%4];
        effect.append(spark);
      }
    }
    grid.append(effect);
    setTimeout(()=>effect.remove(),1450);
  }`],
  [/  const combo=\$\('comboLabel'\);[\s\S]*?(?=  whatsapp\.hidden)/, `  const combo=$('comboLabel');
  combo.hidden=true;
  if(start===null)previousTier=0;
`],
  ["  summary.textContent+=' · '+currency.format(quote.total)+' em hospedagem';", `  if(quote.threshold){
    combo.textContent='Combo '+quote.threshold+'+ noites · '+quote.percent+'% de desconto';
    combo.hidden=false;
    if(quote.threshold>previousTier)celebrateCombo();
  }
  previousTier=quote.threshold;
  summary.textContent+=' · Subtotal '+currency.format(quote.subtotal)+(quote.discount?' · Desconto −'+currency.format(quote.discount):'')+' · Total '+currency.format(quote.total);
  if(count===1){
    summary.textContent+=' · Mínimo de 2 noites para solicitar reserva.';
    whatsapp.hidden=true;
    whatsapp.removeAttribute('href');
    return;
  }`],
  ["start=null;end=null;selectionError='';renderCalendar();","start=null;end=null;anchor=null;selectionError='';renderCalendar();"],
  ["Réveillon e Carnaval têm pacotes de 5 noites. ",""],
  ["Preço por noite. Réveillon e Carnaval são pacotes de 5 noites.", "Clique na primeira e na última noite. Para ajustar o total, clique em outra última noite ou em Limpar."]
];
export function reviseCalendar(source){
  let result=source;
  for(const [oldValue,newValue] of changes){
    if(typeof oldValue==='string'?!result.includes(oldValue):!new RegExp(oldValue.source).test(result))throw new Error('Trecho do calendário não encontrado: '+String(oldValue).slice(0,90));
    result=result.replace(oldValue,()=>newValue);
  }
  return result.replace('<div class="monthbar">','<aside class="promo-note">'+notice+'. <small>3+ noites 5% · 5+ noites 8% · 7+ noites 12% · 15+ noites 15%</small></aside><div class="monthbar">');
}
export const promoStyles = `<style>
.promo-note{display:block;background:#e6f1e8;color:#173c31;border:1px solid #c4d9ca;border-radius:9px;padding:.65rem .8rem;margin:.7rem 0;font:650 .9rem/1.35 system-ui}
.promo-note small{display:block;margin-top:.25rem;font-weight:500}
#calendar{position:relative}
.combo-fireworks{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.combo-fireworks i{position:absolute;width:5px;height:5px;border-radius:50%;opacity:0;animation:calendar-spark .95s var(--delay) ease-out both}
@keyframes calendar-spark{12%{opacity:1;transform:translate(0,0) scale(1.35)}65%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.4)}}
@media(prefers-reduced-motion:reduce){.combo-fireworks{display:none}}
</style>`;
