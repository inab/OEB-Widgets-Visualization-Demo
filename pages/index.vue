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

      <!-- Bar plot -->
      <b-col cols="12" sm="10" md="12">
        <b-card class="pl-8 pr-8 pb-4 mt-4">
          <BarPlot />
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
</style>