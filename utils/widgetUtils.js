// widgetUtils.js

// Importa las dependencias necesarias si las hay
import Vue from 'vue';

// Definición de la función loadWidgetVisualization
export async function loadWidgetVisualization(data) {
  // Sets charging status based on data presence
  this.loading = !data;
  let visualization = data.datalink.inline_data.visualization;
  let type = visualization.type;

  // Prepare the data to pass to the component
  this.preparedData = {
    _id: data._id,
    dates: data.dates,
    dataset_contact_ids: data.dataset_contact_ids,
    inline_data: {
      challenge_participants: [],
      visualization: {}
    }
  };

  // Prepare specific data for Plots
  if (type === 'bar-plot') {
    // Process challenge_participants data for BarPlot
    data.datalink.inline_data.challenge_participants.forEach(participant => {
      const preparedParticipant = {
        tool_id: participant.tool_id,
        metric_value: participant.metric_value,
        stderr: participant.stderr
      };
      this.preparedData.inline_data.challenge_participants.push(preparedParticipant);
    });

    // Process visualization data for BarPlot
    const visualization = data.datalink.inline_data.visualization;
    this.preparedData.inline_data.visualization = {
      metric: visualization.metric,
      type: visualization.type
    };
  } else if (type === '2D-plot') {
    // Process challenge_participants data for ScatterPlot
    data.datalink.inline_data.challenge_participants.forEach(participant => {
      const preparedParticipant = {
        tool_id: participant.tool_id,
        metric_x: participant.metric_x,
        stderr_x: participant.stderr_x,
        metric_y: participant.metric_y,
        stderr_y: participant.stderr_y
      };
      this.preparedData.inline_data.challenge_participants.push(preparedParticipant);
    });

    // Process visualization data for ScatterPlot
    const visualization = data.datalink.inline_data.visualization;
    const metrics_names = await this.getMetricsNames(visualization.x_axis, visualization.y_axis);
    this.preparedData.inline_data.visualization = {
      type: visualization.type,
      x_axis: metrics_names.metricX,
      y_axis: metrics_names.metricY,
      optimization: visualization.optimization
    };
  } else {
    return null;
  }

  // Check the display type and set the corresponding status
  if (visualization && type) {
    this.visualizationType = type;
  }
}

// Definición de la función getMetricsNames
export async function getMetricsNames(metric_x, metric_y) {
  let metrics_names = { 'metricX': '', 'metricY': '' };

  if (this.metrics.length === 0) {
    await this.$store.dispatch('fetchMetrics');
    this.metrics = this.$store.state.metrics;

    this.metrics.forEach(function (metric) {
      if (metric._metadata && "level_2:metric_id" in metric._metadata) {
        if (metric._metadata["level_2:metric_id"] === metric_x) {
          metrics_names['metricX'] = metric.title;
        }
        if (metric._metadata["level_2:metric_id"] === metric_y) {
          metrics_names['metricY'] = metric.title;
        }
      }
    });
  }
  return metrics_names;
}
