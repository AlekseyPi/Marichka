async function getElevenLabsApiKey() {
  let apiKey = localStorage.getItem("xiApiKey");
  if (!apiKey) {
    apiKey = prompt("Please enter your ElevenLabs API key.");
    localStorage.setItem("xiApiKey", apiKey);
  }
  return apiKey;
}

async function fetchSpeechAudio(text) {
  const apiKey = await getElevenLabsApiKey();
  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/UKCPU7dPRkILl78Hmi5S/stream",
    {
      method: "POST",
      headers: {
        accept: "audio/mpeg",
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.63,
          style: 0.69,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.blob();
}

async function convertToSpeech() {
  const textInput = document.getElementById("textInput").value;
  try {
    const audioBlob = await fetchSpeechAudio(textInput);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = audioUrl;
    audioPlayer.play();
  } catch (error) {
    console.error("Error fetching speech audio:", error);
  }
}
