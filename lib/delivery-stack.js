"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliVeryStack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const route53 = require("aws-cdk-lib/aws-route53");
const apiGateway = require("aws-cdk-lib/aws-apigateway");
const dynamoDB = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const cognito = require("aws-cdk-lib/aws-cognito");
class DeliVeryStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Define the custom domain in Route 53 and the associated SSL certificate from ACM
        const customDomain = "themasteroffire.com"; // To be placed in ParameterStore
        // Distribution Certificate for Cloudfront
        const certificate = acm.Certificate.fromCertificateArn(this, "Certificate", "arn:aws:acm:us-east-1:187922044747:certificate/467258e1-1946-48f1-adfc-2fa1c08b0445" // To be placed in ParameterStore
        );
        const ApiGatewayCertificate = acm.Certificate.fromCertificateArn(this, "ApiGatewayCertificate", "arn:aws:acm:ap-southeast-2:187922044747:certificate/66b98780-a993-436c-b434-a9d7a32078d2" // To be placed in ParameterStore
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
        const distribution = new cloudfront.Distribution(this, "DELIVeryDistribution", {
            defaultBehavior: {
                origin: new origins.S3Origin(websiteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            domainNames: [customDomain, "www." + customDomain],
            certificate: certificate,
            defaultRootObject: "index.html", // Default page
        });
        // Output the CloudFront distribution domain name
        new cdk.CfnOutput(this, "DELIVeryDistributionDomainName", {
            value: distribution.distributionDomainName,
        });
        // The ID of the existing hosted zone
        const existingHostedZoneId = "Z02265453VRDKVENQDAL1"; // To be placed in ParameterStore
        // Use fromHostedZoneAttributes to reference the existing hosted zone
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "CustomDomainHostedZone", {
            zoneName: customDomain,
            hostedZoneId: existingHostedZoneId,
        });
        // Define the CNAME record for www
        new route53.CnameRecord(this, "CustomDomainCNAME", {
            zone: hostedZone,
            recordName: "www",
            domainName: distribution.distributionDomainName,
        });
        // Define the A record for the custom domain (apex)
        new route53.ARecord(this, "ApexAliasRecord", {
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
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
            selfSignUpEnabled: true,
            autoVerify: { email: true },
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
            billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST,
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
            billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST,
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
        const checkoutLambda = new lambda.Function(this, "DELIVeryCheckoutLambda", {
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
        const subscribeIntegration = new apiGateway.LambdaIntegration(subscribeLambda);
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
        const checkoutIntegration = new apiGateway.LambdaIntegration(checkoutLambda);
        // Add POST Method from checkoutIntegration to API
        api.root.addResource("checkout").addMethod("POST", checkoutIntegration);
        // BFF Layer
        // Define the Backend API Gateway
        const apiHandler = new apiGateway.RestApi(this, "DELIVeryApiHandlerGateway", {
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
        });
        // Lambda function for securely calling the endpoints
        const apiLambdaHandler = new lambda.Function(this, "DELIVeryBackkendHandlerLambda", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "backend-handler.callHandler",
            code: lambda.Code.fromAsset("src/backend"),
            environment: apiLambdaEnv,
            timeout: cdk.Duration.seconds(60),
            role: new iam.Role(this, "LambdaRole", {
                assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
                // Attach policies to the Lambda function role
                managedPolicies: [
                    iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
                ],
            }),
        });
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
        const backendLambdaIntegration = new apiGateway.LambdaIntegration(apiLambdaHandler, {
            proxy: true,
        });
        // Allow anonymous access to GET method
        // Create a resource with a greedy path variable and ANY method
        const backendMethod = backendResource.addMethod("ANY", backendLambdaIntegration, {
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
        });
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
            target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.ApiGateway(api)),
            recordName: localDnsName,
        });
        // Add ARecord target for API Gateway
        new cdk.aws_route53.ARecord(this, "AppARecord", {
            zone: hostedZone,
            target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.ApiGateway(apiHandler)),
            recordName: appDnsName,
        });
    }
}
exports.DeliVeryStack = DeliVeryStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsaXZlcnktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZWxpdmVyeS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMsMkNBQTJDO0FBQzNDLHlDQUF5QztBQUN6QywwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDhEQUE4RDtBQUM5RCwwREFBMEQ7QUFDMUQsbURBQW1EO0FBQ25ELHlEQUF5RDtBQUN6RCxxREFBcUQ7QUFDckQsaURBQWlEO0FBQ2pELG1EQUFtRDtBQUVuRCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMxQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG1GQUFtRjtRQUNuRixNQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLGlDQUFpQztRQUU3RSwwQ0FBMEM7UUFDMUMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FDcEQsSUFBSSxFQUNKLGFBQWEsRUFDYixxRkFBcUYsQ0FBQyxpQ0FBaUM7U0FDeEgsQ0FBQztRQUNGLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FDOUQsSUFBSSxFQUNKLHVCQUF1QixFQUN2QiwwRkFBMEYsQ0FBQyxpQ0FBaUM7U0FDN0gsQ0FBQztRQUVGLHdEQUF3RDtRQUN4RCxNQUFNLGFBQWEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN6RCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsK0NBQStDO1FBQy9DLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFB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aW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50XCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udFwiO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2luc1wiO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyXCI7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtcm91dGU1M1wiO1xuaW1wb3J0ICogYXMgYXBpR2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGR5bmFtb0RCIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYVwiO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcblxuZXhwb3J0IGNsYXNzIERlbGlWZXJ5U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIGN1c3RvbSBkb21haW4gaW4gUm91dGUgNTMgYW5kIHRoZSBhc3NvY2lhdGVkIFNTTCBjZXJ0aWZpY2F0ZSBmcm9tIEFDTVxuICAgIGNvbnN0IGN1c3RvbURvbWFpbiA9IFwidGhlbWFzdGVyb2ZmaXJlLmNvbVwiOyAvLyBUbyBiZSBwbGFjZWQgaW4gUGFyYW1ldGVyU3RvcmVcblxuICAgIC8vIERpc3RyaWJ1dGlvbiBDZXJ0aWZpY2F0ZSBmb3IgQ2xvdWRmcm9udFxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gYWNtLkNlcnRpZmljYXRlLmZyb21DZXJ0aWZpY2F0ZUFybihcbiAgICAgIHRoaXMsXG4gICAgICBcIkNlcnRpZmljYXRlXCIsXG4gICAgICBcImFybjphd3M6YWNtOnVzLWVhc3QtMToxODc5MjIwNDQ3NDc6Y2VydGlmaWNhdGUvNDY3MjU4ZTEtMTk0Ni00OGYxLWFkZmMtMmZhMWMwOGIwNDQ1XCIgLy8gVG8gYmUgcGxhY2VkIGluIFBhcmFtZXRlclN0b3JlXG4gICAgKTtcbiAgICBjb25zdCBBcGlHYXRld2F5Q2VydGlmaWNhdGUgPSBhY20uQ2VydGlmaWNhdGUuZnJvbUNlcnRpZmljYXRlQXJuKFxuICAgICAgdGhpcyxcbiAgICAgIFwiQXBpR2F0ZXdheUNlcnRpZmljYXRlXCIsXG4gICAgICBcImFybjphd3M6YWNtOmFwLXNvdXRoZWFzdC0yOjE4NzkyMjA0NDc0NzpjZXJ0aWZpY2F0ZS82NmI5ODc4MC1hOTkzLTQzNmMtYjQzNC1hOWQ3YTMyMDc4ZDJcIiAvLyBUbyBiZSBwbGFjZWQgaW4gUGFyYW1ldGVyU3RvcmVcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGFuIFMzIGJ1Y2tldCB0byBob3N0IHRoZSB3ZWJzaXRlIHN0YXRpYyBmaWxlcy5cbiAgICBjb25zdCB3ZWJzaXRlQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIlN0YXRpY0NvbnRlbnRcIiwge1xuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gRGVwbG95IHN0YXRpYyB3ZWJzaXRlIGZpbGVzIHRvIHRoZSBTMyBidWNrZXRcbiAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCBcIkRlcGxveURFTElWZXJ5V2Vic2l0ZVwiLCB7XG4gICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KFwiLi9jb250ZW50L3dlYnNpdGUvZmlsZXNcIildLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHdlYnNpdGVCdWNrZXQsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvblxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkRFTElWZXJ5RGlzdHJpYnV0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4od2Vic2l0ZUJ1Y2tldCksXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6XG4gICAgICAgICAgICBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICB9LFxuICAgICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcbiAgICAgICAgZG9tYWluTmFtZXM6IFtjdXN0b21Eb21haW4sIFwid3d3LlwiICsgY3VzdG9tRG9tYWluXSwgLy8gQXNzb2NpYXRlIGN1c3RvbSBkb21haW5cbiAgICAgICAgY2VydGlmaWNhdGU6IGNlcnRpZmljYXRlLCAvLyBVc2UgU1NMIGNlcnRpZmljYXRlXG4gICAgICAgIGRlZmF1bHRSb290T2JqZWN0OiBcImluZGV4Lmh0bWxcIiwgLy8gRGVmYXVsdCBwYWdlXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIE91dHB1dCB0aGUgQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gZG9tYWluIG5hbWVcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkRFTElWZXJ5RGlzdHJpYnV0aW9uRG9tYWluTmFtZVwiLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUsXG4gICAgfSk7XG5cbiAgICAvLyBUaGUgSUQgb2YgdGhlIGV4aXN0aW5nIGhvc3RlZCB6b25lXG4gICAgY29uc3QgZXhpc3RpbmdIb3N0ZWRab25lSWQgPSBcIlowMjI2NTQ1M1ZSREtWRU5RREFMMVwiOyAvLyBUbyBiZSBwbGFjZWQgaW4gUGFyYW1ldGVyU3RvcmVcblxuICAgIC8vIFVzZSBmcm9tSG9zdGVkWm9uZUF0dHJpYnV0ZXMgdG8gcmVmZXJlbmNlIHRoZSBleGlzdGluZyBob3N0ZWQgem9uZVxuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUhvc3RlZFpvbmVBdHRyaWJ1dGVzKFxuICAgICAgdGhpcyxcbiAgICAgIFwiQ3VzdG9tRG9tYWluSG9zdGVkWm9uZVwiLFxuICAgICAge1xuICAgICAgICB6b25lTmFtZTogY3VzdG9tRG9tYWluLFxuICAgICAgICBob3N0ZWRab25lSWQ6IGV4aXN0aW5nSG9zdGVkWm9uZUlkLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIENOQU1FIHJlY29yZCBmb3Igd3d3XG4gICAgbmV3IHJvdXRlNTMuQ25hbWVSZWNvcmQodGhpcywgXCJDdXN0b21Eb21haW5DTkFNRVwiLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgcmVjb3JkTmFtZTogXCJ3d3dcIixcbiAgICAgIGRvbWFpbk5hbWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgIH0pO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBBIHJlY29yZCBmb3IgdGhlIGN1c3RvbSBkb21haW4gKGFwZXgpXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBcIkFwZXhBbGlhc1JlY29yZFwiLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMoXG4gICAgICAgIG5ldyBjZGsuYXdzX3JvdXRlNTNfdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbilcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIEFtYXpvbiBDb2duaXRvIFVzZXIgUG9vbFxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgXCJEZWxpVmVyeVVzZXJQb29sXCIsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogXCJEZWxpVmVyeVVzZXJQb29sXCIsXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSwgLy8gQWxsb3cgdXNlcnMgdG8gc2lnbiB1cFxuICAgICAgYXV0b1ZlcmlmeTogeyBlbWFpbDogdHJ1ZSB9LCAvLyBWZXJpZnkgZW1haWwgYWRkcmVzc2VzIGJ5IGRlZmF1bHRcbiAgICAgIHVzZXJWZXJpZmljYXRpb246IHtcbiAgICAgICAgZW1haWxTdWJqZWN0OiBcIlZlcmlmeSB5b3VyIGVtYWlsIGFkZHJlc3MgZnJvbSBNYXN0ZXIgb2YgRmlyZVwiLFxuICAgICAgfSxcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuRU1BSUxfT05MWSwgLy8gRW1haWwtb25seSByZWNvdmVyeVxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgVGFibGUgZm9yIFByb2R1Y3RzXG4gICAgY29uc3QgcHJvZHVjdHNUYWJsZSA9IG5ldyBkeW5hbW9EQi5UYWJsZSh0aGlzLCBcIlByb2R1Y3RUYWJsZVwiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwicHJvZHVjdFwiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IFwiaWRcIiwgdHlwZTogZHluYW1vREIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9EQi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsIC8vIE9uLWRlbWFuZCBiaWxsaW5nXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIHNlY29uZGFyeSBpbmRleGVzIHRvIHByb2R1Y3RzVGFibGVcbiAgICBwcm9kdWN0c1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogXCJjYXRlZ29yeV9pbmRleFwiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6IFwiY2F0ZWdvcnlcIixcbiAgICAgICAgdHlwZTogY2RrLmF3c19keW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogY2RrLmF3c19keW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgc2Vjb25kYXJ5IGluZGV4ZXMgdG8gcHJvZHVjdHNUYWJsZVxuICAgIHByb2R1Y3RzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiBcImNvbXBhbnlfaW5kZXhcIixcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiBcImNvbXBhbnlfaWRcIixcbiAgICAgICAgdHlwZTogY2RrLmF3c19keW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogY2RrLmF3c19keW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgc2Vjb25kYXJ5IGluZGV4ZXMgdG8gcHJvZHVjdHNUYWJsZVxuICAgIHByb2R1Y3RzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiBcInByb2R1Y3RfbmFtZV9pbmRleFwiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6IFwicHJvZHVjdF9uYW1lXCIsXG4gICAgICAgIHR5cGU6IGNkay5hd3NfZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGNkay5hd3NfZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIHNlY29uZGFyeSBpbmRleGVzIHRvIHByb2R1Y3RzVGFibGVcbiAgICBwcm9kdWN0c1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogXCJhY3RpdmVfaW5kZXhcIixcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiBcImFjdGl2ZVwiLFxuICAgICAgICB0eXBlOiBjZGsuYXdzX2R5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBjZGsuYXdzX2R5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlIGZvciBTdWJzY3JpYmVkIFVzZXJzXG4gICAgY29uc3Qgc3Vic2NyaWJlZEVtYWlsID0gbmV3IGR5bmFtb0RCLlRhYmxlKHRoaXMsIFwiU3Vic2NyaWJlZEVtYWlsVGFibGVcIiwge1xuICAgICAgdGFibGVOYW1lOiBcInN1YnNjcmliZWRfZW1haWxcIixcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9EQi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsIC8vIE9uLWRlbWFuZCBiaWxsaW5nXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6IFwiZW1haWxcIiwgdHlwZTogZHluYW1vREIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIGdsb2JhbCBzZWNvbmRhcnkgaW5kZXggZm9yICdpc19zdWJzY3JpYmVkJ1xuICAgIHN1YnNjcmliZWRFbWFpbC5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6IFwiaXNfc3Vic2NyaWJlZF9pbmRleFwiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6IFwiaXNfc3Vic2NyaWJlZFwiLFxuICAgICAgICB0eXBlOiBkeW5hbW9EQi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vREIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2FydFRhYmxlID0gbmV3IGR5bmFtb0RCLlRhYmxlKHRoaXMsIFwiQ2FydFRhYmxlXCIsIHtcbiAgICAgIHRhYmxlTmFtZTogXCJjYXJ0XCIsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogXCJwa1wiLCB0eXBlOiBkeW5hbW9EQi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiBcInNrXCIsIHR5cGU6IGR5bmFtb0RCLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vREIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIERlZmluZSB0aGUgQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpR2F0ZXdheS5SZXN0QXBpKHRoaXMsIFwiREVMSVZlcnlBcGlHYXRld2F5XCIsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBcIkRFTElWZXJ5QXBpR2F0ZXdheVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiVGhlIERFTElWZXJ5IEFQSSBHYXRld2F5XCIsXG4gICAgICAvLyBlbmRwb2ludENvbmZpZ3VyYXRpb246IHtcbiAgICAgIC8vICAgdHlwZXM6IFthcGlHYXRld2F5LkVuZHBvaW50VHlwZS5FREdFXSxcbiAgICAgIC8vIH0sXG4gICAgICBkb21haW5OYW1lOiB7XG4gICAgICAgIGRvbWFpbk5hbWU6IFwiYXBpLlwiICsgY3VzdG9tRG9tYWluLFxuICAgICAgICBjZXJ0aWZpY2F0ZTogQXBpR2F0ZXdheUNlcnRpZmljYXRlLFxuICAgICAgfSxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgLy8gY2FjaGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIC8vIGNhY2hlRGF0YUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgLy8gY2FjaGVDbHVzdGVyRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbWV0aG9kT3B0aW9uczoge1xuICAgICAgICAgIFwiL3Byb2R1Y3RzL0dFVFwiOiB7XG4gICAgICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiAxMCxcbiAgICAgICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAxMCxcbiAgICAgICAgICAgIGNhY2hlRGF0YUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNhY2hpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgY2FjaGVUdGw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiL3Byb2R1Y3RzL3tpZH0vR0VUXCI6IHtcbiAgICAgICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDIwLFxuICAgICAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDIwLFxuICAgICAgICAgICAgY2FjaGluZ0VuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgIH0sICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBBUEkgS2V5XG4gICAgY29uc3QgYXBpS2V5ID0gYXBpLmFkZEFwaUtleShcIkRlbGlWZXJ5QXBpS2V5XCIsIHtcbiAgICAgIGFwaUtleU5hbWU6IFwiRGVsaVZlcnlBcGlLZXlcIixcbiAgICB9KTtcblxuICAgIC8vIEFkZCBBUEkgS2V5IHRvIFVzYWdlIFBsYW5cbiAgICBjb25zdCB1c2FnZVBsYW4gPSBhcGkuYWRkVXNhZ2VQbGFuKFwiRGVsaVZlcnlVc2FnZVBsYW5cIiwge1xuICAgICAgbmFtZTogXCJEZWxpVmVyeVVzYWdlUGxhblwiLFxuICAgICAgdGhyb3R0bGU6IHtcbiAgICAgICAgcmF0ZUxpbWl0OiA1MDAsXG4gICAgICAgIGJ1cnN0TGltaXQ6IDEwMDAsXG4gICAgICB9LFxuICAgICAgcXVvdGE6IHtcbiAgICAgICAgbGltaXQ6IDEwMDAwLFxuICAgICAgICBwZXJpb2Q6IGFwaUdhdGV3YXkuUGVyaW9kLk1PTlRILFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFNldCBlbnZpcm9ubWVudCB2YXJpYWJsZSBmb3IgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgYXBpTGFtYmRhRW52ID0ge1xuICAgICAgUFJPRFVDVFNfVEFCTEVfTkFNRTogcHJvZHVjdHNUYWJsZS50YWJsZU5hbWUsXG4gICAgfTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3Igc2VydmVybGVzcyBlbmRwb2ludHNcbiAgICBjb25zdCBhcGlMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiREVMSVZlcnlBcGlMYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiBcInByb2R1Y3RzLWhhbmRsZXIuZ2V0UHJvZHVjdHNIYW5kbGVyXCIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJzcmMvYXBpXCIpLFxuICAgICAgZW52aXJvbm1lbnQ6IGFwaUxhbWJkYUVudixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IGFjY2VzcyB0byB0aGUgRHluYW1vREIgdGFibGUgZm9yIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBwcm9kdWN0c1RhYmxlLmdyYW50UmVhZERhdGEoYXBpTGFtYmRhKTtcblxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3Igc2VydmVybGVzcyBlbmRwb2ludHNcbiAgICBjb25zdCBjYXJ0TGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIkRFTElWZXJ5Q2FydExhbWJkYVwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6IFwiY2FydC1oYW5kbGVyLmNhcnRIYW5kbGVyXCIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJzcmMvYXBpXCIpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ0FSVF9UQUJMRV9OQU1FOiBjYXJ0VGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgYWNjZXNzIHRvIHRoZSBEeW5hbW9EQiB0YWJsZSBmb3IgdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIGNhcnRUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY2FydExhbWJkYSk7XG5cbiAgICAvLyBMYW1iZGEgZnVuY3Rpb24gZm9yIHNlcnZlcmxlc3MgZW5kcG9pbnRzXG4gICAgY29uc3QgY2hlY2tvdXRMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiREVMSVZlcnlDaGVja291dExhbWJkYVwiLFxuICAgICAge1xuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogXCJjaGVja291dC1oYW5kbGVyLmNoZWNrb3V0SGFuZGxlclwiLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJzcmMvYXBpXCIpLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIENBUlRfVEFCTEVfTkFNRTogY2FydFRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgfSk7XG5cbiAgICAvLyBHcmFudCBhY2Nlc3MgdG8gdGhlIER5bmFtb0RCIHRhYmxlIGZvciB0aGUgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY2FydFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjaGVja291dExhbWJkYSk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIEFQSSBHYXRld2F5IHJlc291cmNlIGZvciAvcHJvZHVjdHNcbiAgICBjb25zdCBwcm9kdWN0c1Jlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJwcm9kdWN0c1wiKTtcblxuICAgIC8vIEFkZCBHRVQgbWV0aG9kIHRvIHRoZSAvcHJvZHVjdHMgcmVzb3VyY2VcbiAgICBjb25zdCBnZXRQcm9kdWN0c0ludGVncmF0aW9uID0gbmV3IGFwaUdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYXBpTGFtYmRhKTtcblxuICAgIC8vIEFsbG93IGFjY2VzcyB0byBHRVQgbWV0aG9kXG4gICAgcHJvZHVjdHNSZXNvdXJjZS5hZGRNZXRob2QoXCJHRVRcIiwgZ2V0UHJvZHVjdHNJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBEZWZpbmUgdGhlIEFQSSBHYXRld2F5IHJlc291cmNlIGZvciAvcHJvZHVjdHMve2lkfVxuICAgIGNvbnN0IHByb2R1Y3RCeUlkUmVzb3VyY2UgPSBwcm9kdWN0c1Jlc291cmNlLmFkZFJlc291cmNlKFwie2lkfVwiKTtcblxuICAgIC8vIEFsbG93IGFjY2VzcyB0byBHRVQgbWV0aG9kIGZvciAvcHJvZHVjdHMve2lkfVxuICAgIHByb2R1Y3RCeUlkUmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGdldFByb2R1Y3RzSW50ZWdyYXRpb24pO1xuXG4gICAgdXNhZ2VQbGFuLmFkZEFwaVN0YWdlKHtcbiAgICAgIHN0YWdlOiBhcGkuZGVwbG95bWVudFN0YWdlLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uIGZvciBzdWJzY3JpYmUgZW5kcG9pbnRcbiAgICBjb25zdCBzdWJzY3JpYmVMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiU3Vic2NyaWJlTGFtYmRhXCIsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogXCJzdWJzY3JpYmUtaGFuZGxlci5zdWJzY3JpYmVIYW5kbGVyXCIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJzcmMvYXBpXCIpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU1VCU0NSSUJFRF9FTUFJTF9UQUJMRV9OQU1FOiBzdWJzY3JpYmVkRW1haWwudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IGFjY2VzcyB0byB0aGUgRHluYW1vREIgdGFibGUgZm9yIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBzdWJzY3JpYmVkRW1haWwuZ3JhbnRSZWFkV3JpdGVEYXRhKHN1YnNjcmliZUxhbWJkYSk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGxhbWJkYSBpbnRlZ3JhdGlvbiBmb3IgdGhlIEFQSVxuICAgIGNvbnN0IHN1YnNjcmliZUludGVncmF0aW9uID0gbmV3IGFwaUdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICBzdWJzY3JpYmVMYW1iZGFcbiAgICApO1xuXG4gICAgLy8gQWRkIFBPU1QgTWV0aG9kIGZyb20gc3Vic2NyaWJlSW50ZWdyYXRpb24gdG8gQVBJXG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJzdWJzY3JpYmVcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBzdWJzY3JpYmVJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBDcmVhdGUgdGhlIENhcnQgTGFtYmRhIGludGVncmF0aW9uIGZvciB0aGUgQVBJXG4gICAgY29uc3QgY2FydEludGVncmF0aW9uID0gbmV3IGFwaUdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY2FydExhbWJkYSk7XG4gICAgLy8gQWRkIGEgc2luZ2xlIHJlc291cmNlIGZvciB0aGUgJ2NhcnQnIHBhdGhcbiAgICBjb25zdCBjYXJ0UmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZShcImNhcnRcIik7XG5cbiAgICAvLyBBZGQgUFVUIGFuZCBQT1NUIE1ldGhvZCBmcm9tIGNhcnRJbnRlZ3JhdGlvbiB0byBBUElcbiAgICBjYXJ0UmVzb3VyY2UuYWRkTWV0aG9kKFwiUFVUXCIsIGNhcnRJbnRlZ3JhdGlvbik7XG4gICAgY2FydFJlc291cmNlLmFkZE1ldGhvZChcIlBPU1RcIiwgY2FydEludGVncmF0aW9uKTtcbiAgICBjYXJ0UmVzb3VyY2UuYWRkTWV0aG9kKFwiR0VUXCIsIGNhcnRJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBDcmVhdGUgdGhlIENoZWNrb3V0IExhbWJkYSBpbnRlZ3JhdGlvbiBmb3IgdGhlIEFQSVxuICAgIGNvbnN0IGNoZWNrb3V0SW50ZWdyYXRpb24gPSBuZXcgYXBpR2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIGNoZWNrb3V0TGFtYmRhXG4gICAgKTtcblxuICAgIC8vIEFkZCBQT1NUIE1ldGhvZCBmcm9tIGNoZWNrb3V0SW50ZWdyYXRpb24gdG8gQVBJXG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJjaGVja291dFwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGNoZWNrb3V0SW50ZWdyYXRpb24pO1xuXG5cbiAgICAvLyBCRkYgTGF5ZXJcblxuICAgIC8vIERlZmluZSB0aGUgQmFja2VuZCBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaUhhbmRsZXIgPSBuZXcgYXBpR2F0ZXdheS5SZXN0QXBpKFxuICAgICAgdGhpcyxcbiAgICAgIFwiREVMSVZlcnlBcGlIYW5kbGVyR2F0ZXdheVwiLFxuICAgICAge1xuICAgICAgICByZXN0QXBpTmFtZTogXCJERUxJVmVyeUFwaUhhbmRsZXJHYXRld2F5XCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIk5vLUNhY2hlZCBCYWNrZW5kIEFQSVwiLFxuICAgICAgICBkb21haW5OYW1lOiB7XG4gICAgICAgICAgZG9tYWluTmFtZTogXCJhcHAuXCIgKyBjdXN0b21Eb21haW4sXG4gICAgICAgICAgY2VydGlmaWNhdGU6IEFwaUdhdGV3YXlDZXJ0aWZpY2F0ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICAgIGNhY2hpbmdFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICBtZXRob2RPcHRpb25zOiB7XG4gICAgICAgICAgICBcIi9iYWNrZW5kL0dFVFwiOiB7XG4gICAgICAgICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDEwMCxcbiAgICAgICAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gTGFtYmRhIGZ1bmN0aW9uIGZvciBzZWN1cmVseSBjYWxsaW5nIHRoZSBlbmRwb2ludHNcbiAgICBjb25zdCBhcGlMYW1iZGFIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkRFTElWZXJ5QmFja2tlbmRIYW5kbGVyTGFtYmRhXCIsXG4gICAgICB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiBcImJhY2tlbmQtaGFuZGxlci5jYWxsSGFuZGxlclwiLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJzcmMvYmFja2VuZFwiKSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IGFwaUxhbWJkYUVudixcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgICByb2xlOiBuZXcgaWFtLlJvbGUodGhpcywgXCJMYW1iZGFSb2xlXCIsIHtcbiAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImxhbWJkYS5hbWF6b25hd3MuY29tXCIpLFxuICAgICAgICAgIC8vIEF0dGFjaCBwb2xpY2llcyB0byB0aGUgTGFtYmRhIGZ1bmN0aW9uIHJvbGVcbiAgICAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAgICAgXCJzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlXCJcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXG4gICAgICAgICAgICAgIFwiU2VjcmV0c01hbmFnZXJSZWFkV3JpdGVcIlxuICAgICAgICAgICAgKSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgYmFja2VuZFJlc291cmNlID0gYXBpSGFuZGxlci5yb290LmFkZFJlc291cmNlKFwie3Byb3h5K31cIik7XG5cbiAgICAvLyBFbmFibGUgQ09SUyBmb3IgdGhlIEFQSSBHYXRld2F5IG1ldGhvZFxuICAgIGJhY2tlbmRSZXNvdXJjZS5hZGRDb3JzUHJlZmxpZ2h0KHtcbiAgICAgIGFsbG93T3JpZ2luczogYXBpR2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgYWxsb3dNZXRob2RzOiBbXCJHRVRcIiwgXCJPUFRJT05TXCJdLFxuICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCIsXG4gICAgICAgIFwiWC1BbXotRGF0ZVwiLFxuICAgICAgICBcIkF1dGhvcml6YXRpb25cIixcbiAgICAgICAgXCJYLUFwaS1LZXlcIixcbiAgICAgICAgXCJYLUFtei1TZWN1cml0eS1Ub2tlblwiLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJhY2tlbmRMYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlHYXRld2F5LkxhbWJkYUludGVncmF0aW9uKFxuICAgICAgYXBpTGFtYmRhSGFuZGxlcixcbiAgICAgIHtcbiAgICAgICAgcHJveHk6IHRydWUsXG4gICAgICB9XG4gICAgKTtcbiAgICAvLyBBbGxvdyBhbm9ueW1vdXMgYWNjZXNzIHRvIEdFVCBtZXRob2RcbiAgICAvLyBDcmVhdGUgYSByZXNvdXJjZSB3aXRoIGEgZ3JlZWR5IHBhdGggdmFyaWFibGUgYW5kIEFOWSBtZXRob2RcbiAgICBjb25zdCBiYWNrZW5kTWV0aG9kID0gYmFja2VuZFJlc291cmNlLmFkZE1ldGhvZChcbiAgICAgIFwiQU5ZXCIsXG4gICAgICBiYWNrZW5kTGFtYmRhSW50ZWdyYXRpb24sXG4gICAgICB7XG4gICAgICAgIGFwaUtleVJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogXCIyMDBcIixcbiAgICAgICAgICAgIHJlc3BvbnNlUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICBcIm1ldGhvZC5yZXNwb25zZS5oZWFkZXIuQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IHRydWUsXG4gICAgICAgICAgICAgIFwibWV0aG9kLnJlc3BvbnNlLmhlYWRlci5BY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgXCJtZXRob2QucmVxdWVzdC5wYXRoLmFueVwiOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBsb2NhbERuc05hbWUgPSBgYXBpLiR7Y3VzdG9tRG9tYWlufWA7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJBcGlHYXRld2F5VXJsXCIsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2xvY2FsRG5zTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246IFwiVGhlIFVSTCBvZiB0aGUgRGVsaS1WZXJ5IEFQSVwiLFxuICAgICAgZXhwb3J0TmFtZTogXCJBcGlHYXRld2F5VXJsXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcHBEbnNOYW1lID0gYGFwcC4ke2N1c3RvbURvbWFpbn1gO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQXBwVXJsXCIsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2FwcERuc05hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlVSTCBmb3IgQVBJIENsaWVudCBBY2Nlc3NcIixcbiAgICAgIGV4cG9ydE5hbWU6IFwiQXBwVXJsXCIsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQVJlY29yZCB0YXJnZXQgZm9yIEFQSSBHYXRld2F5XG4gICAgbmV3IGNkay5hd3Nfcm91dGU1My5BUmVjb3JkKHRoaXMsIFwiQVBJQVJlY29yZFwiLCB7XG4gICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgdGFyZ2V0OiBjZGsuYXdzX3JvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhcbiAgICAgICAgbmV3IGNkay5hd3Nfcm91dGU1M190YXJnZXRzLkFwaUdhdGV3YXkoYXBpKVxuICAgICAgKSxcbiAgICAgIHJlY29yZE5hbWU6IGxvY2FsRG5zTmFtZSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBBUmVjb3JkIHRhcmdldCBmb3IgQVBJIEdhdGV3YXlcbiAgICBuZXcgY2RrLmF3c19yb3V0ZTUzLkFSZWNvcmQodGhpcywgXCJBcHBBUmVjb3JkXCIsIHtcbiAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICB0YXJnZXQ6IGNkay5hd3Nfcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKFxuICAgICAgICBuZXcgY2RrLmF3c19yb3V0ZTUzX3RhcmdldHMuQXBpR2F0ZXdheShhcGlIYW5kbGVyKVxuICAgICAgKSxcbiAgICAgIHJlY29yZE5hbWU6IGFwcERuc05hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==