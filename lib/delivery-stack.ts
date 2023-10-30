import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class DeliVeryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the custom domain in Route 53 and the associated SSL certificate from ACM
    const customDomain = 'themasteroffire.com';
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      'arn:aws:acm:us-east-1:187922044747:certificate/467258e1-1946-48f1-adfc-2fa1c08b0445'
    );

    // Create an S3 bucket to host the website static files.
    const websiteBucket = new s3.Bucket(this, 'StaticContent', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy static website files to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployDELIVeryWebsite', {
      sources: [s3deploy.Source.asset('./content/website/files')],
      destinationBucket: websiteBucket,
    });    

    // Create a CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'DELIVeryDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [customDomain], // Associate custom domain
      certificate: certificate, // Use SSL certificate
      defaultRootObject: 'index.html', // Default page
    });

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'DELIVeryDistributionDomainName', {
      value: distribution.distributionDomainName,
    });
  }
}
