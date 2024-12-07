import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class DeliVeryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the custom domain in Route 53 and the associated SSL certificate from ACM
    const customDomain = "themasteroffire.com"; // To be placed in ParameterStore

    // Distribution Certificate for Cloudfront
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      "arn:aws:acm:us-east-1:187922044747:certificate/467258e1-1946-48f1-adfc-2fa1c08b0445" // To be placed in ParameterStore
    );
    const ApiGatewayCertificate = acm.Certificate.fromCertificateArn(
      this,
      "ApiGatewayCertificate",
      "arn:aws:acm:ap-southeast-2:187922044747:certificate/66b98780-a993-436c-b434-a9d7a32078d2" // To be placed in ParameterStore
    );

    // Create an S3 bucket to host the website static files.
    const websiteBucket = new s3.Bucket(this, "StaticContent", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy static website files to the S3 bucket
    new s3deploy.BucketDeployment(this, "DeployDELIVeryWebsite", {
      sources: [s3deploy.Source.asset("./content/website/files")],
      destinationBucket: websiteBucket,
    });

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "DELIVeryDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(websiteBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        domainNames: [customDomain, "www." + customDomain], // Associate custom domain
        certificate: certificate, // Use SSL certificate
        defaultRootObject: "index.html", // Default page
      }
    );

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, "DELIVeryDistributionDomainName", {
      value: distribution.distributionDomainName,
    });

    // The ID of the existing hosted zone
    const existingHostedZoneId = "Z02265453VRDKVENQDAL1"; // To be placed in ParameterStore

    // Use fromHostedZoneAttributes to reference the existing hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "CustomDomainHostedZone",
      {
        zoneName: customDomain,
        hostedZoneId: existingHostedZoneId,
      }
    );

    // Define the CNAME record for www
    new route53.CnameRecord(this, "CustomDomainCNAME", {
      zone: hostedZone,
      recordName: "www",
      domainName: distribution.distributionDomainName,
    });

    // Define the A record for the custom domain (apex)
    new route53.ARecord(this, "ApexAliasRecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.CloudFrontTarget(distribution)
      ),
    });

    // Define the Amazon Cognito User Pool
    const userPool = new cognito.UserPool(this, "DeliVeryUserPool", {
      userPoolName: "DeliVeryUserPool",
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
      },
      selfSignUpEnabled: true, // Allow users to sign up
      autoVerify: { email: true }, // Verify email addresses by default
      userVerification: {
        emailSubject: "Verify your email address from Master of Fire",
      },
      standardAttributes: {
        email: {
          required: true,
        },
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY, // Email-only recovery
    });

    // DynamoDB Table for Products
    const productsTable = new dynamoDB.Table(this, "ProductTable", {
      tableName: "product",
      partitionKey: { name: "id", type: dynamoDB.AttributeType.STRING },
      billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST, // On-demand billing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add secondary indexes to productsTable
    productsTable.addGlobalSecondaryIndex({
      indexName: "category_index",
      partitionKey: {
        name: "category",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    // Add secondary indexes to productsTable
    productsTable.addGlobalSecondaryIndex({
      indexName: "company_index",
      partitionKey: {
        name: "company_id",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    // Add secondary indexes to productsTable
    productsTable.addGlobalSecondaryIndex({
      indexName: "product_name_index",
      partitionKey: {
        name: "product_name",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    // Add secondary indexes to productsTable
    productsTable.addGlobalSecondaryIndex({
      indexName: "active_index",
      partitionKey: {
        name: "active",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    // DynamoDB Table for Subscribed Users
    const subscribedEmail = new dynamoDB.Table(this, "SubscribedEmailTable", {
      tableName: "subscribed_email",
      billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST, // On-demand billing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "email", type: dynamoDB.AttributeType.STRING },
    });

    // Add a global secondary index for 'is_subscribed'
    subscribedEmail.addGlobalSecondaryIndex({
      indexName: "is_subscribed_index",
      partitionKey: {
        name: "is_subscribed",
        type: dynamoDB.AttributeType.STRING,
      },
      projectionType: dynamoDB.ProjectionType.ALL,
    });

    const cartTable = new dynamoDB.Table(this, "CartTable", {
      tableName: "cart",
      partitionKey: { name: "pk", type: dynamoDB.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamoDB.AttributeType.STRING },
      billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Define the API Gateway
    const api = new apiGateway.RestApi(this, "DELIVeryApiGateway", {
      restApiName: "DELIVeryApiGateway",
      description: "The DELIVery API Gateway",
      // endpointConfiguration: {
      //   types: [apiGateway.EndpointType.EDGE],
      // },
      domainName: {
        domainName: "api." + customDomain,
        certificate: ApiGatewayCertificate,
      },
      deployOptions: {
        // cachingEnabled: true,
        // cacheDataEncrypted: true,
        // cacheClusterEnabled: true,
        dataTraceEnabled: true,
        methodOptions: {
          "/products/GET": {
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            cacheDataEncrypted: true,
            cachingEnabled: true,
            cacheTtl: cdk.Duration.seconds(60),
          },
          "/products/{id}/GET": {
            throttlingRateLimit: 20,
            throttlingBurstLimit: 20,
            cachingEnabled: false,
          },          
        },
      },
    });

    // Create API Key
    const apiKey = api.addApiKey("DeliVeryApiKey", {
      apiKeyName: "DeliVeryApiKey",
    });

    // Add API Key to Usage Plan
    const usagePlan = api.addUsagePlan("DeliVeryUsagePlan", {
      name: "DeliVeryUsagePlan",
      throttle: {
        rateLimit: 500,
        burstLimit: 1000,
      },
      quota: {
        limit: 10000,
        period: apiGateway.Period.MONTH,
      },
    });

    // Set environment variable for Lambda function
    const apiLambdaEnv = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
    };

    // Lambda function for serverless endpoints
    const apiLambda = new lambda.Function(this, "DELIVeryApiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "products-handler.getProductsHandler",
      code: lambda.Code.fromAsset("src/api"),
      environment: apiLambdaEnv,
      timeout: cdk.Duration.seconds(60),
    });

    // Grant access to the DynamoDB table for the Lambda function
    productsTable.grantReadData(apiLambda);

    // Lambda function for serverless endpoints
    const cartLambda = new lambda.Function(this, "DELIVeryCartLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "cart-handler.cartHandler",
      code: lambda.Code.fromAsset("src/api"),
      environment: {
        CART_TABLE_NAME: cartTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(60),
    });

    // Grant access to the DynamoDB table for the Lambda function
    cartTable.grantReadWriteData(cartLambda);

    // Lambda function for serverless endpoints
    const checkoutLambda = new lambda.Function(
      this,
      "DELIVeryCheckoutLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "checkout-handler.checkoutHandler",
        code: lambda.Code.fromAsset("src/api"),
        environment: {
          CART_TABLE_NAME: cartTable.tableName,
        },
        timeout: cdk.Duration.seconds(60),
      });

    // Grant access to the DynamoDB table for the Lambda function
    cartTable.grantReadWriteData(checkoutLambda);

    // Define the API Gateway resource for /products
    const productsResource = api.root.addResource("products");

    // Add GET method to the /products resource
    const getProductsIntegration = new apiGateway.LambdaIntegration(apiLambda);

    // Allow access to GET method
    productsResource.addMethod("GET", getProductsIntegration);

    // Define the API Gateway resource for /products/{id}
    const productByIdResource = productsResource.addResource("{id}");

    // Allow access to GET method for /products/{id}
    productByIdResource.addMethod("GET", getProductsIntegration);

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Lambda Function for subscribe endpoint
    const subscribeLambda = new lambda.Function(this, "SubscribeLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "subscribe-handler.subscribeHandler",
      code: lambda.Code.fromAsset("src/api"),
      environment: {
        SUBSCRIBED_EMAIL_TABLE_NAME: subscribedEmail.tableName,
      },
      timeout: cdk.Duration.seconds(60),
    });

    // Grant access to the DynamoDB table for the Lambda function
    subscribedEmail.grantReadWriteData(subscribeLambda);

    // Create the lambda integration for the API
    const subscribeIntegration = new apiGateway.LambdaIntegration(
      subscribeLambda
    );

    // Add POST Method from subscribeIntegration to API
    api.root.addResource("subscribe").addMethod("POST", subscribeIntegration);

    // Create the Cart Lambda integration for the API
    const cartIntegration = new apiGateway.LambdaIntegration(cartLambda);
    // Add a single resource for the 'cart' path
    const cartResource = api.root.addResource("cart");

    // Add PUT and POST Method from cartIntegration to API
    cartResource.addMethod("PUT", cartIntegration);
    cartResource.addMethod("POST", cartIntegration);
    cartResource.addMethod("GET", cartIntegration);

    // Create the Checkout Lambda integration for the API
    const checkoutIntegration = new apiGateway.LambdaIntegration(
      checkoutLambda
    );

    // Add POST Method from checkoutIntegration to API
    api.root.addResource("checkout").addMethod("POST", checkoutIntegration);


    // BFF Layer

    // Define the Backend API Gateway
    const apiHandler = new apiGateway.RestApi(
      this,
      "DELIVeryApiHandlerGateway",
      {
        restApiName: "DELIVeryApiHandlerGateway",
        description: "No-Cached Backend API",
        domainName: {
          domainName: "app." + customDomain,
          certificate: ApiGatewayCertificate,
        },
        deployOptions: {
          cachingEnabled: false,
          methodOptions: {
            "/backend/GET": {
              throttlingRateLimit: 100,
              throttlingBurstLimit: 100,
            },
          },
        },
      }
    );

    // Lambda function for securely calling the endpoints
    const apiLambdaHandler = new lambda.Function(
      this,
      "DELIVeryBackkendHandlerLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "backend-handler.callHandler",
        code: lambda.Code.fromAsset("src/backend"),
        environment: apiLambdaEnv,
        timeout: cdk.Duration.seconds(60),
        role: new iam.Role(this, "LambdaRole", {
          assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
          // Attach policies to the Lambda function role
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "service-role/AWSLambdaBasicExecutionRole"
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "SecretsManagerReadWrite"
            ),
          ],
        }),
      }
    );

    const backendResource = apiHandler.root.addResource("{proxy+}");

    // Enable CORS for the API Gateway method
    backendResource.addCorsPreflight({
      allowOrigins: apiGateway.Cors.ALL_ORIGINS,
      allowMethods: ["GET", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "X-Amz-Date",
        "Authorization",
        "X-Api-Key",
        "X-Amz-Security-Token",
      ],
    });

    const backendLambdaIntegration = new apiGateway.LambdaIntegration(
      apiLambdaHandler,
      {
        proxy: true,
      }
    );
    // Allow anonymous access to GET method
    // Create a resource with a greedy path variable and ANY method
    const backendMethod = backendResource.addMethod(
      "ANY",
      backendLambdaIntegration,
      {
        apiKeyRequired: false,
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Headers": true,
            },
          },
        ],
        requestParameters: {
          "method.request.path.any": true,
        },
      }
    );

    const localDnsName = `api.${customDomain}`;
    new cdk.CfnOutput(this, "ApiGatewayUrl", {
      value: `https://${localDnsName}`,
      description: "The URL of the Deli-Very API",
      exportName: "ApiGatewayUrl",
    });

    const appDnsName = `app.${customDomain}`;
    new cdk.CfnOutput(this, "AppUrl", {
      value: `https://${appDnsName}`,
      description: "URL for API Client Access",
      exportName: "AppUrl",
    });

    // Add ARecord target for API Gateway
    new cdk.aws_route53.ARecord(this, "APIARecord", {
      zone: hostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.ApiGateway(api)
      ),
      recordName: localDnsName,
    });

    // Add ARecord target for API Gateway
    new cdk.aws_route53.ARecord(this, "AppARecord", {
      zone: hostedZone,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.ApiGateway(apiHandler)
      ),
      recordName: appDnsName,
    });
  }
}
