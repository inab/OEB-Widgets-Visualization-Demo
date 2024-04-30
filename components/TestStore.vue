<template>
    <div>
    <b-row>
        <b-col>
            <div>
                <p>Double count: {{ count }}</p>
                <button @click="increment">Increment</button>
            </div>
        </b-col>
    </b-row>
    <!--  -->

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
    setup(){
    }
}
</script>

<style scoped>
.benchmarkingChart_scatter{
    text-align: left;
}
</style>