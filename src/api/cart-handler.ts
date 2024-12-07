import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  ScanCommand,
  ScanCommandInput,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
// import { Tracer } from "@aws-lambda-powertools/tracer";
// import { Logger } from "@aws-lambda-powertools/logger";
// import { Metrics } from "@aws-lambda-powertools/metrics";
import { randomUUID as uuidv4 } from "crypto";
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
} from "aws-lambda";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

// import { Cart } from "../layers/models";

const dynamoDB = new DynamoDBClient({ region: "ap-southeast-2" });
const logger = console;
// const tracer = new Tracer();
// const metrics = new Metrics();
const secretsManager = new SecretsManager();

export interface Cart {
  productId: string;
  quantity: number;
  priceString: string;
}

export const cartHandler: APIGatewayProxyHandler = async (event) => {
  logger.info("cartHandler initiated");
  var requestPayload: Cart | null = null;
  const cartCookie = getCartId(event.headers);
  const cartId = cartCookie[0];
  logger.info("cartHandler headers: ", event.headers);
  const headers = getHeaders(cartId)

  try {
    requestPayload = JSON.parse(event.body!);
    logger.info(
      `requestPayload: ${requestPayload} and headers: ${headers}`
    );
  } catch (error) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({ message: "No Request payload" }),
    };
  }

  // Handle Shopping Cart
  if (!requestPayload && event.httpMethod == "GET") {
    const pk = `cart#${cartId}`;
    logger.info("GET cart/ invoked pk:", pk);
    const params: ScanCommandInput = {
      TableName: process.env.CART_TABLE_NAME,
      FilterExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: pk },
      },
    };
    const data = await dynamoDB.send(new ScanCommand(params));
    const response_body = JSON.stringify(data.Items);
    return {
      statusCode: 200,
      headers: headers,
      body: response_body,
    };
  }

  // Handling Adding/Modifying Items from the Cart.
  const product_id = requestPayload?.productId ?? "defaultProductId";
  logger.info("product_id:", product_id);
  const quantity = requestPayload?.quantity ?? 1;
  const string_price: string = requestPayload?.priceString ?? "$0";
//   const product_details: string = requestPayload?.productName || "";
  const price: number = parseFloat(string_price.replace("$", ""));

  const cartTable = process.env.CART_TABLE_NAME;
  let pk, sk, ttl;
  pk = `cart#${cartId}`;
  sk = `product#${product_id}`;
  ttl = generateTtl();
  logger.info(`Cart entry - pk:${pk}, sk:${sk}, ttl:${ttl}`);

  if (quantity < 0) {
    await dynamoDB.send(
      new UpdateItemCommand({
        TableName: cartTable,
        Key: {
          pk: { S: pk },
          sk: { S: sk },
        },
        ExpressionAttributeNames: {
          "#quantity": "quantity",
          "#price": "price",
          "#expirationTime": "expirationTime",
          "#productDetail": "productDetail",
        },
        ExpressionAttributeValues: {
          ":val": { N: quantity.toString() },
          ":unitPrice": { N: price.toString() },
          ":ttl": { N: generateTtl().toString() },
        //   ":productDetail": { S: product_details },
          ":limit": { N: Math.abs(quantity).toString() },
        },
        UpdateExpression:
          "ADD #quantity :val SET #expirationTime = :ttl, #productDetail = :productDetail, #price = :unitPrice",
        ConditionExpression: "quantity >= :limit",
      })
    );
  } else {
    await dynamoDB.send(
      new UpdateItemCommand({
        TableName: cartTable,
        Key: {
          pk: { S: pk },
          sk: { S: `product#${product_id}` },
        },
        ExpressionAttributeNames: {
          "#quantity": "quantity",
          "#price": "price",
          "#expirationTime": "expirationTime",
          "#productDetail": "productDetail",
        },
        ExpressionAttributeValues: {
          ":val": { N: quantity.toString() },
          ":unitPrice": { N: price.toString() },
          ":ttl": { N: generateTtl().toString() },
        //   ":productDetail": { S: product_details },
        },
        UpdateExpression:
          "ADD #quantity :val SET #expirationTime = :ttl, #productDetail = :productDetail, #price = :unitPrice",
      })
    );
  }

  return {
    statusCode: 200,
    headers: headers, //We don't want to expose the ApiKey
    body: JSON.stringify({
      message: `Processed successful! ${product_id} - ${quantity} CartId: ${cartId}`,
    }),
  };
};

function getHeaders(cartId: string): Record<string, any> {
  /**
   * Get the headers to add to response data
   */

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Set-Cookie": `cartId=${cartId}; Max-Age=${
      60 * 60 * 24
    }; Secure; HttpOnly; SameSite=None; Path=/`,
    // Add any other headers as needed
  };
  logger.info(`Getting headers: ${headers}`);
  return headers;
}

// @tracer.captureMethod
export function getCartId(
  eventHeaders: APIGatewayProxyEventHeaders
): [string, boolean] {
  /**
   * Retrieve cart_id from cookies if it exists, otherwise set and return it
   */

  logger.info("Getting cartId");
  const generatedCookie = (): [string, boolean] => {
    const cartId = String(uuidv4());
    return [cartId, true];
  };

  const cookie = new Map<string, string>();
  try {
    const cookieHeader = eventHeaders["cookie"];
    logger.info(`cookieHeader from eventHeaders: ${cookieHeader}`);
    if (cookieHeader) {
      logger.info("cookieHeader obtained: ", cookieHeader);
      cookieHeader.split(";").forEach((pair) => {
        const [key, value] = pair.trim().split("=");
        cookie.set(key, value);
      });
    }

    const cartCookie = cookie.get("cartId");
    logger.info(`cartCookie: ${cartCookie}`);
    if (cartCookie !== undefined) {
      return [cartCookie, false];
    }
  } catch (error) {
    // Handle the error as needed
  }
  const new_cookie = generatedCookie();
  logger.info("New cookie generated: ", new_cookie);
  return new_cookie;
}

async function getProduct(
  event: APIGatewayProxyEvent,
  productId: string
): Promise<Record<string, any>> {
  const apiKey = await getApiKey();
  // Modify the event to add the API key to headers
  const headers = {
    ...event.headers,
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };

  // Call product API to retrieve product details using productId
  const response = await fetch(
    "https://api.themasteroffire.com/products/" + productId,
    {
      method: "GET",
      headers: headers,
    }
  );

  // Return the response to the client
  const data = await response.json();
  const response_body = JSON.stringify(data);
  logger.info("API Call Result: ", response.status, response_body);
  return { response_body };
}

async function getApiKey(): Promise<string> {
  try {
    if (!process.env.API_KEY) {
      // Retrieve the secret from AWS Secrets Manager
      const apiKey = await getSecretFromAWS("DeliVery/DVApiKey");

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

function generateTtl(days: number = 1): number {
  /**
   * Generate epoch timestamp for a number of days in the future
   */
  const future = new Date();
  future.setUTCDate(future.getUTCDate() + days);
  return Math.floor(future.getTime() / 1000);
}
