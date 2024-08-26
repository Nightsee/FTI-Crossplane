
# Crossplane setup on eks cluster
Before setting up Crossplane on your EKS cluster, we need the following.
## Prequisites
- kubernetes cluster & kubectl: A running EKS cluster with  the Kubernetes command-line (kubectl) tool installed and configured to communicate with the cluster.
- Helm:  Helm package manager installed on your local machine.

If helm is not installed, we can install it by following the official Helm installation guide:
    
    https://helm.sh/docs/intro/install/

## setting up crossplane
Add the official Crossplane Helm repository to your Helm installation:
    
    helm repo add crossplane-stable https://charts.crossplane.io/stable
    helm repo update
Then install Crossplane using Helm. This command deploys Crossplane to your EKS cluster:

    helm install crossplane --namespace crossplane-system crossplane-stable/crossplane --create-namespace

Then to verify the installation, we can run the following command and ensure that the pods are in a running state:
    
    kubectl get pods -n crossplane-system
Now that crossplane has been installed on the cluster, we need to install the necessary providers, more on providers in the Concepts folder. We will be working with AWS only, so we need to install it's provider, and to do that we start first by writting a yaml file for the provider.

    #file: provider-aws.yaml
    apiVersion: pkg.crossplane.io/v1
    kind: Provider
    metadata:
    name: provider-aws-X
    spec:
    package: xpkg.upbound.io/upbound/provider-aws-X:Y

X: Is the service or ressource name from the aws providers family that we want to manage with crossplane.

Y: Is the version of the provider.

Then we use the kubctl command to apply this manifest.

    kubectl apply -f provider-aws.yaml
to check if the provider is installed.

    kubectl get providers

To look for providers and their required configuration fields. check the upbound marketplace.

    https://marketplace.upbound.io/providers/upbound/provider-family-aws/v1.12.0/providers

## Setting the cloud provider credentials
Crossplane requires the target cloud providers credentials to manage the resources. in AWS, we can provide these credentials using an AWS IAM User with access keys.

1. Create kubernetes secret to store aws access keys.


        kubectl create secret generic aws-secret -n crossplane-system \
        --from-literal=credentials="[default]
        aws_access_key_id=<YOUR_ACCESS_KEY>
        aws_secret_access_key=<YOUR_SECRET_KEY>"

2. We configure the AWS Provider to use these credentials.

        #file: provider-config.yaml
        apiVersion: aws.crossplane.io/v1beta1
        kind: ProviderConfig
        metadata:
        name: default
        spec:
            credentials:
                source: Secret
                secretRef:
                    namespace: crossplane-system
                    name: aws-secret
                    key: credentials

3. We apply the manifest.

        kubectl apply -f provider-config.yaml

Now that we have successfully set up Crossplane on the cluster and know how to configure it to manage any AWS resource through the providers. we can now leverage Crossplane to manage and deploy a wide range of cloud resources directly from our Kubernetes cluster, using the familiar Kubernetes APIs.