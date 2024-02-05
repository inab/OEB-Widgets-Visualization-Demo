<template>
    <div>
        <h4>Scatter plot</h4>
        <p>Dataset Id: {{ datasetId }} </p>
        <p>Modification Date: {{ modificationDate }}</p>

        <!-- Button Row -->
        <div class="row justify-content-end mr-4">
            <!-- Classification -->
            <b-dropdown text="Classification" variant="primary" size="sm" class="m-md-2 button-classification">
                <b-dropdown-text class="font-weight-bold text-classifi"><strong>Select a Classification
                        method:</strong></b-dropdown-text>
                <b-dropdown-item @click="noClassification"> No Classification </b-dropdown-item>
                <b-dropdown-item @click="toggleKmeansVisibility"> K-Means Clustering </b-dropdown-item>
                <b-dropdown-item @click="toggleQuartilesVisibility"> Square Quartiles </b-dropdown-item>

            </b-dropdown>

            <!-- Reset View / optimal view -->
            <b-button @click="toggleView" variant="primary" size="sm" class="m-md-2 button-resetView">
                {{ viewButtonText }}
            </b-button>

            <!-- Button Dowloand -->
            <b-dropdown text="Download" variant="primary" size="sm" class="m-md-2 button-download">
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


        <!-- Table -->
        <div id="tableSQ" class="">
            <table class="cuartiles-table table table-striped" v-if="cuartilesData.length > 0">
                <tr>
                    <th>Tool</th>
                    <th>Quartil</th>
                </tr>
                <tr v-for="item in cuartilesData" :key="item.tool_id">
                    <td>{{ item.tool_id }}</td>
                    <td :class="'quartil-' + item.cuartil">{{ item.cuartil }}</td>
                </tr>
            </table>
        </div>

        <!-- Error message -->
        <div>
            <b-alert :show="dismissCountDown > 0" dismissible variant="danger" @dismissed="dismissCountDown = 0"
                @dismiss-count-down="countDownChanged">
                At least four participants are required for the benchmark!!
            </b-alert>
        </div>

    </div>
</template>

<script setup>
const pf = require('pareto-frontier');
const clustering = require('density-clustering');
import { onMounted, ref, computed } from 'vue';
import * as statistics from 'simple-statistics';

const dataset = ref(null);
const data = ref(null);
const datasetId = ref(null);
const modificationDate = ref(null);
const paretoPoints = ref([]);
// 
const optimalXaxis = ref(null);
const optimalYaxis = ref(null);

// K-means Clustering
const showShapesKmeans = ref(false);
let shapes = [];

// Error messages
const showMessageError = ref(false);
const dismissCountDown = ref(0);

const countDownChanged = () => {
    if (dismissCountDown.value > 0) {
        dismissCountDown.value -= 1;
    }
};

// Square Quartiles
const showShapesSquare = ref(false);
const showAnnotationSquare = ref(false);
const cuartilesData = ref([]);
const toolID = ref([]);
const coordenadasX = ref([]);
const coordenadasY = ref([]);

// view
const viewApplied = ref(false);

onMounted(async () => {
    const Plotly = require('plotly.js-dist');
    const response = await fetch('/raw_data_OEBD00200002UK0.json');
    dataset.value = await response.json();
    datasetId.value = dataset.value._id
    modificationDate.value = new Date(dataset.value.dates.modification).toUTCString()
    data.value = dataset.value.datalink.inline_data
    const visualization = data.value.visualization


    // Data structures for Plotly
    const traces = [];

    // Data for the Pareto frontier and Quartile
    // ----------------------------------------------------------------
    coordenadasX.value = data.value.challenge_participants.map((participant) => participant.metric_x);
    coordenadasY.value = data.value.challenge_participants.map((participant) => participant.metric_y);
    toolID.value = data.value.challenge_participants.map((participant) => participant.tool_id);
    // 
    const dataPoints = data.value.challenge_participants.map((participant) => ([
        participant.metric_x,
        participant.metric_y,
    ]));

    // ----------------------------------------------------------------
    // K-Means Clustering

    paretoPoints.value = pf.getParetoFrontier(dataPoints);

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

    // Dynamic
    const paretoTrace = {
        x: paretoPoints.value.map((point) => point[0]),
        y: paretoPoints.value.map((point) => point[1]),
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
            showlegend: true
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
        title: visualization.x_axis + ' + ' + visualization.y_axis,
        autosize: false,
        width: 1080,
        height: 600,
        annotations: getOptimizationArrow(visualization.optimization, paretoPoints.value),
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
        showlegend: true
    };

    const scatterPlot = Plotly.newPlot('scatter-plot', traces, layout);
    createShapeClustering(dataPoints)

    // Get rangees from ejest graph
    scatterPlot.then(scatterPlot => {
        const layoutObj = scatterPlot.layout;
        optimalXaxis.value = layoutObj.xaxis.range;
        optimalYaxis.value = layoutObj.yaxis.range;
    });


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

                // If hiding the trace, check if there are at least 4 visible traces
                if (!toolHidden) {
                    const visibleTools = dataPoints.filter((tool) => !tool.hidden);
                    if (visibleTools.length <= 4) {
                        // Show Message Error
                        console.log("Debe haber al menos 4 traces visibles.");
                        // Mostrar el mensaje de error
                        showMessageError.value = true;
                        dismissCountDown.value = 5; // Establecer el tiempo deseado en segundos

                        // Iniciar el temporizador para ocultar el alerta después de 5 segundos
                        const timer = setInterval(() => {
                            if (dismissCountDown.value > 0) {
                                dismissCountDown.value -= 1;
                            } else {
                                showMessageError.value = false;
                                clearInterval(timer);
                            }
                        }, 1000); // Actualizar cada segundo

                        return false;
                    }
                } else {
                    showMessageError.value = false;
                }

                // Toggle the hidden state
                dataPoints[traceIndex].hidden = !toolHidden;

                // Filter visible tools
                const updatedVisibleTools = dataPoints.filter((tool) => !tool.hidden);

                // Recalculate Clustering
                createShapeClustering(updatedVisibleTools)
                showShapesKmeans.value = true;
                const layout = {
                    shapes: showShapesKmeans.value ? shapes : [],
                    annotations: getOptimizationArrow(data.value.visualization.optimization, paretoPoints.value)
                };


                // Calculate the new Pareto Frontier with the visible tools
                const newParetoPoints = pf.getParetoFrontier(updatedVisibleTools);

                // Update the trace of the Pareto frontier
                const newTraces = { x: [newParetoPoints.map((point) => point[0])], y: [newParetoPoints.map((point) => point[1])] }
                Plotly.update('scatter-plot', newTraces, layout, 1);
            }

        });
    });
})

// ----------------------------------------------------------------
// Functions
// ----------------------------------------------------------------
const resetView = () => {
    const Plotly = require('plotly.js-dist');
    const layout = {
        xaxis: {
            range: [0, Math.max(...coordenadasX.value) + 5000],
        },
        yaxis: {
            range: [0, Math.max(...coordenadasY.value) + 0.05],
        }
    };
    Plotly.update('scatter-plot', {}, layout);
    viewApplied.value = true;
};

const optimalView = () => {
    const Plotly = require('plotly.js-dist');
    const layout = {
        xaxis: {
            range: [optimalXaxis.value[0], optimalXaxis.value[1]],
            title: {
                text: dataset.value.datalink.inline_data.visualization.x_axis,
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: 'black',
                    weight: 'bold',
                },
            }
        },
        yaxis: {
            range: [optimalYaxis.value[0], optimalYaxis.value[1]],
            title: {
                text: dataset.value.datalink.inline_data.visualization.y_axis,
                font: {
                    family: 'Arial, sans-serif',
                    size: 14,
                    color: 'black',
                    weight: 'bold',
                },
            },
        },
    }
    Plotly.update('scatter-plot', {}, layout);
    viewApplied.value = false; // Optimal view is applied
};

const toggleView = () => {
    if (viewApplied.value) {
        optimalView();
    } else {
        resetView();
    }
};

const viewButtonText = computed(() => {
    return viewApplied.value ? 'Optimal View' : 'Reset View';
});

// NO CLASSIFICATION
// ----------------------------------------------------------------
const noClassification = () => {
    cuartilesData.value = [];
    showShapesKmeans.value = false;
    showShapesSquare.value = false;
    showAnnotationSquare.value = false;
    const Plotly = require('plotly.js-dist');
    const layout = {
        shapes: false ? shapes : [],
        annotations: getOptimizationArrow(data.value.visualization.optimization, paretoPoints.value)
    };
    Plotly.update('scatter-plot', {}, layout);
};


// ----------------------------------------------------------------
// SQUARE QUARTILES
// ----------------------------------------------------------------
// Function to toggle the visibility of the Square Quartiles
const toggleQuartilesVisibility = () => {
    if (!showShapesSquare.value) {
        showShapesSquare.value = !showShapesSquare.value;
        showAnnotationSquare.value = !showAnnotationSquare.value
        calculateQuartiles();
    }
};

const calculateQuartiles = () => {

    const cuartilesX = [
        statistics.quantile(coordenadasX.value, 0.25),
        statistics.quantile(coordenadasX.value, 0.5),
        statistics.quantile(coordenadasX.value, 0.75),
    ];
    const cuartilesY = [
        statistics.quantile(coordenadasY.value, 0.25),
        statistics.quantile(coordenadasY.value, 0.5),
        statistics.quantile(coordenadasY.value, 0.75),
    ];
    cuartilesData.value = [];
    toolID.value.forEach((toolId, index) => {
        const x = coordenadasX.value[index];
        const y = coordenadasY.value[index];
        let cuartil;

        if (x <= cuartilesX[1] && y <= cuartilesY[1]) {
            cuartil = '1';
            // cuartil = '4';
        } else if (x > cuartilesX[1] && y <= cuartilesY[2] && y > cuartilesY[1]) {
            cuartil = '2';
            // cuartil = '1';
        } else if (x <= cuartilesX[1] && y > cuartilesY[1]) {
            cuartil = '3';
            // cuartil = '2';
        } else {
            cuartil = '4';
            // cuartil = '3';
        }
        cuartilesData.value.push({ tool_id: toolId, cuartil });
    });

    // Create quartile lines to the layout
    const shapes = [
        {
            type: 'line',
            x0: cuartilesX[1],
            x1: cuartilesX[1],
            y0: 0,
            y1: Math.max(...cuartilesY) + 10,
            line: {
                color: '#C0D4E8',
                width: 2,
                dash: 'dash'
            }
        },
        {
            type: 'line',
            y0: cuartilesY[1],
            y1: cuartilesY[1],
            x0: 0,
            x1: Math.max(...cuartilesX) + 1500000,
            line: {
                color: '#C0D4E8',
                width: 2,
                dash: 'dash'
            }
        },
    ];

    // Annotations
    annotationSquareQuartile(cuartilesData.value, toolID, coordenadasX, coordenadasY)
    // Add Quartiles
    const layout = {
        shapes: showShapesSquare.value ? shapes : [],
    };
    const Plotly = require('plotly.js-dist');
    Plotly.update('scatter-plot', {}, layout);
};

// Annotation for Square Quartiles
const annotationSquareQuartile = (cuartilesData, toolID, coordenadasX, coordenadasY) => {
    const cuartilPositions = {};
    cuartilesData.forEach((item) => {
        const toolIndex = toolID.value.indexOf(item.tool_id);
        if (!cuartilPositions[item.cuartil]) {
            cuartilPositions[item.cuartil] = {
                x: 0,
                y: 0,
                count: 0,
            };
        }
        cuartilPositions[item.cuartil].x += coordenadasX.value[toolIndex];
        cuartilPositions[item.cuartil].y += coordenadasY.value[toolIndex];
        cuartilPositions[item.cuartil].count += 1;
    });
    let coordenadasCuartil = []
    const getCoordenadasByCuartil = Object.keys(cuartilPositions).map((cuartil) => {
        const avgX = cuartilPositions[cuartil].x / cuartilPositions[cuartil].count;
        const avgY = cuartilPositions[cuartil].y / cuartilPositions[cuartil].count;
        coordenadasCuartil.push({ x: avgX, y: avgY, numCuartil: cuartil })
    });

    // Create Annotation
    let position = asignaPositionCuartil(coordenadasCuartil)
    const newAnnotation = position.map(({ position, numCuartil }) => {
        let annotation = {};
        switch (position) {
            case 'top-left':
                annotation = {
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.03,
                    xanchor: 'right',
                    y: 0.9,
                    yanchor: 'bottom',
                    text: numCuartil,
                    showarrow: false,
                    font: {
                        size: 30,
                        color: '#5A88B5'
                    }
                };
                break;
            case 'bottom-right':
                annotation = {
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.97,
                    xanchor: 'left',
                    y: 0.1,
                    yanchor: 'top',
                    text: numCuartil,
                    showarrow: false,
                    font: {
                        size: 30,
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
                    y: 0.1,
                    yanchor: 'top',
                    text: numCuartil,
                    showarrow: false,
                    font: {
                        size: 30,
                        color: '#5A88B5'
                    }
                };
                break;
            case 'top-right':
                annotation = {
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.97,
                    xanchor: 'left',
                    y: 1,
                    yanchor: 'top',
                    text: numCuartil,
                    showarrow: false,
                    font: {
                        size: 30,
                        color: '#5A88B5'
                    }
                };
                break;
            default:
                break;
        }
        return annotation;
    });

    const annotations = getOptimizationArrow(data.value.visualization.optimization, paretoPoints.value)
    const layout = {
        annotations: showAnnotationSquare.value ? annotations.concat(newAnnotation) : [],
    };
    const Plotly = require('plotly.js-dist');
    Plotly.update('scatter-plot', {}, layout);
}

// Asigna position
const asignaPositionCuartil = (coordenadasCuartil) => {
    const positions = coordenadasCuartil.map((point, index) => {
        const nextIndex = (index + 1) % 4;
        const position =
            index === 0
                ? 'bottom-left'
                : index === 1
                    ? 'top-right'
                    : nextIndex === 0
                        ? 'bottom-right'
                        : 'top-left';
        return { position, numCuartil: point.numCuartil };
    });
    return positions
};


// ----------------------------------------------------------------
// K-MEANS CLUSTERING
// ----------------------------------------------------------------
const toggleKmeansVisibility = () => {
    showShapesKmeans.value = !showShapesKmeans.value;
    updatePlotVisibility();
    showShapesKmeans.value = false;
    cuartilesData.value = [];
    showShapesSquare.value = false;
    showAnnotationSquare.value = false;
};
// Visibility of the graph with K-means Clustering classification
const updatePlotVisibility = () => {
    const Plotly = require('plotly.js-dist');
    const layout = {
        shapes: showShapesKmeans.value ? shapes : [],
        annotations: getOptimizationArrow(data.value.visualization.optimization, paretoPoints.value)
    };
    Plotly.update('scatter-plot', {}, layout);
};

const createShapeClustering = (dataPoints) => {

    // ----------------------------------------------------------------
    // K-Means Clustering
    const kmeans = new clustering.KMEANS();
    const clusters = kmeans.run(dataPoints, 4);

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
            }
        };
    });

    // return shapes
}


// DOWNLOAD
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
.button-download {
    width: 160px;
}

.text-download {
    padding: auto;
    font-size: small;
}

.button-classification {
    width: 200px;
}

.button-resetView {
    width: 150px;
}

.text-classifi {
    padding: auto;
    font-size: small;
}


.cuartiles-table {
    margin: 0 auto;
    width: 80%;
    border-collapse: collapse;
    border-radius: 5px;
    margin-top: 20px;
}

.cuartiles-table th {
    background-color: #E2E3E5;
    text-align: center;

}

.cuartiles-table td {
    border: 1px solid #dddddd;
    text-align: center;
    padding: 5px;
}

.quartil-1 {
    background-color: #5495D6;
}

.quartil-2 {
    background-color: #7FB0E0;
}

.quartil-3 {
    background-color: #AACAEB;
}

.quartil-4 {
    background-color: #D4E5F5;
}
</style>
