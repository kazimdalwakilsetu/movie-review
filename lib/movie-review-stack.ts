import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { AuthApi } from "./constructs/auth-api";
import { AppApi } from "./constructs/app-api";
import { movies, reviews, reviewers } from "../seed/movies";

export class MovieReviewStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    const table = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addLocalSecondaryIndex({
      indexName: "DateIndex",
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const seedItems = [
      ...movies.map((m) => ({
        PutRequest: {
          Item: {
            PK: { S: `m#${m.movieId}` },
            SK: { S: `m#${m.movieId}` },
            title: { S: m.title },
            date: { S: m.date },
            overview: { S: m.overview },
            type: { S: "movie" },
          },
        },
      })),
      ...reviewers.map((r) => ({
        PutRequest: {
          Item: {
            PK: { S: `r#${r.reviewerId}` },
            SK: { S: `r#${r.reviewerId}` },
            name: { S: r.name },
            type: { S: "reviewer" },
          },
        },
      })),
      ...reviews.map((rv) => ({
        PutRequest: {
          Item: {
            PK: { S: `m#${rv.movieId}` },
            SK: { S: `r#${rv.reviewerId}` },
            date: { S: rv.date },
            text: { S: rv.text },
            type: { S: "review" },
            movieId: { N: String(rv.movieId) },
            reviewerId: { S: rv.reviewerId },
          },
        },
      })),
    ];

    new custom.AwsCustomResource(this, "SeedData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: { [table.tableName]: seedItems },
        },
        physicalResourceId: custom.PhysicalResourceId.of("SeedData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [table.tableArn],
      }),
    });

    new AuthApi(this, "AuthServiceApi", {
      userPoolId: userPool.userPoolId,
      userPoolClientId: appClient.userPoolClientId,
    });

    new AppApi(this, "AppApi", {
      userPoolId: userPool.userPoolId,
      userPoolClientId: appClient.userPoolClientId,
      tableName: table.tableName,
      tableArn: table.tableArn,
    });
  }
}
