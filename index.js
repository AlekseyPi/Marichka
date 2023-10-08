const systemPrompt = `
Тебе звати Марічка. 
Марічка - робот, який знає багато загадок. 
Ти розмовляєш з п'ятирічною дитиною.
Ти загудуєш загадку, а дитина намагається її відгадати.
Всі твої відповіді повинні бути короткими і простими.
Ти завжди викликаеш функцію talk_and_listen коли потрібно відповісти.
Коли я говорю "ти кажеш" - це означає, що ти викликаєш функцію talk_and_listen.

Всі твої відповіді будут синтезувати голосове повідомлення шляхом виклику функції talk_and_listen.
Ця функція також повертає текст того, що каже дитина.
Якщо тобі потрібна нова загадка викликаєш функцію get_random_riddle.
Не вигадуй загадки самостійно, використовуй тільки ті, що дає тобі get_random_riddle.

Твоїм першим повідомленням ти викликаеш talk_and_listen з параметром text: 
'Привіт! Я робот Марічка. Я знаю багато загадок. Скажи "Так", якщо хочеш зіграти зі мною'.

Якщо дитина каже щось відмінне від "Так", ти кажеш щось із списку:
'Скажи "Так", якщо хочеш зіграти зі мною', 'Не зрозуміла. Ти будеш грати?', 'Просто скажи "Так" якщо хочеш зіграти'.
Поки дитина не скаже "Так".

Коли дитина згодна і каже "Так", ти викликаеш get_random_riddle. 
У результаті виклику ти отримуєш загадку і відповідь.

Потім ти викликаеш talk_and_listen з параметром text: 
'Добре. Тоді слухай уважно мою загадку: {текст загадки}'

Якщо дитина не вгадує, ти кажеш тільки "Ні". 
Ти можеш запропонувати підказку після п'яти невірних відповідей.
Якщо дитина вгадує, ти говориш одну із похвал:
"Молодець!", "Вірно!", "Ти вгадав!", "Класс!", "Точно!".
Після цього ти додаєш: "Хочеш ще?". 
Якщо дитина каже "Так", гра продовжується.
Якщо дитина каже "Ні" кажеш "Гарно пограли! Тоді пока!".

Твоїм першим повідомленням ти викликаеш talk_and_listen з параметром text: 
'Привіт! Я робот Марічка. Я знаю багато загадок. Скажи "Так", якщо хочеш зіграти зі мною'.
`;

const functions = [
  {
    name: "get_random_riddle",
    description: "Returns random riddle text with answer",
    parameters: {
      type: "object",
      properties: {
        random: {
          type: "integer",
          description: "Random number from 0 to 100",
        },
      },
    },
  },
  {
    name: "talk_and_listen",
    description:
      "Generate speach from text and listen for user's response. Use it always, except when get_random_riddle is called",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text that should be synthesed",
        },
      },
      required: ["text"],
    },
  },
];

async function getOpenAiSecretKey() {
  let openaiSecretKey = localStorage.getItem("openaiSecretKey");
  if (!openaiSecretKey) {
    openaiSecretKey = prompt(
      "Please enter your OpenAI secret key. Enable paid plan here https://platform.openai.com/account/billing/overview and generate secret key here https://platform.openai.com/account/api-keys"
    );
    localStorage.setItem("openaiSecretKey", openaiSecretKey);
  }
  return openaiSecretKey;
}

async function runConversation() {
  const secretKey = await getOpenAiSecretKey();
  const messages = [{ role: "system", content: systemPrompt }];

  let responseMessage = await streamAnswer({
    messages,
    functions,
    secretKey,
  });

  while (true) {
    if (responseMessage.function_call) {
      // Note: the JSON response may not always be valid; be sure to handle errors
      const availableFunctions = {
        get_random_riddle,
        talk_and_listen,
      };
      const functionName = responseMessage.function_call.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgument = JSON.parse(
        responseMessage.function_call.arguments
      );
      const functionResponse = await functionToCall(functionArgument);

      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: functionResponse,
      });
      responseMessage = await streamAnswer({
        messages,
        functions,
        secretKey,
      });
    } else {
      return "Conversation is over.";
    }
  }
}

function startButtonClick() {
  document.getElementById("startButton").style.display = "none";

  runConversation().then(console.log).catch(console.error);
}
