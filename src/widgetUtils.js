// widgetUtils.js

import Vue from 'vue';

const widgetUtils = {
  test(d) {
    console.log(d);
  },
  // Add other functions here as needed
  greet() {
    console.log('Hello, world!');
  },
  loadWidgetVisualization(data) {
  // Sets charging status based on data presence
  this.loading = !data;
  let visualization = data.datalink.inline_data.visualization;
  let type = visualization.type;
  
  // Set visualizationType based on the type of visualization
  this.visualizationType = type;

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
    this.preparedData.inline_data.visualization = {
      type: visualization.type,
      x_axis: visualization.x_axis,
      y_axis: visualization.y_axis,
      optimization: visualization.optimization
    };
  } else {
    return null;
  }
  console.log('Ha llegado aqui y devolvera: ' + type)
  return type
}

};

export default widgetUtils;

