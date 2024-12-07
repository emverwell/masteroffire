import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
const logger = console;

export const getProductsHandler = async (event: any): Promise<any> => {
  logger.info("getProductsHandler method initiated");

  const dynamoDB = new DynamoDBClient({ region: "ap-southeast-2" });

  // Check if there is an "id" parameter in the path
  if (event.pathParameters && event.pathParameters.id) {
    // Handle /products/{id} request
    const id = event.pathParameters.id;
    logger.info("Handle /products/{id} request");
    const params: GetItemCommandInput = {
      TableName: process.env.PRODUCTS_TABLE_NAME || "",
      Key: {
        id: { S: id },
      },
    };
    const getItemCommand = new GetItemCommand(params);

    try {
      const result = await dynamoDB.send(getItemCommand);

      if (result.Item) {
        logger.info("result.Item has a value", result.Item);
        const unwrappedResult = unmarshall(result.Item);
        return {
          statusCode: 200,
          body: JSON.stringify(unwrappedResult),
        };
      } else {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Product not found" }),
        };
      }
    } catch (error) {
      console.error("Error getting product from DynamoDB:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" }),
      };
    }
  } else {
    // Handle /products request
    logger.info("Handle /products request");
    const params: ScanCommandInput = {
      TableName: process.env.PRODUCTS_TABLE_NAME || "",
      FilterExpression: "#active = :active",
      ExpressionAttributeValues: {
        ":active": { S: "true" },
      },
      ExpressionAttributeNames: {
        "#active": "active",
      },
    };

    const scanCommand = new ScanCommand(params);

    try {
      const result = await dynamoDB.send(scanCommand);
      logger.info("result successfully obtained");
      // Check if result.Items has a value
      if (!result.Items) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Products not found" }),
        };
      } else {
        const unwrappedResult = result.Items.map((item) => unmarshall(item));
        logger.info("Full result data:", unwrappedResult);
        return {
          statusCode: 200,
          body: JSON.stringify(unwrappedResult),
        };
      }
    } catch (error) {
      console.error("Error scanning DynamoDB table:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" }),
      };
    }
  }
};
