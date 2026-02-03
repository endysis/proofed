import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
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

    // Items routes
    httpApi.addRoutes({
      path: '/items',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
    });

    // Recipes routes
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
    });

    // Variants routes
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}/variants',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
    });
    httpApi.addRoutes({
      path: '/items/{itemId}/recipes/{recipeId}/variants/{variantId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
    });

    // Attempts routes
    httpApi.addRoutes({
      path: '/attempts',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.POST],
      integration,
    });
    httpApi.addRoutes({
      path: '/attempts/{attemptId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
    });
    httpApi.addRoutes({
      path: '/attempts/{attemptId}/capture',
      methods: [apigateway.HttpMethod.POST],
      integration,
    });

    // Proofed Items routes
    httpApi.addRoutes({
      path: '/proofed-items',
      methods: [apigateway.HttpMethod.GET],
      integration,
    });
    httpApi.addRoutes({
      path: '/proofed-items/{proofedItemId}',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT, apigateway.HttpMethod.DELETE],
      integration,
    });

    // Photos routes
    httpApi.addRoutes({
      path: '/photos/upload-url',
      methods: [apigateway.HttpMethod.POST],
      integration,
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
  }
}
