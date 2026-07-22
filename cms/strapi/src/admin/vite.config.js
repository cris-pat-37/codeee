const { mergeConfig } = require('vite');
const path = require('path');

module.exports = (config) => {
  return mergeConfig(config, {
    resolve: {
      alias: {
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, '../../node_modules/react-router-dom'),
        'styled-components': path.resolve(__dirname, '../../node_modules/styled-components'),
        '@strapi/admin': path.resolve(__dirname, '../../node_modules/@strapi/admin'),
        '@strapi/strapi': path.resolve(__dirname, '../../node_modules/@strapi/strapi'),
      },
    },
  });
};
