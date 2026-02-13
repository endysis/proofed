import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

// Cache the secret to avoid fetching on every request
let cachedOpenAIKey: string | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getOpenAIApiKey(): Promise<string> {
  // Return cached value if still valid
  if (cachedOpenAIKey && Date.now() < cacheExpiry) {
    return cachedOpenAIKey;
  }

  const secretArn = process.env.OPENAI_SECRET_ARN;
  if (!secretArn) {
    throw new Error('OPENAI_SECRET_ARN environment variable not set');
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error('OpenAI API key secret is empty');
  }

  // Cache the secret
  cachedOpenAIKey = response.SecretString;
  cacheExpiry = Date.now() + CACHE_TTL;

  return cachedOpenAIKey;
}
