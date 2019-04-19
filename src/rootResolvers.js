const knex = require('knex')({
  client: 'pg',
  version: '10.6',
  connection: {
    host: process.env.USER_DATABASE_URL,
    user: process.env.USER_DATABASE_USER,
    password: process.env.USER_DATABASE_PASSWORD,
    database: process.env.USER_DATABASE_NAME
  }
})

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

    const user = await knex.withSchema('sc_user').select().from('user').where({ uid: response.uid })
      |> (_ => # ? #[0] : null )()

    return {
      loggedIn: response.isloggedin,
      name: user ? user.callname : 'unknown name'
    }
  }
}

export default rootResolvers
