"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeHandler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_ses_1 = require("@aws-sdk/client-ses");
const REGION = "ap-southeast-2";
const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({ region: REGION });
const sqsClient = new client_sqs_1.SQSClient({ region: REGION });
const sesClient = new client_ses_1.SESClient({ region: REGION });
const subscribeHandler = async (event) => {
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
        const putCommand = {
            TableName: process.env.SUBSCRIBED_EMAIL_TABLE_NAME,
            Item: {
                email: { S: email },
                is_subscribed: { S: is_subscribed },
            },
        };
        // Put the item into DynamoDB
        await dynamoDBClient.send(new client_dynamodb_1.PutItemCommand(putCommand));
        console.info("Subscription successful!");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Subscription successful!" }),
        };
    }
    catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Subscription failed. Please try again.",
            }),
        };
    }
};
exports.subscribeHandler = subscribeHandler;
async function checkSubscribed(email) {
    const subscribedEmail = await dynamoDBClient.send(new client_dynamodb_1.GetItemCommand({
        TableName: process.env.SUBSCRIBED_EMAIL_TABLE_NAME,
        Key: { email: { S: email } },
    }));
    return subscribedEmail.Item || {};
}
async function updateSubscribed(subscription) {
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
        await dynamoDBClient.send(new client_dynamodb_1.UpdateItemCommand(updateCommand));
        // Send a message to SQS for email notification
        const sqsParams = {
            QueueUrl: "your-sqs-queue-url",
            MessageBody: JSON.stringify({ email }),
        };
        await sqsClient.send(new client_sqs_1.SendMessageCommand(sqsParams));
        console.info("Subscription updated to true!");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Subscription updated to true!" }),
        };
    }
    else {
        console.info("Email is already subscribed.");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Email is already subscribed." }),
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vic2NyaWJlLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdWJzY3JpYmUtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFNa0M7QUFDbEMsb0RBQW9FO0FBQ3BFLG9EQU82QjtBQUU3QixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQztBQUNoQyxNQUFNLGNBQWMsR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUM5RCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNwRCxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUU3QyxNQUFNLGdCQUFnQixHQUEyQixLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDdEUsSUFBSTtRQUNGLE9BQU8sQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUMzQywwQ0FBMEM7UUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNqRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDO1FBRWpFLE1BQU0sZUFBZSxHQUFHLE1BQU0sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JELElBQUksZUFBZSxDQUFDLGFBQWEsRUFBRTtZQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDekMsT0FBTyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUMxQztRQUVELHVDQUF1QztRQUN2QyxNQUFNLFVBQVUsR0FBd0I7WUFD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TCxPQUFPLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDN0MsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsOEJBQThCLEVBQUUsQ0FBQztTQUNsRSxDQUFDO0tBQ0g7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5SGFuZGxlciB9IGZyb20gXCJhd3MtbGFtYmRhXCI7XG5pbXBvcnQge1xuICBEeW5hbW9EQkNsaWVudCxcbiAgR2V0SXRlbUNvbW1hbmQsXG4gIFB1dEl0ZW1Db21tYW5kLFxuICBQdXRJdGVtQ29tbWFuZElucHV0LFxuICBVcGRhdGVJdGVtQ29tbWFuZCxcbn0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1keW5hbW9kYlwiO1xuaW1wb3J0IHsgU1FTQ2xpZW50LCBTZW5kTWVzc2FnZUNvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNxc1wiO1xuaW1wb3J0IHtcbiAgU0VTQ2xpZW50LFxuICBTZW5kRW1haWxDb21tYW5kLFxuICBEZXN0aW5hdGlvbixcbiAgTWVzc2FnZSxcbiAgQm9keSxcbiAgQ29udGVudCxcbn0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1zZXNcIjtcblxuY29uc3QgUkVHSU9OID0gXCJhcC1zb3V0aGVhc3QtMlwiO1xuY29uc3QgZHluYW1vREJDbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoeyByZWdpb246IFJFR0lPTiB9KTtcbmNvbnN0IHNxc0NsaWVudCA9IG5ldyBTUVNDbGllbnQoeyByZWdpb246IFJFR0lPTiB9KTtcbmNvbnN0IHNlc0NsaWVudCA9IG5ldyBTRVNDbGllbnQoeyByZWdpb246IFJFR0lPTiB9KTtcblxuZXhwb3J0IGNvbnN0IHN1YnNjcmliZUhhbmRsZXI6IEFQSUdhdGV3YXlQcm94eUhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmluZm8oXCJzdWJzY3JpYmVIYW5kbGVyIGluaXRpYXRlZFwiKTtcbiAgICAvLyBFeHRyYWN0IHRoZSBlbWFpbCBmcm9tIHRoZSByZXF1ZXN0IGJvZHlcbiAgICBjb25zdCBlbWFpbCA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSB8fCBcIlwiKS5lbWFpbDtcbiAgICBjb25zdCBpc19zdWJzY3JpYmVkID0gSlNPTi5wYXJzZShldmVudC5ib2R5IHx8IFwiXCIpLmlzX3N1YnNjcmliZWQ7XG5cbiAgICBjb25zdCBzdWJzY3JpYmVkRW1haWwgPSBhd2FpdCBjaGVja1N1YnNjcmliZWQoZW1haWwpO1xuICAgIGlmIChzdWJzY3JpYmVkRW1haWwuaXNfc3Vic2NyaWJlZCkge1xuICAgICAgY29uc29sZS5pbmZvKFwiRW1haWwgYWxyZWFkeSBzdWJzY3JpYmVkXCIpO1xuICAgICAgcmV0dXJuIHVwZGF0ZVN1YnNjcmliZWQoc3Vic2NyaWJlZEVtYWlsKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBQdXRJdGVtQ29tbWFuZCBmb3IgRHluYW1vREJcbiAgICBjb25zdCBwdXRDb21tYW5kOiBQdXRJdGVtQ29tbWFuZElucHV0ID0ge1xuICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5TVUJTQ1JJQkVEX0VNQUlMX1RBQkxFX05BTUUsXG4gICAgICBJdGVtOiB7XG4gICAgICAgIGVtYWlsOiB7IFM6IGVtYWlsIH0sXG4gICAgICAgIGlzX3N1YnNjcmliZWQ6IHsgUzogaXNfc3Vic2NyaWJlZCB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgLy8gUHV0IHRoZSBpdGVtIGludG8gRHluYW1vREJcbiAgICBhd2FpdCBkeW5hbW9EQkNsaWVudC5zZW5kKG5ldyBQdXRJdGVtQ29tbWFuZChwdXRDb21tYW5kKSk7XG5cbiAgICBjb25zb2xlLmluZm8oXCJTdWJzY3JpcHRpb24gc3VjY2Vzc2Z1bCFcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogXCJTdWJzY3JpcHRpb24gc3VjY2Vzc2Z1bCFcIiB9KSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvcjpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1lc3NhZ2U6IFwiU3Vic2NyaXB0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcbiAgICAgIH0pLFxuICAgIH07XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrU3Vic2NyaWJlZChlbWFpbDogc3RyaW5nKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBhbnk+PiB7XG4gIGNvbnN0IHN1YnNjcmliZWRFbWFpbCA9IGF3YWl0IGR5bmFtb0RCQ2xpZW50LnNlbmQoXG4gICAgbmV3IEdldEl0ZW1Db21tYW5kKHtcbiAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuU1VCU0NSSUJFRF9FTUFJTF9UQUJMRV9OQU1FLFxuICAgICAgS2V5OiB7IGVtYWlsOiB7IFM6IGVtYWlsIH0gfSxcbiAgICB9KVxuICApO1xuXG4gIHJldHVybiBzdWJzY3JpYmVkRW1haWwuSXRlbSB8fCB7fTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlU3Vic2NyaWJlZChcbiAgc3Vic2NyaXB0aW9uOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIGFueT4+IHtcbiAgLy8gSWYgYWxyZWFkeSBzdWJzY3JpYmVkLCB1cGRhdGUgb25seSBpZiBub3QgYWxyZWFkeSBzdWJzY3JpYmVkXG4gIGNvbnN0IGJvb2xfc3Vic2NyaWJlZCA9IHN1YnNjcmlwdGlvbi5pc19zdWJzY3JpYmVkLlMgPT09ICd0cnVlJztcbiAgY29uc3QgZW1haWwgPSBzdWJzY3JpcHRpb24uZW1haWwuUztcbiAgY29uc3QgaXNfc3Vic2NyaWJlZCA9IHN1YnNjcmlwdGlvbi5pc19zdWJzY3JpYmVkLlM7XG5cbiAgaWYgKCFib29sX3N1YnNjcmliZWQpIHtcbiAgICAvLyBDcmVhdGUgYW4gVXBkYXRlSXRlbUNvbW1hbmQgZm9yIER5bmFtb0RCXG4gICAgY29uc3QgdXBkYXRlQ29tbWFuZCA9IHtcbiAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuU1VCU0NSSUJFRF9FTUFJTF9UQUJMRV9OQU1FLFxuICAgICAgS2V5OiB7IGVtYWlsOiB7IFM6IGVtYWlsIH0gfSxcbiAgICAgIFVwZGF0ZUV4cHJlc3Npb246IFwiU0VUIGlzX3N1YnNjcmliZWQgPSA6aXNfc3Vic2NyaWJlZFwiLFxuICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICBcIjppc19zdWJzY3JpYmVkXCI6IHsgUzogXCJ0cnVlXCIgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgaXRlbSBpbiBEeW5hbW9EQlxuICAgIGF3YWl0IGR5bmFtb0RCQ2xpZW50LnNlbmQobmV3IFVwZGF0ZUl0ZW1Db21tYW5kKHVwZGF0ZUNvbW1hbmQpKTtcblxuICAgIC8vIFNlbmQgYSBtZXNzYWdlIHRvIFNRUyBmb3IgZW1haWwgbm90aWZpY2F0aW9uXG4gICAgY29uc3Qgc3FzUGFyYW1zID0ge1xuICAgICAgUXVldWVVcmw6IFwieW91ci1zcXMtcXVldWUtdXJsXCIsIC8vIFJlcGxhY2Ugd2l0aCB5b3VyIGFjdHVhbCBTUVMgcXVldWUgVVJMXG4gICAgICBNZXNzYWdlQm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbCB9KSxcbiAgICB9O1xuICAgIGF3YWl0IHNxc0NsaWVudC5zZW5kKG5ldyBTZW5kTWVzc2FnZUNvbW1hbmQoc3FzUGFyYW1zKSk7XG5cbiAgICBjb25zb2xlLmluZm8oXCJTdWJzY3JpcHRpb24gdXBkYXRlZCB0byB0cnVlIVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiBcIlN1YnNjcmlwdGlvbiB1cGRhdGVkIHRvIHRydWUhXCIgfSksXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmluZm8oXCJFbWFpbCBpcyBhbHJlYWR5IHN1YnNjcmliZWQuXCIpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6IFwiRW1haWwgaXMgYWxyZWFkeSBzdWJzY3JpYmVkLlwiIH0pLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==