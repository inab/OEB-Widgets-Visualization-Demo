<template>
  <b-container fluid class="pl-5 pr-5">
    <b-row>
      <b-col cols="12" sm="10" md="12">
        <transition name="fade" v-if="!loading">
          <component :is="currentPlotComponent" v-if="currentPlotComponent" :preparedData="preparedData"/>
          <ScatterPlot v-if="type" :preparedData="preparedData"></ScatterPlot>
        </transition>
        <div v-else class="spinner-container">
          <b-spinner type="grow" label="Loading..." style="width: 3rem; height: 3rem; color: #0b579f;"></b-spinner>
        </div>
      </b-col>
    </b-row>
    <b-row>

    </b-row>
    <br>
  </b-container>
</template>

<script>
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import { loadWidgetVisualization, test, greet, widgetUtils } from '~/src/widgetUtils'; // Importa las funciones necesarias

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import BarPlot from '~/components/BarPlot.vue';
import ScatterPlot from '~/components/ScatterPlot.vue';

export default {
  name: 'IndexPage',
  components: {
    BarPlot, ScatterPlot
  },
  data() {
    return {
      loading: true,
      preparedData: null,
      visualizationType: null, 
      metrics: [],
      type: null
    };
  },
  methods: {
    loadWidgetData(data) {
      this.type = loadWidgetVisualization.call(this, data);
      console.log('loadedWidgetVisualization')
    },
  },
  mounted (){
    greet()
    // this.loadWidgetData(data);
  },
  computed: {
    // Calcula el componente de visualización a mostrar
    currentPlotComponent() {
      if (this.visualizationType === 'bar-plot') {
        return BarPlot;
      } else if (this.visualizationType === '2D-plot') {
        return ScatterPlot;
      } else {
        // Puedes agregar más tipos de visualización aquí si es necesario
        return null;
      }
    }
  }
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
