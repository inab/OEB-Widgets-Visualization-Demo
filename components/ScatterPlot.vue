<template>
  <div>
    <b-row>
      <b-col cols="8">
        <!-- Buttons -->
        <div v-if="data" class="butns">
          <b-button-group class="ml-auto">
            <!-- Classification -->
            <b-dropdown variant="outline-secondary" class="button-classification">
              <template #button-content >
                <span class="fontSizeBtn">{{classificationButtonText}}</span>
              </template>
              <b-dropdown-text class="font-weight-bold text-classifi"><strong>Select a Classification
                      method:</strong></b-dropdown-text>
              <b-dropdown-item @click="noClassification"> No Classification </b-dropdown-item>
              <b-dropdown-item @click="toggleQuartilesVisibility"> Square Quartiles </b-dropdown-item>
              <b-dropdown-item @click="toggleDiagonalQuartile"> Diagonal Quartiles </b-dropdown-item>
              <b-dropdown-item @click="toggleKmeansVisibility"> K-Means Clustering </b-dropdown-item> 
            </b-dropdown>

            <!-- Reset View / optimal view -->
            <b-button @click="toggleView" variant="outline-secondary" right class="button-resetView fontSizeBtn">
              {{ viewButtonText }}
            </b-button>

            <!-- Button Dowloand -->
            <b-dropdown variant="outline-secondary" class="button-download">
              <template #button-content >
                <span class="fontSizeBtn">Download</span>
              </template>
              <b-dropdown-text class="font-weight-bold text-download"><strong>Select a
                      format:</strong></b-dropdown-text>
              <b-dropdown-item @click="downloadChart('png', datasetId)"> PNG </b-dropdown-item>
              <b-dropdown-item @click="downloadChart('pdf', datasetId)"> PDF </b-dropdown-item>
              <b-dropdown-item @click="downloadChart('svg', datasetId)"> SVG (only plot) </b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item @click="downloadChart('json', datasetId)"> JSON (raw data)</b-dropdown-item>
            </b-dropdown>

          </b-button-group>
        </div>
      </b-col>
    </b-row>


    <b-row class="mt-4" id="todownload">
      <!-- Chart -->
      <b-col cols="8">
        <div>
          <!-- Scatter Plot -->
          <div id="scatter-plot"></div>

          <!-- Error message -->
          <div class="error-alert mb-3">
            <b-alert class="b-alert" :show="dismissCountDown > 0" dismissible variant="danger"
              @dismissed="dismissCountDown = 0" @dismiss-count-down="countDownChanged">
              At least four participants are required for the benchmark!!
            </b-alert>
          </div>
        </div>
      </b-col>

      <!-- Table -->
      <b-col cols="4">
        <div id="benchmarkingTable">
          <!-- Quartile Table -->
          <div class="table-container">
            <table class="table table-fixed table-bordered cuartiles-table" v-if="quartileData.length > 0">
              <thead>
                <tr>
                  <th class="toolHeader">Participants</th>
                  <th>{{ viewKmeans ? 'Clusters' : 'Quartile' }} <font-awesome-icon id="extrainfoquartile"
                    :icon="['fas', 'circle-info']" class="info-icon" v-if="viewSquare" />
                  </th>
                  <b-popover target="extrainfoquartile" triggers="hover" placement="bottom" v-if="viewSquare">
                    <template #title><b>The Square quartile label</b></template>
                    Quartiles 2 and 3 are 'Mid (M)', representing average rankings, while 'Top (T)' 
                    denotes quartiles above average and 'Bottom (B)' those below, offering clarity in rankin
                  </b-popover>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in quartileData" :key="item.tool_id"
                  :class="{ 'quartil-zero': item.cuartil === 0 }">
                  <td class="toolColumn" @click="handleTableRowClick(index)">
                    <div class="color-box"
                      :style="{ backgroundColor: markerColors[index % markerColors.length], opacity: (item.cuartil === 0 ? 0.5 : 1) }">
                    </div>
                    <span>{{ item.tool_id }}</span>
                  </td>
                  <td :class="'quartil-' + item.cuartil">{{ item.label }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </b-col>
    </b-row>

  </div>
</template>

<script setup>
// IMPORTS 
import { defineProps } from 'vue';
import { onMounted, ref, computed } from 'vue';
import * as statistics from 'simple-statistics';

// REQUIREMENTS
var clusterMaker = require('clusters');
const pf = require('pareto-frontier');
const html2canvas = require('html2canvas');
const { jsPDF } = require('jspdf');

// PROPS
const props = defineProps({
  preparedData: {
  type: Object,
  required: true
},
});

// GLOBAL CONSTANTES
// ----------------------------------------------------------------
const data = ref(null);
const datasetId = ref(null);

const dataPoints = ref([]);
const paretoPoints = ref([]);
const optimalXaxis = ref(null);
const optimalYaxis = ref(null);
const toolID = ref([]);
const allToolID = ref([]);
// 
const xValues = ref([]);
const yValues = ref([]);

// Data for the table
const quartileData = ref([]);

// K-means Clustering
const showShapesKmeans = ref(false);
let shapes = [];
let annotationKmeans = [];

// Square Quartiles
const showShapesSquare = ref(false);
const showAnnotationSquare = ref(false);

// Diagonal Quartiles
const showShapesDiagonal = ref(false);


// Error messages
const showMessageError = ref(false);
const dismissCountDown = ref(0);

// Reset/Optimal View
const viewApplied = ref(false);
// Views by Classification
const viewKmeans = ref(false);
const viewSquare = ref(false);
const viewDiagonal = ref(false);



onMounted(async () => {
  const Plotly = require('plotly.js-dist');
  data.value = props.preparedData.inline_data
  datasetId.value = data.value._id
  const visualization = data.value.visualization


  // Data structures for Plotly
  const traces = [];

  // Data for the Pareto frontier and Quartile
  // ----------------------------------------------------------------
  xValues.value = data.value.challenge_participants.map((participant) => participant.metric_x);
  yValues.value = data.value.challenge_participants.map((participant) => participant.metric_y);
  toolID.value = data.value.challenge_participants.map((participant) => participant.tool_id);
  allToolID.value = data.value.challenge_participants.map((participant) => participant.tool_id);

  // 
  dataPoints.value = data.value.challenge_participants.map((participant) => ([
    participant.metric_x,
    participant.metric_y,
  ]));

  // ----------------------------------------------------------------
  // PARETO
  let direction = formatOptimalDisplay(visualization.optimization)
  paretoPoints.value = pf.getParetoFrontier(dataPoints.value, { optimize: direction });

  const globalParetoTrace = {
    x: paretoPoints.value.map((point) => point[0]),
    y: paretoPoints.value.map((point) => point[1]),
    mode: 'lines',
    type: 'scatter',
    name: '<span style="color:black;">Global Pareto Frontier</span>',
    line: {
        dash: 'dot',
        width: 2,
        color: 'rgb(152, 152, 152)',
    },
  };

  const dynamicParetoTrace = {
    x: paretoPoints.value.map((point) => point[0]),
    y: paretoPoints.value.map((point) => point[1]),
    mode: 'lines',
    type: 'scatter',
    name: 'Dynamic Pareto Frontier',
    line: {
        dash: 'dot',
        width: 2,
        color: 'rgb(244, 124, 33)',
    }
  };

  // Add the pareto trace to the trace array
  traces.push(globalParetoTrace, dynamicParetoTrace);

  // Go through each object in challenge participants
  for (let i = 0; i < data.value.challenge_participants.length; i++) {
    const participant = data.value.challenge_participants[i];

    const trace = {
      x: [participant.metric_x],
      y: [participant.metric_y],
      mode: 'markers',
      type: 'scatter',
      marker: {
          size: 14,
          symbol: getSymbol(),
          color: getColor()
      },
      name: participant.tool_id,
      showlegend: true,
      error_x: {
        type: 'data',
        array: [participant.stderr_x],
        visible: true,
        color: '#000000',
        width: 2,
        thickness: 0.3
          
      },
      error_y: {
        type: 'data',
        array: [participant.stderr_y],
        visible: true,
        color: '#000000',
        width: 2,
        thickness: 0.3
      },
    };
    traces.push(trace);
  }

  // Create the chart layout
  const layout = {
    autosize: true,
    height: 850,
    annotations: getOptimizationArrow(visualization.optimization),
    xaxis: {
      title: {
        text: visualization.x_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 18,
          color: 'black',
          weight: 'bold',
        },
      }
    },
    yaxis: {
      title: {
        text: visualization.y_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 18,
          color: 'black',
          weight: 'bold',
        },
      },
    },
    margin: { l: 60, r: 50, t: 80, b: 20, pad: 4 },
    legend: {
      orientation: 'h',
      x: 0,
      y: -0.2,
      xref: 'paper',
      yref: 'paper',
      font: {
        size: 16,
      }
    },
    // plot_bgcolor: '#F8F9F9',
    images: getImagePosition(visualization.optimization),
    showlegend: true
  };

  const config = {
    // displayModeBar: false,
    responsive: true,
    hovermode: false
  }


  
  // ----------------------------------------------------------------
  // CREATE SCATTER PLOT
  const scatterPlot = Plotly.newPlot('scatter-plot', traces, layout, config);
  // ----------------------------------------------------------------


  // Get rangees from ejest graph
  scatterPlot.then(scatterPlot => {
    const layoutObj = scatterPlot.layout;
    optimalXaxis.value = layoutObj.xaxis.range;
    optimalYaxis.value = layoutObj.yaxis.range;
  });


  // Capture legend event
  // ----------------------------------------------------------------
  scatterPlot.then((gd) => {
    gd.on('plotly_legendclick', (event) => {
      let traceIndex = event.curveNumber;

      // If Pareto was clicked (index 0) do nothing
      if (traceIndex === 0) {
        return false;

      } else if (traceIndex === 1) {
        return true;
      }
      else {
        // Update the graph based on the selected trace
        // Si response es false la trace no se oculta de la legend
        let response = updatePlotOnSelection(traceIndex)
        if (response == false) {
            return false;
        }
      }
    });
  });
})

// ----------------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------------

// ACTIONS FOR TABLE
// ----------------------------------------------------------------
// Handle the click on the table
const handleTableRowClick = (index) => {
  const traceIndex = index + 2; // Adjust the index
  toggleTraceVisibility(traceIndex);
  updatePlotOnSelection(traceIndex)
}

// Toggle trace visibility
const toggleTraceVisibility = (traceIndex) => {
  const scatterPlotElement = document.getElementById('scatter-plot');
  const plotlyData = scatterPlotElement.data;
  const plotlyLayout = scatterPlotElement.layout;

  // Check the visibility state of the trace
  let isVisible = plotlyData[traceIndex].visible;
  if (isVisible === undefined) {
    isVisible = true
  }

  // Count the number of currently visible traces
  let visibleCount = 0;
  plotlyData.forEach(trace => {
    if (trace.visible !== 'legendonly') {
      visibleCount++;
    }
  });

  // If there are only four visible traces and the trace being toggled is currently visible, return without changing its visibility
  if (visibleCount === 6 && isVisible !== 'legendonly') {
    return;
  }

  // Update the visibility state of the trace
  plotlyData[traceIndex].visible = isVisible === true ? 'legendonly' : true;

  // Update the chart with the new data
  const Plotly = require('plotly.js-dist');
  Plotly.react('scatter-plot', plotlyData, plotlyLayout);
}

// Update the graph based on the selected trace
const updatePlotOnSelection = (traceIndex) => {

  const Plotly = require('plotly.js-dist');

  // Adjust the index to exclude the Pareto (which is at index 0)
  traceIndex = traceIndex - 2;

  // (Add hidden) Hide or show the tool based on its current state
  const toolHidden = dataPoints.value[traceIndex].hidden;

  // If hiding the trace, check if there are at least 4 visible traces
  if (!toolHidden) {
    const visibleTools = dataPoints.value.filter((tool) => !tool.hidden);
    if (visibleTools.length <= 4) {
      // Show Message Error
      showMessageError.value = true;
      dismissCountDown.value = 5;
      // Start timer to hide alert after 5 seconds
      const timer = setInterval(() => {
        if (dismissCountDown.value > 0) {
          dismissCountDown.value -= 1;
        } else {
          showMessageError.value = false;
          clearInterval(timer);
        }
      }, 1000);
      return false;
    }
  } else {
    showMessageError.value = false;
  }

  // Toggle the hidden state
  dataPoints.value[traceIndex].hidden = !toolHidden;

  // Filter visible tools
  const updatedVisibleTools = dataPoints.value.filter((tool) => !tool.hidden);

  // Calculate the new Pareto Frontier with the visible tools
  let direction = formatOptimalDisplay(data.value.visualization.optimization)
  const newParetoPoints = pf.getParetoFrontier(updatedVisibleTools, { optimize: direction });

  // Update the trace of the Pareto frontier
  const newTraces = { x: [newParetoPoints.map((point) => point[0])], y: [newParetoPoints.map((point) => point[1])] }



  // Update Kmeans Clustering
  // ----------------------------------------------------------------
  if (viewKmeans.value === true) {
      // If the K-means view is active, K-means Clustering is recalculated, otherwise it is not.

      // Create a list of visible tools with their hiding status
      const visibleTools = toolID.value.map((tool, index) => ({
        name: tool,
        hidden: dataPoints.value[index].hidden
      })).filter(tool => !tool.hidden);
      // List of visible tools
      const visibleToolNames = visibleTools.map(tool => tool.name);

      // Recalculate Clustering
      createShapeClustering(updatedVisibleTools, visibleToolNames)
      showShapesKmeans.value = true;


      // Create a new layout
      const layout = {
        shapes: showShapesKmeans.value ? shapes : [],
        annotations: getOptimizationArrow(data.value.visualization.optimization).concat(annotationKmeans)
      };
      Plotly.update('scatter-plot', newTraces, layout, 1);
  }

  // Update Square Quartiles
  // ----------------------------------------------------------------
  if (viewSquare.value === true) {
    // If the Square view is active, the quartiles are calculated with the visible traces
    const updatedXCoordinates = ref(updatedVisibleTools.map((participant) => participant[0]))
    const updatedYCoordinates = ref(updatedVisibleTools.map((participant) => participant[1]))

    // Create a list of visible tools with their hiding status
    const visibleTools = toolID.value.map((tool, index) => ({
      name: tool,
      hidden: dataPoints.value[index].hidden
    })).filter(tool => !tool.hidden);

    // List of visible tools
    const visibleToolNames = visibleTools.map(tool => tool.name);
    // Update data with visible tools
    calculateQuartiles(updatedXCoordinates.value, updatedYCoordinates.value, visibleToolNames);
    optimalView()
  }

  // Update Diagonal Quartiles
  // ----------------------------------------------------------------
  if (viewDiagonal.value === true){
    const updatedXCoordinates = ref(updatedVisibleTools.map((participant) => participant[0]))
    const updatedYCoordinates = ref(updatedVisibleTools.map((participant) => participant[1]))

    // Update data with visible tools
    getDiagonalQuartile(updatedXCoordinates.value, updatedYCoordinates.value);
    optimalView()
  }

  Plotly.update('scatter-plot', newTraces, {}, 1);
}

// ----------------------------------------------------------------
// Scatter Plot Views
// ----------------------------------------------------------------

// Reset View (Real dimensions)
const resetView = () => {
  const Plotly = require('plotly.js-dist');
  const layout = {
    xaxis: {
      range: [0, Math.max(...xValues.value) + (Math.min(...xValues.value) / 3)],
      title: {
        text: data.value.visualization.x_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 16,
          color: 'black',
          weight: 'bold',
        },
      }
    },
    yaxis: {
      range: [0, Math.max(...yValues.value) + 0.05],
      title: {
        text: data.value.visualization.y_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 16,
          color: 'black',
          weight: 'bold',
        },
      },
    }
  };
  Plotly.relayout('scatter-plot', layout);
  viewApplied.value = true;
};

// Optimal View (Optimal dimensions)
const optimalView = () => {
  const Plotly = require('plotly.js-dist');
  const layout = {
    xaxis: {
      range: [optimalXaxis.value[0], optimalXaxis.value[1]],
      title: {
        text: data.value.visualization.x_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 16,
          color: 'black',
          weight: 'bold',
        },
      }
    },
    yaxis: {
      range: [optimalYaxis.value[0], optimalYaxis.value[1]],
      title: {
        text: data.value.visualization.y_axis,
        font: {
          family: 'Arial, sans-serif',
          size: 16,
          color: 'black',
          weight: 'bold',
        },
      },
    },
  }
  Plotly.relayout('scatter-plot', layout);
  viewApplied.value = false; // Optimal view is applied
};

// Toggle Visibility
const toggleView = () => {
  if (viewApplied.value) {
    optimalView();
  } else {
    resetView();
  }
};

// Text for the View Button
const viewButtonText = computed(() => {
  return viewApplied.value ? 'Optimal View' : 'Reset View';
});

// Text for the Classification Button
const classificationButtonText = computed(() => {
  if (viewKmeans.value) {
    return 'K-Means Clustering';
  } else if (viewSquare.value) {
    return 'Square Quartiles';
  } else if (viewDiagonal.value){
    return 'Diagonal Quartiles';
  } else {
    return 'Classification'
  }
});

// Error messages
const countDownChanged = () => {
  if (dismissCountDown.value > 0) {
    dismissCountDown.value -= 1;
  }
};

// PARETO FRONTIER
// ----------------------------------------------------------------
// format optimal view
const formatOptimalDisplay = (optimization) => {
  if (optimization == 'top-right') {
    return 'topRight';
  } else if (optimization == optimization == 'top-left') {
    return 'topLeft';
  } else if (optimization == 'bottom-right') {
    return 'bottomRight';
  }
}

// NO CLASSIFICATION
// ----------------------------------------------------------------
const noClassification = () => {
  quartileData.value = [];
  viewKmeans.value = false;
  viewSquare.value = false;
  viewDiagonal.value = false;
  showShapesKmeans.value = false;
  showShapesSquare.value = false;
  showAnnotationSquare.value = false;

  // Reset Plot
  const Plotly = require('plotly.js-dist');
  const plot = document.getElementById('scatter-plot')
  const numTraces = plot.data.length
  const visibleArray = Array(numTraces).fill(true)

  // Reset Pareto Frontier
  dataPoints.value.forEach(array => { array.hidden = false; });
  const updatedVisibleTools = dataPoints.value.filter((tool) => !tool.hidden);
  let direction = formatOptimalDisplay(data.value.visualization.optimization)
  const newParetoPoints = pf.getParetoFrontier(updatedVisibleTools, { optimize: direction });
  // Update the trace of the Pareto frontier
  const newTraces = { x: [newParetoPoints.map((point) => point[0])], y: [newParetoPoints.map((point) => point[1])] }

  const layout = {
    shapes: false ? shapes : [],
    annotations: getOptimizationArrow(data.value.visualization.optimization)
  };
  Plotly.update('scatter-plot', newTraces, layout, 1);
  Plotly.restyle('scatter-plot', { visible: visibleArray })

};


// ----------------------------------------------------------------
// SQUARE QUARTILES
// ----------------------------------------------------------------
// Function to toggle the visibility of the Square Quartiles
const toggleQuartilesVisibility = () => {
  const Plotly = require('plotly.js-dist');
  const plot = document.getElementById('scatter-plot');
  const numTraces = plot.data.length;

  // Reset visibilities. Hide the Kmeans and Show the Square
  showShapesKmeans.value = false;
  viewKmeans.value = false;
  viewDiagonal.value = false;
  viewSquare.value = true;
  showShapesSquare.value = true;
  showAnnotationSquare.value = true;

  // Update visibility of Points
  dataPoints.value.forEach(array => { array.hidden = false; });

  // Calculate Pareto Frontier
  const updatedVisibleTools = dataPoints.value.filter(tool => !tool.hidden);
  const direction = formatOptimalDisplay(data.value.visualization.optimization);
  const newParetoPoints = pf.getParetoFrontier(updatedVisibleTools, { optimize: direction });
  const newTraces = { x: [newParetoPoints.map(point => point[0])], y: [newParetoPoints.map(point => point[1])] };

  const layout = {
    shapes: false ? shapes : [],
    annotations: getOptimizationArrow(data.value.visualization.optimization)
  };

  const visibleArray = Array(numTraces).fill(true);

  Plotly.update('scatter-plot', newTraces, layout, 1);
  Plotly.update('scatter-plot', { visible: visibleArray });

  calculateQuartiles(xValues.value, yValues.value, toolID.value);
  optimalView();
};

// Calculate square quartiles
const calculateQuartiles = (xValues, yValues, toolID) => {

  const cuartilesX = statistics.quantile(xValues, 0.5);
  const cuartilesY = statistics.quantile(yValues, 0.5);

  let better = data.value.visualization.optimization
  sortToolsForSquare(better, toolID, cuartilesX, cuartilesY, xValues, yValues)

  // Lines 
  const shapes = [
    {
      type: 'line',
      x0: cuartilesX,
      x1: cuartilesX,
      y0: 0,
      y1: Math.max(...yValues) + Math.max(cuartilesY),
      line: {
        color: '#C0D4E8',
        width: 2,
        dash: 'dash'
      }
    },
    {
      type: 'line',
      y0: cuartilesY,
      y1: cuartilesY,
      x0: 0,
      x1: Math.max(...xValues) + Math.max(cuartilesX),
      line: {
        color: '#C0D4E8',
        width: 2,
        dash: 'dash'
      }
    },
  ];
  // Annotations
  annotationSquareQuartile(better)
  // Add Quartiles
  const layout = {
    shapes: showShapesSquare.value ? shapes : [],
  };
  const Plotly = require('plotly.js-dist');
  Plotly.relayout('scatter-plot', layout);
};

// Sort tools for Square Quartiles
const sortToolsForSquare = (better, visibleToolID, cuartilesX, cuartilesY, xValues, yValues) => {
  quartileData.value = [];
  allToolID.value.forEach((tool) => { // Iterate over all tools
    const index = visibleToolID.indexOf(tool);
    const x = index !== -1 ? xValues[index] : null; // Get index and values x, y
    const y = index !== -1 ? yValues[index] : null; // Get index and values x, y

    let cuartil = 0;
    let label = '--';

    if (index !== -1) { // Si la herramienta está presente en visibleToolID
      if (better === "bottom-right") {
        if (x >= cuartilesX && y <= cuartilesY) {
          cuartil = 1;
          label = 'Top';
        } else if (x >= cuartilesX && y > cuartilesY) {
          cuartil = 3;
          label = 'Interquartile';
        } else if (x < cuartilesX && y > cuartilesY) {
          cuartil = 4;
          label = 'Bottom';
        } else if (x < cuartilesX && y <= cuartilesY) {
          cuartil = 2;
          label = 'Interquartile';
        }
      } else if (better === "top-right") {
        if (x >= cuartilesX && y < cuartilesY) {
          cuartil = 3;
          label = 'Interquartile';
        } else if (x >= cuartilesX && y >= cuartilesY) {
          cuartil = 1;
          label = 'Top';
        } else if (x < cuartilesX && y >= cuartilesY) {
          cuartil = 2;
          label = 'Interquartile';
        } else if (x < cuartilesX && y < cuartilesY) {
          cuartil = 4;
          label = 'Bottom';
        }
      } else if (better === "top-left") {
        if (x >= cuartilesX && y < cuartilesY) {
          cuartil = 4;
          label = 'Bottom';
        } else if (x >= cuartilesX && y >= cuartilesY) {
          cuartil = 2;
          label = 'Interquartile';
        } else if (x < cuartilesX && y >= cuartilesY) {
          cuartil = 1;
          label = 'Top';
        } else if (x < cuartilesX && y < cuartilesY) {
          cuartil = 3;
          label = 'Interquartile';
        }
      }
    }
    quartileData.value.push({ tool_id: tool, cuartil: cuartil, label: label });
  });
}

// Annotation for Square Quartiles
const annotationSquareQuartile = (better) => {

  // Create Annotation
  let position = asignaPositionCuartil(better)
  // Add label to the position (T, M, B)
  const newAnnotation = position.map(({ position, numCuartil }) => {
    let annotation = {};
    switch (position) {
      case 'top-left':
        annotation = {
          xref: 'paper',
          yref: 'paper',
          x: 0.01,
          xanchor: 'left',
          y: 1,
          yanchor: 'top',
          text: numCuartil,
          showarrow: false,
          font: {
            size: 20,
            color: '#5A88B5'
          }
        };
        break;
      case 'bottom-right':
        annotation = {
          xref: 'paper',
          yref: 'paper',
          x: 0.91,
          xanchor: 'left',
          y: 0.05,
          yanchor: 'bottom',
          text: numCuartil,
          showarrow: false,
          font: {
            size: 20,
            color: '#5A88B5'
          }
        };
        break;
      case 'bottom-left':
        annotation = {
          xref: 'paper',
          yref: 'paper',
          x: 0.01,
          xanchor: 'left',
          y: 0.10,
          yanchor: 'top',
          text: numCuartil,
          showarrow: false,
          font: {
            size: 20,
            color: '#5A88B5'
          }
        };
        break;
      case 'top-right':
        annotation = {
          xref: 'paper',
          yref: 'paper',
          x: 0.90,
          xanchor: 'left',
          y: 0.98,
          yanchor: 'top',
          text: numCuartil,
          showarrow: false,
          font: {
            size: 20,
            color: '#5A88B5'
          }
        };
        break;
      default:
        break;
    }
    return annotation;
  });

  const annotations = getOptimizationArrow(data.value.visualization.optimization)
  const layout = {
    annotations: showAnnotationSquare.value ? annotations.concat(newAnnotation) : [],
  };
  const Plotly = require('plotly.js-dist');
  Plotly.relayout('scatter-plot', layout);
}

// Asigna position
const asignaPositionCuartil = (better) => {

  // 1: tot, 2y3: Middle, 4:Botton
  let num_bottom_right, num_bottom_left, num_top_right, num_top_left;
  if (better == "bottom-right") {
    num_bottom_right = "Top"; // 1
    num_bottom_left = "Interquartile"; // 2
    num_top_right = "Interquartile"; // 3
    num_top_left = "Bottom"; // 4
  }
  else if (better == "top-right") {
    num_bottom_right = "Interquartile"; // 3
    num_bottom_left = "Bottom"; // 4
    num_top_right = "Top"; // 1
    num_top_left = "Interquartile"; // 2

  } else if (better == "top-left") {
    num_bottom_right = "Bottom"; // 4
    num_bottom_left = "Interquartile"; // 3
    num_top_right = "Interquartile"; // 2
    num_top_left = "Top"; // 1
  }

  let positions = [{ position: 'bottom-right', numCuartil: num_bottom_right },
  { position: 'bottom-left', numCuartil: num_bottom_left },
  { position: 'top-right', numCuartil: num_top_right },
  { position: 'top-left', numCuartil: num_top_left },]

  return positions
};

// ----------------------------------------------------------------
// DIAGONAL QUARTILES
// ----------------------------------------------------------------
const toggleDiagonalQuartile = () => {
  // Classification
  
  viewDiagonal.value = true;
  viewSquare.value = false;
  viewKmeans.value = false;
  // 
  showShapesKmeans.value = false;
  showShapesSquare.value = false;
  showShapesDiagonal.value = true;
  
  getDiagonalQuartile(xValues.value, yValues.value)
  optimalView()
}


// Diagonal Quartile
const getDiagonalQuartile = (x_values, y_values) =>{

  let tools_not_hidden = x_values.map((x, i) => [x, y_values[i]]);

  let normalizedValues = normalizeData(x_values, y_values);
  let [x_norm, y_norm] = [normalizedValues[0], normalizedValues[1]];

  let max_x = Math.max.apply(null, x_values);
  let max_y = Math.max.apply(null, y_values);
  let better = data.value.visualization.optimization


  // # compute the scores for each of the tool. based on their distance to the x and y axis
  let scores = []
  let scores_coords = {}; //this object will store the scores and the coordinates
  for (let i = 0; i < x_norm.length; i++) {

    if (better == "bottom-right"){
      scores.push(x_norm[i] + (1 - y_norm[i]));
      scores_coords[x_norm[i] + (1 - y_norm[i])] =  [x_values[i], y_values[i]];
      //append the score to the data array
      tools_not_hidden[i]['score'] = x_norm[i] + (1 - y_norm[i]);
    } 
    else if (better == "top-right"){
      scores.push(x_norm[i] + y_norm[i]);
      scores_coords[x_norm[i] + y_norm[i]] = [x_values[i], y_values[i]];
      //append the score to the data array
      tools_not_hidden[i]['score'] = x_norm[i] + y_norm[i];

    }else if (better == "top-left"){
      scores.push(1 -x_norm[i] + y_norm[i]);
      scores_coords[(1 -x_norm[i]) + y_norm[i]] = [x_values[i], y_values[i]];
      //append the score to the data array
      tools_not_hidden[i]['score'] = (1 -x_norm[i]) + y_norm[i];
    }
  };

  scores.sort(function(a, b){return b-a});

  let first_quartile  = statistics.quantile(scores, 0.25);
  let second_quartile = statistics.quantile(scores, 0.5);
  let third_quartile  = statistics.quantile(scores, 0.75);

  let coords = [  getDiagonalline(scores, scores_coords, first_quartile,better, max_x, max_y),
                  getDiagonalline(scores, scores_coords, second_quartile,better, max_x, max_y),
                  getDiagonalline(scores, scores_coords, third_quartile,better, max_x, max_y)]


  // Create shapes
  const shapes = [];
  for (let i = 0; i < coords.length; i++) {
    let [x_coords, y_coords] = [coords[i][0], coords[i][1]];
    const shape = {
      type: 'line',
      x0: x_coords[0],
      y0: y_coords[0],
      x1: x_coords[1],
      y1: y_coords[1],
      line: {
        color: '#C0D4E8',
        width: 2,
        dash: 'dash'
      }
    };

    shapes.push(shape);
  }

  // Get Annotations
  let annotationDiagonal = asigneQuartileDiagonal(tools_not_hidden, first_quartile, second_quartile, third_quartile)
  
  // Diagonal Q. Table
  createTableDiagonal(tools_not_hidden)


  const layout = {
    shapes: showShapesDiagonal.value ? shapes : [],
    annotations: getOptimizationArrow(data.value.visualization.optimization).concat(annotationDiagonal),
  };

  const Plotly = require('plotly.js-dist');
  Plotly.relayout('scatter-plot', layout);
}

// Get coordinates for line
const getDiagonalline = (scores, scores_coords, quartile, better, max_x, max_y) =>{
  let target;
  for(let i = 0; i < scores.length; i++){
    if(scores[i] <= quartile){
      target = [[scores_coords[scores[i - 1]][0], scores_coords[scores[i - 1]][1]],
              [scores_coords[scores[i]][0], scores_coords[scores[i]][1]]];
      break;
    }
  }

  let half_point = [(target[0][0] + target[1][0]) /2, (target[0][1] + target[1][1]) / 2]

  // # draw the line depending on which is the optimal corner
  let x_coords;
  let y_coords;
  if (better == "bottom-right"){
    x_coords = [half_point[0] - 2*max_x, half_point[0] + 2*max_x];
    y_coords = [half_point[1] - 2*max_y, half_point[1] + 2*max_y];
  } else if (better == "top-right"){
    x_coords = [half_point[0] + 2*max_x, half_point[0] - 2*max_x];
    y_coords = [half_point[1] - 2*max_y, half_point[1] + 2*max_y];   
  } else if (better == "top-left"){
    x_coords = [half_point[0] + 2*max_x, half_point[0] - 2*max_x];
    y_coords = [half_point[1] + 2*max_y, half_point[1] - 2*max_y];   
  };

  return [x_coords, y_coords];

}

// Normalize data
const normalizeData = (xValues, yValues) => {
  let maxX = Math.max.apply(null, xValues);
  let maxY = Math.max.apply(null, yValues);

  let xNorm = xValues.map(function(e) {  
    return e / maxX;
  });

  let yNorm = yValues.map(function(e) {  
    return e / maxY;
  });

  return [xNorm, yNorm];
}

// Asigne the classification by Diagonal Quartile
const asigneQuartileDiagonal = (dataTools, first_quartile, second_quartile, third_quartile) => {
  
  let poly = [[],[],[],[]];
  dataTools.forEach(element => {
      
    if (element.score <= first_quartile) {
      element.quartile = 4;
      poly[0].push([element[0], element[1]]);
    } else if (element.score <= second_quartile) {
      element.quartile = 3;
      poly[1].push([element[0], element[1]]);
    } else if (element.score <= third_quartile) {
      element.quartile = 2;
      poly[2].push([element[0], element[1]]);
    } else {
      element.quartile = 1;
      poly[3].push([element[0], element[1]]);
    }
  });

  let i = 4;
  let annotationDiagonal = []
  poly.forEach(function(group) {

    let center = (getCentroid(group))
    const centroidX = center[0];
    const centroidY = center[1];
    
    let annotationD = {
      xref: 'x',
      yref: 'y',
      x: centroidX,
      xanchor: 'right',
      y: centroidY,
      yanchor: 'bottom',
      text: i,
      showarrow: false,
      font: {
        size: 30,
        color: '#5A88B5'
      }
    }
    annotationDiagonal.push(annotationD)
    i--;
  });
  return annotationDiagonal

}

// Get centroide by annotation
const getCentroid = (coord) =>{
  var center = coord.reduce(function (x,y) {
    return [x[0] + y[0]/coord.length, x[1] + y[1]/coord.length] 
  }, [0,0])
  return center;
}

// Create Table
const createTableDiagonal = (visibleTool) => {
  quartileData.value = [];

  allToolID.value.forEach((tool) => {
    const toolName = tool;
    const visibleToolInfo = visibleTool.find(item => item[0] === xValues.value[allToolID.value.indexOf(tool)]);

    let quartile = 0;
    let label = '--';

    if (visibleToolInfo) {
      quartile = visibleToolInfo.quartile;
      label = quartile.toString();
    }

    quartileData.value.push({ tool_id: toolName, cuartil: quartile, label: label });
  });
};


// ----------------------------------------------------------------
// K-MEANS CLUSTERING
// ----------------------------------------------------------------
const toggleKmeansVisibility = () => {
  const Plotly = require('plotly.js-dist');
  const plot = document.getElementById('scatter-plot');
  const numTraces = plot.data.length;

  // Reset visibilities. Hide the Square and Show the Kmeans
  showShapesSquare.value = false;
  showAnnotationSquare.value = false;
  viewSquare.value = false;
  viewDiagonal.value = false;
  showShapesKmeans.value = true;
  viewKmeans.value = true;

  // Update visibility of Points
  dataPoints.value.forEach(array => { array.hidden = false; });

  // Calculate Pareto Frontier
  const updatedVisibleTools = dataPoints.value.filter(tool => !tool.hidden);
  const direction = formatOptimalDisplay(data.value.visualization.optimization);
  const newParetoPoints = pf.getParetoFrontier(updatedVisibleTools, { optimize: direction });
  const newTraces = { x: [newParetoPoints.map(point => point[0])], y: [newParetoPoints.map(point => point[1])] };

  // Update visibility of traces in legend
  const visibleArray = Array(numTraces).fill(true);
  const layout = {
    shapes: false ? shapes : [],
    annotations: getOptimizationArrow(data.value.visualization.optimization)
  };
  Plotly.update('scatter-plot', newTraces, layout, 1);
  Plotly.update('scatter-plot', { visible: visibleArray });

  // Create shape clustering
  createShapeClustering(dataPoints.value, toolID.value);

};


const createShapeClustering = (dataPoints, toolIDVisible) => {
  clusterMaker.k(4);
  clusterMaker.iterations(500);
  clusterMaker.data(dataPoints);

  // Obtener los resultados de los clusters
  let results = clusterMaker.clusters();
  let sortedResults = JSON.parse(JSON.stringify(results));

  let better = data.value.visualization.optimization
  orderResultKMeans(sortedResults, better)

  const groupedDataPoints = assignGroupToDataPoints(dataPoints, sortedResults);
  createDataPointForTables(toolIDVisible, groupedDataPoints)


  // Crear shapes basados en los clusters
  shapes = sortedResults.map((cluster) => {
    const xValues = cluster.points.map(point => point[0]);
    const yValues = cluster.points.map(point => point[1]);
    return {
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: Math.min(...xValues),
      y0: Math.min(...yValues),
      x1: Math.max(...xValues),
      y1: Math.max(...yValues),
      opacity: 0.2,
      fillcolor: 'rgba(0, 72, 129, 183)',
      line: {
        color: '#2A6CAB',
      }
    };
  });

  // Crear annotations para los centroides de los clusters
  let count = 0;
  annotationKmeans = sortedResults.map((cluster) => {
    const centroidX = cluster.centroid[0];
    const centroidY = cluster.centroid[1];
    count++;

    return {
      xref: 'x',
      yref: 'y',
      x: centroidX,
      xanchor: 'right',
      y: centroidY,
      yanchor: 'bottom',
      text: count,
      showarrow: false,
      font: {
        size: 30,
        color: '#5A88B5'
      }
    };
  });

  const Plotly = require('plotly.js-dist');
  const layout = {
    shapes: showShapesKmeans.value ? shapes : [],
    annotations: getOptimizationArrow(data.value.visualization.optimization).concat(annotationKmeans),
  };
  Plotly.update('scatter-plot', {}, layout);

}


const createDataPointForTables = (visibleTools, groupedDataPoints) => {
  quartileData.value = [];
  allToolID.value.forEach((tool) => {
    const index = visibleTools.indexOf(tool);
    let cuartil = 0;
    let label = '--';
    if (index !== -1) {
      cuartil = groupedDataPoints[index][2];
      label = cuartil.toString();
    }

    quartileData.value.push({ tool_id: tool, cuartil: cuartil, label: label });
  })

}

const assignGroupToDataPoints = (dataPoints, sortedResults) => {
  const groupedDataPoints = [];
  for (let i = 0; i < dataPoints.length; i++) {
    const dataPoint = dataPoints[i];
    for (let j = 0; j < sortedResults.length; j++) {
      const group = sortedResults[j];
      // Verificar si el punto está en el grupo
      if (group.points.some(groupPoint => isEqual(groupPoint, dataPoint))) {
        groupedDataPoints.push([...dataPoint, j + 1]);
        break;
      }
    }
  }
  return groupedDataPoints;
}

// Función de utilidad para comparar dos puntos y verificar si son iguales
const isEqual = (point1, point2) => {
  return point1[0] === point2[0] && point1[1] === point2[1];
}

// Sorted Results K-means
const orderResultKMeans = (sortedResults, better) => {
  // normalize data to 0-1 range
  let centroids_x = []
  let centroids_y = []
  sortedResults.forEach(function (element) {
    centroids_x.push(element.centroid[0])
    centroids_y.push(element.centroid[1])
  })

  let [x_norm, y_norm] = normalize_data(centroids_x, centroids_y)

  let scores = [];
  if (better == "top-right") {
    for (let i = 0; i < x_norm.length; i++) {
      let distance = x_norm[i] + y_norm[i];
      scores.push(distance);
      sortedResults[i]['score'] = distance;
    };

  } else if (better == "bottom-right") {
    for (let i = 0; i < x_norm.length; i++) {
      let distance = x_norm[i] + (1 - y_norm[i]);
      scores.push(distance);
      sortedResults[i]['score'] = distance;
    };
  } else if (better == "top-left") {
    for (let i = 0; i < x_norm.length; i++) {
      let distance = (1 - x_norm[i]) + y_norm[i];
      scores.push(distance);
      sortedResults[i]['score'] = distance;
    };
  };

  sortByKey(sortedResults, "score");
}

const normalize_data = (x_values, y_values) => {
  let maxX = Math.max.apply(null, x_values);
  let maxY = Math.max.apply(null, y_values);

  let x_norm = x_values.map(function (e) {
    return e / maxX;
  });

  let y_norm = y_values.map(function (e) {
    return e / maxY;
  });

  return [x_norm, y_norm];
}

const sortByKey = (array, key) => {
  return array.sort(function (a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0)) * -1;
  });
}



// DOWNLOAD
// ----------------------------------------------------------------
const downloadChart = async (format, datasetId) => {
  const Plotly = require('plotly.js-dist');
  const chart = document.getElementById('scatter-plot');
  chart.layout.images[0].opacity = 0.5;
  Plotly.relayout('scatter-plot', chart.layout);

  if (format === 'png') {
    if (viewSquare.value || viewKmeans.value || viewDiagonal.value) {
      const toDownloadDiv = document.getElementById('todownload');
      const downloadCanvas = await html2canvas(toDownloadDiv, {
        scrollX: 0,
        scrollY: 0,
        width: toDownloadDiv.offsetWidth,
        height: toDownloadDiv.offsetHeight,
      });
        const downloadImage = downloadCanvas.toDataURL(`image/${format}`);

        const link = document.createElement('a');
        link.href = downloadImage;
        link.download = `benchmarking_chart_${datasetId}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
      const options = { format, height: 700, width: 800 };
      Plotly.toImage(chart, options)
        .then((url) => {
          const link = document.createElement('a');
          link.href = url;
          link.download = `benchmarking_chart_${datasetId}.${format}`;
          link.click();
        })
        .catch((error) => {
          console.error(`Error downloading graphic as ${format}`, error);
        });
    }

  } else if (format === 'svg') {
    const options = { format, height: 700, width: 800 };
    Plotly.toImage(chart, options)
      .then((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `benchmarking_chart_${datasetId}.${format}`;
        link.click();
      })
      .catch((error) => {
          console.error(`Error downloading graphic as ${format}`, error);
      });

  } else if (format === 'pdf') {
    const pdf = new jsPDF();
    
    pdf.text('Benchmarking', 105, 10, null, null, 'center');

    // Get chart image as base64 data URI
    const chartImageURI = await Plotly.toImage(chart, { format: 'png' });
    const chartHeight = 130;
    const chartWidth = 170;

    pdf.addImage(chartImageURI, 'PNG', 10, 15, chartWidth, chartHeight, null, 'FAST', 0, null, 'center');

    if (viewSquare.value || viewKmeans.value || viewDiagonal.value) {
      const table = document.getElementById('benchmarkingTable');
      const downloadCanvas = await html2canvas(table, {
        scrollX: 0,
        scrollY: 0,
        width: table.offsetWidth,
        height: table.offsetHeight,
      });
      const tableImageURI = downloadCanvas.toDataURL(`image/png`);
      const tableHeight = 140;
      const tableWidth = 100;

      // Add 20 pixels to the vertical position for the second image
      const tableVerticalPosition = chartHeight + 10;
      pdf.addImage(tableImageURI, 'PNG', 10, 150, tableVerticalPosition, tableHeight, tableWidth, null, 'FAST', 0, null, 'center');
    }

    // Save the PDF
    pdf.save(`benchmarking_chart_${datasetId}.${format}`);

  } else if (format === 'json') {
    // Descargar como JSON
    const chartData = chart.data // Obtener datos del gráfico
    console.log(chartData)
    const jsonData = JSON.stringify(chartData);

    const link = document.createElement('a');
    link.href = `data:text/json;charset=utf-8,${encodeURIComponent(jsonData)}`;
    link.download = `${datasetId}.json`;
    link.click();
  } else {
    console.error('Error downloading chart:', error);
  }

  chart.layout.images[0].opacity = 0;
  Plotly.relayout('scatter-plot', chart.layout);
};

// Image Position
// ----------------------------------------------------------------
function getImagePosition(optimization) {
  const ImagePositions = [];

  let positionX, positionY;

  // Posicion contraria
  switch (optimization) {
    case 'top-left':
      positionX = 1
      positionY = 0
      break;
    case 'top-right':
      positionX = 0.1
      positionY = 0
      break;
    case 'bottom-left':
      positionX = 1
      positionY = 0.9
      break;
    case 'bottom-right':
      positionX = 0.1
      positionY = 0.8
      break;
    default:
      positionX = 0.1
      positionY = 0
      break;
  }

  const imagesPosition = {
    x: positionX,
    y: positionY,
    sizex: 0.1,
    sizey: 0.3,
    source: "/2018.OpenEBench.logo.Manual_page2.png",
    xref: "paper",
    yref: "paper",
    xanchor: "right",
    yanchor: "bottom",
    "opacity": 0,
  }

  ImagePositions.push(imagesPosition)

  return ImagePositions

}

// This function creates the annotations for the optimization arrow
// ----------------------------------------------------------------
function getOptimizationArrow(optimization) {
  const arrowAnnotations = [];

  let arrowX, arrowY;
  let axAdjustment = 0;
  let ayAdjustment = 0;

  // Determine arrow position based on optimization
  switch (optimization) {
    case 'top-left':
      arrowX = 0;
      arrowY = 0.98;
      axAdjustment = 35;
      ayAdjustment = 30;
      break;

    case 'top-right':
      arrowX = 0.98;
      arrowY = 0.98;
      axAdjustment = -30;
      ayAdjustment = 35;
      break;

    case 'bottom-right':
      arrowX = 1
      arrowY = 0;
      axAdjustment = -30;
      ayAdjustment = -30;
      break;

    default:
      // By default, place the arrow in the upper left corner
      arrowX = 0;
      arrowY = 0;
      axAdjustment = 30;
      ayAdjustment = -35;
  }

  // Crear la anotación para la flecha
  const arrowAnnotation = {
    x: arrowX,
    y: arrowY,
    xref: 'paper',
    yref: 'paper',
    text: 'Optimal corner',
    font: {
      color: '#6C757D'
    },
    showarrow: true,
    arrowhead: 3,
    ax: axAdjustment,
    ay: ayAdjustment,
    arrowsize: 1,
    arrowcolor: '#6C757D'
  };

  arrowAnnotations.push(arrowAnnotation);

  return arrowAnnotations;
}

// Get Color and Symbols
// ----------------------------------------------------------------
const markerColors = ['#D62728', '#FF7F0E', '#8C564B', '#E377C2', '#4981B6', '#BCBD22', '#9467BD', '#0C9E7B', '#7F7F7F', '#31B8BD', '#FB8072', '#62D353'];
let colorIndex = 0;
function getColor() {
  const currentColor = markerColors[colorIndex];
  colorIndex = (colorIndex + 1) % markerColors.length;
  return currentColor;
}
const symbols = ['circle', 'triangle-up', 'pentagon', 'cross', 'x', 'star', 'star-diamond', 'square', 'diamond-tall'];
let currentIndex = 0;
function getSymbol() {
  const currentSymbol = symbols[currentIndex];
  currentIndex = (currentIndex + 1) % symbols.length;
  return currentSymbol;
}

</script>


<style scoped lang="css">
html {
  font-size: 18px; /* Por ejemplo, 16px */
}
.butns {
  position: absolute;
  top: 14px;
  margin-top: 10px;
  z-index: 1;
}

.fontSizeBtn{
  font-size: 18px;
}

.button-classification {
  width: 210px;
}

.button-resetView {
  width: 140px;
}

.button-download {
  width: 168px;
}

.text-download {
  padding: auto;
  font-size: small;
}

.text-classifi {
  padding: auto;
  font-size: small;
}

.error-alert {
  width: 70%;
  margin: 0 auto;
  height: 2em;
}

.b-alert {
  padding: 7px;
}

.table-container {
  max-height: 850px; /* Height layout of Scatter */
  overflow-y: auto;
  font-size: 1.1rem;
}
.cuartiles-table tbody tr:first-child {
  margin-top: 40px; 
}

.cuartiles-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.cuartiles-table th {
  position: -webkit-sticky;
  position: sticky;
  top: -1px;
  z-index: 1;
  background-color: #6c757d;
  color: white;
  white-space: nowrap;
}
.toolHeader{
  width: 60%;
}
.cuartiles-table td {
  padding: 8px;
  vertical-align: top;
}

.toolColumn {
  cursor: pointer;
  position: relative;
}

.toolColumn .color-box {
  width: 20px;
  height: 100%;
  display: inline-block;
  position: absolute;
  left: 0px;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.5);
}

.toolColumn span {
  display: inline-block;
  margin-left: 25px;
  transition: transform 0.3s ease;
}

.toolColumn:hover span {
  transform: translateX(5px);
  font-style: italic;
  color: #0A58A2;
}
@media (max-width: 768px) {
  .toolHeader {
      width: 30%; /* Ajusta el ancho de la columna de herramientas */
  }

  .toolColumn span {
      margin-left: 15px; /* Restaura el margen a su valor original */
  }
}
.quartil-1 {
  background-color: rgb(237, 248, 233);
}

.quartil-2 {
  background-color: rgb(186, 228, 179);
}

.quartil-3 {
  background-color: rgb(116, 196, 118);
}

.quartil-4 {
  background-color: rgb(35, 139, 69);
}

.quartil-zero {
  background-color: rgba(237, 231, 231, 0.5);
}

.info-icon{
  color: #ffffff;
  margin-left: 5px;
}
</style>
