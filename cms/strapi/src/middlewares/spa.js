const fs = require('fs');
const path = require('path');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const publicDir = strapi.dirs.static.public;

    // 1. Intercept root "/" GET requests and serve index.html directly to bypass default admin redirect
    if (ctx.method === 'GET' && ctx.path === '/') {
      try {
        const indexPath = path.join(publicDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          ctx.type = 'html';
          ctx.body = fs.readFileSync(indexPath);
          return;
        }
      } catch (err) {
        strapi.log.error(`SPA Middleware Root Error: ${err.message}`);
      }
    }

    await next();

    // 2. Catch 404s for client React Router routes
    if (ctx.status === 404 && ctx.method === 'GET') {
      const urlPath = ctx.path;

      if (
        !urlPath.startsWith('/api') &&
        !urlPath.startsWith('/admin') &&
        !urlPath.startsWith('/content-manager') &&
        !urlPath.startsWith('/content-type-builder') &&
        !urlPath.includes('.')
      ) {
        try {
          const indexPath = path.join(publicDir, 'index.html');
          if (fs.existsSync(indexPath)) {
            ctx.type = 'html';
            ctx.body = fs.readFileSync(indexPath);
          }
        } catch (err) {
          strapi.log.error(`SPA Fallback Middleware Error: ${err.message}`);
        }
      }
    }
  };
};
