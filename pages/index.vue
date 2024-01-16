<template>
  <b-container>
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

      <!-- Componentes -->

      <!-- Scatter plot -->
      <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <ScatterPlot/>
        </b-card>
      </b-col>

      <!-- Bar plot -->
      <!-- <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <BarPlot/>
        </b-card>
      </b-col> -->

      <!-- Box plot -->
      <!-- <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <BoxPlot/>
        </b-card>
      </b-col> -->


      <!-- Scatter plot v2 -->
      <!-- <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <LineCharts/>
        </b-card>
      </b-col> -->

    </b-row>
    <br>

  </b-container>

  <!-- <LineCharts/> -->
  <!-- <BarChart/> -->
</template>

<script>
import LineCharts from '~/components/LineCharts.vue';
import BarPlot from '~/components/BarPlot.vue';
import BoxPlot from '~/components/BoxPlot.vue';
import ScatterPlot from '~/components/ScatterPlot.vue';

export default {
  name: 'IndexPage',
  components:{
    LineCharts,BarPlot,BoxPlot,ScatterPlot
  },
  data(){
    return {
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