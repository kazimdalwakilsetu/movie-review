import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { username, code } = body;

  try {
    await client.send(
      new ConfirmSignUpCommand({
        ClientId: process.env.CLIENT_ID!,
        Username: username,
        ConfirmationCode: code,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User confirmed successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
