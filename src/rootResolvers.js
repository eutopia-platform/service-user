import { graphql } from 'graphql'
import schema from './schema'
const axios = require('axios')

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

const dbSchema = 'sc_user'
const select = async cond => await knex.select().withSchema(dbSchema).from('user').where(cond)
const selectSingle = async cond => await select(cond) |> (_ => #.length ? #[0] : null)()

const createUser = async (uid, email) => {
  await knex.withSchema(dbSchema).into('user').insert({uid, email})
}

const rootResolvers = {
  hello: () => 'Hello there',

  user: async (_, context) => {
    if (!context.token)
      return { isLoggedIn: false }

    const authUser = (await axios.post(context.authUrl, {
      query: `{
        user(token: "${context.token}") {
          isLoggedIn
          uid
          email
        }
      }`
    }, { headers: {'auth': process.env.AUTH_PASSWORD} })).data.data.user

    if (!authUser.isLoggedIn)
      return { isLoggedIn: false }

    let user = await selectSingle({uid: authUser.uid})
    if (!user) {
      await createUser(authUser.uid, authUser.email)
      user = await selectSingle({uid: authUser.uid})
    }

    if (user.name === null) {
      await knex.withSchema(dbSchema).table('user').where({ uid: user.uid }).update({ 
        name: user.email.split('@')[0],
        callname: user.email.split('@')[0].split('.')[0],
      })
      user = await selectSingle({ uid: authUser.uid })
    }
    
    return { 
      isLoggedIn: true, 
      name: user.name,
      callname: user.callname,
      email: user.email
    }
  },

  logout: async (_, context) => {
    console.log('logout', context.token)
    await axios.post(context.authUrl, {
      query: `mutation {
        logout(token: "${context.token}")
      }`
    })
  }
}

export default rootResolvers
