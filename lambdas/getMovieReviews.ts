import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const movieId = event.pathParameters?.movieId;
  const reviewerId = event.queryStringParameters?.reviewer;

  if (!movieId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing movieId" }) };
  }

  try {
    if (reviewerId) {
      const result = await ddbClient.send(
        new QueryCommand({
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND SK = :sk",
          ExpressionAttributeValues: {
            ":pk": `m#${movieId}`,
            ":sk": `r#${reviewerId}`,
          },
        })
      );
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviews: result.Items }),
      };
    }

    const result = await ddbClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `m#${movieId}`,
          ":prefix": "r#",
        },
      })
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviews: result.Items }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
