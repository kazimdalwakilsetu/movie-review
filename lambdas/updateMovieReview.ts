import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.REGION })
);

export const handler: APIGatewayProxyHandler = async (event) => {
  const reviewerId = event.requestContext?.authorizer?.principalId;
  const movieId = event.pathParameters?.movieId;

  if (!reviewerId) {
    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorised" }) };
  }

  if (!movieId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing movieId" }) };
  }

  const body = JSON.parse(event.body || "{}");
  const { text } = body;

  if (!text) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required field: text" }),
    };
  }

  try {
    await ddbClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          PK: `m#${movieId}`,
          SK: `r#${reviewerId}`,
        },
        UpdateExpression: "SET #t = :text", //setting the text attribute
        ConditionExpression: "attribute_exists(PK)", //only update if item already exists
        ExpressionAttributeNames: { "#t": "text" }, //setting alias #t
        ExpressionAttributeValues: { ":text": text }, // setting the actual value
      })
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Review updated successfully" }),
    };
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Review not found or you are not the reviewer" }),
      };
    }
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
