import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ACMValidationConstructProps {
  readonly environment: string;
  readonly zoneAccountId: string;
  readonly zoneName: string;
}

export class ACMValidationConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ACMValidationConstructProps) {
    super(scope, id);

    const roleArn = `arn:aws:iam::${props.zoneAccountId}:role/${props.environment}-dns-validation-role`;
    const resourcePrefix = props.zoneName.replace(/\./g, '-');

    const certLambdaRole = new iam.Role(this, `${resourcePrefix}-dns-lambda-execution-role`, {
      roleName: `${resourcePrefix}-dns-lambda-execution-role`,
      description: 'Execution role for ACM validation lambda.',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCertificateManagerReadOnly'),
      ],
      inlinePolicies: {
        AssumeRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sts:AssumeRole'],
              resources: [roleArn],
            }),
          ],
        }),
      },
    });

    const dirname = path.dirname(__filename) || '.';
    const validateCertLambda = new lambda.Function(this, `${resourcePrefix}-validate-cert-lambda`, {
      functionName: `${resourcePrefix}-validate-cert-lambda`,
      code: lambda.Code.fromAsset(path.join(dirname, '../function')),
      handler: 'index.handler',
      runtime: lambda.Runtime.PYTHON_3_9,
      logRetention: logs.RetentionDays.ONE_MONTH,
      role: certLambdaRole,
      description: `DNS validation of ACM certs for ${props.zoneName}`,
      timeout: cdk.Duration.seconds(120),
      environment: {
        HOSTED_ZONE_NAME: props.zoneName,
        TARGET_ROLE_ARN: roleArn,
      },
    });

    const acmRule = new events.Rule(this, `${resourcePrefix}-acm-event-rule`, {
      ruleName: `${resourcePrefix}-acm-event-rule`,
      eventPattern: {
        source: ['aws.acm'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['acm.amazonaws.com'],
          eventName: ['RequestCertificate', 'DeleteCertificate'],
        },
      },
    });
    acmRule.addTarget(new targets.LambdaFunction(validateCertLambda));
  }
}
