import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ACMValidationConstruct } from '../src/ACMValidationConstruct';

test('ACMValidationConstruct creates necessary resources', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack', {
    env: { region: 'us-east-1', account: '123456789012' },
  });

  new ACMValidationConstruct(stack, 'MyTestACMValidationConstruct', {
    environment: 'prod',
    zoneAccountId: '123456789012',
    zoneName: 'example.com',
  });

  const template = Template.fromStack(stack);

  // Check if a Lambda Function is created
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'python3.9',
    Handler: 'index.handler',
  });

  // Check if an EventBridge Rule is created
  template.hasResourceProperties('AWS::Events::Rule', {
    EventPattern: {
      'source': ['aws.acm'],
      'detail-type': ['AWS API Call via CloudTrail'],
      'detail': {
        eventSource: ['acm.amazonaws.com'],
        eventName: ['RequestCertificate', 'DeleteCertificate'],
      },
    },
  });

  // Check if the IAM Role for Lambda execution is created
  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
    ManagedPolicyArns: [
      {
        'Fn::Join': ['', [
          'arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ]],
      },
      {
        'Fn::Join': ['', [
          'arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/AWSCertificateManagerReadOnly',
        ]],
      },
    ],
  });
});
