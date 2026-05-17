import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { SignUpBody } from "../../shared/types";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import Ajv from "ajv";
import schema from "../../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile<SignUpBody>(
  schema.definitions["SignUpBody"] || {}
);

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const defaultHeaders: Record<string, string> = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
  };

  try {
    console.log("[EVENT]", event);
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: JSON.stringify({
          message: "Incorrect type. Must match SignUpBody schema",
          schema: schema.definitions["SignUpBody"],
        }),
      };
    }

    const signUpBody = body;
    const params: SignUpCommandInput = {
      ClientId: process.env.CLIENT_ID!,
      Username: signUpBody.username,
      Password: signUpBody.password,
      UserAttributes: [{ Name: "email", Value: signUpBody.email }],
    };

    const command = new SignUpCommand(params);
    const res = await client.send(command);

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({ message: res }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};