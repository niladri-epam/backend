const basicAuthorizer = async (event, context, callback) => {
  let token = event.headers['authorization'];

  if (token) {
    let permission = "Deny"
    try {
      token = atob(token.split(" ")[1])
    
      let username = token.split("=")[0]
      let password = token.split("=")[1]

      if (username === process.env.USERNAME && password === process.env.PASSWORD) {
        permission = "Allow"
      }
    } catch(e) {}

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
  } else {
    callback("Unauthorized");
  }
};
  
module.exports = {
  basicAuthorizer,
};