const basicAuthorizer = async (event, context) => {
    const token = event.authorizationToken;
    let permission = "Allow"
    const authResponse = {
        principalId: "abc123",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
              {
                Action: "execute-api:Invoke",
                Resource: ["*"],
                Effect: `${permission}`
              }
            ]
        }
      }
  
    return authResponse;
  };
  
  module.exports = {
    basicAuthorizer,
  };