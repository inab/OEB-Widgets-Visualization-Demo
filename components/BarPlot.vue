<template>
  <div>
    <b-row>
      <b-col cols="8">
        <div class="butns">
          <!-- Buttons -->
          <b-button-group class="ml-auto">
            <!-- Button Sort -->
            <b-button variant="outline-secondary" v-if="sortOrder === 'raw'" @click="toggleSortOrder"
              :disabled="loading" class="fontSizeBtn button-classify">
              Sort & Classify Data
            </b-button>
            <b-button squared variant="outline-secondary" v-else @click="toggleSortOrder" :disabled="loading" 
            class="fontSizeBtn button-classify">
              Return To Raw Results
            </b-button>
            <!-- Button Optimal -->
            <b-button squared variant="outline-secondary" v-if="optimal === 'no'" :disabled="loading"
              @click="optimalView" class="fontSizeBtn button-resetView">
              Optimal View
            </b-button>
            <b-button squared variant="outline-secondary" v-else :disabled="loading" @click="optimalView" class="fontSizeBtn button-resetView">
              Reset View
            </b-button>
            <!-- Button Download -->
            <b-dropdown variant="outline-secondary" right :disabled="loading" class="button-download">
              <template #button-content >
                <span class="fontSizeBtn">Download</span>
              </template>
              <b-dropdown-header id="dropdown-header-label">Select a format</b-dropdown-header>
              <b-dropdown-item @click="downloadChart('png')">PNG</b-dropdown-item>
              <b-dropdown-item @click="downloadChart('svg')">SVG (only plot)</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item @click="downloadChart('pdf')">PDF</b-dropdown-item>
            </b-dropdown>
          </b-button-group>
        </div>
      </b-col>
    </b-row>

    <b-row class="mt-4">
      <!-- Chart -->

      <b-col cols="8" id="chartCapture">

        <div id="barPlot"></div>
        <br>
        <!-- ID AND DATE TABLE -->
        <div v-if="datasetId && formattedDate" class="tableid">
          <table class=" table table-bordered rounded-3" id='idDateTable'>
            <tbody>
              <tr>
                <th>Dataset ID</th>
                <td>{{ datasetId }}</td>
                <th>Last Update</th>
                <td>{{ formattedDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </b-col>

      <!-- Quartile Table -->
      <b-col id="quartileCapture" cols="4" v-if="sortOrder === 'sorted'">
        <div class="table-container">
          <table :class="{ 'fade-in': sortOrder === 'sorted', 'fade-out': sortOrder === 'raw' }"class="table table-bordered  quartile-table-container" id='quartileTable'>
            <thead>
              <tr>
                <th style="width: 60%;" class="table-secondary">Tool</th>
                <th style="width: 40%;" class="table-secondary">Quartile <font-awesome-icon id="extrainfoquartile"
                    :icon="['fas', 'circle-info']"
                    style="color: #ffffff;  float: right; margin-left: 5px;margin-top: 3px;" /></th>
                <b-popover target="extrainfoquartile" triggers="hover" placement="bottom">
                  <template #title><b>How to</b></template>

                  By default, the highest values will be displayed in the first quartile.
                  Inversely if it is specified.
                </b-popover>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(quartile, index) in quartileDataArray" :key="index">
                <td>{{ quartile.tool }}</td>
                <td :style="{ backgroundColor: quartile.quartile.bgColor }">{{ quartile.quartile.quartile }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </b-col>

    </b-row>

  </div>
</template>

<script setup>
// IMPORTS 
import { onBeforeMount, ref, watch } from 'vue';
import { computed } from 'vue';
import 'jspdf-autotable';

// REQUIREMENTS
const html2canvas = require('html2canvas');
const { jsPDF } = require('jspdf');


// DATA RETRIEVE
const props = defineProps({
  preparedData: {
  type: Object,
  required: true
},
});

// const data = ref(null);
const dates = ref(null);

const layout = ref(null)
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

const showAdditionalTable = ref(false);


// ----------------------------------------------------------------
// CREATE PLOT
// ----------------------------------------------------------------
onBeforeMount(async () => {
  const Plotly = require('plotly.js-dist');
  loading.value = true;

  // Dataset values
  // dataset.value = await props.jsonData
  // const data = dataset.value.datalink.inline_data;
  const data = props.preparedData.inline_data
  datasetId.value = await props.preparedData._id
  dates.value = await props.preparedData.dates

  const visualization = data.visualization
  datasetDate.value = dates.value.modification;
  datasetPolarity.value = data.visualization.better;
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


  layout.value = {
    title: '',
    autosize: true,
    height: 800,
    xaxis: {
      title: {
        text: 'Participants',
        standoff: 30,
        font: {
          family: 'Arial, sans-serif',
          size: 18,
          color: 'black',
          weight: 'bold',
        },
      },
      fixedrange: true,
      tickangle: -45,
      tickfont: { size: 12 },
    },
    yaxis: {
      title: {
        text: visualization.metric,
        font: {
          family: 'Arial, sans-serif',
          size: 18,
          color: 'black',
          weight: 'bold',
        },
      },
      fixedrange: true,
      range: [0, maxMetricValue + 0.1],
    },
    margin: { l: 50, r: 50, t: 100, b: 110, pad: 4 },
    images: [
      {
        source: "/2018.OpenEBench.logo.Manual_page2.png",
        xref: "paper",
        yref: "paper",
        x: 0.95,
        y: 1.17,
        sizex: 0.1,
        sizey: 0.3,
        xanchor: "right",
        yanchor: "top",
        opacity: 0,
      }
    ],
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    hovermode: false
  }

  // Create the bar chart with the initial trace and layout
  Plotly.newPlot('barPlot', [initialTrace], layout.value, config);


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
  const yTarget = 1; // End at the top

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
        data = originalData.value.challenge_participants.slice().sort((a, b) => b.metric_value - a.metric_value);
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
        data = originalData.value.challenge_participants.slice().sort((a, b) => b.metric_value - a.metric_value);
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
      showAdditionalTable.value = !showAdditionalTable.value;
      // Sort logic (descending order)
      const sortedData = originalData.value.challenge_participants.slice().sort((a, b) => b.metric_value - a.metric_value);

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
        y: 1.03, // Top of the chart
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
  console.log('Downloading chart as', format);
  try {
    if (format === 'pdf') {
      const Plotly = require('plotly.js-dist');
      const pdf = new jsPDF();
      layout.value.images[0].opacity = 0.5;
      Plotly.relayout('barPlot', layout.value);

      // Get chart image as base64 data URI
      const chartImageURI = await Plotly.toImage(document.getElementById('barPlot'), { format: 'png', width: 750, height: 600 });

      pdf.addImage(chartImageURI, 'PNG', 10, 10);

      // Add table as text to the PDF
      pdf.autoTable({
        html: '#idDateTable',
        startY: 170,
        theme: 'grid',
        tableWidth: 'auto',
        styles: {
          cellPadding: 1,
          fontSize: 8,
          overflow: 'linebreak',
          halign: 'center'
        },
        margin: { top: 10 },
        willDrawCell: function (data) {
          if (data.row.section === 'body') {
            if (data.column.dataKey === 0 || data.column.dataKey === 2) {
              pdf.setFillColor(108, 117, 125)
              pdf.setTextColor(250, 250, 250)
              pdf.setFont("helvetica", "bold");
            }

          }
        },
      });


      // Add additional table if it is visible
      if (showAdditionalTable.value) {
        const columns = ["Tool", "Quartile"]; // Define your columns

        // Extract data from quartileDataArray
        const rows = quartileDataArray.value.map(q => [q.tool, q.quartile.quartile]);

        // Generate autoTable with custom styles
        pdf.autoTable({
          head: [columns],
          body: rows,
          startY: pdf.autoTable.previous.finalY + 10,
          theme: 'grid',
          tableWidth: 'auto',
          styles: {
            cellPadding: 1,
            fontSize: 8,
            overflow: 'linebreak',
            halign: 'center'
          },
          headStyles: {
            fillColor: [108, 117, 125]
          },
          willDrawCell: function (data) {

            if (data.row.section === 'body') {
              // Check if the column header matches 'Quartile'
              if (data.column.dataKey === 1) {
                // Access the raw value of the cell
                const quartileValue = data.cell.raw;
                if (quartileValue === 1) {
                  pdf.setFillColor(237, 248, 233)
                } else if (quartileValue === 2) {
                  pdf.setFillColor(186, 228, 179)
                } else if (quartileValue === 3) {
                  pdf.setFillColor(116, 196, 118)
                } else if (quartileValue === 4) {
                  pdf.setFillColor(35, 139, 69)
                }
              }

            }
          },
        });
      }

      if (showAdditionalTable.value) {
        // Save the PDF
        pdf.save(`benchmarking_chart__quartiles_${datasetId.value}.${format}`);
        layout.value.images[0].opacity = 0;
        Plotly.relayout('barPlot', layout.value);
      } else {
        // Save the PDF
        pdf.save(`benchmarking_chart_${datasetId.value}.${format}`);
        layout.value.images[0].opacity = 0;
        Plotly.relayout('barPlot', layout.value);
      }


    } else if (format === 'svg') {

      const Plotly = require('plotly.js-dist');
      layout.value.images[0].opacity = 0.5;
      Plotly.relayout('barPlot', layout.value);
      const graphDiv = document.getElementById('barPlot')
      Plotly.downloadImage(graphDiv, { format: 'svg', width: 800, height: 600, filename: `benchmarking_chart_${datasetId.value}` });
      layout.value.images[0].opacity = 0;
      Plotly.relayout('barPlot', layout.value);

    } else {
      const Plotly = require('plotly.js-dist');
      layout.value.images[0].opacity = 0.5;
      Plotly.relayout('barPlot', layout.value);

      const toDownloadChart = document.getElementById('chartCapture');
      const downloadChart = await html2canvas(toDownloadChart, {
        scrollX: 0,
        scrollY: 0,
        width: toDownloadChart.offsetWidth,
        height: toDownloadChart.offsetHeight,
      });



      if (showAdditionalTable.value) {

        const element = document.getElementById('quartileCapture');
        // Trigger download after 2 seconds (adjust the delay as needed)
        setTimeout(async function () {
          const downloadTable = await html2canvas(element, {
            scrollX: 0,
            scrollY: 0,
            width: element.offsetWidth,
            height: element.offsetHeight,
          });
         
          const chartDownloadImage = downloadChart.toDataURL(`image/${format}`);
          const tableDownloadImage = downloadTable.toDataURL(`image/${format}`);
          const chartLink = document.createElement('a');
          const tableLink = document.createElement('a');
          chartLink.href = chartDownloadImage;
          tableLink.href = tableDownloadImage;
          chartLink.download = `benchmarking_chart__quartiles_chart_${datasetId.value}.${format}`;
          tableLink.download = `benchmarking_chart__quartiles_table_${datasetId.value}.${format}`;
          // Append links to the document
          document.body.appendChild(chartLink);
          document.body.appendChild(tableLink);

          // Trigger the download
          chartLink.click();
          tableLink.click();

          // Remove links from the document
          document.body.removeChild(chartLink);
          document.body.removeChild(tableLink);
        }, 2000); // 2000 milliseconds = 2 seconds

      } else {
        const chartDownloadImage = downloadChart.toDataURL(`image/${format}`);
        const chartLink = document.createElement('a');
        chartLink.href = chartDownloadImage;
        chartLink.download = `benchmarking_chart_${datasetId.value}.${format}`;
        document.body.appendChild(chartLink); // Append link to the document
        chartLink.click();
        document.body.removeChild(chartLink); // Remove link after download

      }


      layout.value.images[0].opacity = 0;
      Plotly.relayout('barPlot', layout.value);

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
.butns {
  position: absolute;
  top: 14px;
  margin-top: 10px;
  z-index: 1
}

.fontSizeBtn{
  font-size: 18px;
}

.button-classify {
  width: 210px;
}

.button-resetView {
  width: 140px;
}

.button-download {
  width: 168px;
}
.plot-container {
  position: relative;
  margin-bottom: 20px;
}


.table-secondary {
  background-color: #6c757d;
  color: white;
}

.tableid {
  font-family: arial, sans-serif;
  width: 100%;
  margin: 15px;
  text-align: center;
}


.tableid th {
  background-color: #6c757d;
  color: white;

}

.tableid td {
  background-color: white;
  color: black;
}

rect {
  cursor: default !important;
}

.table-container {
  max-height: 710px;
  overflow-y: auto;
  margin-top: 100px;
}

.quartile-table-container {
  width: 100%;
}



.quartile-table-container th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.quartile-table-container td {
  padding-top: 8px;
  padding-bottom: 8px;
}


@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
    visibility: visible;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* Apply animation when table enters and leaves */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.fade-out {
  animation: fadeOut 0.5s ease-in-out;
}
</style>