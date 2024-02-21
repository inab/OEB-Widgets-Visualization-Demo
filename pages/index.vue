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
        <h3>Component Visualization</h3>
      </b-col>

      <!-- Botones de alternancia -->
      <b-col cols="12" sm="6" md="6">
        <b-button @click="showScatterPlot = true; showBarPlot = false">Mostrar Scatter Plot</b-button>
      </b-col>
      <b-col cols="12" sm="6" md="6">
        <b-button @click="showBarPlot = true; showScatterPlot = false">Mostrar Bar Plot</b-button>
      </b-col>
    </b-row>

    <b-row>
      <!-- Scatter plot -->
      <b-col v-if="showScatterPlot" cols="12" sm="10" md="12">
        <!-- <b-card class="pl-8 pr-8 pb-4 mt-4"> -->
          <ScatterPlot/>
        <!-- </b-card> -->
      </b-col>


      <!-- Bar plot -->
      <b-col v-if="showBarPlot" cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <BarPlot/>
        </b-card>
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