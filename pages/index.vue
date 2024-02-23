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
        <h3>Component Visualization &#8594; {{titlePlot}}</h3>
      </b-col>
    </b-row>

    <b-row>
      <!-- Wrapper div for spinner with centering styles -->
      <div v-if="loading" class="spinner-container">
        <b-spinner type="grow" label="Loading..." style="width: 3rem; height: 3rem; color: #0b579f;"></b-spinner>
      </div>
      <!-- Scatter plot -->
      <b-col cols="12" sm="10" md="12">
        <transition name="fade">
<<<<<<< HEAD
          <ScatterPlot v-if="isScatterPlotType" :inline_data="inline_data" :datasetId="datasetId" />
          <BarPlot v-if="isBarPlotType" :jsonData="fetchedData" />
=======
          <ScatterPlot v-if="!loading" />
>>>>>>> cf2dca4 (Add:  spinner to Scatter Plot)
        </transition>
      </b-col>

    </b-row>
    <br>

  </b-container>
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
  components: {
    BarPlot, ScatterPlot
  },
  data() {
    return {
      loading: true, // Initial loading state
<<<<<<< HEAD
      fetchedData: null,
      inline_data: null,
      isBarPlotType: null,
      isScatterPlotType: null,
      datasetId: null,
      titlePlot: null,
    }
  },
  async mounted() {
    // Simulate an asynchronous operation to better layout
    setTimeout(() => {
      this.loading = false;
    }, 1000);

    // Fetch your data
    const response = await fetch('/raw_data_OEBD00200002V20.json'); //endpoint to db rest to cofigure
    this.fetchedData = await response.json();
    this.inline_data = this.fetchedData.datalink.inline_data
    this.datasetId = this.fetchedData._id
    let visualization = this.fetchedData.datalink.inline_data.visualization
    let type = this.fetchedData.datalink.inline_data.visualization.type

    // Test Loader
    if (this.fetchedData) {
      if (visualization && type === 'bar-plot') {
        this.isBarPlotType = true;
        this.titlePlot = 'BAR PLOT'
      }else if(visualization && type === '2D-plot'){
        this.isScatterPlotType = true;
        this.titlePlot = 'SCATTER PLOT'
      }
=======
>>>>>>> cf2dca4 (Add:  spinner to Scatter Plot)
    }
  },
  mounted() {
    // Simulate an asynchronous operation (e.g., fetching data)
    setTimeout(() => {
      this.loading = false; // Set loading to false when the operation is complete
    }, 1000); // Adjust the time according to your needs
  },

}
</script>

<style scoped>
.background {
  background-color: gray !important;
}

.border-alert {
  border-left: 5px solid #dee2e6 !important;
  text-align: left;
}

.spinner-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Add a custom fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
</style>