const { IAMClient, CreateRoleCommand, UpdateAssumeRolePolicyCommand, AttachRolePolicyCommand } = require("@aws-sdk/client-iam");
const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

// Usage: node create-oidc-role.js <roleName> <githubOwner> <githubRepo> <branchOrWildcard> <policyArnsCommaSeparated> <region>
(async () => {
  const argv = process.argv;
  if (argv.length < 7) {
    console.error("Usage: node create-oidc-role.js <roleName> <githubOwner> <githubRepo> <branchOrWildcard> <policyArnsCommaSeparated> <region>");
    process.exit(2);
  }
  const [, , roleName, owner, repo, branch, policyArnsCsv, region] = argv;
  const policyArns = policyArnsCsv ? policyArnsCsv.split(",").map(s => s.trim()).filter(Boolean) : [];

  const sts = new STSClient({ region });
  let accountId;
  try {
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account;
    if (!accountId) throw new Error("Unable to determine AWS account ID from STS");
  } catch (err) {
    console.error("Failed to get AWS account ID via STS:", err);
    process.exit(1);
  }

  const providerArn = `arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com`;

  const assumeRolePolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Federated: providerArn },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${owner}/${repo}:ref:refs/heads/${branch}`
          },
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          }
        }
      }
    ]
  };

  const iam = new IAMClient({ region });

  try {
    console.log(`Creating role ${roleName} with OIDC provider ${providerArn}`);
    const create = new CreateRoleCommand({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy),
      Description: `Role for GitHub Actions OIDC for ${owner}/${repo}`
    });
    const resp = await iam.send(create);
    console.log("Created role:", resp.Role && resp.Role.Arn ? resp.Role.Arn : JSON.stringify(resp));
  } catch (err) {
    if (err.name === 'EntityAlreadyExists' || (err.Code && err.Code === 'EntityAlreadyExists')) {
      console.log("Role exists, updating assume role policy...");
      try {
        await iam.send(new UpdateAssumeRolePolicyCommand({ RoleName: roleName, PolicyDocument: JSON.stringify(assumeRolePolicy) }));
        console.log("Assume role policy updated");
      } catch (uerr) {
        console.error("Failed to update assume role policy:", uerr);
        process.exit(1);
      }
    } else {
      console.error("Failed to create role:", err);
      process.exit(1);
    }
  }

  for (const arn of policyArns) {
    if (!arn) continue;
    try {
      console.log(`Attaching managed policy ${arn}`);
      await iam.send(new AttachRolePolicyCommand({ RoleName: roleName, PolicyArn: arn }));
    } catch (aerr) {
      console.error(`Failed to attach policy ${arn}:`, aerr);
    }
  }

  console.log("Done. If no errors were printed, role exists and policies are attached.");
})();
