const { mergeConfig } = require('vite');
const path = require('path');

module.exports = (config) => {
  return mergeConfig(config, {
    build: {
      rollupOptions: {
        output: {
          // Disable code-splitting chunks for admin plugins to keep AuthProvider & useRBAC in a single unified bundle
          manualChunks: () => 'admin-main',
        },
      },
    },
    resolve: {
      alias: {
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, '../../node_modules/react-router-dom'),
        'styled-components': path.resolve(__dirname, '../../node_modules/styled-components'),
      },
    },
  });
};
