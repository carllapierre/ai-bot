const Discord = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config()

const bot = new Discord.Client({ intents: ["GUILD_MESSAGES"] });
const token = process.env.DISCORD;
const command = process.env.COMMAND;
const maxMessageLength = 400;
const typingDelayPerCharacter = 5;

const configuration = new Configuration({
    apiKey: process.env.OPENAI,
});
const openai = new OpenAIApi(configuration);

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async (msg) => {
	// Ignore messages sent by the bot itself
	if (msg.author.bot) {
		return;
	}

	const sanitizedCommand = command.toLowerCase();
	const sanitizedMessage = msg.content?.toLowerCase();

	// Check if the message is a command for the bot
	if (sanitizedMessage.startsWith(sanitizedCommand)) {
		// Start typing in the chat channel to indicate that the bot is generating a response
		msg.channel.startTyping();
		// Extract the message text to send to the OpenAI API
		const input = msg.content.substring(sanitizedCommand.length);
		const author = msg.author.username;

		const response = await openai.createCompletion({
		model: "text-davinci-003",
		//prompt: process.env.PROMPT,
		temperature: 0.9,
		max_tokens: 150,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0.6,
		});

		// Send the response back to the chat channel
		// Split the response into multiple messages if it exceeds the maximum length allowed by Discord
		const responseText = response.data.choices[0].text ?? '';    
		console.log(response.data.choices,responseText.length,maxMessageLength, responseText.length / maxMessageLength )
		const numMessages = Math.ceil(responseText.length / maxMessageLength);
		const typingDelay = responseText.length * typingDelayPerCharacter;
		setTimeout(() => {
			console.log(numMessages)
			for (let i = 0; i < numMessages; i++) {
				const startIndex = i * maxMessageLength;
				const endIndex = (i + 1) * maxMessageLength;
				const messageText = responseText.substring(startIndex, endIndex);
				msg.channel.send(messageText);
			}

			// Stop typing in the chat channel
			msg.channel.stopTyping();
		}, typingDelay);
	}
});

bot.login(token);
