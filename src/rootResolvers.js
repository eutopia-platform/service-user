import { auth } from './interService'
import gql from 'graphql-tag'
import crypto from 'crypto'

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

const hashUid = uid => crypto.createHash('sha256').update(uid).digest('base64')

const createUser = async (uid, email) => {
  if (await selectSingle({ uid }) === null)
    await knex.withSchema(dbSchema).into('user').insert({ uid, email })
}

const rootResolvers = {
  hello: () => 'Hello there',

  user: async (_, context) => {
    if (!context.token)
      return { isLoggedIn: false }

    const authUser = (await auth.query({
      query: gql`query authUser($token: ID!) {
        user(token: $token) {
          isLoggedIn
          uid
          email
        }
      }`,
      variables: {
        token: context.token
      }
    })).data.user

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
      email: user.email,
      id: hashUid(user.uid),
    }
  },

  setName: async({name, callname}, context) => {
    if (!context.token)
      throw new Error('NOT_LOGGED_IN')
    const uid = (await auth.query({
      query: gql`query authUser($token: ID!) {
        user(token: $token) {
          uid
        }
      }`,
      variables: {
        token: context.token
      }
    })).data.user.uid
    
    const names = {
      ...(name && name.length && {name}),
      ...(callname && callname.length && {callname}),
    }
    
    await knex.withSchema(dbSchema).into('user').where({uid}).update(names)
    const user = await selectSingle({uid})
    return {
      ...user,
      id: hashUid(user.uid),
      isLoggedIn: true,
    }
  }
}

export default rootResolvers
