import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LANGUAGES = ['fr', 'en'];
const SLIDES = [
  'slide-01-hero',
  'slide-02-switch',
  'slide-03-cms',
  'slide-04-auth',
  'slide-05-team',
];

async function generateScreenshots() {
  const browser = await chromium.launch();

  for (const lang of LANGUAGES) {
    const outputDir = join(__dirname, 'output', lang);
    mkdirSync(outputDir, { recursive: true });

    for (const slide of SLIDES) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });

      const slidePath = resolve(__dirname, 'slides', `${slide}.html`);
      await page.goto(`file://${slidePath}?lang=${lang}`);
      await page.waitForLoadState('networkidle');

      const outputPath = join(outputDir, `${slide}.png`);
      await page.screenshot({ path: outputPath, type: 'png' });
      console.log(`✓ ${lang}/${slide}.png`);

      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to screenshots/output/');
}

generateScreenshots().catch((err) => {
  console.error(err);
  process.exit(1);
});
