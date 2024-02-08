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
        <b-button variant="outline-secondary" v-if="optimal === 'no'" :disabled="loading" @click="optimalView">
          Optimal View
        </b-button>
        <b-button variant="outline-secondary" v-else :disabled="loading" @click="optimalView">
          Reset View
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
              <div class="annotationfooter">
                <p>* By default, the highest values will be displayed in the first quartile. Inversely if it is specified
                  in the dataset. </p>
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

// DATA RETRIEVE
const props = defineProps(['jsonData'])


const loading = ref(false);
const dataset = ref(null);
const originalData = ref(null);
const datasetId = ref(null);
const datasetDate = ref(null);
const datasetPolarity = ref(null);
const formattedDate = ref(null);
const sortOrder = ref('raw');
const optimal = ref('no');
const quartileData = ref({});
const quartileDataArray = computed(() => {
  // Convert quartileData object into an array of objects
  const array = Object.entries(quartileData.value).map(([tool, quartile]) => ({ tool, quartile }));
  // Sort the array alphabetically
  return array.sort((a, b) => a.tool.localeCompare(b.tool));
});


// ----------------------------------------------------------------
// CREATE PLOT
// ----------------------------------------------------------------
onBeforeMount(async () => {
  const Plotly = require('plotly.js-dist');
  loading.value = true;

  // Dataset values
  dataset.value = await props.jsonData
  const data = dataset.value.datalink.inline_data;

  datasetId.value = dataset.value._id;
  datasetDate.value = dataset.value.dates.modification;
  datasetPolarity.value = dataset.value.datalink.inline_data.visualization.better;
  formattedDate.value = formatDateString(datasetDate.value); // Format the date

  // Save original data for future use
  originalData.value = data;

  // Calculate maximum value for y-axis range
  const maxMetricValue = Math.max(...data.challenge_participants.map(entry => entry.metric_value));

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
      range: [0, maxMetricValue + 0.1],
    },
    margin: { t: 90, l: 100 },
    images: [
      {
        source: "/2018.OpenEBench.logo.Manual_page2.png",
        xref: "paper",
        yref: "paper",
        x: -0.02,
        y: 1.3,
        sizex: 0.2,
        sizey: 0.2,
        xanchor: "left",
        yanchor: "top",
        opacity: 0.5,
      }
    ],
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    hovermode: false
  }

  // Create the bar chart with the initial trace and layout
  Plotly.newPlot('barPlot', [initialTrace], layout, config);


  const myPlot = document.getElementById('barPlot');

  // Change the color of tghe bars on hover.
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

  // Simulate fetching data with animation
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

  // Set up of the cursor inside the plot. Set default.
  // Select all SVG rect elements with class 'cursor-pointer' within the chart container
  const chartContainer = document.getElementById('barPlot');
  // Add a mouseover event listener to the chart container
  chartContainer.addEventListener('mouseover', function (event) {
    // Check if the mouseover event is triggered by a cursor-pointer element
    if (event.target.classList.contains('cursor-pointer')) {
      // Prevent the default behavior of the mouseover event
      event.preventDefault();
      // Set the cursor style to 'default' directly on the target element
      event.target.style.cursor = 'default';
    }
  });
})

// ----------------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------------

// ANIMATIONS
// ----------------------------------------------------------------

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
      y += 0.03; // Adjust the speed as needed
      requestAnimationFrame(animateStep);
    }
  };

  // Start the animation
  animateStep();
}


// BUTTON OPTIMAL VIEW
// ----------------------------------------------------------------
async function optimalView() {
  try {
    if (optimal.value === 'no') {
      const Plotly = require('plotly.js-dist');

      // Fetch current data and calculate metric range
      let data;
      if (sortOrder.value !== 'raw') {
        // If data has been sorted, use the sorted data
        data = sortBy(originalData.value.challenge_participants, entry => entry.metric_value).reverse();
      } else {
        // Otherwise, use the original data
        data = originalData.value.challenge_participants;
      }

      const metricValues = data.map(entry => entry.metric_value);
      const minMetric = Math.min(...metricValues);
      const maxMetric = Math.max(...metricValues);

      // Calculate range between min and max metrics
      const metricRange = maxMetric - minMetric;

      // Calculate new y-axis range with a slight buffer based on metric range
      const minY = Math.max(0, minMetric - metricRange * 0.2);
      const maxY = maxMetric + metricRange * 0.08;

      // Update plot layout with new y-axis range
      Plotly.relayout('barPlot', { 'yaxis.range': [minY, maxY] });

      // Animate the bars
      animateBars(data);

      // Update optimal value to indicate optimal view is active
      optimal.value = 'yes';
    } else {
      const Plotly = require('plotly.js-dist');
      let data;
      if (sortOrder.value !== 'raw') {
        // If data has been sorted, use the sorted data
        data = sortBy(originalData.value.challenge_participants, entry => entry.metric_value).reverse();
      } else {
        // Otherwise, use the original data
        data = originalData.value.challenge_participants;
      }
      // Return to original data view by restoring the original y-axis range
      const originalLayout = {
        'yaxis.range': [0, Math.max(...data.map(entry => entry.metric_value)) + 0.1]
      };

      // Update plot layout with original y-axis range
      Plotly.relayout('barPlot', originalLayout);

      // Animate the bars after adjusting the y-axis range
      animateBars(data);

      // Update optimal value to indicate original view is active
      optimal.value = 'no';
    }
  } catch (error) {
    console.error('Error in optimalView:', error);
  }
}



// BUTTON SORT & CLASSIFY
// ----------------------------------------------------------------
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

      // Add quartile labels
      addQuartileLabels();

    } else {
      // Return to raw data
      updateChart(originalData.value.challenge_participants);
      // Call the animateBars function after updating the chart
      animateBars(originalData.value.challenge_participants);
      quartileData.value = {};

      // Remove lines between quartile groups
      removeLinesBetweenQuartiles();

      // Clear quartile labels
      clearQuartileLabels();
    }

    // Toggle sortOrder
    sortOrder.value = sortOrder.value === 'raw' ? 'sorted' : 'raw';
  } catch (error) {
    console.error('Error in toggleSortOrder:', error);
  }
}


// PLOT LAYOUT
// ----------------------------------------------------------------
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
          color: 'rgba(11, 87, 159, 0.5)',
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


function removeLinesBetweenQuartiles() {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;

  // Remove existing shapes
  layout.shapes = layout.shapes.filter(shape => shape.type !== 'line');

  // Update the plotly layout
  Plotly.update('barPlot', {}, layout);
}



function addQuartileLabels() {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;

  // Ensure layout.annotations is initialized as an array
  layout.annotations = layout.annotations || [];

  const tools = Object.keys(quartileData.value);
  const quartileCounts = {}; // Object to store the count of quartiles for each quartile number
  let uniqueQuartiles = []; // Array to store quartiles with only one tool

  // Count the occurrences of each quartile number
  tools.forEach(tool => {
    const quartile = quartileData.value[tool].quartile;
    quartileCounts[quartile] = (quartileCounts[quartile] || 0) + 1;
  });

  // Identify quartiles with only one tool
  uniqueQuartiles = Object.keys(quartileCounts).filter(quartile => quartileCounts[quartile] === 1);

  // Set to keep track of added label positions
  const addedLabelPositions = new Set();

  // Iterate over the tools to add quartile labels
  tools.forEach(tool => {
    const quartile = quartileData.value[tool].quartile;

    // Calculate the label position based on quartile count
    let labelPosition;
    if (quartileCounts[quartile] === 1) {
      // If quartile occurs only once, place the label above the tool
      labelPosition = tools.indexOf(tool);
    } else {
      // If quartile occurs multiple times, calculate the midpoint between tools with the same quartile
      const positions = tools.reduce((acc, curr, index) => {
        if (quartileData.value[curr].quartile === quartile) {
          acc.push(index);
        }
        return acc;
      }, []);

      const sum = positions.reduce((sum, pos) => sum + pos, 0);
      labelPosition = sum / positions.length;
    }

    // Add label only if it hasn't been added at this position
    if (!addedLabelPositions.has(labelPosition)) {
      // Add a label annotation to the layout
      layout.annotations.push({
        x: labelPosition,
        y: 1.1, // Top of the chart
        xref: 'x',
        yref: 'paper',
        text: `Q${quartile}`,
        showarrow: false,
        font: {
          size: 16,
          color: 'rgba(11, 87, 159, 0.5)'
        }
      });

      // Add the label position to the set of added positions
      addedLabelPositions.add(labelPosition);
    }
  });

  // Update the layout with the new annotations
  Plotly.relayout('barPlot', { annotations: layout.annotations });
}



function clearQuartileLabels() {
  const Plotly = require('plotly.js-dist');
  const layout = document.getElementById('barPlot').layout;

  // Ensure layout.annotations is initialized as an array
  layout.annotations = [];

  // Update the layout with the cleared annotations
  Plotly.relayout('barPlot', { annotations: layout.annotations });
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

// CALCULATE QUARTILES
// ----------------------------------------------------------------
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

  // Assign positions to metrics based on quartiles with the polarity of the dataset


  data.forEach(entry => {
    const metricValue = entry.metric_value;

    if (datasetPolarity.value === "minimum") {
      if (metricValue <= q1) {
        metricPositions[entry.tool_id] = { quartile: 1, bgColor: 'rgb(237, 248, 233)' };
      } else if (metricValue > q1 && metricValue <= q2) {
        metricPositions[entry.tool_id] = { quartile: 2, bgColor: 'rgb(186, 228, 179)' };
      } else if (metricValue > q2 && metricValue < q3) {
        metricPositions[entry.tool_id] = { quartile: 3, bgColor: 'rgb(116, 196, 118)' };
      } else if (metricValue >= q3) {
        metricPositions[entry.tool_id] = { quartile: 4, bgColor: 'rgb(35, 139, 69)' };
      }
    } else {
      if (metricValue <= q1) {
        metricPositions[entry.tool_id] = { quartile: 4, bgColor: 'rgb(35, 139, 69)' };
      } else if (metricValue > q1 && metricValue <= q2) {
        metricPositions[entry.tool_id] = { quartile: 3, bgColor: 'rgb(116, 196, 118)' };
      } else if (metricValue > q2 && metricValue < q3) {
        metricPositions[entry.tool_id] = { quartile: 2, bgColor: 'rgb(186, 228, 179)' };
      } else if (metricValue >= q3) {
        metricPositions[entry.tool_id] = { quartile: 1, bgColor: 'rgb(237, 248, 233)' };
      }
    }


  });

  return metricPositions;
}


// DOWNLOAD BUTTON
// ----------------------------------------------------------------
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
        const quartile = document.getElementById('quartileTable');
        const doc = new jsPDF();
        const pdfWidth = doc.internal.pageSize.getWidth(); // Get PDF page width
        const pdfHeight = doc.internal.pageSize.getHeight(); // Get PDF page height

        // Calculate the width and height of the image
        const imgWidth = 190; // Default width
        let imgHeight = 100; // Default height
        if (content.width && content.height) {
          // If content has width and height properties, use them to calculate aspect ratio
          const aspectRatio = content.width / content.height;
          imgHeight = imgWidth / aspectRatio;
        }

        // Adjust image height based on whether quartile table is present
        if (quartile) {
          imgHeight = 190; // Adjusted height if quartile table is present
        }

        // Calculate margins or padding for the PDF content
        const marginX = 30; // Margin or padding on the left and right sides
        const marginY = 30; // Margin or padding on the top and bottom sides

        // Add the image to the PDF with margins or padding
        doc.addImage(content, 'PNG', marginX, marginY, pdfWidth - 2 * marginX, imgHeight);

        // Return the generated PDF data URI
        return doc.save(`benchmarking_chart_${datasetId.value}.${format}`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        return null;
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



// FORMAT DATE
// ----------------------------------------------------------------
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

.annotationfooter {
  background-color: #f0f0f0;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  color: #666;
  font-size: 12px;
  text-align: center;
}

rect {
  cursor: default !important;
}
</style>
