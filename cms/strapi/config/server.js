module.exports = ({ env }) => {
  const fallbackKeys = ['fallbackAppKeyA123!', 'fallbackAppKeyB123!', 'fallbackAppKeyC123!', 'fallbackAppKeyD123!'];
  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: env.array('APP_KEYS', fallbackKeys),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
