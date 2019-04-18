const rootResolvers = {
  hello: () => 'Hello World',
  user: () => ({
    status: 'logged out',
    name: ''
  })
}

export default rootResolvers
