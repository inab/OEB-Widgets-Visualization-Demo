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
        <h3>Component Visualization ➜ BAR PLOT</h3>
      </b-col>

      <!-- Componentes -->

      <!-- Bar plot -->
      <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <!-- Wrapper div for spinner with centering styles -->
          <div v-if="loading" class="spinner-container">
            <b-spinner type="grow" label="Loading..." style="width: 3rem; height: 3rem; color: #0b579f;"></b-spinner>
          </div>
          <transition v-else name="fade">
            <BarPlot v-if="isBarPlotType" :jsonData="fetchedData" />
            <div v-else>hello</div>
          </transition>
        </b-card>
      </b-col>

    </b-row>

  </b-container>
</template>

<script>
import BarPlot from '~/components/BarPlot.vue';



export default {
  name: 'IndexPage',
  components: {
    BarPlot
  },
  data() {
    return {
      loading: true, // Initial loading state
      fetchedData: null,
      isBarPlotType: null
    }
  },

  async mounted() {
    // Simulate an asynchronous operation to better layout
    setTimeout(() => {
      this.loading = false;
    }, 1000);

     // Fetch your data
     const response = await fetch('/OEBD004000000D.json'); //endpoint to db
    this.fetchedData = await response.json();

    if (this.fetchedData) {
      if (this.fetchedData.datalink.inline_data.visualization && this.fetchedData.datalink.inline_data.visualization.type === 'bar-plot') {
        this.isBarPlotType = true;
      }
    }

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

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>