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
  searchPath: 'schema_user'
})

export default {
  Query: {
    hello: () => 'user service says hello',

    user: async (root, args, context) => {
      if (!context.userId) throw new AuthenticationError('NOT_LOGGED_IN')
      return (await knex('user').where({ id: context.userId }))[0]
    },

    usersById: async (root, { ids }, context) => {
      if (!context.isService) throw new ForbiddenError()
      const users = await knex('user').whereIn('id', ids)
      return ids.map(id => {
        const user = users.find(user => user.id === id)
        if (user) return user
        else
          throw new UserInputError(
            `user with ${ids.indexOf(id) + 1}. id doesn't exist`
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
        .where({ id: context.userId })
        .update(names)
      return (await knex('user').where({ id: context.userId }))[0]
    },

    addUser: async (root, { id, email }, { isService }) => {
      if (!isService) throw new ForbiddenError('UNAUTHORIZED')
      if ((await knex('user').where({ email })).length > 0)
        throw new UserInputError('ALREADY_EXISTS')
      const name = email
        .split('@')[0]
        .replace('.', ' ')
        .replace(/(?:^|\s)\S/g, c => c.toUpperCase())
      await knex('user').insert({
        id,
        email,
        name,
        callname: name.split(' ')[0],
        joined: knex.fn.now()
      })
    }
  },

  User: {
    id: ({ id }, _, context) =>
      context.isService
        ? id
        : crypto
            .createHash('sha256')
            .update(id)
            .digest('base64')
  }
}
