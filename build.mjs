import { reviseCalendar, notice, promoStyles } from './calendar-revision.mjs';
import { rm, mkdir, readFile, writeFile } from 'node:fs/promises';

const address = new URL(process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000');
if (!['https:', 'http:'].includes(address.protocol)) throw new Error('Invalid site URL');
const canonical = new URL('/', address).href;
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const source = await readFile('index.html', 'utf8');
const page = source.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (_, raw) => {
  const apartment = JSON.parse(raw);
  apartment.url = canonical;
  apartment.image = apartment.image.map(path => new URL(path, canonical).href);
  return '<script type="application/ld+json">' + JSON.stringify(apartment).replaceAll('<', '\\u003c') + '</script>';
});
const seo = [
  `<link rel="canonical" href="${escape(canonical)}">`,
  '<meta property="og:type" content="website">',
  '<meta property="og:locale" content="pt_BR">',
  `<meta property="og:url" content="${escape(canonical)}">`,
  '<meta property="og:title" content="Apartamento por temporada em Balneário Camboriú | Pioneiros">',
  '<meta property="og:description" content="Veja as fotos reais do apartamento em Pioneiros, perto da Praia Central e da roda-gigante. Consulte suas datas e preços.">',
  `<meta property="og:image" content="${escape(new URL('media/vistaPhoto.webp',canonical).href)}">`,
  '<meta name="twitter:card" content="summary_large_image">',
].join('\n');
await mkdir('dist', { recursive: true });
await mkdir('dist/media', {recursive:true});
const files=JSON.parse((await Promise.all([0, 1, 2, 3, 4, 5].map(i=>readFile('media-'+i+'.txt','utf8')))).join(''));
for (const [name, data] of Object.entries(files)) {
  if (/\.(webp|png|jpe?g)$/i.test(name)) await writeFile('dist/media/' + name, Buffer.from(data, 'base64'));
}
for (const name of ['quartoVideo.mp4', 'vistaVideo.mp4']) await rm('dist/media/' + name, { force: true });
const intro = "<dialog id=\"barraNorteIntro\" aria-label=\"Aftermovie da Barra Norte\" style=\"box-sizing:border-box;width:min(96vw,960px);max-width:none;max-height:96dvh;padding:0;border:1px solid #ffffff44;border-radius:16px;background:#101720;color:#fcf4e6\">\n<form method=\"dialog\" style=\"display:flex;justify-content:flex-end;padding:.45rem .7rem\"><button type=\"submit\" autofocus>Ir ao apartamento</button></form>\n<iframe data-src=\"/aftermovie.html\" title=\"Aftermovie e fotos da Barra Norte\" allow=\"autoplay; encrypted-media; fullscreen; picture-in-picture\" allowfullscreen style=\"display:block;border:0;width:100%;height:min(83dvh,860px)\"></iframe>\n</dialog>\n<script>\n(() => {\n  if (new URLSearchParams(location.search).get('reserva') === '1') {\n    return;\n  }\n  const dialog = document.querySelector('#barraNorteIntro');\n  try { if (sessionStorage.getItem('barra-norte-intro')) return; } catch {}\n  if (typeof dialog.showModal !== 'function') return;\n  const frame = dialog.querySelector('iframe');\n  dialog.addEventListener('close', () => {\n    frame.removeAttribute('src');\n    try { sessionStorage.setItem('barra-norte-intro', '1'); } catch {}\n  });\n  frame.src = frame.dataset.src;\n  dialog.showModal();\n})();\n</script>";
const legacyModal = /<dialog id="welcome"[\s\S]*?<\/dialog>/g;
const legacyScript = /\(\(\) => \{\s*const welcome=\$\('welcome'\),[\s\S]*?\n\s*welcome\.showModal\(\);\s*show\(0\);\s*\n\}\)\(\);/g;
if ([...page.matchAll(legacyModal)].length !== 1 || [...page.matchAll(legacyScript)].length !== 1) {
  throw new Error('A abertura anterior mudou. Revise a integração do aftermovie.');
}
const moduleTag = '<script type="module" src="/mar-azul-media.js"></script><script type="module" src="/coastal-tour.js"></script>';
const bookingMode = '<script>if(new URLSearchParams(location.search).get("reserva")==="1")document.documentElement.classList.add("booking-minimal")</script><style>html.booking-minimal .tour{display:none!important}</style>';
const hostProfile = page.match(/href="(https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?)"/)?.[1];
const hostRow = page.match(/<div class="host"><img[\s\S]*?<\/div><\/div>/)?.[0] || '';
const mapSource = page.match(/id="mapFrame"[^>]+data-src="([^"]+)"/)?.[1];
if (!mapSource) throw new Error('Endereço do mapa indisponível');
const satellite = new URL(mapSource.replaceAll('&amp;', '&'));
satellite.searchParams.set('t', 'k');
satellite.searchParams.set('z', '17');
satellite.searchParams.set('ll', '-26.97195,-48.63195');
satellite.searchParams.delete('q');
const mapFrame = '<iframe title="Vista de satélite do Edifício Mar Azul e da Praia Central" src="' + escape(satellite.href) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
const addressLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(new URL(mapSource.replaceAll('&amp;', '&')).searchParams.get('q'));
const profilePreview = hostProfile ? '<section id="anfitria" aria-labelledby="instagram-heading"><h3 id="instagram-heading">Instagram da anfitriã</h3><iframe title="Prévia do Instagram da anfitriã" src="' + escape(new URL('embed/', hostProfile.endsWith('/') ? hostProfile : hostProfile + '/').href) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowtransparency="true"></iframe><a href="' + escape(hostProfile) + '" target="_blank" rel="noopener">Abrir perfil no Instagram ↗</a></section>' : '';
const routeOverlay = (path, name) => '<svg aria-hidden="true" class="walking-route" viewBox="0 0 880 88" preserveAspectRatio="none"><path id="' + name + '" d="' + path + '" fill="none" stroke="#ffe6a8" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round"/><circle r="7" fill="#153f35" stroke="#fff8df" stroke-width="3"><animateMotion dur="5.5s" repeatCount="indefinite" path="' + path + '"/></circle></svg>';
const beachPath = 'M35 54 H224 Q265 54 300 35 H636 Q685 35 725 54 H845';
const wheelPath = 'M35 54 H340 Q402 54 442 34 H660 Q715 34 756 54 H845';
const coastTour = '<div class="coast-tour" data-coastal-tour><p class="walk-time"><strong>2 minutos da praia a pé</strong> <small>Tempo estimado · esquema do trajeto abaixo do mapa</small></p><div class="coast-stage"><figure data-tour-slide>' + mapFrame + '<div class="route-key"><span>Mar Azul</span><span>Praia Central</span></div>' + routeOverlay(beachPath,'praia-rota') + '</figure><figure data-tour-slide hidden><img src="/media/fachada-atual.webp" alt="Fachada atual do Edifício Mar Azul" loading="lazy"><figcaption>Fachada atual · Mar Azul</figcaption></figure><figure data-tour-slide hidden>' + mapFrame + '<div class="route-key"><span>Mar Azul</span><span>Roda-gigante</span></div>' + routeOverlay(wheelPath,'roda-rota') + '</figure><figure data-tour-slide hidden><img src="/media/rua-roda-gigante.webp" alt="Vista da roda-gigante a partir da rua" loading="lazy"><figcaption>Roda-gigante da Barra Norte</figcaption></figure></div><div class="coast-controls"><button type="button" data-tour-index>Mapa da praia</button><button type="button" data-tour-index>Fachada</button><button type="button" data-tour-index>Mapa da roda</button><button type="button" data-tour-index>Roda-gigante</button><button type="button" data-tour-toggle>Pausar passeio</button></div></div>';
const regionVideo = '<figure class="region-video"><figcaption>Barra Norte vista do alto · 20 segundos</figcaption><video controls playsinline preload="none" poster="/media/barra-norte-drone-poster.webp" aria-label="Passeio aéreo pela orla e roda-gigante da Barra Norte"><source src="/media/barra-norte-drone-20s.mp4" type="video/mp4"></video></figure>';
const coastStyles = '<style>.coast-stage{position:relative;overflow:hidden;border-radius:8px;background:#10251f}.coast-stage figure{margin:0;position:relative}.coast-stage figure[hidden]{display:none}.coast-stage figure>iframe,.coast-stage figure>img{display:block;width:100%;height:clamp(280px,34vw,430px);margin:0;border:0;object-fit:cover}.coast-stage figcaption{position:absolute;bottom:10px;left:10px;color:#fff;background:#10251fe8;border-radius:5px;padding:.3rem .55rem}.walking-route{pointer-events:none;position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 1px 2px #10251f)}.walking-route path{paint-order:stroke;filter:drop-shadow(0 0 1px #142c29)}.walk-time small{display:block;color:#4b625c}.coast-controls{display:flex;gap:.35rem;flex-wrap:wrap;margin:.65rem 0}.coast-controls button,.open-photo-gallery{border:1px solid #84a295;border-radius:20px;background:#f7f5ef;color:#142c29;padding:.36rem .7rem;cursor:pointer;font:inherit}.coast-controls button[aria-pressed=true]{background:#153c34;color:white}.open-photo-gallery{margin-top:.5rem}.region-video{margin:1.25rem 0 0}.region-video figcaption{margin-bottom:.5rem;font-weight:650}.region-video video{display:block;width:min(100%,360px);aspect-ratio:480/854;max-height:490px;background:#10251f;border-radius:8px}.photo-collection{position:fixed;inset:0;margin:auto;width:min(94vw,930px);background:#142c29;color:#fff;border:0;border-radius:10px;padding:.8rem;max-height:92dvh}.photo-collection::backdrop{background:#091d17cf}.photo-collection header{display:flex;justify-content:flex-end}.photo-collection button{background:#f7f5ef;color:#142c29;border-radius:6px;border:0;min-width:36px;min-height:36px;cursor:pointer}.photo-collection-stage{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.5rem}.photo-collection-stage img{width:100%;height:min(58dvh,570px);object-fit:contain}.photo-collection-strip{display:flex;overflow:auto;gap:.4rem;max-width:100%}.photo-collection-strip button{flex:0 0 70px;padding:2px}.photo-collection-strip button[aria-pressed=true]{background:#e5b96c}.photo-collection-strip img{width:100%;height:54px;object-fit:cover;margin:0}.photo-collection p{margin:.4rem 0}</style>';
const localPanel = '<section class="local-panel" id="local" aria-labelledby="local-heading"><section><h2 id="local-heading">Localização</h2><p>Edifício Mar Azul · Rua Miguel Matte, 130 · Praia Central</p>' + coastTour + '<a href="' + escape(addressLink) + '" target="_blank" rel="noopener">Abrir no Google Maps ↗</a> · <a href="https://www.google.com/maps/dir/?api=1&amp;origin=Rua+Miguel+Matte+130%2C+Balne%C3%A1rio+Cambori%C3%BA&amp;destination=Pontal+Norte%2C+Balne%C3%A1rio+Cambori%C3%BA&amp;travelmode=walking" target="_blank" rel="noopener">Ver rota a pé ↗</a>' + '</section>' + profilePreview + '</section>';
const refreshedStyles = '<style>:root{--green:#171717;--ink:#171717;--muted:#464646}.proposta-topo{background:#f7f5ef!important;color:#171717!important}.proposta-topo .place,.proposta-topo .hero p.desc,.proposta-topo .hero figcaption{color:#292929!important;text-shadow:none!important}.proposta-topo .hero figcaption{background:#f7f5ef}.proposta-topo .hero a.secondary{background:transparent!important;border-color:#202020!important;color:#202020!important}.proposta-topo .hero a.cta:not(.secondary),.top .cta,.reserve .cta,.coast-controls button[aria-pressed=true]{background:#171717!important;border-color:#171717!important;color:#fff!important}.area{background:#161616!important;color:#f7f5ef!important}.area .cta{color:#fff;border-color:#fff}.coast-stage,.coast-stage figcaption,.photo-collection,.booking-photo,.instagram-credit,.media-hero mar-azul-photos,.thumb-row button,.thumb-row button span{background:#151515!important}.local-panel,.booking-page{color:#171717!important}.coast-stage figure>.walking-route{display:block;position:static;height:38px;width:100%;padding:0 7px 3px;box-sizing:border-box;filter:none}.route-key{display:flex;justify-content:space-between;padding:8px 12px 0;color:#fff;font:600 .75rem system-ui}.coast-stage figure>img[src$="fachada-atual.webp"],.coast-stage figure>img[src$="rua-roda-gigante.webp"]{object-fit:contain}.walking-route circle{fill:#161616}@media(max-width:730px){.media-hero mar-azul-photos,.proposta-topo .media-hero mar-azul-photos{background:transparent!important;color:#171717!important}}</style>';
const localStyles = '<style>.local-panel{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:clamp(16px,4vw,48px);padding:clamp(24px,4vw,44px) 0;color:#142c29;background:#f7f5ef}.local-panel>section{min-width:0}.local-panel h2,.local-panel h3{font:400 clamp(1.6rem,3vw,2.2rem)/1.15 Georgia,serif;margin:0 0 .45rem;color:inherit}.local-panel p{margin:0 0 .65rem}.local-panel iframe{display:block;width:100%;height:360px;border:1px solid #d2d9cf;border-radius:8px;background:#fff;margin:.7rem 0}.local-panel a{color:#153c34;text-underline-offset:3px}@media(max-width:780px){.local-panel{grid-template-columns:minmax(0,1fr)}.local-panel iframe{height:330px}}.host-minimal-card{padding:1rem 0;border-top:1px solid #d2d9cf}</style>';
const bookingPage = '<main hidden class="booking-page"><a class="return" href="/proposta.html">← Voltar ao apartamento</a><div class="calendar-slot"></div><h2>Fotos do apartamento e da cidade</h2><mar-azul-photos></mar-azul-photos>' + localPanel + '<dialog class="booking-photo" aria-label="Foto ampliada"><header><strong></strong><form method="dialog"><button>Fechar</button></form></header><img alt=""></dialog></main>';
const home = reviseCalendar(page).replace('</head>', () => bookingMode + promoStyles + localStyles + coastStyles + refreshedStyles + '</head>').replace('data-src="' + mapSource + '"', 'data-src="' + escape(satellite.href) + '"').replace(legacyModal, '').replace(legacyScript, '').replace('</body>', () => bookingPage + intro + moduleTag + '\n</body>');
const aftermovie = await readFile('aftermovie.html', 'utf8');
await writeFile('dist/aftermovie.html', aftermovie);
const mediaModule = (await readFile('mar-azul-media.js','utf8')).replace("['Vista', 'vistaPhoto.webp']", "['Sala', 'sala-integrada.webp'], ['Cozinha', 'cozinha.webp'], ['Vista', 'vistaPhoto.webp']").replace("['Atlântica', 'proposta-atlantica.webp']", "['Atlântica', 'proposta-atlantica.webp'], ['Rua da roda', 'rua-roda-gigante.webp']");
await writeFile('dist/mar-azul-media.js', mediaModule);
const tourModule = (await readFile('coastal-tour.js','utf8'))
  .replace("const route = tour.querySelector('svg');", "for (const route of tour.querySelectorAll('svg')) {")
  .replace("else route.pauseAnimations?.();", "else route.pauseAnimations?.(); }")
  .replace("&&typeof photo.label==='string'", "&&typeof photo.label==='string'&&!photos.some(existing=>existing.src===photo.src)");
await writeFile('dist/coastal-tour.js', tourModule);
const extraGallery = JSON.parse(await readFile('gallery-extra.json','utf8').catch(error => { if (error.code === 'ENOENT') return '[]'; throw error; }));
for (let index=0; index<4; index++) {
  const photos = JSON.parse(await readFile('apartment-photos-' + index + '.json','utf8'));
  for (const {file,label,data} of photos) {
    if (!/^[a-z0-9-]+\.webp$/.test(file)) throw new Error('Nome de foto inválido');
    const bytes = Buffer.from(data,'base64');
    if (bytes.subarray(8,12).toString() !== 'WEBP') throw new Error('Imagem inválida: ' + file);
    await writeFile('dist/media/' + file, bytes);
    extraGallery.push({src:'/media/' + file,label});
  }
}
await writeFile('dist/gallery-extra.json', JSON.stringify(extraGallery));
const droneParts = await Promise.all([0,1].map(index => readFile('region-drone-' + index + '.txt','utf8')));
const droneVideo = Buffer.from(droneParts.join(''),'base64');
if (droneVideo.subarray(4,8).toString() !== 'ftyp') throw new Error('Corte aéreo inválido');
await writeFile('dist/media/barra-norte-drone-20s.mp4', droneVideo);
const coastalImages = JSON.parse(await readFile('coastal-images.json','utf8'));
await writeFile('dist/media/barra-norte-drone-poster.webp', Buffer.from(coastalImages.poster,'base64'));
await writeFile('dist/media/fachada-atual.webp', Buffer.from(coastalImages.facade,'base64'));
const originalProposal = await readFile('proposta.html', 'utf8');
const proposal = originalProposal
  .replace('</head>', () => promoStyles + localStyles + coastStyles + refreshedStyles + "<style>\n.proposta-topo{background:linear-gradient(105deg,#091914f5 0%,#091914c4 45%,#09191469 100%),url('/media/proposta-reveillon.webp') center 41%/cover no-repeat;color:#fff;padding-bottom:1.2rem}\n.proposta-topo .top{border-color:#ffffff45}.proposta-topo .place,.proposta-topo .hero p.desc{color:#f0f3ed}.proposta-topo a.secondary{border-color:#fff;color:#fff;background:#142c29c7}\n.proposta-topo .hero figcaption{color:#fff;text-shadow:0 1px 4px #000}\n.host-minimal .host{display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;padding:1rem 0;color:#142c29}.host-minimal .host img{width:53px;height:53px;border-radius:50%;object-fit:cover}\n.host-minimal .host strong,.host-minimal .host small{display:block}.host-minimal .hostLinks{display:flex;gap:.4rem;margin-inline-start:auto}\n.host-minimal .hostLinks a{display:grid;place-items:center;width:44px;height:44px;border:1px solid #c6d1ca;border-radius:50%;background:#fff;color:#153c34}\n.host-minimal .hostLinks svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.5}\n.instagram-credit{position:absolute;top:.75rem;right:.75rem;padding:.3rem .55rem;border-radius:5px;text-decoration:none;color:white;background:#142c29b8;font:550 .73rem/1.3 system-ui}\n@media(max-width:730px){.proposta-topo .media-hero mar-azul-photos{color:#fff}.proposta-topo .hero{padding-top:1rem}.proposta-topo .top{gap:.5rem}}\n</style>" + '</head>')
  .replace('<header class="top wrap">', '<header class="top wrap">')
  .replace('<section class="hero wrap"', () => '<div class="proposta-topo"><div class="wrap">' + (notice ? '<aside class="promo-note">' + notice + '</aside>' : '') + '</div><section class="hero wrap"')
  .replace('<ul class="facts', () => '</div><div class="wrap">' + localPanel.replace('</section>' + profilePreview, () => regionVideo + '</section>' + profilePreview) + '</div><ul class="facts')
  .replace('<figure>', '<figure class="media-hero">')
  .replace('</figcaption></figure>', () => '</figcaption>' + (hostProfile ? '<a class="instagram-credit" href="' + escape(hostProfile) + '" target="_blank" rel="noopener">@' + escape(new URL(hostProfile).pathname.split('/')[1]) + '</a>' : '') + '</figure>')
  .replace('</figure>', '<mar-azul-photos></mar-azul-photos></figure>')
  .replace('<nav class="nav" aria-label="Menu">','<nav class="nav" aria-label="Menu"><a class="jump" href="#anfitria">Anfitriã</a>')
  .replace('</main>', () => (hostRow ? '<div class="host-minimal host-minimal-card wrap">' + hostRow + '</div>' : '') + '</main>')
  .replace('</body>', () => moduleTag + '</body>');
await writeFile('dist/proposta.html', proposal);
const embeddedPhotos = JSON.parse(page.match(/const media = (\{[^\n]+\});/)?.[1] || '{}');
for (const key of ['camaPhoto', 'banheiroPhoto']) {
  const data = embeddedPhotos[key]?.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/)?.[1];
  if (!data) throw new Error('Foto do apartamento indisponível: ' + key);
  await writeFile('dist/media/mini-' + key + '.webp', Buffer.from(data, 'base64'));
}
const shots = [...aftermovie.matchAll(/<img class="shot(?: active)?" src="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/g)];
if (shots.length !== 4) throw new Error('Fotos da Barra Norte não encontradas');
for (const [index, name] of ['atlantica', 'deck', 'roda', 'reveillon'].entries()) {
  await writeFile('dist/media/proposta-' + name + '.webp', Buffer.from(shots[index][1], 'base64'));
}
await writeFile('dist/index.html', home.replace('</title>', '</title>\n' + seo));
await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + new URL('sitemap.xml', canonical).href + '\n');
await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + escape(canonical) + '</loc></url></urlset>\n');

const photoTourRedirect = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Visita fotográfica</title><a href="/">Abrir a visita fotográfica</a></html>';
for (const path of ['maquete.html', 'rua-miguel-matte.html']) await writeFile('dist/' + path, photoTourRedirect);

const miranteParts = await Promise.all([0, 1, 2, 3].map(index => readFile('mirante-cgi-' + index + '.txt', 'utf8')));
const mirante = Buffer.from(miranteParts.map(part => part.trim()).join(''), 'base64');
if (mirante.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Imagem do mirante inválida');
await writeFile('dist/media/mirante-cgi.png', mirante);
