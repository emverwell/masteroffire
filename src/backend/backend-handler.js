"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callHandler = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const secretsManager = new client_secrets_manager_1.SecretsManager();
const logger = console;
let apiKey = null;
const callHandler = async (event) => {
    logger.log("Received event:", JSON.stringify(event, null, 2));
    const response_headers = {
        ...event.headers,
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
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
            headers: response_headers,
            body: response_body,
        };
    }
    catch (error) {
        logger.error("Error:", error);
        return {
            statusCode: 500,
            headers: response_headers,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
exports.callHandler = callHandler;
async function getApiKey() {
    try {
        if (!process.env.API_KEY) {
            // Retrieve the secret from AWS Secrets Manager
            apiKey = await getSecretFromAWS("DeliVery/DVApiKey");
            // Set the API key in the environment variable
            process.env.API_KEY = apiKey;
            return apiKey;
        }
        return process.env.API_KEY;
    }
    catch (error) {
        console.error("Error retrieving API key:", error);
        return "";
    }
}
async function getSecretFromAWS(secretName) {
    return new Promise((resolve, reject) => {
        secretsManager.getSecretValue({ SecretId: secretName }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                // Check if data.SecretString is defined before using it
                if (data && data.SecretString) {
                    resolve(data.SecretString);
                }
                else {
                    reject(new Error("SecretString is undefined"));
                }
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmFja2VuZC1oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRFQUFpRTtBQUVqRSxNQUFNLGNBQWMsR0FBRyxJQUFJLHVDQUFjLEVBQUUsQ0FBQztBQUU1QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFDdkIsSUFBSSxNQUFNLEdBQWtCLElBQUksQ0FBQztBQUUxQixNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQzlCLEtBQTJCLEVBQ0ssRUFBRTtJQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTlELE1BQU0sZ0JBQWdCLEdBQUc7UUFDdkIsR0FBRyxLQUFLLENBQUMsT0FBTztRQUNoQixjQUFjLEVBQUUsa0JBQWtCO1FBQ2xDLDZCQUE2QixFQUFFLEdBQUc7UUFDbEMsOEJBQThCLEVBQzVCLHNFQUFzRTtLQUN6RSxDQUFDLENBQUMsb0NBQW9DO0lBRXZDLElBQUk7UUFDRixrQ0FBa0M7UUFFbEMsTUFBTSxHQUFHLE1BQU0sU0FBUyxFQUFFLENBQUM7UUFFM0IsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLCtCQUErQixDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFaEQsb0RBQW9EO1FBQ3BELElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxjQUFjLENBQUM7UUFDakUsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNuQixNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQzNDLE9BQU87Z0JBQ0wsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFL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RUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNwRSxJQUFJLEdBQUcsRUFBRTtnQkFDUCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDYjtpQkFBTTtnQkFDTCx3REFBd0Q7Z0JBQ3hELElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7aUJBQzVCO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7aUJBQ2hEO2FBQ0Y7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tIFwiYXdzLWxhbWJkYVwiO1xuaW1wb3J0IHsgU2VjcmV0c01hbmFnZXIgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlclwiO1xuXG5jb25zdCBzZWNyZXRzTWFuYWdlciA9IG5ldyBTZWNyZXRzTWFuYWdlcigpO1xuXG5jb25zdCBsb2dnZXIgPSBjb25zb2xlO1xubGV0IGFwaUtleTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBjb25zdCBjYWxsSGFuZGxlciA9IGFzeW5jIChcbiAgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50XG4pOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICBsb2dnZXIubG9nKFwiUmVjZWl2ZWQgZXZlbnQ6XCIsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG5cbiAgY29uc3QgcmVzcG9uc2VfaGVhZGVycyA9IHtcbiAgICAuLi5ldmVudC5oZWFkZXJzLFxuICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLFxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOlxuICAgICAgXCJDb250ZW50LVR5cGUsWC1BbXotRGF0ZSxBdXRob3JpemF0aW9uLFgtQXBpLUtleSxYLUFtei1TZWN1cml0eS1Ub2tlblwiLFxuICB9OyAvL1dlIGRvbid0IHdhbnQgdG8gZXhwb3NlIHRoZSBBcGlLZXlcblxuICB0cnkge1xuICAgIC8vIEV4dHJhY3QgQVBJIGtleSBmcm9tIHRoZSBzZWNyZXRcblxuICAgIGFwaUtleSA9IGF3YWl0IGdldEFwaUtleSgpO1xuXG4gICAgY29uc3QgcGFyYW1ldGVycyA9IGV2ZW50Lm11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM7XG4gICAgbG9nZ2VyLmluZm8oXCJQYXJhbWV0ZXJzIHJlY2VpdmVkOlwiLCBwYXJhbWV0ZXJzKTtcblxuICAgIC8vIEV4dHJhY3QgdGhlIGRlc3RpbmF0aW9uIFVSTCBmcm9tIHRoZSBxdWVyeSBzdHJpbmdcbiAgICB2YXIgZGVzdGluYXRpb25VcmwgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnM/LmRlc3RpbmF0aW9uVXJsO1xuICAgIGlmICghZGVzdGluYXRpb25VcmwpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcIkVycm9yOlwiLCBcIlVSTCBub3QgcHJvdmlkZWRcIik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiVVJMIG5vdCBwcm92aWRlZFwiIH0pLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IHRoZSBpZCBmcm9tIHRoZSBxdWVyeSBzdHJpbmdcbiAgICBjb25zdCBpZCA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycz8uaWQ7XG4gICAgaWYgKGlkKSB7XG4gICAgICBkZXN0aW5hdGlvblVybCA9IGBwcm9kdWN0cy8ke2lkfWA7XG4gICAgICBsb2dnZXIuaW5mbyhcImlkIHJlY2VpdmVkXCIsIGRlc3RpbmF0aW9uVXJsKTtcbiAgICB9XG5cbiAgICAvLyBNb2RpZnkgdGhlIGV2ZW50IHRvIGFkZCB0aGUgQVBJIGtleSB0byBoZWFkZXJzXG4gICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgIFwieC1hcGkta2V5XCI6IGFwaUtleSxcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH07XG5cbiAgICAvLyBGb3J3YXJkIHRoZSByZXF1ZXN0IHRvIHRoZSBhY3R1YWwgQVBJIEdhdGV3YXlcbiAgICB2YXIgYm9keSA9IGV2ZW50LmJvZHk7XG4gICAgaWYgKCFbJ0dFVCcsICdIRUFEJ10uaW5jbHVkZXMoZXZlbnQuaHR0cE1ldGhvZCkpIHtcbiAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShldmVudC5ib2R5KTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmwgPSBcImh0dHBzOi8vYXBpLnRoZW1hc3Rlcm9mZmlyZS5jb20vXCIgKyBkZXN0aW5hdGlvblVybDtcbiAgICBsb2dnZXIuaW5mbyhgSW52b2tpbmcgQVBJICR7dXJsfSB3aXRoIGJvZHkgJHtib2R5fWApO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIG1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICAgIGJvZHk6IGJvZHksXG4gICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIHRoZSByZXNwb25zZSB0byB0aGUgY2xpZW50XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICBjb25zdCByZXNwb25zZV9ib2R5ID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgbG9nZ2VyLmluZm8oXCJBUEkgQ2FsbCBSZXN1bHQ6IFwiLCByZXNwb25zZS5zdGF0dXMsIHJlc3BvbnNlX2JvZHkpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgIGhlYWRlcnM6IHJlc3BvbnNlX2hlYWRlcnMsIC8vV2UgZG9uJ3Qgd2FudCB0byBleHBvc2UgdGhlIEFwaUtleVxuICAgICAgYm9keTogcmVzcG9uc2VfYm9keSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5lcnJvcihcIkVycm9yOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGhlYWRlcnM6IHJlc3BvbnNlX2hlYWRlcnMsIC8vV2UgZG9uJ3Qgd2FudCB0byBleHBvc2UgdGhlIEFwaUtleVxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiB9KSxcbiAgICB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRBcGlLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBpZiAoIXByb2Nlc3MuZW52LkFQSV9LRVkpIHtcbiAgICAgIC8vIFJldHJpZXZlIHRoZSBzZWNyZXQgZnJvbSBBV1MgU2VjcmV0cyBNYW5hZ2VyXG4gICAgICBhcGlLZXkgPSBhd2FpdCBnZXRTZWNyZXRGcm9tQVdTKFwiRGVsaVZlcnkvRFZBcGlLZXlcIik7XG5cbiAgICAgIC8vIFNldCB0aGUgQVBJIGtleSBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVcbiAgICAgIHByb2Nlc3MuZW52LkFQSV9LRVkgPSBhcGlLZXk7XG5cbiAgICAgIHJldHVybiBhcGlLZXk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3MuZW52LkFQSV9LRVk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHJldHJpZXZpbmcgQVBJIGtleTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFNlY3JldEZyb21BV1Moc2VjcmV0TmFtZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBzZWNyZXRzTWFuYWdlci5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiBzZWNyZXROYW1lIH0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayBpZiBkYXRhLlNlY3JldFN0cmluZyBpcyBkZWZpbmVkIGJlZm9yZSB1c2luZyBpdFxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLlNlY3JldFN0cmluZykge1xuICAgICAgICAgIHJlc29sdmUoZGF0YS5TZWNyZXRTdHJpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTZWNyZXRTdHJpbmcgaXMgdW5kZWZpbmVkXCIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cbiJdfQ==