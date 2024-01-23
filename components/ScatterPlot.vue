<template>
    <div>
        <h4>Scatter plot</h4>
        <p>Dataset Id: {{ datasetId }} </p>
        <p>Modification Date: {{ modificationDate }}</p>
        
        <!-- Button Row -->
        <div class="row justify-content-end mr-4">
            <!-- Classification -->
            <b-dropdown text="Classification" size="sm" variant="primary" class="m-md-2 button-classification">
                <b-dropdown-text class="font-weight-bold text-classifi"><strong>Select a Classification
                        method:</strong></b-dropdown-text>
                <b-dropdown-item> No Classification </b-dropdown-item>
                <b-dropdown-item @click="toggleShapesVisibility"> K-Means Clustering </b-dropdown-item>

            </b-dropdown>

            <!-- Button Dowloand -->
            <b-dropdown text="Download" size="sm" variant="primary" class="m-md-2 button-download">
                <b-dropdown-text class="font-weight-bold text-download"><strong>Select a format:</strong></b-dropdown-text>
                <b-dropdown-item @click="downloadChart('png')"> PNG </b-dropdown-item>
                <b-dropdown-item @click="downloadChart('svg')"> SVG (only plot) </b-dropdown-item>
                <b-dropdown-item @click="downloadChart('json')"> JSON </b-dropdown-item>
                <!-- <b-dropdown-divider></b-dropdown-divider> -->
            </b-dropdown>

        </div>

        <br>
        <!-- Scatter Plot -->
        <div id="scatter-plot"></div>
    </div>
</template>

<script setup>
const pf = require('pareto-frontier');
const clustering = require('density-clustering');
import { onMounted, ref } from 'vue';
import * as statistics from 'simple-statistics';


const dataset = ref(null);
const datasetId = ref(null);
const modificationDate = ref(null);
const showShapes = ref(false);
let shapes = [];

onMounted(async () => {
    const Plotly = require('plotly.js-dist');
    const response = await fetch('/raw_data_OEBD00200002UK0.json');
    dataset.value = await response.json();
    datasetId.value = dataset.value._id
    modificationDate.value = new Date(dataset.value.dates.modification).toUTCString()
    const data = dataset.value.datalink.inline_data
    const visualization = data.visualization


    // Data structures for Plotly
    const traces = [];

    // Data for the Pareto frontier
    // ----------------------------------------------------------------
    const dataPoints = data.challenge_participants.map((participant) => ([
        participant.metric_x,
        participant.metric_y,
    ]));
    // console.log(dataPoints);


    // ----------------------------------------------------------------
    // QUARTILES CUADRADOS
    const dataTools = data.challenge_participants.map((participant) => (
        {
            tool: participant.tool_id,
            x: participant.metric_x,
            y: participant.metric_y,
        }
    ));

    // Separa las coordenadas X e Y en dos arrays distintos
    const coordenadasX = dataTools.map(herramienta => herramienta.x);
    const coordenadasY = dataTools.map(herramienta => herramienta.y);

    // Calcula los cuartiles para las coordenadas X e Y
    const cuartilesX = [
        statistics.quantile(coordenadasX, 0.25),
        statistics.quantile(coordenadasX, 0.5),
        statistics.quantile(coordenadasX, 0.75),
    ];

    const cuartilesY = [
        statistics.quantile(coordenadasY, 0.25),
        statistics.quantile(coordenadasY, 0.5),
        statistics.quantile(coordenadasY, 0.75),
    ];




    // ----------------------------------------------------------------
    // K-Means Clustering
    const kmeans = new clustering.KMEANS();
    const clusters = kmeans.run(dataPoints, 4);
    // console.log(clusters);

    // Create shapes based on clusters
    shapes = clusters.map((cluster) => {
        const xValues = cluster.map((dataPointIndex) => dataPoints[dataPointIndex][0]);
        const yValues = cluster.map((dataPointIndex) => dataPoints[dataPointIndex][1]);

        return {
            type: 'rect',
            xref: 'x',
            yref: 'y',
            x0: Math.min(...xValues), y0: Math.min(...yValues),
            x1: Math.max(...xValues), y1: Math.max(...yValues),
            opacity: 0.2,
            fillcolor: 'rgba(0, 72, 129, 183)',
            line: {
                color: '#2A6CAB',
            },
        };
    });

    const paretoPoints = pf.getParetoFrontier(dataPoints);

    const globalParetoTrace = {
        x: paretoPoints.map((point) => point[0]),
        y: paretoPoints.map((point) => point[1]),
        mode: 'lines',
        type: 'scatter',
        name: '<span style="color:black;">Global Pareto Frontier</span>',
        line: {
            dash: 'dot',
            width: 2,
            color: 'rgb(152, 152, 152)',
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
            width: 2,
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
                size: 14,
                symbol: getSymbol(),
                color: getColor()
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

    // Crea trazos adicionales para las líneas de cuartiles
    const cuartilTraceX = {
        x: cuartilesX.map(cuartil => cuartil),
        y: cuartilesX.map(() => statistics.mean(coordenadasY)), // Línea horizontal a la altura del promedio de Y
        mode: 'lines',
        type: 'scatter',
        line: { color: 'black', width: 2, dash: 'dash' },
        name: 'Cuartiles X',
    };

    const cuartilTraceY = {
        x: cuartilesY.map(() => statistics.mean(coordenadasX)), // Línea vertical a la altura del promedio de X
        y: cuartilesY.map(cuartil => cuartil),
        mode: 'lines',
        type: 'scatter',
        line: { color: 'black', width: 2, dash: 'dash' },
        name: 'Cuartiles Y',
    };

    traces.push(cuartilTraceX, cuartilTraceY);

    // Create the chart layout
    const layout = {
        title: visualization.x_axis + ' + ' + visualization.y_axis,
        autosize: false,
        width: 1080,
        height: 600,
        annotations: getOptimizationArrow(visualization.optimization, paretoPoints),
        xaxis: {
            title: {
                text: visualization.x_axis,
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
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
                    size: 14,
                    color: 'black',
                    weight: 'bold',
                },
            },
        },

        margin: { l: 60, r: 50, t: 30, b: 30, pad: 4 },
        paper_bgcolor: '#ffffff',
        legend: {
            orientation: 'h',
            x: 0.1,
            y: -0.2,
            // borderwidth: 1,
            font: {
                size: 14,
            }
        },
        plot_bgcolor: '#F8F9F9',
        images: getImagePosition(visualization.optimization),

    };

    const scatterPlot = Plotly.newPlot('scatter-plot', traces, layout);

    // Update Pareto Frontier 
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
                // Adjust the index to exclude the Pareto (which is at index 0)
                traceIndex = traceIndex - 2;
                // Hide or show the tool based on its current state
                const toolHidden = dataPoints[traceIndex].hidden;
                dataPoints[traceIndex].hidden = !toolHidden;

                // Filter visible tools
                const visibleTools = dataPoints.filter((tool) => !tool.hidden);
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

// ----------------------------------------------------------------
// Función para alternar la visibilidad de los shapes
const toggleShapesVisibility = () => {
    showShapes.value = !showShapes.value;
    updatePlotVisibility();
};
// Función para actualizar la visibilidad del gráfico y shapes
const updatePlotVisibility = () => {
    const Plotly = require('plotly.js-dist');
    const layout = {
        shapes: showShapes.value ? shapes : [], // Mostrar u ocultar shapes según el estado de la variable
        // ... (resto de tu configuración de layout)
    };
    Plotly.update('scatter-plot', {}, layout);
};

// ----------------------------------------------------------------
// Download
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


<style>
.button-download .btn-primary {
    width: 150px;
    font-size: small;
    background-color: #0b579f;
    color: #ffffff;
}

.text-download {
    padding: auto;
    font-size: small;
}

.button-classification .btn-primary {
    width: 200px;
    background-color: #0b579f;
    color: #ffffff;
}

.text-classifi {
    padding: auto;
    font-size: small;
}
</style>