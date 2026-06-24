import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const html = fs.readFileSync(path.join(__dirname, 'edit_page.html'), 'utf8');
const $ = cheerio.load(html);

console.log('Searching for images inside edit page...');

// Print all img sources
const imgUrls = [];
$('img').each((idx, el) => {
  const src = $(el).attr('src');
  if (src && (src.includes('uploads') || src.includes(' tirumakudalu') || src.includes('properties'))) {
    imgUrls.push(src);
  }
});

console.log('Found uploads images:');
console.log(imgUrls.slice(0, 15));

// Check for featured image container
console.log('\nFeatured image elements:');
$('#set-post-thumbnail img').each((idx, el) => {
  console.log($(el).attr('src'));
});

// Check for gallery container
console.log('\nGallery image inputs or containers:');
const galleryContainer = $('#gallery-thumbs, .gallery-thumbs, #property-images-container');
console.log('Gallery container length:', galleryContainer.length);
if (galleryContainer.length > 0) {
  galleryContainer.find('img').each((idx, el) => {
    console.log($(el).attr('src'));
  });
}

// Let's search if there are script blocks with metadata
console.log('\nScript block elements (first 3):');
$('script').each((idx, el) => {
  const html = $(el).html();
  if (html && (html.includes('wp.media') || html.includes('gallery') || html.includes('attachment'))) {
    console.log(`Script ${idx} length:`, html.length);
    console.log(html.substring(0, 300));
  }
});
