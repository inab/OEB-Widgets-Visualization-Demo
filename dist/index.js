/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["oeb-Widgets"] = factory();
	else
		root["oeb-Widgets"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/widgetUtils.js":
/*!****************************!*\
  !*** ./src/widgetUtils.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   greet: () => (/* binding */ greet),\n/* harmony export */   loadWidgetVisualization: () => (/* binding */ loadWidgetVisualization),\n/* harmony export */   test: () => (/* binding */ test)\n/* harmony export */ });\n// widgetUtils.js\n\nconst loadWidgetVisualization = function (data) {\n  // Sets charging status based on data presence\n  // this.loading = !data;\n  console.log(data);\n  let visualization = data.datalink.inline_data.visualization;\n  let type = visualization.type;\n\n  // Set visualizationType based on the type of visualization\n  // this.visualizationType = type;\n\n  // Prepare the data to pass to the component\n  const preparedData = {\n    _id: data._id,\n    dates: data.dates,\n    dataset_contact_ids: data.dataset_contact_ids,\n    inline_data: {\n      challenge_participants: [],\n      visualization: {}\n    }\n  };\n\n  // Prepare specific data for Plots\n  if (type === 'bar-plot') {\n    // Process challenge_participants data for BarPlot\n    data.datalink.inline_data.challenge_participants.forEach(participant => {\n      const preparedParticipant = {\n        tool_id: participant.tool_id,\n        metric_value: participant.metric_value,\n        stderr: participant.stderr\n      };\n      preparedData.inline_data.challenge_participants.push(preparedParticipant);\n    });\n\n    // Process visualization data for BarPlot\n    const visualization = data.datalink.inline_data.visualization;\n    preparedData.inline_data.visualization = {\n      metric: visualization.metric,\n      type: visualization.type\n    };\n  } else if (type === '2D-plot') {\n    // Process challenge_participants data for ScatterPlot\n    data.datalink.inline_data.challenge_participants.forEach(participant => {\n      const preparedParticipant = {\n        tool_id: participant.tool_id,\n        metric_x: participant.metric_x,\n        stderr_x: participant.stderr_x,\n        metric_y: participant.metric_y,\n        stderr_y: participant.stderr_y\n      };\n      preparedData.inline_data.challenge_participants.push(preparedParticipant);\n    });\n\n    // Process visualization data for ScatterPlot\n    const visualization = data.datalink.inline_data.visualization;\n    preparedData.inline_data.visualization = {\n      type: visualization.type,\n      x_axis: visualization.x_axis,\n      y_axis: visualization.y_axis,\n      optimization: visualization.optimization\n    };\n  } else {\n    return null;\n  }\n  console.log('Ha llegado aqui y devolvera: ' + type);\n  return type, preparedData;\n};\nconst test = function (d) {\n  console.log(d);\n};\nconst greet = function () {\n  console.log('Hello, world!');\n};\n\n// const widgetUtils = {\n//   test(d) {\n//     console.log(d);\n//   },\n//   // Add other functions here as needed\n//   greet() {\n//     console.log('Hello, world!');\n//   },\n//   loadWidgetVisualization(data) {\n//   // Sets charging status based on data presence\n//   this.loading = !data;\n//   let visualization = data.datalink.inline_data.visualization;\n//   let type = visualization.type;\n\n//   // Set visualizationType based on the type of visualization\n//   this.visualizationType = type;\n\n//   // Prepare the data to pass to the component\n//   this.preparedData = {\n//     _id: data._id,\n//     dates: data.dates,\n//     dataset_contact_ids: data.dataset_contact_ids,\n//     inline_data: {\n//       challenge_participants: [],\n//       visualization: {}\n//     }\n//   };\n\n//   // Prepare specific data for Plots\n//   if (type === 'bar-plot') {\n//     // Process challenge_participants data for BarPlot\n//     data.datalink.inline_data.challenge_participants.forEach(participant => {\n//       const preparedParticipant = {\n//         tool_id: participant.tool_id,\n//         metric_value: participant.metric_value,\n//         stderr: participant.stderr\n//       };\n//       this.preparedData.inline_data.challenge_participants.push(preparedParticipant);\n//     });\n\n//     // Process visualization data for BarPlot\n//     const visualization = data.datalink.inline_data.visualization;\n//     this.preparedData.inline_data.visualization = {\n//       metric: visualization.metric,\n//       type: visualization.type\n//     };\n//   } else if (type === '2D-plot') {\n//     // Process challenge_participants data for ScatterPlot\n//     data.datalink.inline_data.challenge_participants.forEach(participant => {\n//       const preparedParticipant = {\n//         tool_id: participant.tool_id,\n//         metric_x: participant.metric_x,\n//         stderr_x: participant.stderr_x,\n//         metric_y: participant.metric_y,\n//         stderr_y: participant.stderr_y\n//       };\n//       this.preparedData.inline_data.challenge_participants.push(preparedParticipant);\n//     });\n\n//     // Process visualization data for ScatterPlot\n//     const visualization = data.datalink.inline_data.visualization;\n//     this.preparedData.inline_data.visualization = {\n//       type: visualization.type,\n//       x_axis: visualization.x_axis,\n//       y_axis: visualization.y_axis,\n//       optimization: visualization.optimization\n//     };\n//   } else {\n//     return null;\n//   }\n//   console.log('Ha llegado aqui y devolvera: ' + type)\n//   return type\n//   }\n\n// };\n\n// export default widgetUtils;\n\n//# sourceURL=webpack://oeb-Widgets/./src/widgetUtils.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/widgetUtils.js"](0, __webpack_exports__, __webpack_require__);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});