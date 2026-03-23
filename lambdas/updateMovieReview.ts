import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const movieId = event.queryStringParameters?.movie;
  const published = event.queryStringParameters?.published;

  if (!movieId || !published) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required query params: movie and published" }),
    };
  }

  try {
    const result = await ddbClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "DateIndex",
        KeyConditionExpression: "PK = :pk AND begins_with(#d, :date)",
        ExpressionAttributeNames: { "#d": "date" },
        ExpressionAttributeValues: {
          ":pk": `m#${movieId}`,
          ":date": published,
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
