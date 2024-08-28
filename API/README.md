
# Api with Crossplane

This document is a walkthrough to the key resource kinds available in the API Gateway v2 provider and how to use them to manage your API Gateway resources. While the example focuses on AWS, the same principles apply to other cloud providers supported by Crossplane.

## Prequisites

- kubernetes cluster with crossplane and kubectl installed.
- the upbound aws lambda provider, the manifest for the provider is in " provider-apigatewayv2.yaml ".

## Provisioning & managing Api
To Provision a fully functional api using Crossplane, we need to define  a set of resources, and they are:
 - API: creates the API resource.
 - Integration: connects the API to a backend service (like a Lambda function).
 - Route: defines how requests to specific paths and methods are handled and routed to integrations.
 - Stage: provides a logical environment for the API (e.g., prod, dev).
 - Deployment: activates the API at a specific stage.
 
#### 1. Define the API resource:

	apiVersion: apigatewayv2.aws.upbound.io/v1beta1
	kind: API
	metadata:
		labels:
			api: apigatewayv2-test
	 	name: test-api
	spec:
		forProvider:
			name: test-http-api
			protocolType: HTTP
			region: us-west-1
		providerConfigRef:
			name: default

##### Key Components
- protocolType: Specifies the type of API (HTTP or WebSocket).
- name: The name of the API.
- corsConfiguration: Defines CORS settings for the API.
- providerConfigRef: References the AWS Provider configuration.

#### 2. Define the Integration resource:
An Integration in API Gateway v2 represents the connection between an API route and a backend service. Integrations determine how the API Gateway routes requests to your backend.

	apiVersion: apigatewayv2.aws.upbound.io/v1beta1
	kind: Integration
	metadata:
	  labels:
	  	integration: apigatewayv2-test-integration
	  name: example-websocket
	spec:
	  forProvider:
		apiIdSelector:
		  matchLabels:
			api: apigatewayv2-test
		integrationMethod: POST
		integrationType: HTTP
		integrationUri: arn:aws:lambda:region:xxxxxxxx:function:<functionName>
		payloadFormatVersion: '2.0'
		region: us-west-1
  	  providerConfigRef:
  		name: default

##### Key Components
- apiIdSelector: Selects the API to which the integration is associated by matching the labels.
- integrationType: The type of integration (e.g., AWS_PROXY, HTTP_PROXY).
- integrationUri: The URI of the backend service (e.g., a Lambda function ARN).
- payloadFormatVersion: Specifies the format of the payload that API Gateway sends to the backend service.

#### 3. Define the Route resource:
A Route in Apigatewayv2 defines the path and methods for an API request and associates it with an integration.

	apiVersion: apigatewayv2.aws.upbound.io/v1beta1
	kind: Route
	metadata:
	  name: example-route
	spec:
	  forProvider:
		apiIdSelector:
		  matchLabels:
			api: apigatewayv2-http
		region: us-west-1
		routeKey: POST /login
		targetSelector:
		  matchLabels:
			integration: apigatewayv2-test-integration
	  providerConfigRef:
  		name: default

##### Key Components
- apiIdSelector: Selects the API to which the route belongs.
- routeKey: Specifies the route's method and path.
- targetSelector: Selects the integration associated with the route.

#### 4. Define the Stage resource:
A Stage in Apigatewayv2 is a logical reference to a specific point in the lifecycle of the api (for example, dev, test, or prod). Stages can be associated with different versions of the API.

	apiVersion: apigatewayv2.aws.upbound.io/v1beta2
	kind: Stage
	metadata:
	  labels:
		stage: apigatewayv2-test-stage
	  name: example-stage
	spec:
	  forProvider:
		apiIdSelector:
		  matchLabels:
			api: apigatewayv2-test
		deploymentIdSelector:
		  matchLabels:
		  	deployment: apigatewayv2-test-deployment
		name: dev
		region: us-west-1
	  providerConfigRef:
	  	name: default

#####Key Components
- apiIdSelector: Selects the API to which the stage belongs.
- spec.name: The name of the stage (e.g., dev, prod).
- deploymentIdSelector: Selects the deployment associated with the stage.
- providerConfigRef: References the AWS Provider configuration.

#### 5. Define the Deployment resource:
A Deployment in Apigatewayv2 represents a snapshot of our API that can be associated with a Stage. Each time we deploy the API, a new deployment is created.

	apiVersion: apigatewayv2.aws.upbound.io/v1beta1
	kind: Deployment
	metadata:
	  labels:
		deployment: apigatewayv2-test-deployment
	  name: example-deployment
	spec:
	  forProvider:
		apiIdSelector:
		  matchLabels:
			api: apigatewayv2-test
		description: Example deployment of our api
		region: us-west-1
	  providerConfigRef:
	  	name: default

#### Applying the configurations:
	>>> Note: if we were to write theses configurations in seperate files, we would have to apply each file in the same order: api - integration - route - stage - deployment.

Now we need to apply the manifest:

	kubectl apply -f Api.yaml

=> Crossplane will take the YAML configuration and create the corresponding AWS resources.

To verify that that all the resources defined in the manifest have been successfuly created, we run this command and check their kubernetes resource status.

    kubectl get -f Api.yaml

And to delete the provisioned resource, we can simply delete the kubernetes resource, either by specifying the kubernetes resource name or the manifest file.

    kubectl delete -f Api.yaml


#### you can see more configuration fields for different api resources in the API documentation of the apigatewayv2 provider.

	https://marketplace.upbound.io/providers/upbound/provider-aws-apigatewayv2/v1.12.0
