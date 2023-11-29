import { APIGatewayProxyHandler } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: "ap-southeast-2" });

export const subscribeHandler: APIGatewayProxyHandler = async (event) => {
  try {
    console.info("subscribeHandler initiated");
    // Extract the email from the request body
    const email = JSON.parse(event.body || "").email;
    const is_subscribed = JSON.parse(event.body || "").is_subscribed;

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
