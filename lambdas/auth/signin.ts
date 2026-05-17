import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { SignInBody } from "../../shared/types";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import Ajv from "ajv";
import schema from "../../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile<SignInBody>(
  schema.definitions["SignInBody"] || {}
);

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (
  event
): Promise<APIGatewayProxyResultV2> => {
  const defaultHeaders: Record<string, string> = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    console.log("[EVENT]", event);
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({
          message: "Incorrect type. Must match SignInBody schema",
          schema: schema.definitions["SignInBody"],
        }),
      };
    }

    const signInBody = body;
    const params: InitiateAuthCommandInput = {
      ClientId: process.env.CLIENT_ID!,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: signInBody.username,
        PASSWORD: signInBody.password,
      },
    };

    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await client.send(command);

    if (!AuthenticationResult) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({ message: "User signin failed" }),
      };
    }

    const token = AuthenticationResult.IdToken;

    return {
      statusCode: 200,
      headers: {
        ...defaultHeaders,
        "Set-Cookie": `token=${token}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=3600;`,
      },
      body: JSON.stringify({
        message: "Auth successfull",
        token,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ message: (err as Error).message }),
    };
  }
};