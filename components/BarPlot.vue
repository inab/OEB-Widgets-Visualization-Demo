<template>
  <div>

    <div class="butns">
      <!-- Buttons -->

      <b-button-group class="ml-auto">
        <!-- Button Sort -->
        <b-button variant="outline-secondary" v-if="sortOrder === 'raw'" @click="toggleSortOrder">
          Sort & Classify Data
        </b-button>
        <b-button variant="outline-secondary" v-else @click="toggleSortOrder">
          Return To Raw Results
        </b-button>
        <!-- Button Optimal -->
        <b-button variant="outline-secondary">Optimal View</b-button>
        <!-- Button Downland -->
        <b-dropdown variant="outline-secondary" right text="Download">
          <b-dropdown-header id="dropdown-header-label">
            Select a format
          </b-dropdown-header>
          <b-dropdown-item @click="downloadChart('png')">PNG</b-dropdown-item>
          <b-dropdown-item @click="downloadChart('svg')">SVG</b-dropdown-item>
          <b-dropdown-divider></b-dropdown-divider>
          <b-dropdown-item @click="downloadChart('pdf')">PDF</b-dropdown-item>
        </b-dropdown>
      </b-button-group>

    </div>

    <!-- Chart -->
    <div id="barPlot"></div>
    <br>
    <!-- ID AND DATE TABLE -->
    <b-table-simple bordered small caption-top responsive>
      <b-tbody>
        <b-tr>
          <b-th variant="secondary" class="text-center">Dataset ID</b-th>
          <b-td class="text-center">{{ datasetId }}</b-td>
          <b-th variant="secondary" class="text-center">Last Update</b-th>
          <b-td class="text-center">{{ formattedDate }}</b-td>
        </b-tr>
      </b-tbody>
    </b-table-simple>
    <br>
    <!-- Quartile Table -->
    <b-container v-if="sortOrder === 'sorted'">
      <b-row>
        <b-col>
          <b-card title="Quartile Data" class="mt-3">
            <b-table :items="quartileDataArray" bordered small caption-top responsive>
              <b-thead>
                <b-tr>
                  <b-th>Tool</b-th>
                  <b-th>Quartile</b-th>
                </b-tr>
              </b-thead>
              <b-tbody>
                <b-tr v-for="(quartile, tool) in quartileDataArray" :key="tool">
                  <b-td>{{ tool }}</b-td>
                  <b-td>{{ quartile }}</b-td>
                </b-tr>
              </b-tbody>
            </b-table>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { computed } from 'vue';
import { sortBy } from 'lodash';
const { jsPDF } = require('jspdf');
const html2canvas = require('html2canvas');



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


onMounted(async () => {
  const Plotly = require('plotly.js-dist');
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
    margin: {
      t: 50,
    }

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
function toggleSortOrder() {
  try {
    if (sortOrder.value === 'raw') {
      // Sort logic (descending order)
      const sortedData = sortBy(originalData.value.challenge_participants, entry => entry.metric_value).reverse();
      updateChart(sortedData);
      // Calculate quartiles and update the table data
      quartileData.value = calculateQuartiles(sortedData);

    } else {

      // Return to raw data
      updateChart(originalData.value.challenge_participants);
      quartileData.value = {}

    }

    // Toggle sortOrder
    sortOrder.value = sortOrder.value === 'raw' ? 'sorted' : 'raw';
  } catch (error) {
    console.error('Error in toggleSortOrder:', error);
  }
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
const quartileGroupColors = ['#00ff00', '#0000ff', '#800080', '#ffa500'];
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
      metricPositions[entry.tool_id] = 1;
    } else if (metricValue > q1 && metricValue <= q2) {
      metricPositions[entry.tool_id] = 2;
    } else if (metricValue > q2 && metricValue < q3) {
      metricPositions[entry.tool_id] = 3;
    } else if (metricValue >= q3) {
      metricPositions[entry.tool_id] = 4;
    }
  });
  console.info(metricPositions)

  return metricPositions;
}




function downloadChart(format) {
  const Plotly = require('plotly.js-dist');
  const myPlot = document.getElementById('barPlot');

  if (format === 'png' || format === 'svg') {
    // Download as PNG or SVG using Plotly's toImage
    const options = { format, height: 500, width: 700 };

    Plotly.toImage(myPlot, options)
      .then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `benchmarking_chart_${datasetId.value}.${format}`;
        link.click();
      })
      .catch((error) => {
        console.error(`Error downloading as ${format}`, error);
      });
  } else if (format === 'pdf') {
    // Download as PDF using jspdf and html2canvas
    const pdfOptions = {
      filename: `benchmarking_chart_${datasetId.value}.pdf`,
      image: { type: 'png', quality: 1.0 }, // Increase image quality
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }, // Landscape orientation
    };

    // Use html2canvas to convert the Plotly chart to an image
    html2canvas(myPlot, { scale: 2 }) // Increase scale for higher resolution
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

        // Create a PDF document
        const pdf = new jsPDF(pdfOptions.jsPDF);

        // Calculate image dimensions based on PDF page size
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // Adjust the margins
        const imgHeight = (imgWidth / canvas.width) * canvas.height;

        // Add the image to the PDF document
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

        // Save the PDF
        pdf.save(pdfOptions.filename);
      })
      .catch((error) => {
        console.error('Error exporting chart to PDF', error);
      });
  } else {
    console.error(`Unsupported format: ${format}`);
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
  display: flex;
  justify-content: flex-end;
}
</style>
