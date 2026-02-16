import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const client = new SSMClient({});

// Cache the secret to avoid fetching on every request
let cachedOpenAIKey: string | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getOpenAIApiKey(): Promise<string> {
  // Return cached value if still valid
  if (cachedOpenAIKey && Date.now() < cacheExpiry) {
    return cachedOpenAIKey;
  }

  const paramName = process.env.OPENAI_PARAM_NAME;
  if (!paramName) {
    throw new Error('OPENAI_PARAM_NAME environment variable not set');
  }

  const command = new GetParameterCommand({
    Name: paramName,
    WithDecryption: true,
  });
  const response = await client.send(command);

  if (!response.Parameter?.Value) {
    throw new Error('OpenAI API key parameter is empty');
  }

  // Cache the secret
  cachedOpenAIKey = response.Parameter.Value;
  cacheExpiry = Date.now() + CACHE_TTL;

  return cachedOpenAIKey;
}
