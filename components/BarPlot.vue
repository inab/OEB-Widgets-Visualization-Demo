<template>
    <div>
        <h4>Bar Plot</h4>
        <p>Dataset Id: {{ datasetId }}</p>
        <div id="barPlot"></div>
    </div>
</template>

<script setup>
import { onMounted, ref} from 'vue';

const dataset = ref(null);
const datasetId = ref(null);

onMounted(async () => {
    const Plotly = require('plotly.js-dist');

    const response = await fetch('/OEBD00700000NI.json');
    dataset.value = await response.json();
    datasetId.value = dataset.value._id
    const data = dataset.value.datalink.inline_data

    // Data structures for Plotly
    const trace = {
        x: data.challenge_participants.map(entry => entry.tool_id),
        y: data.challenge_participants.map(entry => entry.metric_value),
        type: 'bar',
        marker: {
            color: 'orange',  // Puedes ajustar el color de las barras según tus preferencias
        },
    };


    const layout = {
        title: '',
        xaxis: { title: 'Tools' },
        yaxis: { title: data.visualization.metric },
    };

    // Crear el gráfico de barras con la única traza y el layout
    Plotly.newPlot('barPlot', [trace], layout);

})
</script>
