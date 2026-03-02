import {
  CreateSecretCommand,
  DescribeSecretCommand,
  ResourceExistsException,
  SecretsManagerClient,
  TagResourceCommand,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DOTENV_PATH = path.resolve(process.cwd(), '.env');

dotenv.config({ path: DOTENV_PATH });

const SECRET_NAME = 'dev/PlantWaterPlannerCore/OpenAIAPIKey';
const PROJECT_TAG = { Key: 'projectName', Value: 'PlantWaterPlannerCore' };
const OPENAI_ENV_KEY = 'OPENAI_API_KEY';
const OPENAI_SECRET_ARN_ENV_KEY = 'OPENAI_SECRET_ARN';
const LOCALSTACK_ENDPOINT = 'http://127.0.0.1:4566';
const LOCALSTACK_REGION = 'us-east-1';

const openAiApiKey = process.env[OPENAI_ENV_KEY];

if (!openAiApiKey) {
  throw new Error(`${OPENAI_ENV_KEY} is required in the .env file`);
}

const secretString = JSON.stringify({
  key: OPENAI_ENV_KEY,
  value: openAiApiKey,
});

const client = new SecretsManagerClient({
  endpoint: LOCALSTACK_ENDPOINT,
  region: LOCALSTACK_REGION,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

function setEnvVarInDotenv(key: string, value: string): void {
  const escapedValue = value.replace(/\n/g, '\\n');
  const envLine = `${key}=${escapedValue}`;
  const dotenvContent = fs.existsSync(DOTENV_PATH) ? fs.readFileSync(DOTENV_PATH, 'utf8') : '';
  const envVarPattern = new RegExp(`^${key}=.*$`, 'm');
  const nextDotenvContent = envVarPattern.test(dotenvContent)
    ? dotenvContent.replace(envVarPattern, envLine)
    : `${dotenvContent}${dotenvContent.endsWith('\n') || dotenvContent.length === 0 ? '' : '\n'}${envLine}\n`;

  fs.writeFileSync(DOTENV_PATH, nextDotenvContent);
  process.env[key] = value;
}

async function ensureSecret(): Promise<void> {
  try {
    const createResult = await client.send(
      new CreateSecretCommand({
        Name: SECRET_NAME,
        SecretString: secretString,
        Tags: [PROJECT_TAG],
      })
    );

    if (createResult.ARN) {
      setEnvVarInDotenv(OPENAI_SECRET_ARN_ENV_KEY, createResult.ARN);
    }

    console.info(`Created secret ${SECRET_NAME}`);
    console.info(`ARN: ${createResult.ARN ?? 'unknown'}`);
    return;
  } catch (error) {
    if (!(error instanceof ResourceExistsException)) {
      throw error;
    }
  }

  await client.send(
    new UpdateSecretCommand({
      SecretId: SECRET_NAME,
      SecretString: secretString,
    })
  );

  const describedSecret = await client.send(
    new DescribeSecretCommand({
      SecretId: SECRET_NAME,
    })
  );

  const hasProjectTag = describedSecret.Tags?.some(
    (tag) => tag.Key === PROJECT_TAG.Key && tag.Value === PROJECT_TAG.Value
  );

  if (!hasProjectTag) {
    await client.send(
      new TagResourceCommand({
        SecretId: SECRET_NAME,
        Tags: [PROJECT_TAG],
      })
    );
  }

  if (describedSecret.ARN) {
    setEnvVarInDotenv(OPENAI_SECRET_ARN_ENV_KEY, describedSecret.ARN);
  }

  console.info(`Updated secret ${SECRET_NAME}`);
  console.info(`ARN: ${describedSecret.ARN ?? 'unknown'}`);
}

ensureSecret().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to create or update LocalStack secret at ${LOCALSTACK_ENDPOINT}: ${message}`);
  process.exitCode = 1;
});
