# Securing API Gateway with AWS Cognito using Crossplane

## Overview

This project demonstrates how to secure an API Gateway by integrating it with AWS Cognito using Crossplane. We will provision the following AWS resources:

- **User Pool**: To manage and store user profiles.
- **User Pool Client**: To interact with the user pool.
- **User Pool Domain**: To provide a custom domain for authentication.
- **Authorizer**: To authorize requests to the API Gateway using the Cognito User Pool.

## Steps

### 1. Create the AWS Cognito User Pool

The first step is to create a User Pool, which will store user profiles.

**Manifest: `userpool.yaml`**

```yaml
apiVersion: cognitoidentityprovider.aws.upbound.io/v1alpha1
kind: UserPool
metadata:
  name: my-cognito-userpool-asatout
spec:
  forProvider:
    name: myUserPool
    policies:
      passwordPolicy:
        minimumLength: 8
        requireLowercase: true
        requireNumbers: true
        requireSymbols: true
        requireUppercase: true
    autoVerifiedAttributes:
      - email
  providerConfigRef:
    name: aws-provider-asatout
```

### Important Note

Crossplane does not currently support configuring the Hosted UI for an AWS Cognito User Pool. This means that any UI customization, such as sign-in/sign-up pages and custom redirects, must be configured manually through the AWS Management Console or via the AWS CLI after the User Pool has been created.

### 2. Create the AWS Cognito User Pool Client

Next, create a User Pool Client to allow applications to interact with the User Pool.

**Manifest: `userpoolclient.yaml`**

```yaml
apiVersion: cognitoidp.aws.upbound.io/v1beta1
kind: UserPoolClient
metadata:
  name: user-pool-client-asatout
spec:
  forProvider:
    region: eu-west-3
    # Here, we're referrencing the pool id by its metadata.name
    userPoolIdRef:
      name: user-pool-asatout
    name: user-pool-client-asatout
    generateSecret: false
    explicitAuthFlows:
      - ALLOW_USER_PASSWORD_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH
  providerConfigRef:
    name: aws-provider-asatout
```

### 3. Create the AWS Cognito User Pool Domain

Create a User Pool Domain to provide a custom domain for user authentication.

**Manifest: `userpooldomain.yaml`**

```yaml
apiVersion: cognitoidp.aws.upbound.io/v1beta1
kind: UserPoolDomain
metadata:
  labels:
    testing.upbound.io/example-name: main
  name: userpool-domain-asatout
spec:
  forProvider:
    domain: "auth-pool"
    region: eu-west-3
    userPoolIdRef:
      name: user-pool-client-asatout
```

### 4. Create the API Gateway Authorizer

Finally, create an Authorizer to enable API Gateway to authenticate and authorize requests using the Cognito User Pool.

**Manifest: `authorizer.yaml`**

```yaml
apiVersion: apigatewayv2.aws.upbound.io/v1beta1
kind: Authorizer
metadata:
  name: cognito-authorizer-asatout
spec:
  forProvider:
    apiIdSelector:
      matchLabels:
        reff: apireff
    authorizerType: JWT
    identitySources:
      - $request.header.Authorization
    jwtConfiguration:
      - audience:
          - qs1k0ucc74rpv8s44vm8qesrk #user pool client
        issuer: https://cognito-idp.eu-west-3.amazonaws.com/eu-west-3_iFoXn8EiI/ #user pool id
    name: route-authorizer
    region: eu-west-3
  providerConfigRef:
    name: aws-provider-asatout
```

### 5. Update the route API manifest

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
    #Add this  2 fields to attach the authorizer
    authorizationType: JWT
    authorizerIdRef:
      name: cognito-authorizer-asatout
  providerConfigRef:
    name: aws-provider-asatout
```

### 6. Apply the Manifests

Once all manifests are created, apply them using `kubectl`:

```sh
kubectl apply -f userpool.yaml
kubectl apply -f userpoolclient.yaml
kubectl apply -f userpooldomain.yaml
kubectl apply -f authorizer.yaml
kubectl apply -f api_route.yaml
```

### 6. Integration with API Gateway

After creating the User Pool, User Pool Client, User Pool Domain, and Authorizer, configure your API Gateway to use these resources for securing API requests.
