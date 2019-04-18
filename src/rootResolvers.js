const axios = require('axios')

const rootResolvers = {
  hello: () => 'Hello World',
  isLoggedIn: async(_, context) => {

  },
  user: async (_, context) => {
    const response = (await axios.post(context.authUrl, {
      'query': `
      mutation{
        isUserLoggedIn(token: "${context.token}", authpassword: "${process.env.AUTH_PASSWORD}") {
          isloggedin
          uid
          exitcode
          msg
        }
      }`
    })).data.data.isUserLoggedIn
    
    return {
      loggedIn: response.isloggedin,
      name: 'unknown name'
    }
  }
}

export default rootResolvers
