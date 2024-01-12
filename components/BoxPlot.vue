<template>
    <div>
        <h4>Box Plot</h4>
        <p>Dataset Id: {{ datasetId }}</p>
        <div id="boxplot"></div>
    </div>
</template>

<script setup>
import { onMounted, ref} from 'vue';

const dataset = ref(null);
const datasetId = ref(null);


onMounted(async () =>{
    const Plotly = require('plotly.js-dist');

    const response = await fetch('/OEBD01000000Q7.json');
    dataset.value = await response.json();
    datasetId.value = dataset.value._id
    const data = dataset.value.datalink.inline_data

    const boxTraces = data.challenge_participants.map((participant, index) => {
        return {
            y: participant.values,
            type: 'box',
            name: participant.label,
            marker: {
                color:  `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`,
            }
        }
    });

    const traces = [...boxTraces];

    const layout = {
        title: dataset.value.name
    }

    // Create the graph with the traces and layout
    Plotly.newPlot('boxplot', traces, layout);

})

</script>
