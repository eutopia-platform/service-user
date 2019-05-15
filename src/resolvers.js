import { AuthenticationError } from 'apollo-server-micro'
import crypto from 'crypto'

const knex = require('knex')({
  client: 'pg',
  version: '10.6',
  connection: {
    host: process.env.USER_DATABASE_URL,
    user: process.env.USER_DATABASE_USER,
    password: process.env.USER_DATABASE_PASSWORD,
    database: process.env.USER_DATABASE_NAME
  },
  searchPath: 'sc_user'
})

export default {
  Query: {
    hello: () => 'user service says hello',

    user: async (root, args, context, info) => {
      if (!context.userId) throw new AuthenticationError('NOT_LOGGED_IN')
      return (await knex('user').where({ uid: context.userId }))[0]
    },

    users: () => []
  },

  User: {
    id: ({ uid }) =>
      crypto
        .createHash('sha256')
        .update(uid)
        .digest('base64')
  }
}
