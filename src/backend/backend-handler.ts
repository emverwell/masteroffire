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

    apiKey = await getApiKey();

    const parameters = event.multiValueQueryStringParameters;
    logger.info("Parameters received:", parameters);

    // Extract the destination URL from the query string
    var destinationUrl = event.queryStringParameters?.destinationUrl;
    if (!destinationUrl) {
      logger.error("Error:", "URL not provided");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "URL not provided" }),
      };
    }

    // Extract the id from the query string
    const id = event.queryStringParameters?.id;
    if (id) {
      destinationUrl = `products/${id}`;
      logger.info("id received", destinationUrl);
    }

    // Modify the event to add the API key to headers
    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };

    // Forward the request to the actual API Gateway
    var body = event.body;
    if (!['GET', 'HEAD'].includes(event.httpMethod)) {
      body = JSON.stringify(event.body);
    }

    const url = "https://api.themasteroffire.com/" + destinationUrl;
    logger.info(`Invoking API ${url} with body ${body}`);

    const response = await fetch(url, {
      method: event.httpMethod,
      body: body,
      headers: headers,
    });

    // Return the response to the client
    const data = await response.json();
    const response_body = JSON.stringify(data);
    logger.info("API Call Result: ", response.status, response_body);

    return {
      statusCode: response.status,
      headers: response_headers, //We don't want to expose the ApiKey
      body: response_body,
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

async function getApiKey(): Promise<string> {
  try {
    if (!process.env.API_KEY) {
      // Retrieve the secret from AWS Secrets Manager
      apiKey = await getSecretFromAWS("DeliVery/DVApiKey");

      // Set the API key in the environment variable
      process.env.API_KEY = apiKey;

      return apiKey;
    }

    return process.env.API_KEY;
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return "";
  }
}

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
