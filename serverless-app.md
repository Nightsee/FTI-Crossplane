# Crossplane Serverless Application Deployment

This documentation provides an overview of deploying a serverless application using Crossplane. The application includes AWS services such as S3, Lambda, API Gateway, and DynamoDB, all managed within a Kubernetes cluster.

## Deployment Order and Role of Manifests

To deploy our serverless application using Crossplane, we need to apply the manifests in the correct order, ensuring each resource is created with the dependencies it requires. Here’s the order to apply our manifests, along with the role of each:

1.  **s3.yaml:**

This manifest creates the S3 bucket used for storing objects needed by our application.

```yaml
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  #MAKE SURE ITS UNIQUE GLOBALLY
  name: bucket-asatout
spec:
  forProvider:
    region: eu-west-3
  providerConfigRef:
    name: aws-provider-asatout
```

    kubectl apply -f s3.yaml

2.  **lambda_role.yaml:**

This manifest creates the IAM role for our Lambda function and attach a policy to it, providing the necessary permissions for it to execute and perform actions (e.g getting obj from s3 , scan dynamodb table).

```yaml
apiVersion: iam.aws.upbound.io/v1beta1
kind: Role
metadata:
  name: lambda-execution-role
spec:
  forProvider:
    assumeRolePolicy: |
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      }
    description: "Role for executing Lambda functions"
    path: "/"
  providerConfigRef:
    name: aws-provider-asatout
---
apiVersion: iam.aws.upbound.io/v1beta1
kind: RolePolicy
metadata:
  name: lambda-execution-policy
spec:
  forProvider:
    roleRef:
      name: lambda-execution-role
    policy: |
      {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "logs:PutLogEvents",
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream"
              ],
              "Resource": "arn:aws:logs:*:*:*"
          },
          {
              "Effect": "Allow",
              "Action": [
                  "dynamodb:Scan",
                  "dynamodb:GetItem",
                  "dynamodb:Query"
              ],
              "Resource": "arn:aws:dynamodb:eu-west-3:626253564591:table/users"
          },
          {
              "Effect": "Allow",
              "Action": [
                  "s3:GetObject"
              ],
              "Resource": "arn:aws:s3:::*/*"
          }
        ]
      }
  providerConfigRef:
    name: aws-provider-asatout
```

      kubectl apply -f lambda_role.yaml

3.  **lambda.yaml:**

This manifest deploys the Lambda function itself, specifying the code and configurations. But first, we need to deploy the Lambda function, we need to upload our function code as a `.zip` file to an S3 bucket. Here’s a sample function and the command to upload it:

- Create the ZIP File

  zip func.zip index.js

- Upload the ZIP File to S3

```bash
  aws s3 cp func.zip s3://bucket-asatout/

```

```yaml
apiVersion: lambda.aws.upbound.io/v1beta1
kind: Function
metadata:
  name: my-lambda
spec:
  forProvider:
    region: eu-west-3
    role: arn:aws:iam::626253564591:role/lambda-execution-role
    handler: index.handler #filename.function
    runtime: nodejs18.x
    s3Bucket: bucket-asatout
    s3Key: my-lambda-code.zip
  providerConfigRef:
    name: aws-provider-asatout
```

    kubectl apply -f lambda.yaml

### Note: Apply this manifest for giving it the permission to get invoked, otherwise we get Internal Server Error while invoking it thro our API

```yaml
apiVersion: lambda.aws.upbound.io/v1beta1
kind: Permission
metadata:
  name: api-invoke-function-permission-asatout
spec:
  forProvider:
    action: lambda:InvokeFunction
    #Referrencing it by its name
    functionNameRef:
      name: my-lambda
    principal: apigateway.amazonaws.com
    region: eu-west-3
  providerConfigRef:
    name: aws-provider-asatout
```

4.  **apigateway_v2.yaml:**

This manifest creates the API Gateway, setting up the base configuration for our API.

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta2
kind: API
metadata:
  name: api-asatout-test
  labels:
    reff: apireff
spec:
  forProvider:
    region: eu-west-3
    name: api-asatout-test
    protocolType: HTTP
  providerConfigRef:
    name: aws-provider-asatout
```

    kubectl apply -f apigateway_v2.yaml

5.  **apigateway_v2_integration.yaml:**

This manifest creates the integration between the API Gateway and the Lambda function, allowing the API Gateway to invoke the Lambda.

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta2
kind: Integration
metadata:
  name: intergration-asatout
spec:
  forProvider:
    region: eu-west-3
    #We've labeled the API reff: apireff before
    apiIdSelector:
      matchLabels:
        reff: apireff
    integrationType: AWS_PROXY
    integrationMethod: GET
    payloadFormatVersion: "2.0"
    integrationUri: arn:aws:lambda:eu-west-3:626253564591:function:my-lambda
  providerConfigRef:
    name: aws-provider-asatout
```

      kubectl apply -f apigateway_v2_integration.yaml

6.  **apigateway_v2_route.yaml:**

This manifest defines the route for the API Gateway, specifying how incoming requests are routed to the integration.

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta1
kind: Route
metadata:
  name: route-asatout
spec:
  forProvider:
    region: eu-west-3
    apiIdRef:
      name: api-asatout-test
    routeKey: GET /test
    target: integrations/5ebgdyo
      name: cognito-authorizer-asatout
  providerConfigRef:
    name: aws-provider-asatout
```

    kubectl apply -f apigateway_v2_route.yaml

7.  **apigateway_v2_stage.yaml:**

This manifest creates the stage for our API Gateway, which is a logical reference to a lifecycle state of our API (like development, staging, or production).

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta2
kind: Stage
metadata:
  name: dev-asatout
spec:
  forProvider:
    region: eu-west-3
    apiIdRef:
      name: api-asatout-test
    deploymentIdRef:
      name: deployment-api-asatout
  providerConfigRef:
    name: aws-provider-asatout
```

    kubectl apply -f apigateway_v2_stage.yaml

8.  **apigateway_v2_deployment.yaml:**

This manifest creates the deployment for our API Gateway, which is a snapshot of the API configuration at a specific point in time.

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta1
kind: Deployment
metadata:
  name: deployment-api-asatout
spec:
  forProvider:
    apiIdRef:
      name: api-asatout-test
    region: eu-west-3
  providerConfigRef:
    name: aws-provider-asatout
```

       kubectl apply -f apigateway_v2_deployment.yaml`

1. List all REST APIs to get the restApiId:

```bash
aws apigateway get-rest-apis
```

This will return a list of your APIs along with their id and name. Identify the id of the API you're interested in.

2. Get the stages of the API to retrieve the stageName:

```bash
aws apigateway get-stages --rest-api-id <restApiId>
```

Replace <restApiId> with the actual ID you obtained from the previous step. This command will list all stages associated with the API. Note the stageName.

3. Construct the API URL: The URL for the API Gateway follows this pattern:
   https://<restApiId>.execute-api.<region>.amazonaws.com/<stageName>

Replace <restApiId> with your API ID , <region> with your AWS region (e.g., eu-west-3), and <stageName> with the stage name (dev-asatout).

Our API:
https://33jvaoqsx0.execute-api.us-east-1.amazonaws.com/dev-asatout
https://33jvaoqsx0.execute-api.us-east-1.amazonaws.com/dev-asatout/test
