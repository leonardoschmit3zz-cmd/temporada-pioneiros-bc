const base = '/media/';
const groups = [
  ['Apartamento', [
    ['Quarto', 'mini-camaPhoto.webp'], ['Janela', 'quartoPhoto.webp'],
    ['Vista', 'vistaPhoto.webp'], ['Banheiro', 'mini-banheiroPhoto.webp'],
    ['Entrada', 'entradaPhoto.webp'], ['Garagem', 'garagemPhoto.webp']
  ]],
  ['Balneário Camboriú', [
    ['Atlântica', 'proposta-atlantica.webp'], ['Roda-gigante', 'proposta-roda.webp'],
    ['Deck e Prainha', 'proposta-deck.webp'], ['Réveillon', 'proposta-reveillon.webp']
  ]]
];
const style = document.createElement('style');
style.textContent = `
mar-azul-photos{display:block;min-width:0;color:#142c29;font:500 13px/1.35 system-ui,sans-serif}
.media-hero{position:relative;margin:0;min-width:0}
.hero .media-hero>img{height:clamp(430px,56vw,650px);width:100%;object-fit:cover;object-position:center 43%}
.media-hero figcaption{position:static;background:none;color:#52645d;padding:.4rem 0}
.media-hero mar-azul-photos{position:absolute;left:.6rem;right:.6rem;bottom:2.15rem;padding:.55rem .65rem;border-radius:9px;background:#10251fdf;color:#fcfaf4;backdrop-filter:blur(12px)}
.photo-strip+.photo-strip{margin-top:.45rem}.photo-strip h3{margin:0 0 .3rem;font:inherit;letter-spacing:0}
.thumb-row{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(68px,1fr);gap:.38rem;overflow-x:auto;scrollbar-width:thin;padding:4px;scroll-snap-type:x proximity}
.thumb-row button{border:1px solid transparent;border-radius:6px;padding:0;overflow:hidden;min-width:0;min-height:46px;background:#173e33;position:relative;color:#fff;scroll-snap-align:start;cursor:pointer;font:600 11px/1.2 system-ui}
mar-azul-photos .thumb-row button img,.hero mar-azul-photos .thumb-row button img{width:100%;height:clamp(53px,6vw,83px);object-fit:cover;border-radius:0;transition:transform .32s,filter .32s}
.thumb-row button span{padding:.2rem .24rem;background:#0e221df0;position:absolute;bottom:0;left:0;right:0;text-align:center}
.thumb-row button:hover img,.thumb-row button:focus-visible img{transform:scale(1.10);filter:saturate(1.15) brightness(1.08)}
.thumb-row button[aria-pressed=true]{border-color:#eac995;box-shadow:0 0 0 1px #eac995}
@keyframes thumb-reveal{from{opacity:0;transform:translateY(8px);clip-path:inset(0 0 100% 0 round 6px)}to{opacity:1;transform:translateY(0);clip-path:inset(0 round 6px)}}
.thumb-row button{animation:thumb-reveal .46s cubic-bezier(.19,1,.22,1) both;animation-delay:calc(var(--order)*48ms)}
.host-minimal{border-top:1px solid #d2d9cf;padding-block:2rem}.host-minimal h2{font-size:clamp(2rem,5vw,3rem)}.host-minimal p{margin:.7rem 0}.host-minimal iframe{width:min(100%,540px);height:480px;border:0;border-radius:8px;background:#fff;display:block;margin:1rem 0}
html.booking-minimal,html.booking-minimal body{background:#f7f5ef;color:#142c29;height:auto;overflow:visible}
html.booking-minimal .tour{display:none!important}
.booking-page{width:min(1080px,calc(100% - 32px));margin:auto;padding:1rem 0 2rem;color:#142c29}
.booking-page>.return{display:inline-block;padding:.6rem 0;color:#153c34} .booking-page h2{font:1.6rem Georgia,serif;margin:1.2rem 0 .65rem}
html.booking-minimal #dates{position:static;inset:auto;transform:none;box-sizing:border-box;display:block;background:#fff;color:#142c29;border:1px solid #d2d9cf;border-radius:14px;width:min(100%,620px);max-width:none;height:auto;max-height:none;overflow:visible;margin:0 auto;padding:clamp(.7rem,3vw,1.5rem);box-shadow:none}
html.booking-minimal #dates a,html.booking-minimal #dates small,html.booking-minimal #dates p,html.booking-minimal #dates .day,html.booking-minimal #dates .price,html.booking-minimal #dates .day-price{color:#153c34}
html.booking-minimal #dates button{color:#153c34;background:#f7f5ef;border-color:#c6d1ca}
html.booking-minimal #dates .day:disabled{opacity:.52}
html.booking-minimal #dates button[aria-pressed=true],html.booking-minimal #dates .actions a{background:#153c34;color:#fff}
html.booking-minimal #dates .host,html.booking-minimal #dates .monthbar{border-color:#d2d9cf}
html.booking-minimal #dates #closeDates{display:none}
html.booking-minimal #dates .hostLinks a{background:#f7f5ef;color:#153c34;border-color:#c6d1ca}
html.booking-minimal dialog.booking-photo{position:fixed;inset:0;margin:auto;width:min(94vw,800px);background:#142c29;color:#fff;border:0;border-radius:12px;padding:.7rem}
.booking-photo::backdrop{background:#0a221bd4}.booking-photo header{display:flex;justify-content:space-between;align-items:center}.booking-photo button{background:#fff;color:#142c29;border-radius:99px;padding:.45rem .75rem}
.booking-photo img{width:100%;height:min(72dvh,720px);object-fit:contain;display:block;margin:.55rem auto 0}
@media(max-width:730px){.hero .media-hero{grid-row:1}.hero .media-hero>img{height:clamp(270px,49svh,450px)}.media-hero mar-azul-photos{position:static;padding:.65rem 0;background:none;color:#142c29;backdrop-filter:none}.hero .media-hero figcaption{padding:.2rem 0}.hero .media-hero .thumb-row button img{height:61px}.hero h1{font-size:clamp(2.4rem,9.4vw,4.5rem)}.hero .place{margin-bottom:.55rem}.hero .desc{margin:.65rem 0 .9rem}.hero .actions .cta{white-space:normal}}
@media(prefers-reduced-motion:reduce){.thumb-row button{animation:none}.thumb-row button img{transition:none}}
`;
document.head.append(style);
const hero = document.querySelector('.media-hero');
const mainPhoto = hero?.querySelector('img');
const caption = hero?.querySelector('figcaption');
function showBookingPhoto(src,label) {
  const dialog = document.querySelector('.booking-photo');
  dialog.querySelector('strong').textContent = label;
  const photo = dialog.querySelector('img');
  photo.src = src;
  photo.alt = label;
  dialog.showModal();
}
for (const gallery of document.querySelectorAll('mar-azul-photos')) {
  for (const [title, items] of groups) {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    const row = document.createElement('div');
    heading.textContent = title;
    row.className = 'thumb-row';
    section.className = 'photo-strip';
    section.append(heading,row);
    items.forEach(([label,file], index) => {
      const button = document.createElement('button');
      const image = document.createElement('img');
      const name = document.createElement('span');
      button.type = 'button';
      button.style.setProperty('--order', index);
      name.textContent = label;
      image.alt = '';
      image.src = base + file;
      button.append(image,name);
      if (mainPhoto) button.setAttribute('aria-pressed', String(mainPhoto.getAttribute('src') === image.getAttribute('src')));
      button.onclick = () => {
        if (!mainPhoto) return showBookingPhoto(image.src,label);
        for (const item of gallery.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item === button));
        mainPhoto.src = image.src;
        mainPhoto.alt = label;
        caption.textContent = label;
        if (!matchMedia('(prefers-reduced-motion:reduce)').matches) {
          mainPhoto.animate([{opacity:.54,filter:'saturate(.8)'},{opacity:1,filter:'saturate(1)'}],{duration:380,easing:'ease-out'});
        }
      };
      row.append(button);
    });
    gallery.append(section);
  }
}
const bookingPage = document.querySelector('.booking-page');
if (bookingPage && document.documentElement.classList.contains('booking-minimal')) {
  const dates = document.getElementById('dates');
  bookingPage.querySelector('.calendar-slot').append(dates);
  dates.setAttribute('open','');
  const keepOpen = () => dates.setAttribute('open','');
  new MutationObserver(keepOpenIfClosed).observe(dates,{attributes:true,attributeFilter:['open']});
  function keepOpenIfClosed(){if(!dates.open)keepOpen();}
  bookingPage.hidden = false;
}
const openInstagram = document.querySelector('[data-instagram]');
if (openInstagram) openInstagram.onclick = () => {
  const target = document.querySelector('#instagram-feed');
  if (!target.querySelector('blockquote')) {
    const embed = document.createElement('blockquote');
    embed.className = 'instagram-media';
    embed.dataset.instgrmPermalink = openInstagram.previousElementSibling.href;
    embed.dataset.instgrmVersion = '14';
    embed.textContent = 'Publicações no Instagram';
    target.prepend(embed);
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.head.append(script);
  }
  target.hidden = false;
  openInstagram.hidden = true;
};
