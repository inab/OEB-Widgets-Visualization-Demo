import Vuex from 'vuex';
import axios from 'axios';

export default () => {
  return new Vuex.Store({
    state: () => ({
      metrics: [], // Agregamos un nuevo array para almacenar las métricas
    }),
    mutations: {
      setMetrics(state, metrics) { // Mutación para actualizar las métricas
        state.metrics = metrics;
      },
    },
    actions: {
      async fetchMetrics({ commit }) {
        try {
          const response = await axios.post('https://openebench.bsc.es/sciapi/graphql', {
            query: `
              query getMetrics {
                getMetrics {
                  _id
                  title
                  _metadata
                  representation_hints
                }
              }
            `
          });
          // Actualizamos el estado con las métricas obtenidas
          commit('setMetrics', response.data.data.getMetrics);
        } catch (error) {
          console.error('Error to get metrics:', error);
        }
      },
    },
    getters: {
      // tus getters aquí
    },
    modules: {
      // tus módulos aquí
    },
  });
};
