import { auth } from './interService'

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
  if (await selectSingle({uid}) === null) {
    try {
      await knex.withSchema(dbSchema).into('user').insert({uid, email})
    } catch(e) {
      console.error('couldn\'nt create user', email)
    }
  }
}

const rootResolvers = {
  hello: () => 'Hello there',

  user: async (_, context) => {
    if (!context.token)
      return { isLoggedIn: false }

    const authUser = (await auth.query(`
      {
        user(token: "${context.token}") {
          isLoggedIn
          uid
          email
        }
      }
    `)).data.user

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
  }
}

export default rootResolvers
