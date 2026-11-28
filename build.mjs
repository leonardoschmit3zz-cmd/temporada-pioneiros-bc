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
const intro = "<dialog id=\"barraNorteIntro\" aria-label=\"Aftermovie da Barra Norte\" style=\"box-sizing:border-box;width:min(96vw,960px);max-width:none;max-height:96dvh;padding:0;border:1px solid #ffffff44;border-radius:16px;background:#101720;color:#fcf4e6\">\n<form method=\"dialog\" style=\"display:flex;justify-content:flex-end;padding:.45rem .7rem\"><button type=\"submit\" autofocus>Ir ao apartamento</button></form>\n<iframe data-src=\"/aftermovie.html\" title=\"Aftermovie e fotos da Barra Norte\" allow=\"autoplay; encrypted-media; fullscreen; picture-in-picture\" allowfullscreen style=\"display:block;border:0;width:100%;height:min(83dvh,860px)\"></iframe>\n</dialog>\n<script>\n(() => {\n  const dialog = document.querySelector('#barraNorteIntro');\n  try { if (sessionStorage.getItem('barra-norte-intro')) return; } catch {}\n  if (typeof dialog.showModal !== 'function') return;\n  const frame = dialog.querySelector('iframe');\n  dialog.addEventListener('close', () => {\n    frame.removeAttribute('src');\n    try { sessionStorage.setItem('barra-norte-intro', '1'); } catch {}\n  });\n  frame.src = frame.dataset.src;\n  dialog.showModal();\n})();\n</script>";
const legacyModal = /<dialog id="welcome"[\s\S]*?<\/dialog>/g;
const legacyScript = /\(\(\) => \{\s*const welcome=\$\('welcome'\),[\s\S]*?\n\s*welcome\.showModal\(\);\s*show\(0\);\s*\n\}\)\(\);/g;
if ([...page.matchAll(legacyModal)].length !== 1 || [...page.matchAll(legacyScript)].length !== 1) {
  throw new Error('A abertura anterior mudou. Revise a integração do aftermovie.');
}
const home = page.replace(legacyModal, '').replace(legacyScript, '').replace('</body>', () => intro + '\n</body>');
await writeFile('dist/aftermovie.html', await readFile('aftermovie.html'));
await writeFile('dist/index.html', home.replace('</title>', '</title>\n' + seo));
await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + new URL('sitemap.xml', canonical).href + '\n');
await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' + escape(canonical) + '</loc></url></urlset>\n');

const photoTourRedirect = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Visita fotográfica</title><a href="/">Abrir a visita fotográfica</a></html>';
for (const path of ['maquete.html', 'rua-miguel-matte.html']) await writeFile('dist/' + path, photoTourRedirect);

const miranteParts = await Promise.all([0, 1, 2, 3].map(index => readFile('mirante-cgi-' + index + '.txt', 'utf8')));
const mirante = Buffer.from(miranteParts.map(part => part.trim()).join(''), 'base64');
if (mirante.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Imagem do mirante inválida');
await writeFile('dist/media/mirante-cgi.png', mirante);
