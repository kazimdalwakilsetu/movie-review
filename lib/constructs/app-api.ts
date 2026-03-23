import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
  tableName: string;
  tableArn: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const commonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      environment: {
        TABLE_NAME: props.tableName,
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const getMovieReviewsFn = new node.NodejsFunction(this, "GetMovieReviewsFn", {
      ...commonFnProps,
      entry: path.join(process.cwd(), "lambdas/getMovieReviews.ts"),
    });

    const getReviewsByDateFn = new node.NodejsFunction(this, "GetReviewsByDateFn", {
      ...commonFnProps,
      entry: path.join(process.cwd(), "lambdas/getReviewsByDate.ts"),
    });

    const addMovieReviewFn = new node.NodejsFunction(this, "AddMovieReviewFn", {
      ...commonFnProps,
      entry: path.join(process.cwd(), "lambdas/addMovieReview.ts"),
    });

    const updateMovieReviewFn = new node.NodejsFunction(this, "UpdateMovieReviewFn", {
      ...commonFnProps,
      entry: path.join(process.cwd(), "lambdas/updateMovieReview.ts"),
    });

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...commonFnProps,
      entry: path.join(process.cwd(), "lambdas/auth/authorizer.ts"),
    });

    const tablePolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
      ],
      resources: [props.tableArn, `${props.tableArn}/index/*`],
    });

    [getMovieReviewsFn, getReviewsByDateFn, addMovieReviewFn, updateMovieReviewFn]
      .forEach(fn => fn.addToRolePolicy(tablePolicy));

    const requestAuthorizer = new apig.RequestAuthorizer(this, "RequestAuthorizer", {
      identitySources: [apig.IdentitySource.header("cookie")],
      handler: authorizerFn,
      resultsCacheTtl: cdk.Duration.minutes(0),
    });

    const api = new apig.RestApi(this, "AppRestApi", {
      description: "Movie Reviews App API",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const moviesRes = api.root.addResource("movies");

    const moviesReviewsRes = moviesRes.addResource("reviews");
    moviesReviewsRes.addMethod("POST", new apig.LambdaIntegration(addMovieReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });

    const movieRes = moviesRes.addResource("{movieId}");
    const movieReviewsRes = movieRes.addResource("reviews");

    movieReviewsRes.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn));
    movieReviewsRes.addMethod("PUT", new apig.LambdaIntegration(updateMovieReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });

    const reviewsRes = api.root.addResource("reviews");
    reviewsRes.addMethod("GET", new apig.LambdaIntegration(getReviewsByDateFn));
  }
}
