import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'John Vardanian',
  authorAddress: 'name@example.com',
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.0.0',
  name: 'acm-auto-validate',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/jvardanian/acm-auto-validate.git',
  description: 'AWS CDK construct for automated cross-account ACM certificate validation using DNS',
  keywords: ['awscdk', 'acm', 'certificate'],
  devDeps: [
    'jest',
    '@types/jest',
    'ts-jest',
  ],

  // Jest configuration
  jestOptions: {
    jestConfig: {
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
  },

});
project.synth();