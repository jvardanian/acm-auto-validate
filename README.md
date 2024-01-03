# ACM Auto-Validate Construct

## Overview

The ACM Auto-Validate Construct is designed to automate the validation of AWS Certificate Manager (ACM) certificates using DNS validation, especially useful in continuous deployment pipelines. It handles the complexity of validating certificates in a hosted zone that resides in a different AWS account. This automation ensures that certificates requested during infrastructure deployment are validated promptly, allowing CloudFormation templates to proceed without waiting for manual intervention.

## Use Case

This construct was initially created to support CDK-based deployment pipelines where certificates requested remained pending validation. By automating this step, it significantly reduces the deployment time and manual overhead, especially in cross-account DNS validation scenarios.

## Features

- **Automated DNS Validation**: Automates the creation and deletion of DNS records for ACM certificate validation.
- **Cross-Account Support**: Capable of handling DNS records in a hosted zone that is in a different AWS account.
- **Event-Driven**: Utilizes AWS Lambda and Amazon EventBridge to respond to certificate request events.
- **SSM Parameter Tracking**: Tracks the certificates processed using AWS Systems Manager Parameter Store. Note that SSM parameters are created in the `us-east-1` region, but certificates can be issued in any region.

## Prerequisites

- Two AWS accounts: a source account where the ACM certificates are requested and a zone account where the hosted zone resides.
- IAM permissions to create necessary resources in both accounts.
- AWS CDK v2 installed.

## Installation

To use this construct, install it from npm:

```bash
npm install acm-auto-validate
```

## Usage

Here's an example of how to use these constructs in your CDK application:

```typescript
import { ACMValidationConstruct, DnsValidationRoleConstruct } from 'acm-auto-validate';
import { App, Stack } from 'aws-cdk-lib';

const app = new App();

// Create a stack in the account where certificates will be requested
const sourceStack = new Stack(app, 'SourceStack', {
  env: { account: 'source-account-id', region: 'us-east-1' }
});

// Deploy the ACM validation construct in the source account stack
new ACMValidationConstruct(sourceStack, 'ACMValidationConstruct', {
  environment: 'prod',
  zoneAccountId: 'zone-account-id',
  zoneName: 'example.com',
});

// Create a stack in the account where the zone is hosted
const zoneStack = new Stack(app, 'ZoneStack', {
  env: { account: 'zone-account-id', region: 'us-east-1' }
});

// Deploy the DNS validation role construct in the zone account stack
new DnsValidationRoleConstruct(zoneStack, 'DnsValidationRoleConstruct', {
  environment: 'prod',
  sourceAcctId: 'source-account-id',
  zoneAcctId: 'zone-account-id',
});
```

## Configuration

- `ACMValidationConstruct`: Deploys the Lambda function (written in Python) and EventBridge rule in the source account. Requires the zone account ID and the zone name.
- `DnsValidationRoleConstruct`: Deploys the IAM role in the zone account, which the Lambda function assumes. Requires an environment identifier (such as 'dev' or 'prod'), the source account ID, and the zone account ID.

## Contributing

Contributions to this project are welcome. Please follow the standard procedures for submitting issues or pull requests.

## License

This project is distributed under the [MIT License](LICENSE).
