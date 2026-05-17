import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import { ConfirmSignUpBody } from "../../shared/types";
import Ajv from "ajv";
import schema from "../../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile<ConfirmSignUpBody>(
  schema.definitions["ConfirmSignUpBody"] || {}
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
          message: "Incorrect type. Must match ConfirmSignUpBody schema",
          schema: schema.definitions["ConfirmSignUpBody"],
        }),
      };
    }

    const confirmSignUpBody = body;
    const params: ConfirmSignUpCommandInput = {
      ClientId: process.env.CLIENT_ID!,
      Username: confirmSignUpBody.username,
      ConfirmationCode: confirmSignUpBody.code,
    };

    const command = new ConfirmSignUpCommand(params);
    await client.send(command);

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({
        message: `User ${confirmSignUpBody.username} successfully confirmed`,
        confirmed: true,
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