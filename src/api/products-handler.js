"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsHandler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const logger = console;
const getProductsHandler = async (event) => {
    logger.info("getProductsHandler method initiated");
    const dynamoDB = new client_dynamodb_1.DynamoDBClient({ region: "ap-southeast-2" });
    // Check if there is an "id" parameter in the path
    if (event.pathParameters && event.pathParameters.id) {
        // Handle /products/{id} request
        const id = event.pathParameters.id;
        logger.info("Handle /products/{id} request");
        const params = {
            TableName: process.env.PRODUCTS_TABLE_NAME || "",
            Key: {
                id: { S: id },
            },
        };
        const getItemCommand = new client_dynamodb_1.GetItemCommand(params);
        try {
            const result = await dynamoDB.send(getItemCommand);
            if (result.Item) {
                logger.info("result.Item has a value", result.Item);
                const unwrappedResult = (0, util_dynamodb_1.unmarshall)(result.Item);
                return {
                    statusCode: 200,
                    body: JSON.stringify(unwrappedResult),
                };
            }
            else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: "Product not found" }),
                };
            }
        }
        catch (error) {
            console.error("Error getting product from DynamoDB:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Internal Server Error" }),
            };
        }
    }
    else {
        // Handle /products request
        logger.info("Handle /products request");
        const params = {
            TableName: process.env.PRODUCTS_TABLE_NAME || "",
            FilterExpression: "#active = :active",
            ExpressionAttributeValues: {
                ":active": { S: "true" },
            },
            ExpressionAttributeNames: {
                "#active": "active",
            },
        };
        const scanCommand = new client_dynamodb_1.ScanCommand(params);
        try {
            const result = await dynamoDB.send(scanCommand);
            logger.info("result successfully obtained");
            // Check if result.Items has a value
            if (!result.Items) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: "Products not found" }),
                };
            }
            else {
                const unwrappedResult = result.Items.map((item) => (0, util_dynamodb_1.unmarshall)(item));
                logger.info("Full result data:", unwrappedResult);
                return {
                    statusCode: 200,
                    body: JSON.stringify(unwrappedResult),
                };
            }
        }
        catch (error) {
            console.error("Error scanning DynamoDB table:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Internal Server Error" }),
            };
        }
    }
};
exports.getProductsHandler = getProductsHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdHMtaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2R1Y3RzLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsOERBTWtDO0FBQ2xDLDBEQUFvRDtBQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFFaEIsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFnQixFQUFFO0lBQ25FLE1BQU0sQ0FBQyxJQUFJLENBQUMscUNBQXFDLENBQUMsQ0FBQztJQUVuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO0lBRWxFLGtEQUFrRDtJQUNsRCxJQUFJLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUU7UUFDbkQsZ0NBQWdDO1FBQ2hDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1FBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBd0I7WUFDbEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRTtZQUNoRCxHQUFHLEVBQUU7Z0JBQ0gsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTthQUNkO1NBQ0YsQ0FBQztRQUNGLE1BQU0sY0FBYyxHQUFHLElBQUksZ0NBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVsRCxJQUFJO1lBQ0YsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRW5ELElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtnQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxlQUFlLEdBQUcsSUFBQSwwQkFBVSxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEQsT0FBTztvQkFDTCxVQUFVLEVBQUUsR0FBRztvQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7aUJBQ3RDLENBQUM7YUFDSDtpQkFBTTtnQkFDTCxPQUFPO29CQUNMLFVBQVUsRUFBRSxHQUFHO29CQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLENBQUM7aUJBQ3ZELENBQUM7YUFDSDtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdELE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQzthQUMzRCxDQUFDO1NBQ0g7S0FDRjtTQUFNO1FBQ0wsMkJBQTJCO1FBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUN4QyxNQUFNLE1BQU0sR0FBcUI7WUFDL0IsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRTtZQUNoRCxnQkFBZ0IsRUFBRSxtQkFBbUI7WUFDckMseUJBQXlCLEVBQUU7Z0JBQ3pCLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUU7YUFDekI7WUFDRCx3QkFBd0IsRUFBRTtnQkFDeEIsU0FBUyxFQUFFLFFBQVE7YUFDcEI7U0FDRixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSw2QkFBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTVDLElBQUk7WUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzVDLG9DQUFvQztZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtnQkFDakIsT0FBTztvQkFDTCxVQUFVLEVBQUUsR0FBRztvQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDO2lCQUN4RCxDQUFDO2FBQ0g7aUJBQU07Z0JBQ0wsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUEsMEJBQVUsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUNsRCxPQUFPO29CQUNMLFVBQVUsRUFBRSxHQUFHO29CQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQztpQkFDdEMsQ0FBQzthQUNIO1NBQ0Y7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxDQUFDO2FBQzNELENBQUM7U0FDSDtLQUNGO0FBQ0gsQ0FBQyxDQUFDO0FBbEZXLFFBQUEsa0JBQWtCLHNCQWtGN0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEeW5hbW9EQkNsaWVudCxcbiAgR2V0SXRlbUNvbW1hbmQsXG4gIEdldEl0ZW1Db21tYW5kSW5wdXQsXG4gIFNjYW5Db21tYW5kLFxuICBTY2FuQ29tbWFuZElucHV0LFxufSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiXCI7XG5pbXBvcnQgeyB1bm1hcnNoYWxsIH0gZnJvbSBcIkBhd3Mtc2RrL3V0aWwtZHluYW1vZGJcIjtcbmNvbnN0IGxvZ2dlciA9IGNvbnNvbGU7XG5cbmV4cG9ydCBjb25zdCBnZXRQcm9kdWN0c0hhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSk6IFByb21pc2U8YW55PiA9PiB7XG4gIGxvZ2dlci5pbmZvKFwiZ2V0UHJvZHVjdHNIYW5kbGVyIG1ldGhvZCBpbml0aWF0ZWRcIik7XG5cbiAgY29uc3QgZHluYW1vREIgPSBuZXcgRHluYW1vREJDbGllbnQoeyByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIiB9KTtcblxuICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbiBcImlkXCIgcGFyYW1ldGVyIGluIHRoZSBwYXRoXG4gIGlmIChldmVudC5wYXRoUGFyYW1ldGVycyAmJiBldmVudC5wYXRoUGFyYW1ldGVycy5pZCkge1xuICAgIC8vIEhhbmRsZSAvcHJvZHVjdHMve2lkfSByZXF1ZXN0XG4gICAgY29uc3QgaWQgPSBldmVudC5wYXRoUGFyYW1ldGVycy5pZDtcbiAgICBsb2dnZXIuaW5mbyhcIkhhbmRsZSAvcHJvZHVjdHMve2lkfSByZXF1ZXN0XCIpO1xuICAgIGNvbnN0IHBhcmFtczogR2V0SXRlbUNvbW1hbmRJbnB1dCA9IHtcbiAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuUFJPRFVDVFNfVEFCTEVfTkFNRSB8fCBcIlwiLFxuICAgICAgS2V5OiB7XG4gICAgICAgIGlkOiB7IFM6IGlkIH0sXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZ2V0SXRlbUNvbW1hbmQgPSBuZXcgR2V0SXRlbUNvbW1hbmQocGFyYW1zKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkeW5hbW9EQi5zZW5kKGdldEl0ZW1Db21tYW5kKTtcblxuICAgICAgaWYgKHJlc3VsdC5JdGVtKSB7XG4gICAgICAgIGxvZ2dlci5pbmZvKFwicmVzdWx0Lkl0ZW0gaGFzIGEgdmFsdWVcIiwgcmVzdWx0Lkl0ZW0pO1xuICAgICAgICBjb25zdCB1bndyYXBwZWRSZXN1bHQgPSB1bm1hcnNoYWxsKHJlc3VsdC5JdGVtKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodW53cmFwcGVkUmVzdWx0KSxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogXCJQcm9kdWN0IG5vdCBmb3VuZFwiIH0pLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2V0dGluZyBwcm9kdWN0IGZyb20gRHluYW1vREI6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiBcIkludGVybmFsIFNlcnZlciBFcnJvclwiIH0pLFxuICAgICAgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gSGFuZGxlIC9wcm9kdWN0cyByZXF1ZXN0XG4gICAgbG9nZ2VyLmluZm8oXCJIYW5kbGUgL3Byb2R1Y3RzIHJlcXVlc3RcIik7XG4gICAgY29uc3QgcGFyYW1zOiBTY2FuQ29tbWFuZElucHV0ID0ge1xuICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5QUk9EVUNUU19UQUJMRV9OQU1FIHx8IFwiXCIsXG4gICAgICBGaWx0ZXJFeHByZXNzaW9uOiBcIiNhY3RpdmUgPSA6YWN0aXZlXCIsXG4gICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgIFwiOmFjdGl2ZVwiOiB7IFM6IFwidHJ1ZVwiIH0sXG4gICAgICB9LFxuICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZU5hbWVzOiB7XG4gICAgICAgIFwiI2FjdGl2ZVwiOiBcImFjdGl2ZVwiLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3Qgc2NhbkNvbW1hbmQgPSBuZXcgU2NhbkNvbW1hbmQocGFyYW1zKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkeW5hbW9EQi5zZW5kKHNjYW5Db21tYW5kKTtcbiAgICAgIGxvZ2dlci5pbmZvKFwicmVzdWx0IHN1Y2Nlc3NmdWxseSBvYnRhaW5lZFwiKTtcbiAgICAgIC8vIENoZWNrIGlmIHJlc3VsdC5JdGVtcyBoYXMgYSB2YWx1ZVxuICAgICAgaWYgKCFyZXN1bHQuSXRlbXMpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiBcIlByb2R1Y3RzIG5vdCBmb3VuZFwiIH0pLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdW53cmFwcGVkUmVzdWx0ID0gcmVzdWx0Lkl0ZW1zLm1hcCgoaXRlbSkgPT4gdW5tYXJzaGFsbChpdGVtKSk7XG4gICAgICAgIGxvZ2dlci5pbmZvKFwiRnVsbCByZXN1bHQgZGF0YTpcIiwgdW53cmFwcGVkUmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodW53cmFwcGVkUmVzdWx0KSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNjYW5uaW5nIER5bmFtb0RCIHRhYmxlOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiB9KSxcbiAgICAgIH07XG4gICAgfVxuICB9XG59O1xuIl19