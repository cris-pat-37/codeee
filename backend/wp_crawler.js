import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WP_URL = process.env.WP_URL || 'https://tirumakudaluproperties.com';
const USERNAME = process.env.WP_CRAWLER_USER || 'naveen@codegres.com';
const PASSWORD = process.env.WP_CRAWLER_PASSWORD || '';

async function crawl() {
  try {
    console.log('Logging into WordPress...');
    const loginData = new URLSearchParams();
    loginData.append('log', USERNAME);
    loginData.append('pwd', PASSWORD);
    loginData.append('wp-submit', 'Log In');
    loginData.append('redirect_to', `${WP_URL}/wp-admin/`);

    const loginResponse = await axios.post(`${WP_URL}/wp-login.php`, loginData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const setCookies = loginResponse.headers['set-cookie'];
    if (!setCookies || setCookies.length === 0) {
      throw new Error('No cookies returned from login. Please check credentials.');
    }

    const cookieString = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
    console.log('Login successful! Session cookies retrieved.');

    // Fetch properties from /wp/v2/properties
    console.log('Fetching properties from REST API (/wp/v2/properties)...');
    
    // We fetch pages in a loop to handle pagination and make sure we get all 40+ properties
    let page = 1;
    let allProperties = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page ${page}...`);
      try {
        const response = await axios.get(`${WP_URL}/wp-json/wp/v2/properties?per_page=50&page=${page}`, {
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });

        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          allProperties = allProperties.concat(data);
          console.log(`Fetched ${data.length} properties from page ${page}. Total so far: ${allProperties.length}`);
          page++;
        } else {
          hasMore = false;
        }
      } catch (err) {
        console.log(`Stop fetching properties: ${err.message}`);
        hasMore = false;
      }
    }

    console.log(`Successfully fetched a total of ${allProperties.length} properties.`);

    if (allProperties.length > 0) {
      const outputPath = path.join(__dirname, 'properties_rest.json');
      fs.writeFileSync(outputPath, JSON.stringify(allProperties, null, 2), 'utf8');
      console.log(`Saved properties JSON to ${outputPath}`);
    } else {
      console.log('No properties fetched.');
    }

  } catch (error) {
    console.error('Error crawling WordPress properties:', error.message);
  }
}

crawl();
