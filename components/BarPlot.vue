<template>
  <div>
    <h4>Bar Plot</h4>
    <p>Dataset Id: {{ datasetId }}</p>
    <p>Last update: {{ formattedDate }}</p>
    <div id="barPlot"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const dataset = ref(null);
const datasetId = ref(null);
const datasetDate = ref(null);
const formattedDate = ref(null);

onMounted(async () => {
  const Plotly = require('plotly.js-dist');

  const response = await fetch('/OEBD00700000NI.json');
  dataset.value = await response.json();
  datasetId.value = dataset.value._id;
  datasetDate.value = dataset.value.dates.modification;
  formattedDate.value = formatDateString(datasetDate.value); // Format
  const data = dataset.value.datalink.inline_data;

  const x = data.challenge_participants.map(entry => entry.tool_id);
  const y = data.challenge_participants.map(() => 0);

  const colors = Array(x.length).fill('#0b579f'); // Initial colors

  const initialTrace = {
    x,
    y,
    type: 'bar',
    marker: {
      color: colors,
    },
  };

  const layout = {
    title: '',
    xaxis: {
      title: {
        text: '<b>TOOLS</b>',
        standoff: 30
      },
      fixedrange: true,
      tickangle: -45,
      tickfont: { size: 10 },
    },
    yaxis: {
      title: '<b>' + data.visualization.metric + '</b>',
      fixedrange: true,
      range: [0, Math.max(...data.challenge_participants.map(entry => entry.metric_value)) + 1]
    },
  };

  const config = {
    displayModeBar: false
  }

  // Create the bar chart with the initial trace and layout
  Plotly.newPlot('barPlot', [initialTrace], layout, config);

  const myPlot = document.getElementById('barPlot');

  myPlot.on('plotly_hover', function (event) {
    const pn = event.points[0].pointNumber;
    const hoverColors = Array(x.length).fill('#0b579f'); // Reset colors
    hoverColors[pn] = '#f47c21'; // Change color on hover (you can adjust the color)

    const update = { 'marker': { color: hoverColors } };
    Plotly.restyle('barPlot', update);
  });

  myPlot.on('plotly_unhover', function () {
    const unhoverColors = Array(x.length).fill('#0b579f'); // Reset colors

    const update = { 'marker': { color: unhoverColors } };
    Plotly.restyle('barPlot', update);
  });

  // Simulate fetching data (replace this with your actual data fetching logic)
  setTimeout(() => {
    const actualTrace = {
      y: data.challenge_participants.map(entry => entry.metric_value),
    };

    // Animate the transition from 0 to actual values
    Plotly.animate('barPlot', {
      data: [actualTrace],
      traces: [0],
      transition: {
        duration: 1000,
        easing: 'ease-in-out',
      },
    });
  }, 1000);
})


function formatDateString(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "UTC", // Adjust the time zone as needed
  });
}

</script>
