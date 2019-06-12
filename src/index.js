import { ApolloServer, gql } from 'apollo-server-micro'
import schema from './schema'
import resolvers from './resolvers'
import { auth as authService } from './interService'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:1234'
      : 'https://productcube.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, session-token'
}

export default async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end()
    return
  }

  Object.keys(headers).forEach(header =>
    response.setHeader(header, headers[header])
  )

  const sessionToken = request.headers['session-token'] || null

  const { userId, userRole } = await authService
    .query({
      query: gql`
        query sessionUser($sessionToken: ID!) {
          user(sessionToken: $sessionToken) {
            id
            role
          }
        }
      `,
      variables: {
        sessionToken
      },
      fetchPolicy: 'network-only'
    })
    .then(({ data: { user: { id, role } } }) => ({
      userId: id,
      userRole: role
    }))
    .catch(() => ({ userId: null, role: 'USER' }))

  const isService =
    request.headers.auth && request.headers.auth === process.env.USER_PASSWORD

  new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: {
      userId,
      userRole,
      isService
    }
  }).createHandler({
    path: '/'
  })(request, response)
}
