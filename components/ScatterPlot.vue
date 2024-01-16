<template>
    <div>
        <h4>2D-Plot (scatter plot)</h4>
        <p>Dataset Id: {{ datasetId }} </p>
        <br>

        <!-- Button Dowloand -->
        <div>
            <b-dropdown id="dropdown-1" text=" Dowload " class="m-md-2" variant="primary" style="width: 170px;">
                <b-dropdown-text class="font-weight-bold"><strong>Select a format:</strong></b-dropdown-text>
                <b-dropdown-item @click="downloadChart('png')"> PNG </b-dropdown-item>
                <b-dropdown-item @click="downloadChart('svg')"> SVG (only plot) </b-dropdown-item>
                <b-dropdown-item @click="downloadChart('json')"> JSON </b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
            </b-dropdown>
        </div>

        <br>
        <div id="scatter-plot"></div>
    </div>
</template>

<script setup>
const pf = require('pareto-frontier');
import { onMounted, ref } from 'vue';

const dataset = ref(null);
const datasetId = ref(null);

onMounted(async () => {
    const Plotly = require('plotly.js-dist');
    const response = await fetch('/raw_data_OEBD00200002UK0.json');
    dataset.value = await response.json();
    datasetId.value = dataset.value._id
    const data = dataset.value.datalink.inline_data
    const visualization = data.visualization

    
    // Data structures for Plotly
    const traces = [];

    // Data for the Pareto frontier
    const paretoData = data.challenge_participants.map((participant) => ([
        participant.metric_x,
        participant.metric_y,
    ]));
    
    const paretoPoints = pf.getParetoFrontier(paretoData);

    const globalParetoTrace = {
        x: paretoPoints.map((point) => point[0]),
        y: paretoPoints.map((point) => point[1]),
        mode: 'lines',
        type: 'scatter',
        name: '<span style="color:black;">Global Pareto Frontier</span>',
        line: {
            dash: 'dot',
            width: 1,
            color: 'rgb(89, 89, 89)',
        },
    };

    const paretoTrace = {
        x: paretoPoints.map((point) => point[0]),
        y: paretoPoints.map((point) => point[1]),
        mode: 'lines',
        type: 'scatter',
        name: 'Calculate Pareto Frontier',
        line: {
            dash: 'dot',
            width: 1,
            // color: 'rgb(11, 87, 159)',
            color: 'rgb(244, 124, 33)',
        }
    };
    

    // Add the pareto trace to the trace array
    traces.push(globalParetoTrace, paretoTrace);

    // Go through each object in challenge participants
    for (let i = 0; i < data.challenge_participants.length; i++) {
        const participant = data.challenge_participants[i];

        const trace = {
            x: [participant.metric_x],
            y: [participant.metric_y],
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 12,
                symbol: getRandomSymbol()
            },
            name: participant.tool_id,
            // error_x: {
            //     type: 'data',
            //     array: [participant.stderr_x],
            //     visible: true,
            // },
            // error_y: {
            //     type: 'data',
            //     array: [participant.stderr_y],
            //     visible: true,
            // },
        };

        traces.push(trace);
    }


    // Create the chart layout
    const layout = {
        title: visualization.x_axis+' + '+visualization.y_axis,
        annotations: getOptimizationArrow(visualization.optimization, paretoPoints),
        xaxis: {
            title: { text: visualization.x_axis,
                font: {
                    family: 'Arial, sans-serif', 
                    size: 14, 
                    color: 'black', 
                    weight: 'bold',
                },
            }
        },
        yaxis: {
            title: { text: visualization.y_axis,
                font: {
                    family: 'Arial, sans-serif', 
                    size: 14, 
                    color: 'black', 
                    weight: 'bold', 
                },
            },
        },
        margin: {
            l: 50, 
            r: 50, 
            t: 30, 
            b: 30,
        },
        paper_bgcolor: '#ffffff',
        legend: {
            orientation: 'h',
            x: 0.05,
            y: -0.3,
            borderwidth: 1,
        },
        images: getImagePosition(visualization.optimization)
        // [
        //     {
        //     x: 0.1,
        //     y: 0.1,
        //     sizex: 0.5,
        //     sizey: 0.3,
        //     source: "/2018.OpenEBench.logo.Manual_page2.png",
        //     xref: "paper",
        //     yref: "paper",
        //     xanchor: "right",
        //     yanchor: "bottom",
        //     "opacity": 0.5,
        //     }
        // ],

    };

    const scatterPlot = Plotly.newPlot('scatter-plot', traces, layout);

    // Update Pareto Frontier 
    scatterPlot.then((gd) => {
        gd.on('plotly_legendclick', (event) => {
            let traceIndex = event.curveNumber;

            // If Pareto was clicked (index 0) do nothing
            if (traceIndex === 0) {
                return false;
    
            }else if (traceIndex === 1){
                return true;
            }
            else{
                // Adjust the index to exclude the Pareto (which is at index 0)
                traceIndex = traceIndex - 2;
                // Hide or show the tool based on its current state
                const toolHidden = paretoData[traceIndex].hidden;
                paretoData[traceIndex].hidden = !toolHidden;

                // Filter visible tools
                const visibleTools = paretoData.filter((tool) => !tool.hidden);
                // Calculate the new Pareto Frontier with the visible tools
                const newParetoPoints = pf.getParetoFrontier(visibleTools);
                // Update the trace of the Pareto frontier
                Plotly.update('scatter-plot', { x: [newParetoPoints.map((point) => point[0])], y: [newParetoPoints.map((point) => point[1])] }, {}, 1);
            }
            
        });
    });


})

// ----------------------------------------------------------------
// Functions
// ----------------------------------------------------------------

const downloadChart = (format) => {
    const Plotly = require('plotly.js-dist');

    const chart = document.getElementById('scatter-plot');

    if (format === 'png' || format === 'svg' || format === 'pdf') {
        // Descargar como PNG, SVG o PDF usando Chart Studio
        const options = { format, height: 500, width: 700 };

        Plotly.toImage(chart, options)
        .then((url) => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `${datasetId.value}.${format}`;
            link.click();
        })
        .catch((error) => {
            console.error(`Error al descargar el gráfico como ${format}`, error);
        });
    } else if (format === 'json') {
        // Descargar como JSON
        const chartData = chart.data // Obtener datos del gráfico
        console.log(chartData)
        const jsonData = JSON.stringify(chartData);

        const link = document.createElement('a');
        link.href = `data:text/json;charset=utf-8,${encodeURIComponent(jsonData)}`;
        link.download = `${datasetId.value}.json`;
        link.click();
    }
};


// Function to get a random symbol
function getRandomSymbol() {
    const symbols = ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'triangle-down', 'star', 'hexagram'];
    const randomIndex = Math.floor(Math.random() * symbols.length);
    return symbols[randomIndex];
}

// ----------------------------------------------------------------
// Image Position
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
        "opacity": 0.5,
    }

    ImagePositions.push(imagesPosition)

    return ImagePositions

}

// This function creates the annotations for the optimization arrow
function getOptimizationArrow(optimization, paretoPoints) {
  const arrowAnnotations = [];

  let arrowX, arrowY;
  let axAdjustment = 0;
  let ayAdjustment = 0;

  // Determine arrow position based on optimization
  switch (optimization) {
    case 'top-left':
      arrowX = Math.min(...paretoPoints.map(point => point[0]));
      arrowY = Math.max(...paretoPoints.map(point => point[1]));
      arrowY = arrowY + 0.01  // margin
      axAdjustment = 20;
      ayAdjustment = 20;
      break;
    case 'top-right':
      arrowX = Math.max(...paretoPoints.map(point => point[0]));
      arrowY = Math.max(...paretoPoints.map(point => point[1]));
      arrowX = arrowX + 0.009
      arrowY = arrowY + 0.009

      axAdjustment = -20;
      ayAdjustment = 20;
      break;
    case 'bottom-left':
      arrowX = Math.min(...paretoPoints.map(point => point[0]));
      arrowY = Math.min(...paretoPoints.map(point => point[1]));
      arrowY = arrowY - 0.03

      axAdjustment = 20;
      ayAdjustment = -20;
      break;
    case 'bottom-right':
      arrowX = Math.max(...paretoPoints.map(point => point[0]));
      arrowY = Math.min(...paretoPoints.map(point => point[1]));
      arrowX = arrowX + 0.03;
      arrowY = arrowY - 0.03

      axAdjustment = -20;
      ayAdjustment = -20;
      break;
    default:
      // By default, place the arrow in the upper left corner
      arrowX = Math.min(...paretoPoints.map(point => point[0]));
      arrowY = Math.max(...paretoPoints.map(point => point[1]));
      arrowY = arrowY + 0.01  // margin

  }

  // Crear la anotación para la flecha
  const arrowAnnotation = {
    x: arrowX,
    y: arrowY,
    xref: 'x',
    yref: 'y',
    text: 'Optimal corner',
    showarrow: true,
    arrowhead: 3,
    ax: axAdjustment,
    ay: ayAdjustment,
  };

  arrowAnnotations.push(arrowAnnotation);

  return arrowAnnotations;
}


</script>
