import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManager();

const logger = console;
let apiKey: string | null = null;

export const callHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.log("Received event:", JSON.stringify(event, null, 2));

  const response_headers = {
    ...event.headers,
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  }; //We don't want to expose the ApiKey

  try {
    // Extract API key from the secret

    if (!process.env.API_KEY) {
      apiKey = await getSecretFromAWS("DeliVery/DVApiKey");
      // Set the API key in the environment variable
      process.env.API_KEY = apiKey;
    }

    if (!apiKey) {
      logger.error("Error:", "API key not found");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not found" }),
      };
    }

    // Extract the destination URL from the query string
    const destinationUrl = event.queryStringParameters?.destinationUrl;
    if (!destinationUrl) {
      logger.error("Error:", "URL not provided");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "URL not provided" }),
      };
    }

    logger.info("ApiKey value", apiKey);

    // Modify the event to add the API key to headers
    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };

    // Forward the request to the actual API Gateway
    const url = "https://api.themasteroffire.com/" + destinationUrl;
    logger.info("Invoking API", url);

    const response = await fetch(url, {
      method: event.httpMethod,
      body: event.body,
      headers: headers,
    });

    // Return the response to the client
    const data = await response.json();
    const body = JSON.stringify(data);
    logger.info("API Call Result: ", response.status, body);

    return {
      statusCode: response.status,
      headers: response_headers, //We don't want to expose the ApiKey
      body: body,
    };
  } catch (error) {
    logger.error("Error:", error);
    return {
      statusCode: 500,
      headers: response_headers, //We don't want to expose the ApiKey
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

async function getSecretFromAWS(secretName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    secretsManager.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Check if data.SecretString is defined before using it
        if (data && data.SecretString) {
          resolve(data.SecretString);
        } else {
          reject(new Error("SecretString is undefined"));
        }
      }
    });
  });
}
