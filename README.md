## Enterprise Web Development - Serverless REST Assignment.

__Name:__ Kazi Md Al Wakil

__Demo:__ ... link to your YouTube video demonstration ......

### Links.
__Demo:__ A link to your YouTube video demonstration.]

### Screenshots.

#### App Web API 

![][api]


#### Seeded table from DynamoDB, e.g.

![][db]


[api]: ./images/1.png
[db]: ./images/3.png

# Enterprise Web Development – Serverless Movie Review API

This project is a **serverless Web API** built using **AWS Cloud Development Kit (CDK) with TypeScript**. It provides a secure and scalable backend for managing movie reviews, including user authentication and authorisation.

---

## Project Overview

The goal of this project is to design and implement a **cloud-native API** that allows users to:

- View movie reviews
- Add new reviews
- Update their own reviews
- Authenticate securely using JWT

The infrastructure is fully automated using **AWS CDK**, following Infrastructure as Code (IaC) principles.

---

## Architecture

This project follows a **serverless architecture** using AWS services:

- **AWS Lambda** – Handles API logic
- **Amazon API Gateway** – Exposes REST endpoints
- **Amazon DynamoDB** – Stores movies, reviewers, and reviews (single-table design)
- **Amazon Cognito** – User authentication and authorisation
- **AWS CDK (TypeScript)** – Infrastructure provisioning

---

## API Endpoints

### Auth API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/confirm_signup` | Confirm user registration |
| POST | `/auth/signin` | Sign in and receive JWT token |
| GET | `/auth/signout` | Sign out and clear token |

### App API
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/movies/{movieId}/reviews` | No | Get all reviews for a movie |
| GET | `/movies/{movieId}/reviews?reviewer=id` | No | Get review by specific reviewer |
| GET | `/reviews?movie=id&published=date` | No | Get review by movie and date |
| POST | `/movies/reviews` | Yes | Add a new review |
| PUT | `/movies/{movieId}/reviews` | Yes | Update your own review |

---

## Database Design (DynamoDB)

This project uses a **single-table design pattern**:

| Entity | Partition Key | Sort Key |
|--------|--------------|----------|
| Movie | `m#movieId` | `m#movieId` |
| Reviewer | `r#reviewerId` | `r#reviewerId` |
| Review | `m#movieId` | `r#reviewerId` |

A **Local Secondary Index (DateIndex)** on the `date` attribute enables efficient date-based queries without a full table scan.

---

## Security & Authorisation

- Amazon Cognito user pool for user management
- JWT-based authentication via a custom Lambda authorizer
- `POST` and `PUT` endpoints require a valid token in the `Cookie` header
- Reviewer identity is extracted from the JWT — not the request body
- Users can only update their own reviews

---

## Implementation Highlights

### Restricted Review Update
The `PUT /movies/{movieId}/reviews` endpoint enforces ownership by extracting the reviewer's identity from the JWT token via the custom authorizer. The `principalId` is used as the DynamoDB sort key, making it impossible to update another reviewer's entry as the key is derived from the authenticated identity, not the request body.

### DynamoDB LSI
A Local Secondary Index named `DateIndex` on the `date` attribute allows the `GET /reviews?movie=movieID&published=date` endpoint to query reviews by date efficiently without a full table scan. It supports `begins_with` queries for partial date matching (e.g. `1995-04` matches all reviews from April 1995).

### Single-Table Design
All entities (Movies, Reviewers, Reviews) are stored in one DynamoDB table using prefixed keys (`m#`, `r#`) to distinguish item types. This allows efficient queries for all reviews of a movie using `begins_with(SK, "r#")`.

### Custom Authorizer
A Lambda authorizer validates the JWT token from the `Cookie` header on all `POST` and `PUT` requests. On success, the reviewer's username is passed as `principalId` to downstream Lambda functions, eliminating the need to include the reviewer ID in the request body.

---

## Technologies Used

- TypeScript
- AWS CDK
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon Cognito

---

## Setup & Deployment

### 1. Install dependencies
```bash
npm install
```

### 2. Deploy to AWS
```bash
cdk deploy
```

### 3. Destroy stack
```bash
cdk destroy
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JS |
| `npm run watch` | Watch for changes and compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk deploy` | Deploy stack to AWS |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk synth` | Emit synthesized CloudFormation template |

