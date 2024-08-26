
# Managing AWS Lambda Function URLs with Crossplane
This guide focuses on the FunctionURL resource, which is used to create and manage AWS Lambda Function URLs. AWS Lambda Function URLs provide a dedicated HTTP(S) endpoint for invoking a Lambda direclty over HTTP.

## Prequisites
- kubernetes cluster with crossplane and kubectl installed.
- the upbound aws lambda provider, the manifest for the provider is in " provider-aws-lambda.yaml ".
- Lambda function.

## Provisioning & managing lambda functionURL

The FunctionURL resource defines an HTTP(S) endpoint for a Lambda function. this is an example YAML configuration for creating a FunctionURL:


    #file: lambda-functionURL.yaml

    apiVersion: lambda.aws.upbound.io/v1beta1
    kind: FunctionURL
    metadata:
        name: example-function-url
    spec:
        forProvider:
            functionNameSelector:
            matchLabels:
                example-label: example
            authType: NONE
            cors:
            allowCredentials: false
            allowHeaders:
                - "*"
            allowMethods:
                - "*"
            allowOrigins:
                - "*"
            exposeHeaders:
                - "Content-Type"
            maxAge: 600
        providerConfigRef:
            name: default

#### - spec:
The spec section defines the desired state of the Lambda function. This is where we configure the specifics of the function itself.

- forProvider: This section contains the actual configuration options that will be passed to AWS to create the Lambda function.

 - functionNameSelector: A selector used to identify the Lambda function to which the URL will be associated. It matches the labels of an existing Lambda function resource within the Kubernetes cluster.
- authType: NONE: Specifies the type of authentication for the URL. NONE means the URL can be accessed without authentication. (Other options include AWS_IAM.)
- cors: Defines the Cross-Origin Resource Sharing (CORS) configuration for the function URL.
- cors.allowCredentials: Specifies whether the browser should include credentials (such as cookies or authentication headers) in requests to the function URL.
- cors.allowHeaders: Headers that are allowed in the request.
- cors.allowMethods: HTTP methods allowed for accessing the function URL.
- cors.allowOrigins: Origins that are allowed to access the function URL.
- cors.exposeHeaders: Headers that browsers are allowed to access.
- cors.maxAge: Maximum number of seconds the browser should cache the CORS preflight response.

Now we need to apply this manifest:

    kubectl apply -f lambda-functionURL.yaml
=> Crossplane will take the YAML configuration and create the corresponding AWS Lambda function in the AWS account we previously configured the credentials for.

To verify the lambda function, we run this command and check the lambda kubernetes resource status.

    kubectl get functionURL.lambda.aws.crossplane.io example-function-url -o yaml

This will show the status of the Lambda functionURL, including any errors or updates related to its creation.
we can also verify the function directly in the AWS Management Console under the Lambda service.

And to delete the provisioned resource, we can simply delete the kubernetes resource, either by specifying the kubernetes resource name or the manifest file.

    kubectl delete functionURL.lambda.aws.crossplane.io example-function-url
or 
kubectl delete -f lambda-functionURL.yaml


#### you can see more configuration fields in the API documentation for the aws lambda function.

    https://marketplace.upbound.io/providers/upbound/provider-aws-lambda/v1.12.0/resources/lambda.aws.upbound.io/Function/v1beta1







