const SILENCE_THRESHOLD = 0.15;

class SilenceDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.silenceThreshold = SILENCE_THRESHOLD;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const samples = input[0];
      let isSilent = true;
      for (let i = 0; i < samples.length; i++) {
        if (Math.abs(samples[i]) > this.silenceThreshold) {
          isSilent = false;
          break;
        }
      }
      this.port.postMessage({ isSilent });
    }
    return true;
  }
}

registerProcessor("silence-detector-processor", SilenceDetectorProcessor);
