import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProofedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'proofed-items',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const recipesTable = new dynamodb.Table(this, 'RecipesTable', {
      tableName: 'proofed-recipes',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const variantsTable = new dynamodb.Table(this, 'VariantsTable', {
      tableName: 'proofed-variants',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'variantId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const attemptsTable = new dynamodb.Table(this, 'AttemptsTable', {
      tableName: 'proofed-attempts',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'attemptId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const proofedItemsTable = new dynamodb.Table(this, 'ProofedItemsTable', {
      tableName: 'proofed-proofed-items',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'proofedItemId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'ProofedUserPool', {
      userPoolName: 'proofed-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Cognito App Client for mobile app
    const userPoolClient = userPool.addClient('ProofedMobileClient', {
      userPoolClientName: 'proofed-mobile',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['proofed://callback'],
        logoutUrls: ['proofed://signout'],
      },
    });

    // S3 Bucket for Photos
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `proofed-photos-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `proofed-frontend-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
    });

    // IP-restricted bucket policy for frontend
    frontendBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [frontendBucket.arnForObjects('*')],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          IpAddress: {
            'aws:SourceIp': '82.36.100.6/32',
          },
        },
      })
    );

    // Lambda function
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../packages/backend/dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ITEMS_TABLE: itemsTable.tableName,
        RECIPES_TABLE: recipesTable.tableName,
        VARIANTS_TABLE: variantsTable.tableName,
        ATTEMPTS_TABLE: attemptsTable.tableName,
        PROOFED_ITEMS_TABLE: proofedItemsTable.tableName,
        PHOTOS_BUCKET: photosBucket.bucketName,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
    });

    // Grant permissions
    itemsTable.grantReadWriteData(apiHandler);
    recipesTable.grantReadWriteData(apiHandler);
    variantsTable.grantReadWriteData(apiHandler);
    attemptsTable.grantReadWriteData(apiHandler);
    proofedItemsTable.grantReadWriteData(apiHandler);
    photosBucket.grantReadWrite(apiHandler);
    photosBucket.grantPut(apiHandler);

    // Allow generating presigned URLs
    apiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [photosBucket.arnForObjects('*')],
      })
    );

    // HTTP API Gateway
    const httpApi = new apigateway.HttpApi(this, 'ProofedApi', {
      apiName: 'proofed-api',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'],
        maxAge: cdk.Duration.days(1),
      },
    });

    const integration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiHandler
    );

    // JWT Authorizer for Cognito
    const authorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      {
        jwtAudience: [userPoolClient.userPoolClientId],
      }
    );

    // Items routes
    httpApi.addRoutes({
      path: '/items',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });

    // Recipes routes
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });

    // Variants routes
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}/variants',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}/variants/{variantId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });

    // Attempts routes
    httpApi.addRoutes({
      path: '/attempts',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/attempts/{attemptId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/attempts/{attemptId}/capture',
      methods: [apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/attempts/{attemptId}/ai-advice',
      methods: [apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });

    // AI Container Scale route
    httpApi.addRoutes({
      path: '/recipes/{recipeId}/ai-container-scale',
      methods: [apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });

    // Proofed Items routes
    httpApi.addRoutes({
      path: '/proofed-items',
      methods: [apigateway.HttpMethod.GET],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/proofed-items/{proofedItemId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });

    // Photos routes
    httpApi.addRoutes({
      path: '/photos/upload-url',
      methods: [apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });
    httpApi.addRoutes({
      path: '/photos/download-url',
      methods: [apigateway.HttpMethod.POST],
      integration,
      authorizer,
    });

    // Account routes
    httpApi.addRoutes({
      path: '/account',
      methods: [apigateway.HttpMethod.DELETE],
      integration,
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: frontendBucket.bucketWebsiteUrl,
      description: 'Frontend S3 website URL',
    });

    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: photosBucket.bucketName,
      description: 'Photos S3 bucket name',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'CognitoRegion', {
      value: this.region,
      description: 'AWS Region for Cognito',
    });
  }
}
