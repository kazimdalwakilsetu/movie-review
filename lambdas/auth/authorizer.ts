import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";
import { CookieMap, createPolicy, parseCookies, verifyToken } from "../utils";

export const handler: APIGatewayRequestAuthorizerHandler = async (event) => {
  console.log("[EVENT]", event);

  try {
    const cookies: CookieMap = parseCookies(event);

    if (!cookies || !cookies.token) {
      return {
        principalId: "",
        policyDocument: createPolicy(event, "Deny"),
      };
    }

    const verifiedJwt = await verifyToken(
      cookies.token,
      process.env.USER_POOL_ID,
      process.env.REGION!
    );

    if (!verifiedJwt) {
      return {
        principalId: "",
        policyDocument: createPolicy(event, "Deny"),
      };
    }

    return {
      principalId: verifiedJwt.sub!.toString(), //a unique UUID per user; reviewerId in the Lambda
      policyDocument: createPolicy(event, "Allow"), // Allow or Deny for this API route
      context: {
        email: verifiedJwt.email,
        username: verifiedJwt["cognito:username"],
      },
    };
  } catch (err) {
    console.error("[authorizer] error:", err);
    return {
      principalId: "",
      policyDocument: createPolicy(event, "Deny"),
    };
  }
};