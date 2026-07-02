const https = require('https');

function geocodeLocation(locationName) {
  return new Promise((resolve, reject) => {
    const query = `${locationName}, Karnataka, India`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TirumakudaluProperties/1.0'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.length > 0) {
            resolve({
              lat: parseFloat(parsed[0].lat),
              lon: parseFloat(parsed[0].lon)
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    if (data.location && (!data.latitude || !data.longitude || parseFloat(data.latitude) === 0 || parseFloat(data.longitude) === 0)) {
      try {
        const coords = await geocodeLocation(data.location);
        if (coords) {
          data.latitude = coords.lat;
          data.longitude = coords.lon;
        }
      } catch (err) {
        console.error('Strapi automatic geocoding failed in beforeCreate:', err.message);
      }
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (data.location && (!data.latitude || !data.longitude || parseFloat(data.latitude) === 0 || parseFloat(data.longitude) === 0)) {
      try {
        const coords = await geocodeLocation(data.location);
        if (coords) {
          data.latitude = coords.lat;
          data.longitude = coords.lon;
        }
      } catch (err) {
        console.error('Strapi automatic geocoding failed in beforeUpdate:', err.message);
      }
    }
  }
};
