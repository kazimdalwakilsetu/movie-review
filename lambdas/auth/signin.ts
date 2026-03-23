import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { username, password } = body;

  try {
    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.CLIENT_ID!,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );

    const token = result.AuthenticationResult?.IdToken;

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `token=${token}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=3600`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Signed in successfully", token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
