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
const moduleTag = '<script type="module" src="/mar-azul-media.js"></script>';
const bookingMode = '<script>if(new URLSearchParams(location.search).get("reserva")==="1")document.documentElement.classList.add("booking-minimal")</script><style>html.booking-minimal .tour{display:none!important}</style>';
const bookingPage = '<main hidden class="booking-page"><a class="return" href="/proposta.html">← Voltar ao apartamento</a><div class="calendar-slot"></div><h2>Fotos do apartamento e da cidade</h2><mar-azul-photos></mar-azul-photos><dialog class="booking-photo" aria-label="Foto ampliada"><header><strong></strong><form method="dialog"><button>Fechar</button></form></header><img alt=""></dialog></main>';
const home = page.replace('</head>', () => bookingMode + '</head>').replace(legacyModal, '').replace(legacyScript, '').replace('</body>', () => bookingPage + intro + moduleTag + '\n</body>');
const aftermovie = await readFile('aftermovie.html', 'utf8');
await writeFile('dist/aftermovie.html', aftermovie);
await writeFile('dist/mar-azul-media.js', await readFile('mar-azul-media.js'));
const originalProposal = await readFile('proposta.html', 'utf8');
const hostProfile = page.match(/href="(https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?)"/)?.[1];
const hostRow = page.match(/<div class="host"><img[\s\S]*?<\/div><\/div>/)?.[0] || '';
const hostSection = hostProfile ? '<section id="anfitria" class="host-minimal wrap"><h2>Anfitriã</h2>' + hostRow + '<div class="actions"><a class="cta secondary" href="' + escape(hostProfile) + '" target="_blank" rel="noopener">Abrir Instagram ↗</a><button class="cta" type="button" data-instagram>Ver publicações</button></div><div id="instagram-feed" hidden><p>Se o Instagram não exibir os posts aqui, <a href="' + escape(hostProfile) + '" target="_blank" rel="noopener">abra o perfil</a>.</p></div></section>' : '';
const proposal = originalProposal
  .replace('</head>', () => "<style>\n.proposta-topo{background:linear-gradient(105deg,#091914f5 0%,#091914c4 45%,#09191469 100%),url('/media/proposta-reveillon.webp') center 41%/cover no-repeat;color:#fff;padding-bottom:1.2rem}\n.proposta-topo .top{border-color:#ffffff45}.proposta-topo .place,.proposta-topo .hero p.desc{color:#f0f3ed}.proposta-topo a.secondary{border-color:#fff;color:#fff;background:#142c29c7}\n.proposta-topo .hero figcaption{color:#fff;text-shadow:0 1px 4px #000}\n.host-minimal .host{display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;padding:1rem 0;color:#142c29}.host-minimal .host img{width:53px;height:53px;border-radius:50%;object-fit:cover}\n.host-minimal .host strong,.host-minimal .host small{display:block}.host-minimal .hostLinks{display:flex;gap:.4rem;margin-inline-start:auto}\n.host-minimal .hostLinks a{display:grid;place-items:center;width:44px;height:44px;border:1px solid #c6d1ca;border-radius:50%;background:#fff;color:#153c34}\n.host-minimal .hostLinks svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.5}\n.instagram-credit{position:absolute;top:.75rem;right:.75rem;padding:.3rem .55rem;border-radius:5px;text-decoration:none;color:white;background:#142c29b8;font:550 .73rem/1.3 system-ui}\n@media(max-width:730px){.proposta-topo .media-hero mar-azul-photos{color:#fff}.proposta-topo .hero{padding-top:1rem}.proposta-topo .top{gap:.5rem}}\n</style>" + '</head>')
  .replace('<header class="top wrap">', '<header class="top wrap">')
  .replace('<section class="hero wrap"', '<div class="proposta-topo"><section class="hero wrap"')
  .replace('<ul class="facts', '</div><ul class="facts')
  .replace('<figure>', '<figure class="media-hero">')
  .replace('</figcaption></figure>', () => '</figcaption>' + (hostProfile ? '<a class="instagram-credit" href="' + escape(hostProfile) + '" target="_blank" rel="noopener">@' + escape(new URL(hostProfile).pathname.split('/')[1]) + '</a>' : '') + '</figure>')
  .replace('</figure>', '<mar-azul-photos></mar-azul-photos></figure>')
  .replace('<nav class="nav" aria-label="Menu">','<nav class="nav" aria-label="Menu"><a class="jump" href="#anfitria">Anfitriã</a>')
  .replace('</main>', () => hostSection + '</main>')
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
