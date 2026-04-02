const { SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Usage: node put-secrets.js <region> '<json-string-of-secrets>'
(async () => {
  const argv = process.argv;
  if (argv.length < 4) {
    console.error("Usage: node put-secrets.js <region> '<json-string-of-secrets>'");
    process.exit(2);
  }
  const [, , region, jsonStr] = argv;
  let secrets;
  try { secrets = JSON.parse(jsonStr); } catch (err) { console.error('Invalid JSON:', err); process.exit(2); }

  const client = new SecretsManagerClient({ region });

  async function upsertSecret(name, value) {
    try {
      await client.send(new CreateSecretCommand({ Name: name, SecretString: value }));
      console.log("Created secret", name);
    } catch (err) {
      if (err.name === "ResourceExistsException" || (err.Code && err.Code === 'ResourceExistsException')) {
        await client.send(new PutSecretValueCommand({ SecretId: name, SecretString: value }));
        console.log("Updated secret", name);
      } else {
        console.error(`Failed to create/update secret ${name}:`, err);
      }
    }
  }

  for (const [k, v] of Object.entries(secrets)) {
    await upsertSecret(k, String(v));
  }

  console.log('All done');
})();
