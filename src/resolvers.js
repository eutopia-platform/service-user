import {
  AuthenticationError,
  ForbiddenError,
  UserInputError
} from 'apollo-server-micro'
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

    user: async (root, args, context) => {
      if (!context.userId) throw new AuthenticationError('NOT_LOGGED_IN')
      return (await knex('user').where({ uid: context.userId }))[0]
    },

    usersById: async (root, { ids }, context) => {
      if (!context.isService) throw new ForbiddenError()
      const users = await knex('user').whereIn('uid', ids)
      return ids.map(uid => {
        const user = users.find(user => user.uid === uid)
        if (user) return user
        else
          throw new UserInputError(
            `user with ${ids.indexOf(uid) + 1}. id doesn't exist`
          )
      })
    },

    usersByEmail: async (root, { emails }, context) => {
      if (!context.isService) throw new ForbiddenError()
      const users = await knex('user').whereIn('email', emails)
      return emails.map(email => {
        const user = users.find(user => user.email === email)
        if (user) return user
        else
          throw new UserInputError(`user with email "${email}" doesn't exist`)
      })
    }
  },

  Mutation: {
    setName: async (root, { name, callname }, context) => {
      if (!context.userId) throw new AuthenticationError('NOT_LOGGED_IN')
      const names = {
        ...(name && name.length && { name }),
        ...(callname && callname.length && { callname })
      }
      await knex('user')
        .where({ uid: context.userId })
        .update(names)
      return (await knex('user').where({ uid: context.userId }))[0]
    }
  },

  User: {
    id: ({ uid }, _, context) =>
      context.isService
        ? uid
        : crypto
            .createHash('sha256')
            .update(uid)
            .digest('base64')
  }
}
