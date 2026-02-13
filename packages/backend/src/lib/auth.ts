import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export function getUserId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  console.log('[Auth] JWT claims:', JSON.stringify(claims));
  if (!claims?.sub) {
    throw new Error('Unauthorized: No user ID in token');
  }
  console.log('[Auth] Extracted userId:', claims.sub);
  return claims.sub as string;
}
