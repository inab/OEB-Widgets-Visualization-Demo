<template>
  <div>
    <h1>Métricas</h1>
    
    <ul>
      <li v-for="metric in metrics" :key="metric._id">
        {{ metric.title }}
        <span>{{ metric._id }}</span>
        <span>{{ metric._metadata }}</span>
      </li>
    </ul>
  </div>
</template>

<script> 
export default {
  data() {
    return {
      metrics: [],
    };
  },
  async mounted() {
    let metric_x = 'avg Schlicker'
    let metric_y = 'NR_ORTHOLOGS'

    // Disparar la acción para obtener las métricas si aún no se han obtenido
    if (this.metrics.length === 0) {
      await this.$store.dispatch('fetchMetrics');
      // Una vez que se han obtenido las métricas, asignarlas a la propiedad metrics
      this.metrics = this.$store.state.metrics;

      let metrics_names = {'metricX': '', 'metricY': ''};
      this.metrics.forEach(function(metric) {
        if(metric._metadata && "level_2:metric_id" in metric._metadata){
          if(metric._metadata["level_2:metric_id"] === metric_x){
            metrics_names['metricX'] = metric.title
          }
          if(metric._metadata["level_2:metric_id"] === metric_y){
            metrics_names['metricY'] = metric.title
          }
        }
      });
      console.log(metrics_names)
      
    }
  }
};
</script>
