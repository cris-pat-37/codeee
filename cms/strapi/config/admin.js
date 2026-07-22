module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'fallbackAdminJwtSecretValueChangeMeInProduction123!'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'fallbackApiTokenSaltValueChangeMeInProduction123!'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'fallbackTransferTokenSaltValueChangeMe123!'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY', 'fallbackEncryptionKeyChangeMe123!'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});
