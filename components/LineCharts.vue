<template>
    <div>
      <h4>2D-plot v1</h4>
        <p>Dataset Id: {{ jsonFileName }} </p>
        <div id="2D-plot"></div>

    </div>
</template>
<script setup>
import { onMounted, ref, defineProps } from 'vue';

const dataset = ref(null);
const jsonFileName = ref(null);

onMounted(async () => {
  // const Plotly = (await import('plotly.js-dist')).default;
  const Plotly = require('plotly.js-dist');

  const response = await fetch('/OEBD0070000005.json');
  dataset.value = await response.json();

  // Obtener el nombre del archivo de la URL
  const urlParts = response.url.split('/');
  const fileNameWithExtension = urlParts[urlParts.length - 1];
  jsonFileName.value = fileNameWithExtension.replace('.json', '');



  // Estructuras de datos para Plotly
  const traces = [];

  // Recorrer cada objeto en el dataset
  for (let i = 0; i < dataset.value.length; i++) {
    const dataObject = dataset.value[i];

    // Crear una traza para cada objeto
    const trace = {
      x: dataObject.x,
      y: dataObject.y,
      mode: dataObject.type,
      type: 'scatter',
      name: dataObject.name,
      marker: { size: 12 }
    };

    traces.push(trace);
  }

  const layout = {
    title: '2D-plot | Scatter Plot',
  };

  // Create the graph with the traces and layout
  Plotly.newPlot('2D-plot', traces, layout);

});
</script>