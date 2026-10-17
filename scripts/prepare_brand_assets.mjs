import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const paths = {
  legacyStyle: resolve(root, 'vendor/legacy-commerce-style.css'),
  legacyIcons: resolve(root, 'vendor/legacy-commerce-icons.css'),
  legacyCarousel: resolve(root, 'vendor/legacy-carousel.js'),
  legacyUiRuntime: resolve(root, 'vendor/legacy-ui-runtime.js'),
  outputStyle: resolve(root, 'public/css/style.css'),
  outputIcons: resolve(root, 'public/icons/loopora/commerce-icons.css'),
  outputCarousel: resolve(root, 'public/js/dz.carousel.js'),
  outputUiRuntime: resolve(root, 'public/js/custom.min.js'),
};

const forbidden = [
  /pixio/i,
  /themeforest\.net/i,
  /dexignzone/i,
  /dzassets\.s3\.amazonaws\.com/i,
];

function removeTemplateHeader(text) {
  return text.replace(/\/\*[\s\S]*?Template Name[\s\S]*?\*\//i, '');
}

function removeMarketplaceUrls(text) {
  return text.replace(/https?:\/\/(?:www\.)?themeforest\.net[^\s"'<>)]*/gi, '');
}

function assertClean(label, text) {
  const hit = forbidden.find((pattern) => pattern.test(text));
  if (hit) {
    throw new Error(`${label} still contains forbidden legacy branding: ${hit}`);
  }
}

async function writeText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, 'utf8');
}

async function prepareBaseCss() {
  let css = await readFile(paths.legacyStyle, 'utf8');
  css = removeTemplateHeader(css)
    .replace(
      /@import\s+url\(\.\.\/icons\/flaticon\/flaticon_pixio\.css\);/i,
      '@import url(../icons/loopora/commerce-icons.css);',
    )
    .replace(/flaticon_pixio/gi, 'loopora_commerce_icons')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  css = removeMarketplaceUrls(css);
  assertClean('base CSS', css);
  await writeText(paths.outputStyle, css);
}

async function prepareIconCss() {
  let css = await readFile(paths.legacyIcons, 'utf8');
  css = css
    .replace(/flaticon_pixio\.woff2@[^"')]+/gi, 'commerce-icons.woff2')
    .replace(/flaticon_pixio\.woff@[^"')]+/gi, 'commerce-icons.woff')
    .replace(/flaticon_pixio\.eot@[^"')]+/gi, 'commerce-icons.eot')
    .replace(/flaticon_pixio\.svg@[^"')]+/gi, 'commerce-icons.svg')
    .replace(/flaticon_pixio/gi, 'loopora_commerce_icons')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  css = removeMarketplaceUrls(removeTemplateHeader(css));
  assertClean('icon CSS', css);
  await writeText(paths.outputIcons, css);
}

async function prepareCarousel() {
  let js = await readFile(paths.legacyCarousel, 'utf8');
  js = removeTemplateHeader(js)
    .replace(/PixioCarousel/g, 'LooporaCarousel')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  js = removeMarketplaceUrls(js);
  assertClean('carousel runtime', js);
  await writeText(paths.outputCarousel, js);
}

async function prepareUiRuntime() {
  let js = await readFile(paths.legacyUiRuntime, 'utf8');
  js = js
    .replace(/Pixio/g, 'Loopora')
    .replace(
      /<script id="DZScript" src="https:\/\/dzassets\.s3\.amazonaws\.com\/w3-global-2\.0\.js\?token=[^"]+"><\/script>/g,
      '',
    );
  js = removeMarketplaceUrls(js);
  assertClean('UI runtime', js);
  await writeText(paths.outputUiRuntime, js);
}

await Promise.all([
  prepareBaseCss(),
  prepareIconCss(),
  prepareCarousel(),
  prepareUiRuntime(),
]);

console.log('Prepared original Loopora UI assets with legacy branding removed.');
