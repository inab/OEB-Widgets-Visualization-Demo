<template>
    <div>
      <h1>Usuarios</h1>
      <ul>
        <li v-for="user in users" :key="user.id">{{ user.title }}</li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    computed: {
      users() {
        // Obtener los usuarios del store
        return this.$store.state.datasets;
      },
    },
    async created() {
      // Disparar la acción para obtener los datasets si aún no se han obtenido
      if (this.$store.state.datasets.length === 0) {
        await this.$store.dispatch('fetchDatasets');
      }
    },
  };
  </script>
  