<template>
    <div>
      <p>Double count: {{ count }}</p>
      <button @click="increment">Increment</button>
    </div>
  </template>
  
  <script>
  import { mapState, mapMutations, mapActions } from 'vuex'
  
  export default {
    computed: {
      ...mapState(['count']),
    },
    methods: {
      ...mapMutations(['increment']),
      ...mapActions(['incrementAsync']),
    },
  }
  </script>