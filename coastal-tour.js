const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const tour of document.querySelectorAll('[data-coastal-tour]')) {
  const slides = [...tour.querySelectorAll('[data-tour-slide]')];
  const buttons = [...tour.querySelectorAll('[data-tour-index]')];
  const toggle = tour.querySelector('[data-tour-toggle]');
  let index = 0, timer, visible = false, playing = !reduceMotion.matches;
  function show(next) {
    index = next;
    slides.forEach((slide,i) => {slide.hidden = i !== next;});
    buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === next)));
  }
  function schedule() {
    clearTimeout(timer);
    toggle.textContent = playing ? 'Pausar passeio' : 'Reproduzir passeio';
    tour.classList.toggle('route-motion',playing && visible);
    const route = tour.querySelector('svg');
    if (playing && visible) route.unpauseAnimations?.(); else route.pauseAnimations?.();
    if (playing && visible) timer = setTimeout(() => {show((index+1)%slides.length);schedule();},index%2===0?6500:3600);
  }
  buttons.forEach((button,i) => button.onclick=()=>{playing=false;show(i);schedule();});
  toggle.onclick=()=>{playing=!playing;schedule();};
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{threshold:.2}).observe(tour);
  show(0);schedule();
}
for (const gallery of document.querySelectorAll('mar-azul-photos')) {
  const photos = [...gallery.querySelectorAll('.thumb-row button')].map(button => ({src:button.querySelector('img').getAttribute('src'),label:button.textContent.trim()}));
  if (!photos.length) continue;
  const extra = await fetch('/gallery-extra.json').then(response=>response.ok?response.json():[]).catch(()=>[]);
  photos.push(...extra.filter(photo=>typeof photo.src==='string'&&photo.src.startsWith('/media/')&&typeof photo.label==='string'));
  const button=document.createElement('button');
  button.type='button';button.className='open-photo-gallery';button.textContent='Ver todas as fotos ('+photos.length+')';
  gallery.append(button);
  const viewer=document.createElement('dialog');
  viewer.className='photo-collection';
  viewer.setAttribute('aria-label','Galeria de fotos');
  viewer.innerHTML='<header><button type="button" data-close>Fechar</button></header><div class="photo-collection-stage"><button type="button" data-prev aria-label="Foto anterior">‹</button><img alt=""><button type="button" data-next aria-label="Próxima foto">›</button></div><p aria-live="polite"></p><div class="photo-collection-strip"></div>';
  document.body.append(viewer);
  const image=viewer.querySelector('img'), label=viewer.querySelector('p'), strip=viewer.querySelector('.photo-collection-strip');
  let index=0;
  const choices=photos.map((photo,i)=>{
    const option=document.createElement('button'), thumb=document.createElement('img');
    option.type='button';option.setAttribute('aria-label',photo.label);
    thumb.src=photo.src;thumb.alt='';thumb.loading='lazy';option.append(thumb);
    option.onclick=()=>show(i);strip.append(option);return option;
  });
  function show(next){
    index=(next+photos.length)%photos.length;
    image.src=photos[index].src;image.alt=photos[index].label;
    label.textContent=photos[index].label+' · '+(index+1)+' / '+photos.length;
    choices.forEach((choice,i)=>choice.setAttribute('aria-pressed',String(i===index)));
    choices[index].scrollIntoView({block:'nearest',inline:'nearest'});
  }
  button.onclick=()=>{viewer.showModal();show(0);};
  viewer.querySelector('[data-close]').onclick=()=>viewer.close();
  viewer.querySelector('[data-prev]').onclick=()=>show(index-1);
  viewer.querySelector('[data-next]').onclick=()=>show(index+1);
  viewer.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowLeft'?-1:1));}
  });
}
