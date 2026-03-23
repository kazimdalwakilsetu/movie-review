import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.REGION })
);

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log("[AUTHORIZER CONTEXT]", JSON.stringify(event.requestContext));
    const reviewerId = event.requestContext?.authorizer?.principalId;
    console.log("[REVIEWER ID]", reviewerId);


    if (!reviewerId) {
        return { statusCode: 401, body: JSON.stringify({ message: "Unauthorised" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { movieId, date, text } = body;

    if (!movieId || !date || !text) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: movieId, date, text" }),
        };
    }

    try {
        await ddbClient.send(
            new PutCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    PK: `m#${movieId}`,
                    SK: `r#${reviewerId}`,
                    date,
                    text,
                    reviewerId,
                    movieId,
                    type: "review",
                },
                ConditionExpression: "attribute_not_exists(PK)",
            })
        );

        return {
            statusCode: 201,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: "Review added successfully" }),
        };
    } catch (err: any) {
        if (err.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: "Review already exists for this movie by this reviewer" }),
            };
        }
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
