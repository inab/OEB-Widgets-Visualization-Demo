<template>
  <b-container fluid class="pl-5 pr-5">
    <b-row>
      <b-col cols="12" sm="10" md="12">
        <h1 class="mt-3">
          OEB Widgets Development
        </h1>
      </b-col>

      <b-col cols="12" sm="10" md="12">
        <b-alert show variant="light" class="border-alert"> 🚧 Widgets under construction 🚧</b-alert>
      </b-col>
    </b-row>

    <b-row>
      <b-col cols="12" sm="10" md="12">
        <h3>Component Visualization &#8594; SCATTER PLOT</h3>
      </b-col>
    </b-row> 

    <b-row>
      <!-- Scatter plot -->
      <b-col  cols="12" sm="10" md="12">
          <ScatterPlot/>
      </b-col>

    </b-row>
    <br>

  </b-container>

  <!-- <LineCharts/> -->
  <!-- <BarChart/> -->
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// Instala BootstrapVue y los iconos
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

import BarPlot from '~/components/BarPlot.vue';
import ScatterPlot from '~/components/ScatterPlot.vue';

export default {
  name: 'IndexPage',
  components:{
    BarPlot,ScatterPlot
  },
  data(){
    return {
      showScatterPlot: false,
      showBarPlot: false
    }
  },

}
</script>

<style scoped>

.background {
  background-color: gray !important;
}
.border-alert{
  border-left: 5px solid #dee2e6 !important;
  text-align: left;
}

</style>