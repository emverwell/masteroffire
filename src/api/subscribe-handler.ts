import { APIGatewayProxyHandler } from "aws-lambda";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  PutItemCommandInput,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  SESClient,
  SendEmailCommand,
  Destination,
  Message,
  Body,
  Content,
} from "@aws-sdk/client-ses";

const REGION = "ap-southeast-2";
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const sesClient = new SESClient({ region: REGION });

export const subscribeHandler: APIGatewayProxyHandler = async (event) => {
  try {
    console.info("subscribeHandler initiated");
    // Extract the email from the request body
    const email = JSON.parse(event.body || "").email;
    const is_subscribed = JSON.parse(event.body || "").is_subscribed;

    const subscribedEmail = await checkSubscribed(email);
    if (subscribedEmail.is_subscribed) {
      console.info("Email already subscribed");
      return updateSubscribed(subscribedEmail);
    }

    // Create a PutItemCommand for DynamoDB
    const putCommand: PutItemCommandInput = {
      TableName: process.env.SUBSCRIBED_EMAIL_TABLE_NAME,
      Item: {
        email: { S: email },
        is_subscribed: { S: is_subscribed },
      },
    };

    // Put the item into DynamoDB
    await dynamoDBClient.send(new PutItemCommand(putCommand));

    console.info("Subscription successful!");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription successful!" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Subscription failed. Please try again.",
      }),
    };
  }
};

async function checkSubscribed(email: string): Promise<Record<string, any>> {
  const subscribedEmail = await dynamoDBClient.send(
    new GetItemCommand({
      TableName: process.env.SUBSCRIBED_EMAIL_TABLE_NAME,
      Key: { email: { S: email } },
    })
  );

  return subscribedEmail.Item || {};
}

async function updateSubscribed(
  subscription: Record<string, any>
): Promise<Record<string, any>> {
  // If already subscribed, update only if not already subscribed
  const bool_subscribed = subscription.is_subscribed.S === 'true';
  const email = subscription.email.S;
  const is_subscribed = subscription.is_subscribed.S;

  if (!bool_subscribed) {
    // Create an UpdateItemCommand for DynamoDB
    const updateCommand = {
      TableName: process.env.SUBSCRIBED_EMAIL_TABLE_NAME,
      Key: { email: { S: email } },
      UpdateExpression: "SET is_subscribed = :is_subscribed",
      ExpressionAttributeValues: {
        ":is_subscribed": { S: "true" },
      },
    };

    // Update the item in DynamoDB
    await dynamoDBClient.send(new UpdateItemCommand(updateCommand));

    // Send a message to SQS for email notification
    const sqsParams = {
      QueueUrl: "your-sqs-queue-url", // Replace with your actual SQS queue URL
      MessageBody: JSON.stringify({ email }),
    };
    await sqsClient.send(new SendMessageCommand(sqsParams));

    console.info("Subscription updated to true!");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription updated to true!" }),
    };
  } else {
    console.info("Email is already subscribed.");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email is already subscribed." }),
    };
  }
}
