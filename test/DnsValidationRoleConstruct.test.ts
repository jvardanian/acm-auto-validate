import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DnsValidationRoleConstruct } from '../src/DnsValidationRoleConstruct';

test('DnsValidationRoleConstruct creates an IAM Role', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack', {
    env: { region: 'us-east-1', account: '123456789012' },
  });

  new DnsValidationRoleConstruct(stack, 'MyDnsValidationRole', {
    rolePrefix: 'prod',
    sourceAcctId: '123456789012',
    zoneAcctId: '123456789012',
  });

  const template = Template.fromStack(stack);

  // Check if an IAM Role is created with the expected properties
  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [{
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          AWS: {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::123456789012:root',
              ],
            ],
          },
        },
      }],
      Version: '2012-10-17',
    },
  });

  // Check for inline policies
  template.hasResourceProperties('AWS::IAM::Role', {
    Policies: [
      {
        PolicyName: 'Route53ChangeResourceRecordSetsPolicy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Action: [
              'route53:ChangeResourceRecordSets',
              'route53:ListHostedZones',
            ],
            Effect: 'Allow',
            Resource: '*',
          }],
        },
      },
      {
        PolicyName: 'SSMGetParametersPolicy',
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Action: [
              'ssm:GetParameter*',
              'ssm:DeleteParameter*',
              'ssm:PutParameter*',
            ],
            Effect: 'Allow',
            Resource: 'arn:aws:ssm:us-east-1:123456789012:parameter/acm/*',
          }],
        },
      },
    ],
  });
});
