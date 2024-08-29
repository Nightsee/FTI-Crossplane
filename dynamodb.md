# DynamoDB Table Operations

This document provides instructions for inserting and fetching items from the DynamoDB table `cp-database-asatout`.

## Table Schema

- **Table Name:** dynamodb-table-asatout
- **Partition Key:** UserID (String)
- **Sort Key:** OrderID (String)
- **Attributes:**
  - UserID (String) - Unique identifier for a user
  - OrderID (String) - Unique identifier for an order

## Inserting an Item

To insert an item into the DynamoDB table, use the AWS CLI `put-item` command:

```yaml
apiVersion: dynamodb.aws.upbound.io/v1beta1
kind: Table
metadata:
  name: dynamodb-table-asatout
spec:
  forProvider:
    region: eu-west-3
    writeCapacity: 1
    readCapacity: 1
    attribute:
      - name: UserID
        type: S # String type
      - name: OrderID
        type: S # String type
    hashKey: UserID # The partition key
    rangeKey: OrderID # The sort key
  providerConfigRef:
    name: aws-provider-asatout
```

```bash
kubectl apply -f dynamodb.yaml
```
