
# DiscordUser.js

DiscordUser.js is a simple Node.js module for interacting with the Discord API. It provides functionality for user authentication, sending messages, managing channels, and connecting to the Discord Gateway. The module is designed to be easy to use and can be a foundation for building Discord bots or other applications that interact with Discord.

## Installation

To use DiscordUser.js in your project, you can install it using npm:

```bash
npm install discordjsuser
```

## Usage

Here's a brief overview of the main modules provided by DiscordUser.js:

### Client

The `Client` class provides methods for user authentication with Discord.

Example:

```javascript
const Discord = require("discordjsuser");
const client = new Discord.Client();

const loginResponse = await client.login("your_email@example.com", "your_password");
console.log(loginResponse);
```

### Messages

The `Messages` class handles sending and managing messages in Discord channels.

Example:

```javascript
const Discord = require("discordjsuser");
const messages = new Discord.Messages("your_bot_token");

const userProfile = await messages.getUserProfile("user_id");
console.log(userProfile);

// Sending a message
await messages.sendMessage("channel_id", "Hello, Discord!");

// Sending a message with attachment
await messages.sendMessageWithAttachment("channel_id", "path/to/file.txt", "Message with Attachment");

// ... and more
```

### Gateway

The `Gateway` class allows you to connect to the Discord Gateway for real-time events.

Example:

```javascript
const Discord = require("discordjsuser");
const gateway = new Discord.Gateway("your_bot_token", true);

gateway.READY = async function (data) {
console.log("Gateway connected as user: " + data.user.global_name);
};

gateway.connect();
```

## Examples

Check out the [BasicGateway.js](examples/BasicGateway.js) file for a simple example of using the DiscordUser.js module.

## Contributing

Feel free to contribute to the project by opening issues or submitting pull requests. Your feedback and contributions are highly appreciated!

## WARNING

⚠️ Use at Your Own Risk ⚠️

Please be advised that employing third-party clients or applications on user accounts is against Discord's Terms of Service. Any use of unofficial or unauthorized tools may result in account suspension or other penalties imposed by Discord.