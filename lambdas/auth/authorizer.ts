import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.CLIENT_ID!,
});

export const handler: APIGatewayRequestAuthorizerHandler = async (event) => {
  const cookies = event.headers?.cookie || "";
  const token = cookies
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  try {
    if (!token) throw new Error("No token");

    const payload = await jwtVerifier.verify(token);

    return {
      principalId: payload["cognito:username"] as string,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    };
  } catch {
    return {
      principalId: "",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
