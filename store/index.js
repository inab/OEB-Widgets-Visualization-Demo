import Vuex from 'vuex'

export default () => {
  return new Vuex.Store({
    state: () => ({
      count: 0,
    }),
    mutations: {
        increment(state) {
          state.count++
        },
      // your mutations here
    },
    actions: {
      // your actions here
    },
    getters: {
      // your getters here
    },
    modules: {
      // your modules here
    }
  })
}