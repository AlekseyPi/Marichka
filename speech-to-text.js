const MIN_RECORDING_DURATION = 3000; // Minimum recording duration in milliseconds
const MAX_RECORDING_DURATION = 10000; // Maximum recording duration in milliseconds
const SILENCE_DETECTION_TIMEOUT = 2000; // Timeout for silence detection in milliseconds

document.addEventListener("DOMContentLoaded", startRecording);

let mediaRecorder;
let audioChunks = [];
let silenceDetection;
let startTimestamp;
let recordingInterval;

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule("silence-detector-processor.js");

    const silenceDetectorNode = new AudioWorkletNode(
      audioContext,
      "silence-detector-processor"
    );
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(silenceDetectorNode).connect(audioContext.destination);

    silenceDetectorNode.port.onmessage = (event) => {
      if (event.data.isSilent) {
        const currentTime = new Date().getTime();
        if (
          !silenceDetection &&
          currentTime - startTimestamp > MIN_RECORDING_DURATION
        ) {
          silenceDetection = setTimeout(
            () => stopRecording(),
            SILENCE_DETECTION_TIMEOUT
          );
        }
      } else {
        clearTimeout(silenceDetection);
        silenceDetection = null;
      }
    };

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      audioChunks = [];
      sendToOpenAI(audioBlob);
      clearInterval(recordingInterval);
    };
    mediaRecorder.start();

    startTimestamp = new Date().getTime();
    updateRecordingTime();
    recordingInterval = setInterval(updateRecordingTime, 1000);

    setTimeout(() => {
      if (mediaRecorder.state !== "inactive") {
        stopRecording();
      }
    }, MAX_RECORDING_DURATION);
  } catch (error) {
    console.error("Error setting up audio recording:", error);
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((new Date().getTime() - startTimestamp) / 1000);
  document.getElementById("recordingTime").innerText = elapsed;
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearTimeout(silenceDetection);
}

async function sendToOpenAI(audioBlob) {
  const openaiSecretKey = await getOpenAiSecretKey();
  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append("model", "whisper-1");

  fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiSecretKey}`,
    },
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("transcription").innerText = data.text;
    })
    .catch((error) => console.error("Error:", error));
}

async function getOpenAiSecretKey() {
  let openaiSecretKey = localStorage.getItem("openaiSecretKey");
  if (!openaiSecretKey) {
    openaiSecretKey = prompt(
      "Please enter your OpenAI secret key. You can activate the OpenAI paid plan here: https://platform.openai.com/account/billing/overview. Then, you can generate an OpenAI secret key on this page: https://platform.openai.com/account/api-keys, and provide it here."
    );
    localStorage.setItem("openaiSecretKey", openaiSecretKey);
  }
  return openaiSecretKey;
}
