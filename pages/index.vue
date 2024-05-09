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
        <h3>Component Visualization &#8594; {{ visualizationType }}</h3>
      </b-col>
    </b-row>

    <b-row>
      <b-col cols="12" sm="10" md="12">
        <transition name="fade" v-if="!loading">
          <component :is="currentPlotComponent" v-if="currentPlotComponent" :preparedData="preparedData"/>
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
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

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
      loading: true,
      preparedData: null,
      visualizationType: null, 
      metrics: [],
      fetchedData: null, // Eliminar al finalizar las pruebas
    }
  },
  // Mounted solo esta para probar la funcion fetchDataAndRender.
  async mounted() {
    // Obtén tus datos de prueba
    const response = await fetch('/raw_data_OEBD00200001VF0.json');
    // const response = await fetch('/OEBD00700000NI.json');
    this.fetchedData = await response.json();
    this.fetchDataAndRender(this.fetchedData)
  },
  methods: {
    async fetchDataAndRender(data) {
      // Sets charging status based on data presence
      this.loading = !data;
      let visualization = data.datalink.inline_data.visualization
      let type = visualization.type

      // Prepare the data to pass to the component
      this.preparedData = {
        _id: data._id,
        dates: data.dates,
        dataset_contact_ids: data.dataset_contact_ids,
        inline_data: {
          challenge_participants:[],
          visualization:{}
        }
      }

      // Prepare specific data for Plots
      if (type === 'bar-plot'){
        // Process challenge_participants data for BarPlot
        data.datalink.inline_data.challenge_participants.forEach(participant => {
          const preparedParticipant = {
            tool_id: participant.tool_id,
            metric_value: participant.metric_value,
            stderr: participant.stderr
          };
          this.preparedData.inline_data.challenge_participants.push(preparedParticipant);
        });

        // Process visualization data for BarPlot
        const visualization = data.datalink.inline_data.visualization;
        this.preparedData.inline_data.visualization = {
          metric: visualization.metric,
          type: visualization.type
        };
      }else if (type === '2D-plot'){
        // Process challenge_participants data for ScatterPlot
        data.datalink.inline_data.challenge_participants.forEach(participant => {
          const preparedParticipant = {
            tool_id: participant.tool_id,
            metric_x: participant.metric_x,
            stderr_x: participant.stderr_x,
            metric_y: participant.metric_y,
            stderr_y: participant.stderr_y
          };
          this.preparedData.inline_data.challenge_participants.push(preparedParticipant);
        });

        // Process visualization data for ScatterPlot
        const visualization = data.datalink.inline_data.visualization;
        const metrics_names = await this.getMetricsNames(visualization.x_axis, visualization.y_axis);
        this.preparedData.inline_data.visualization = {
          type: visualization.type,
          x_axis: metrics_names.metricX,
          y_axis: metrics_names.metricY,
          optimization: visualization.optimization
        };
      }else{
        return null;
      }

      
      // Check the display type and set the corresponding status
      if (visualization && type) {
        this.visualizationType = type;
      }
    },
    async getMetricsNames(metric_x, metric_y) {
      let metrics_names = {'metricX': '', 'metricY': ''};

      if (this.metrics.length === 0) {
        await this.$store.dispatch('fetchMetrics');
        this.metrics = this.$store.state.metrics;

        this.metrics.forEach(function(metric) {
          if(metric._metadata && "level_2:metric_id" in metric._metadata){
            if(metric._metadata["level_2:metric_id"] === metric_x){
              metrics_names['metricX'] = metric.title;
            }
            if(metric._metadata["level_2:metric_id"] === metric_y){
              metrics_names['metricY'] = metric.title;
            }
          }
        });
      }
      return metrics_names;
    }
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