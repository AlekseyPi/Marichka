async function fetchSpeechAudio(text) {
  const apiKey = await getOpenAiSecretKey();
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "nova",
    }),
  });

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
