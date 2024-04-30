import Vuex from 'vuex';
import axios from 'axios';

export default () => {
  return new Vuex.Store({
    state: () => ({
      count: 0,
      datasets: [],
    }),
    mutations: {
      increment(state) {
        state.count++;
      },
      setDatasets(state, datasets) {
        state.datasets = datasets;
      },
    },
    actions: {
      async fetchDatasets({ commit }) {
        try {
          // Realizar una solicitud GET a la API para obtener datasets
          const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
          // Actualizar el estado con los datos obtenidos
          commit('setDatasets', response.data);
        } catch (error) {
          console.error('Error al obtener datasets:', error);
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
