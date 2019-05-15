export default {
  Query: {
    hello: () => 'user service says hello',

    user: () => {},

    users: () => []
  },

  User: {
    isLoggedIn: parent => {
      console.log('logged in called')
      console.log({ parent })
      return true
    },
    id: () => 'asdf',
    name: () => 'asdf',
    callname: () => 'asdf',
    email: () => 'asdf'
  }
}
