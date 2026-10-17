import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const paths = {
  legacyStyle: resolve(root, 'vendor/legacy-commerce-style.css'),
  legacyIcons: resolve(root, 'vendor/legacy-commerce-icons.css'),
  legacyCarousel: resolve(root, 'vendor/legacy-carousel.js'),
  outputStyle: resolve(root, 'public/css/loopora-base.css'),
  outputIcons: resolve(root, 'public/css/loopora-icons.css'),
  outputCarousel: resolve(root, 'public/js/loopora-carousel.js'),
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
    .replace(/@import\s+url\(\.\.\/icons\/flaticon\/flaticon_pixio\.css\);/i, '@import url(./loopora-icons.css);')
    .replace(/flaticon_pixio/gi, 'loopora_commerce_icons')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  css = removeMarketplaceUrls(css);
  assertClean('Loopora base CSS', css);
  await writeText(paths.outputStyle, css);
}

async function prepareIconCss() {
  let css = await readFile(paths.legacyIcons, 'utf8');
  css = css
    .replace(/flaticon_pixio\.woff2?@[^"')]+/gi, (value) => value.toLowerCase().includes('woff2')
      ? '../icons/loopora/commerce-icons.woff2'
      : '../icons/loopora/commerce-icons.woff')
    .replace(/flaticon_pixio\.eot@[^"')]+/gi, '../icons/loopora/commerce-icons.eot')
    .replace(/flaticon_pixio\.svg@[^"')]+/gi, '../icons/loopora/commerce-icons.svg')
    .replace(/flaticon_pixio/gi, 'loopora_commerce_icons')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  css = removeMarketplaceUrls(removeTemplateHeader(css));
  assertClean('Loopora icon CSS', css);
  await writeText(paths.outputIcons, css);
}

async function prepareCarousel() {
  let js = await readFile(paths.legacyCarousel, 'utf8');
  js = removeTemplateHeader(js)
    .replace(/PixioCarousel/g, 'LooporaCarousel')
    .replace(/Pixio/gi, 'Loopora')
    .replace(/DexignZone/gi, 'Loopora');
  js = removeMarketplaceUrls(js);
  assertClean('Loopora carousel runtime', js);
  await writeText(paths.outputCarousel, js);
}

await Promise.all([prepareBaseCss(), prepareIconCss(), prepareCarousel()]);
console.log('Prepared clean Loopora runtime assets.');
