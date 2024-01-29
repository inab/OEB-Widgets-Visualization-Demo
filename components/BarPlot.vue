<template>
  <div>

    <div class="butns">
      <!-- Buttons -->
      <b-button-group class="ml-auto">
        <!-- Button Sort -->
        <b-button variant="outline-secondary" v-if="sortOrder === 'raw'" @click="toggleSortOrder" :disabled="loading">
          Sort & Classify Data
        </b-button>
        <b-button variant="outline-secondary" v-else @click="toggleSortOrder" :disabled="loading">
          Return To Raw Results
        </b-button>
        <!-- Button Optimal -->
        <b-button variant="outline-secondary" :disabled="loading">
          Optimal View
        </b-button>
        <!-- Button Download -->
        <b-dropdown variant="outline-secondary" right text="Download" :disabled="loading">
          <b-dropdown-header id="dropdown-header-label">Select a format</b-dropdown-header>
          <b-dropdown-item @click="downloadChart('png')">PNG</b-dropdown-item>
          <b-dropdown-item @click="downloadChart('svg')">SVG (only plot)</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="downloadChart('pdf')">PDF</b-dropdown-item>
        </b-dropdown>
      </b-button-group>

    </div>
    <br>
    <div id="todownload">
      <!-- Chart -->
      <div id="barPlot" style="position: relative;">
      </div>
      <br>
      <!-- ID AND DATE TABLE -->
      <div v-if="datasetId && formattedDate">
        <b-table-simple bordered small caption-top responsive id='idDateTable'>
          <b-tbody>
            <b-tr>
              <b-th variant="secondary" class="text-center">Dataset ID</b-th>
              <b-td class="text-center">{{ datasetId }}</b-td>
              <b-th variant="secondary" class="text-center">Last Update</b-th>
              <b-td class="text-center">{{ formattedDate }}</b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>
      </div>


      <br>
      <!-- Quartile Table -->
      <transition name="slide" mode="out-in">
        <b-container v-if="sortOrder === 'sorted'">
          <b-row>
            <b-col>
              <b-card title="Quartile Data" class="mt-3">
                <div class="table-responsive">
                  <table class="table table-bordered" id='quartileTable'>
                    <thead>
                      <tr>
                        <th scope="col" class="table-secondary">Tool</th>
                        <th scope="col" class="table-secondary">Quartile</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(quartile, index) in quartileDataArray" :key="index">
                        <td>{{ quartile.tool }}</td>
                        <td :style="{ backgroundColor: quartile.quartile.bgColor }">{{ quartile.quartile.quartile }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </b-card>
              <!-- Annotation -->
              <div class="annotation">
                <p>* To calculate the quartiles, the values are first ordered from lowest to highest. Thus, the first
                  quartile is the grouping of the minimum values, and the last quartile, the fourth, is the grouping of
                  the
                  maximum values.</p>
              </div>
            </b-col>
          </b-row>
        </b-container>
      </transition>
    </div>



  </div>
</template>

<script setup>
import { onBeforeMount, ref } from 'vue';
import { computed } from 'vue';
import { sortBy } from 'lodash';
const { jsPDF } = require('jspdf');
const html2canvas = require('html2canvas');


const loading = ref(false); // Loading state
const dataset = ref(null);
const originalData = ref(null);
const datasetId = ref(null);
const datasetDate = ref(null);
const formattedDate = ref(null);
const sortOrder = ref('raw');
const quartileData = ref({});
const quartileDataArray = computed(() => {
  // Convert quartileData object into an array of objects
  const array = Object.entries(quartileData.value).map(([tool, quartile]) => ({ tool, quartile }));
  // Sort the array alphabetically by the 'tool' property
  return array.sort((a, b) => a.tool.localeCompare(b.tool));
});


onBeforeMount(async () => {
  const Plotly = require('plotly.js-dist');
  loading.value = true;
  const response = await fetch('/OEBD00700000NI.json');
  dataset.value = await response.json();
  datasetId.value = dataset.value._id;
  datasetDate.value = dataset.value.dates.modification;
  formattedDate.value = formatDateString(datasetDate.value); // Format
  const data = dataset.value.datalink.inline_data;
  // Save original data for future use
  originalData.value = data;


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
        standoff: 30,
      },
      fixedrange: true,
      tickangle: -45,
      tickfont: { size: 10 },
    },
    yaxis: {
      title: '<b>' + data.visualization.metric + '</b>',
      fixedrange: true,
      range: [0, Math.max(...data.challenge_participants.map(entry => entry.metric_value)) + 1],
    },
    margin: { t: 90, l: 100 },
    images: [
      {
        source: "/2018.OpenEBench.logo.Manual_page2.png", // URL of the image
        xref: "paper", // Reference point for the x-coordinate
        yref: "paper", // Reference point for the y-coordinate
        x: -0.02, // X-coordinate (normalized)
        y: 1.3, // Y-coordinate (normalized)
        sizex: 0.2, // Size of the image in the x-direction (normalized)
        sizey: 0.2, // Size of the image in the y-direction (normalized)
        xanchor: "left", // Anchor point for the x-coordinate
        yanchor: "top", // Anchor point for the y-coordinate
        opacity: 0.5, // Opacity of the image
      }
    ]
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
    loading.value = false;
  }, 500);


})
function animateBars(data) {
  const Plotly = require('plotly.js-dist');
  const x = data.map(entry => entry.tool_id);
  const y = data.map(() => 0); // Start with all bars at 0

  const update = {
    x: [x],
    y: [y],
  };

  Plotly.update('barPlot', update);

  const actualTrace = {
    y: data.map(entry => entry.metric_value),
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
}
async function toggleSortOrder() {
  try {
    if (sortOrder.value === 'raw') {
      // Sort logic (descending order)
      const sortedData = sortBy(originalData.value.challenge_participants, entry => entry.metric_value).reverse();
      updateChart(sortedData);
      // Call the animateBars function after updating the chart
      animateBars(sortedData);
      // Calculate quartiles and update the table data
      quartileData.value = calculateQuartiles(sortedData);

      // Add lines between quartile groups
      addLinesBetweenQuartiles();

    } else {
      // Return to raw data
      updateChart(originalData.value.challenge_participants);
      // Call the animateBars function after updating the chart
      animateBars(originalData.value.challenge_participants);
      quartileData.value = {};

      // Remove lines between quartile groups
      removeLinesBetweenQuartiles();
    }

    // Toggle sortOrder
    sortOrder.value = sortOrder.value === 'raw' ? 'sorted' : 'raw';
  } catch (error) {
    console.error('Error in toggleSortOrder:', error);
  }
}

function addLinesBetweenQuartiles() {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;

  // Ensure layout.shapes is initialized as an array
  layout.shapes = layout.shapes || [];

  const tools = Object.keys(quartileData.value);

  // Iterate over the tools to find transitions between quartiles
  for (let i = 1; i < tools.length; i++) {
    const currentTool = quartileData.value[tools[i]];
    const previousTool = quartileData.value[tools[i - 1]];

    // If the quartile of the current tool is different from the previous tool, draw a line between them
    if (currentTool.quartile !== previousTool.quartile) {
      // Calculate the x-position for the line between the current and previous tools
      const linePosition = (i + i - 1) / 2;

      // Add a line shape to the layout with initial y-positions at the bottom
      layout.shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: linePosition,
        x1: linePosition,
        y0: 0,  // Start from the bottom
        y1: 0,  // Start from the bottom
        line: {
          color: 'rgb(0, 0, 0)',
          width: 1,
          dash: 'dashdot'
        }
      });

      // Animate the line upwards to its final position
      animateLine(layout.shapes.length - 1);
    }
  }

  // Update the layout with the new shapes
  Plotly.relayout('barPlot', { shapes: layout.shapes });
}

function animateLine(shapeIndex) {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;
  const shape = layout.shapes[shapeIndex];
  const yTarget = 1.1; // End at the top

  let y = 0; // Start from the bottom

  const animateStep = () => {
    if (y <= yTarget) {
      // Update the y-coordinate of the line shape
      shape.y1 = y;

      // Update the layout with the modified shape
      Plotly.relayout('barPlot', { shapes: layout.shapes });

      // Increment y and trigger the next animation step
      y += 0.025; // Adjust the speed as needed
      requestAnimationFrame(animateStep);
    }
  };

  // Start the animation
  animateStep();
}

function removeLinesBetweenQuartiles() {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;

  // Remove existing shapes
  layout.shapes = layout.shapes.filter(shape => shape.type !== 'line');

  // Update the plotly layout
  Plotly.update('barPlot', {}, layout);
}

function updateChart(data) {
  const Plotly = require('plotly.js-dist');
  const x = data.map(entry => entry.tool_id);
  const y = data.map(entry => entry.metric_value);

  const update = {
    x: [x],
    y: [y],
  };

  Plotly.update('barPlot', update);
}


// Function to calculate medians in odd or even arrays.
function calculateMedians(inputArray) {
  const sortedArray = [...inputArray].sort((a, b) => a - b);

  // Median number
  const middleIndex = Math.floor(sortedArray.length / 2);

  if (inputArray.length % 2 === 0) {
    // Even length
    const middleValues = [sortedArray[middleIndex - 1], sortedArray[middleIndex]];
    return (middleValues[0] + middleValues[1]) / 2;
  } else {
    // Odd length
    return sortedArray[middleIndex];
  }
}

function calculateQuartiles(data) {
  const sortedValues = data.map(entry => entry.metric_value).sort((a, b) => a - b);
  const middleIndex = Math.floor(data.length / 2);

  let q1, q2, q3;
  // Calculate Q2
  if (sortedValues.length % 2 === 0) {
    // Even length
    q2 = (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
  } else {
    // Odd length
    q2 = sortedValues[middleIndex];
  }

  const lowerArray = sortedValues.filter(value => value < q2);
  const upperArray = sortedValues.filter(value => value > q2);

  // Calculate median for lowerArray and upperArray
  q1 = calculateMedians(lowerArray);
  q3 = calculateMedians(upperArray);

  // Create an object to store metric positions
  const metricPositions = {};

  // Assign positions to metrics based on quartiles
  data.forEach(entry => {
    const metricValue = entry.metric_value;

    if (metricValue <= q1) {
      metricPositions[entry.tool_id] = { quartile: 1, bgColor: 'rgb(237, 248, 233)' };
    } else if (metricValue > q1 && metricValue <= q2) {
      metricPositions[entry.tool_id] = { quartile: 2, bgColor: 'rgb(186, 228, 179)' };
    } else if (metricValue > q2 && metricValue < q3) {
      metricPositions[entry.tool_id] = { quartile: 3, bgColor: 'rgb(116, 196, 118)' };
    } else if (metricValue >= q3) {
      metricPositions[entry.tool_id] = { quartile: 4, bgColor: 'rgb(35, 139, 69)' };
    }
  });
  console.log(metricPositions)

  return metricPositions;
}



async function downloadChart(format) {
  try {
    const htmlToCanvas = async (element, options) => {
      return await html2canvas(element, options);
    };

    const canvasToImage = (canvas, format) => {
      if (format === 'png') {
        return canvas.toDataURL('image/png');
      } else if (format === 'pdf') {
        return canvas.toDataURL('image/pdf');
      }
    };

    const downloadPDF = (content) => {
      try {
        const doc = new jsPDF();
        doc.addImage(content, 'PNG', 10, 10);
        doc.save(`benchmarking_chart_${datasetId.value}.${format}`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    };

    const toDownloadDiv = document.getElementById('todownload');
    const divBounds = toDownloadDiv.getBoundingClientRect();

    const downloadCanvas = await htmlToCanvas(toDownloadDiv, {
      scrollX: 0,
      scrollY: 0,
      width: divBounds.width,
      height: divBounds.height,
    });
    const downloadImage = canvasToImage(downloadCanvas, format);

    if (format === 'pdf') {
      await downloadPDF(downloadCanvas);
    } else if (format === 'svg') {
      const Plotly = require('plotly.js-dist');
      const chart = document.getElementById('barPlot');
      const options = { format };

      Plotly.toImage(chart, options)
        .then((url) => {
          const link = document.createElement('a');
          link.href = url;
          link.download = `benchmarking_chart_${datasetId.value}.${format}`;
          link.click();
        })
        .catch((error) => {
          console.error(`Error al descargar el gráfico como ${format}`, error);
        });
    } else {
      const link = document.createElement('a');
      link.href = downloadImage;
      link.download = `benchmarking_chart_${datasetId.value}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading chart:', error);
  }
}




function formatDateString(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

</script>
<style scoped>
b-th,
b-td {
  border-radius: 10px;
}

.butns {

  position: absolute;
  top: 20px;
  right: 10px;
  margin-top: 10px;
  z-index: 9999
}

.plot-container {
  position: relative;
  margin-bottom: 20px;
  /* Adjust as needed */
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease;
}

.slide-enter,
.slide-leave-to {
  transform: translateY(100%);
}

.table {
  width: 100%;
}

.table-secondary {
  background-color: #6c757d;
  color: white;
}

.annotation {
  background-color: #f0f0f0;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  color: #666;
  font-size: 12px;
  text-align: center;
}
</style>
