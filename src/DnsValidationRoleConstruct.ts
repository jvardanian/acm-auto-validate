import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DnsValidationRoleConstructProps {
  readonly rolePrefix: string;
  readonly sourceAcctId: string;
  readonly zoneAcctId: string;
}

export class DnsValidationRoleConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DnsValidationRoleConstructProps) {
    super(scope, id);

    const paramArns = [
      `arn:aws:ssm:us-east-1:${props.zoneAcctId}:parameter/acm/*`,
    ];

    // Create IAM role used for DNS validation lambda
    new iam.Role(this, `${props.rolePrefix}-dns-validation-role`, {
      roleName: `${props.rolePrefix}-dns-validation-role`,
      assumedBy: new iam.AccountPrincipal(props.sourceAcctId),
      description: 'Lambda role for DNS validation of ACM certificates',
      inlinePolicies: {
        Route53ChangeResourceRecordSetsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'route53:ChangeResourceRecordSets',
                'route53:ListHostedZones',
              ],
              resources: ['*'],
              effect: iam.Effect.ALLOW,
            }),
          ],
        }),
        SSMGetParametersPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ssm:GetParameter*',
                'ssm:DeleteParameter*',
                'ssm:PutParameter*',
              ],
              resources: paramArns,
              effect: iam.Effect.ALLOW,
            }),
          ],
        }),
      },
    });
  }
}
