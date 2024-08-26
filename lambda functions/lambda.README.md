
# Serverless Functions with Crossplane
This guide will walk you through setting up and managing AWS Lambda functions using Crossplane. While the example focuses on AWS, the same principles apply to other cloud providers supported by Crossplane.

## Prequisites
- kubernetes cluster with crossplane and kubectl installed.
- the upbound aws lambda provider, the manifest for the provider is in " provider-aws-lambda.yaml ".

## Provisioning & managing lambda functions

To Provision and manage an AWS Lambda function using Crossplane, we first need to define the function as a Kubernetes resource. Create a YAML file to define the Lambda function:

    #file: lambda.yaml

    apiVersion: lambda.aws.upbound.io/v1beta1
    kind: Function
    metadata:
        labels:
            example-label: example
        name: example
    spec:
        forProvider:
            handler: index.handler
            packageType: Zip
            region: us-east-1
            roleSelector:
                matchLabels:
                    testing.upbound.io/example-name: role
            runtime: node18.x
            s3Bucket: lambda-example-handler-code
            s3Key: handler.zip
            timeout: 60

#### - metadata:
- labels: Key-value pairs used to organize and categorize resources. Here, "example-label: example" is a custom label that can be used to filter or select resources.

- name: The name of the Kubernetes resource, "example", which will be the identifier for this Lambda function within the Kubernetes cluster.
#### - spec:
The spec section defines the desired state of the Lambda function. This is where we configure the specifics of the function itself.

- forProvider: This section contains the actual configuration options that will be passed to AWS to create the Lambda function.

 - handler: The entry point for the Lambda function, where AWS Lambda looks for the function code. Here, index.js indicates that the handler function is located in a javascript file named index.js.
- packageType: Indicates the package type for the Lambda function code. Zip specifies that the code is packaged in a .zip file, which is typical for Lambda deployments.
- region: Specifies the AWS region where the Lambda function will be deployed.
- roleSelector.matchLabels: Defines a selector used to identify an AWS IAM role within Kubernetes based on labels. In this case, it looks for a role resource that has the label "testing.upbound.io/example-name: role". The selected IAM role will be used by the Lambda function to execute in AWS.
- runtime: Specifies the runtime environment for the Lambda function.
- s3Bucket: The name of the S3 bucket where the Lambda function code is stored.
- s3Key: The key (or path) within the S3 bucket where the zipped code for the Lambda function is stored.
- timeout: The maximum time (in seconds) that the Lambda function is allowed to run before it times out.

Now we need to apply this manifest:

    kubectl apply -f lambda.yaml
=> Crossplane will take the YAML configuration and create the corresponding AWS Lambda function in the AWS account we previously configured the credentials for.

To verify the lambda function, we run this command and check the lambda kubernetes resource status.

    kubectl get function.lambda.aws.crossplane.io example-lambda-function -o yaml

This will show the status of the Lambda function, including any errors or updates related to its creation.
we can also verify the function directly in the AWS Management Console under the Lambda service.

And to delete the provisioned resource, we can simply delete the kubernetes resource, either by specifying the kubernetes resource name or the manifest file.

    kubectl delete function.lambda.aws.crossplane.io example-lambda-function
or 
kubectl delete -f lambda.yaml


#### you can see more configuration fields in the API documentation for the aws lambda function.

    https://marketplace.upbound.io/providers/upbound/provider-aws-lambda/v1.12.0/resources/lambda.aws.upbound.io/Function/v1beta1







