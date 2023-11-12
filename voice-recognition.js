const SILENCE_THRESHOLD = 0.1; // The silence threshold to detect silence in the audio chunk

document.addEventListener("DOMContentLoaded", startRecording);

let mediaRecorder;
let audioChunks = [];
let silenceDetection;

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(1024, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = function (e) {
    // Analyze the audio chunk to detect silence
    if (isSilent(e.inputBuffer)) {
      if (!silenceDetection) {
        silenceDetection = setTimeout(() => stopRecording(), 2000); // 2 seconds of silence before stopping
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
  };
  mediaRecorder.start();
}

function isSilent(buffer) {
  const data = buffer.getChannelData(0);
  let isSilent = true;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > SILENCE_THRESHOLD) {
      isSilent = false;
      break;
    }
  }
  return isSilent;
}

function stopRecording() {
  mediaRecorder.stop();
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
