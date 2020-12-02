export function constant(graph, helpers, outputFrame) {
  const parameters = {
    name: 'constant',
    value: 0,
  };

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },
    process(inputFrame, outputFrame) {
      outputFrame.data[parameters.name] = parameters.value;
      return outputFrame;
    },
    destroy() {

    },
  }
}

export default {constant};

