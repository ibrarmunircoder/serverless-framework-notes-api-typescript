// @ts-ignore
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {
  APIGatewayTokenAuthorizerEvent,
  Context,
  AuthResponse,
  StatementEffect,
} from 'aws-lambda';
const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID!,
  tokenUse: 'id',
  clientId: COGNITO_WEB_CLIENT_ID!,
});

const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string
): AuthResponse => {
  const temp = resource.split(':');
  const apiGatewayArnTemp = temp[5].split('/');
  const newResource =
    temp[0] +
    ':' +
    temp[1] +
    ':' +
    temp[2] +
    ':' +
    temp[3] +
    ':' +
    temp[4] +
    ':' +
    apiGatewayArnTemp[0] +
    '/*/*';
  var authReponse = {} as AuthResponse;
  authReponse.principalId = principalId;
  if (effect && resource) {
    let policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: effect as StatementEffect,
          Resource: newResource,
          Action: 'execute-api:Invoke',
        },
      ],
    };
    authReponse.policyDocument = policyDocument;
  }
  authReponse.context = {
    foo: 'bar',
  };
  console.log(JSON.stringify(authReponse));
  return authReponse;
};

exports.handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context,
  callback: any
) => {
  // lambda authorizer code
  var token = event.authorizationToken;
  console.log(token);
  // Validate the token
  try {
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));
    callback(null, generatePolicy('user', 'Allow', event.methodArn));
  } catch (err) {
    callback('Error: Invalid token');
  }
};
