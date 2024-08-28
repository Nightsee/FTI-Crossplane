# Crossplane Serverless Application Deployment

This documentation provides an overview of deploying a serverless application using Crossplane. The application includes AWS services such as S3, Lambda, API Gateway, and DynamoDB, all managed within a Kubernetes cluster.

## Prerequisites

We need to ensure we have the following:

- A Kubernetes cluster with at least 2 GB of RAM.

- Permissions to create pods and secrets in the Kubernetes cluster.

- Helm version v3.2.0 or later.

- AWS CLI installed and configured.

### Configure AWS CLI

Run the following command to configure your AWS CLI:

```bash

aws  configure

```

### Update kubeconfig to Access the Cluster

Use the following command to update your kubeconfig and access the Kubernetes cluster:

```bash

aws  eks  --region  eu-west-3  update-kubeconfig  --name  ft-eks

```

## Overview

Crossplane integrates your Kubernetes cluster with external, non-Kubernetes resources, allowing platform teams to create custom Kubernetes APIs to manage these resources seamlessly. It provides a unified way to deploy, monitor, and manage cloud services such as AWS, Azure, or Google Cloud directly through Kubernetes.

## Key Components

### 1. Providers

- **Functionality:** Providers define how Crossplane connects to external services, each with its own set of CRDs (Custom Resource Definitions).

- **Applicability:** Available cluster-wide, enabling connections to any service with an API.

- **Use Case:** Essential for integrating services like AWS into your Kubernetes environment.

### 2. Provider Configurations

- **Functionality:** Configure authentication and global settings specific to each Provider.

- **Significance:** Ensures secure and consistent connections to external services.

### 3. Managed Resources

- **Functionality:** Represent individual external resources as Kubernetes objects.

- **Example:** Resources like S3 buckets, Lambda functions, API Gateway endpoints, and DynamoDB tables.

- **Benefit:** Allows management of cloud resources using Kubernetes-native tools (e.g., `kubectl`).

### 4. Compositions

- **Functionality:** Serve as templates that define a collection of Managed Resources.

- **Purpose:** Simplify resource management and allow platform teams to create standardized setups.

- **Customization:** Users can adjust settings within predefined boundaries.

### 5. Composite Resources (XR)

- **Functionality:** Implement the templates defined by Compositions, representing a set of provisioned Managed Resources.

- **Example:** A complete application setup combining S3, Lambda, API Gateway, and DynamoDB.

- **Advantage:** Simplifies the deployment of complex, multi-resource configurations.

### 6. Composite Resource Definitions (XRDs)

- **Functionality:** Define custom Kubernetes APIs for managing Composite Resources and Claims.

- **Scope:** Cluster-wide impact, enabling the creation of custom resource types and claims.

- **Flexibility:** Allows the creation of tailored APIs for different infrastructure needs.

### 7. Claims

- **Functionality:** Provide developers with a namespace-scoped interface to request and manage resources.

- **Importance:** Supports multi-tenancy by isolating resource management within namespaces.

- **Benefit:** Empowers teams to independently manage resources without requiring cluster-wide permissions.

## Workflow Summary

1.  **Install Crossplane** in your Kubernetes cluster.

2.  **Set up Providers** (e.g., AWS Provider) to connect your cluster to external cloud services.

3.  **Create Managed Resources** (e.g., S3, Lambda) using Crossplane CRDs, representing external resources as Kubernetes objects.

Verify Access to the Cluster:

```bash

kubectl  get  nodes

```

## Deployment Order and Role of Manifests

To deploy our serverless application using Crossplane, we need to apply the manifests in the correct order, ensuring each resource is created with the dependencies it requires. Here’s the order to apply our manifests, along with the role of each:

1.  **s3.yaml:**

This manifest creates the S3 bucket used for storing objects needed by our application.

    kubectl apply -f s3.yaml

2.  **lambda_role.yaml:**

This manifest creates the IAM role for our Lambda function, providing the necessary permissions for it to execute.

      kubectl apply -f lambda_role.yaml

3.  **lambda.yaml:**

This manifest deploys the Lambda function itself, specifying the code and configurations. But first, we need to deploy the Lambda function, we need to upload our function code as a `.zip` file to an S3 bucket. Here’s a sample function and the command to upload it:

- Create the ZIP File

  zip func.zip index.js

- Upload the ZIP File to S3

  aws s3 cp func.zip s3://your-bucket-name/

  kubectl apply -f lambda.yaml

4.  **apigateway_v2.yaml:**

This manifest creates the API Gateway, setting up the base configuration for our API.

    kubectl apply -f apigateway_v2.yaml

5.  **apigateway_v2_integration.yaml:**

This manifest creates the integration between the API Gateway and the Lambda function, allowing the API Gateway to invoke the Lambda.

      kubectl apply -f apigateway_v2_integration.yaml

6.  **apigateway_v2_route.yaml:**

This manifest defines the route for the API Gateway, specifying how incoming requests are routed to the integration.

    kubectl apply -f apigateway_v2_route.yaml

7.  **apigateway_v2_stage.yaml:**

This manifest creates the stage for our API Gateway, which is a logical reference to a lifecycle state of our API (like development, staging, or production).

    kubectl apply -f apigateway_v2_stage.yaml

8.  **apigateway_v2_deployment.yaml:**

This manifest creates the deployment for our API Gateway, which is a snapshot of the API configuration at a specific point in time.

       kubectl apply -f apigateway_v2_deployment.yaml`
