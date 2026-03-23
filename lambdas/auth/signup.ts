import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { username, password, email } = body;

  try {
    await client.send(
      new SignUpCommand({
        ClientId: process.env.CLIENT_ID!,
        Username: username,
        Password: password,
        UserAttributes: [{ Name: "email", Value: email }],
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User signed up successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
