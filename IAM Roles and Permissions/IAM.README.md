
# IAM with Crossplane

This document is a walkthrough to the key resource kinds available in the iam provider and how to use them to manage iam roles and policies. While the example focuses on AWS, the same principles apply to other cloud providers supported by Crossplane.

## Prequisites

- kubernetes cluster with crossplane and kubectl installed.
- the upbound aws lambda provider, the manifest for the provider is in "provider-iam.yaml".

## Provisioning & managing IAM roles and permissions

When managing IAM roles and policies with Crossplane, we can either define the role and its inline policies together in a single Role resource, split them into separate resources using a Role and RolePolicy kinds or using policy and rolePolicyAttachment.

The following configuration is an example showing how to create an IAM Role in AWS that can be assumed by the EKS service. The role has an inline policy attached to it, granting it permissions to describe any EC2 resources, using crossplane.

	apiVersion: iam.aws.upbound.io/v1beta1
	kind: Role
	metadata:
	  name: role-with-inline-policy
	spec:
	  forProvider:
		assumeRolePolicy: |
		  {
			"Version": "2012-10-17",
			"Statement": [
			  {
				"Effect": "Allow",
				"Principal": {
				  "Service": "eks.amazonaws.com"
				},
				"Action": "sts:AssumeRole"
			  }
			]
		  }
		inlinePolicy:
		  - name: my_inline_policy
			policy: |
			  {
				"Version": "2012-10-17",
				"Statement": [
				  {
					"Effect": "Allow",
					"Resource": "*",
					"Action": "ec2:Describe*"
				  }
				]
			  }

Or we can go with the second method, by defining a Role first, then a RolePolicy. 

	apiVersion: iam.aws.upbound.io/v1beta1
	kind: Role
	metadata:
	  labels:
	  	role: test-role
	  name: role-example
	spec:
	  forProvider:
		assumeRolePolicy: |
		  {
			"Version": "2012-10-17",
			"Statement": [
			  {
				"Effect": "Allow",
				"Principal": {
				  "Service": "eks.amazonaws.com"
				},
				"Action": "sts:AssumeRole"
			  }
			]
		  }
	---
	apiVersion: iam.aws.upbound.io/v1beta1
	kind: RolePolicy
	metadata:
	  name: inline-policy-example
	spec:
	  forProvider:
		roleSelector:
			matchLabels:
				role:  test-role
		policyName: policy-example
		policyDocument: |
		  {
			"Version": "2012-10-17",
			"Statement": [
			  {
				"Effect": "Allow",
				"Resource": "*",
				"Action": "ec2:Describe*"
			  }
			]
		  }

And to make the policy more modulare and reusable, we can create a seperate policy that we can attach to the role using Policy, and RolePolicyAttachement kinds.

	apiVersion: iam.aws.upbound.io/v1beta1
	kind: Policy
	metadata:
	  lables:
	  	policy: ec2-deletion-policy
	  name: ec2-deletion-policy
	spec:
	  forProvider:
		name: ec2-deletion-policy
		policyDocument: |
		  {
			"Version": "2012-10-17",
			"Statement": [
			  {
				"Effect": "Allow",
				"Action": [
				  "ec2:TerminateInstances",
				  "ec2:DeleteSnapshot",
				  "ec2:DeleteVolume"
				],
				"Resource": "*"
			  }
			]
		  }
now that we have a standalone policy, we can use the RolePolicyAttachement to attach this policy to any role we want.

	apiVersion: iam.aws.upbound.io/v1beta1
	kind: RolePolicyAttachment
	metadata:
	  name: ec2-management-role-attachment
	spec:
	  forProvider:
		roleSelector:
			matchLabels:
				role: test-role
		policyArnSelector:
			matchLabels: ec2-deletion-policy



#### Applying the configurations:

To apply the manifest:

	kubectl apply -f FileName.yaml

=> Crossplane will take the YAML configuration and create the corresponding AWS resources.

To verify that that all the resources defined in the manifest have been successfuly created, we run this command and check their kubernetes resource status.

    kubectl get -f FileName.yaml

And to delete the provisioned resource, we can simply delete the kubernetes resource, either by specifying the kubernetes resource name or the manifest file.

    kubectl delete -f FileName.yaml


#### you can see more configuration fields for different api resources in the API documentation of the apigatewayv2 provider.

	https://marketplace.upbound.io/providers/upbound/provider-aws-iam/v1.12.0