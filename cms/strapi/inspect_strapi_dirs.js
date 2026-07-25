const strapi = require('@strapi/strapi');

async function test() {
  const app = await strapi().load();
  console.log("Directories keys:", Object.keys(app.dirs));
  if (app.dirs.dist) {
    console.log("dist keys:", Object.keys(app.dirs.dist));
    console.log("dist public:", app.dirs.dist.public);
  }
  console.log("app.dirs.public:", app.dirs.public);
  await app.destroy();
}

test();
