const fetch = require("node-fetch");
const WebSocket = require("ws");

class Client {
  conuctor() {}
  printMsg() {
    console.log("This is a message from the demo package");
  }
  async login(email, password) {
    var jsonn;
    await fetch("https://discord.com/api/v6/auth/login", {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        pragma: "no-cache",
      },
      referrer: "https://discord.com/login",
      referrerPolicy: "no-referrer-when-downgrade",
      body:
        '{"email":"' +
        email +
        '","password":"' +
        password +
        '","undelete":false,"captcha_key":null,"login_source":null,"gift_code_sku_id":null}',
      method: "POST",
      mode: "cors",
    })
      .then((res) => res.json()) // expecting a json response
      .then((json) => (jsonn = json));
    return jsonn;
  }
}
var discordURL = "https://discordapp.com/api/v6/";
class Messages {
  constructor(token) {
    this.token = token;
  }

  sendMessage(chatid, content, nonce) {
    return fetch(discordURL + "channels/" + chatid + "/messages#", {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: content, nonce: nonce, tts: false }),
      method: "POST",
    });
  }
  sendMessageWithTSS(chatid, content, nonce) {
    return fetch(discordURL + "channels/" + chatid + "/messages#", {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: content, nonce: nonce, tts: true }),
      method: "POST",
    });
  }
  typingAction(chatid) {
    return fetch(discordURL + "channels/" + chatid + "/typing", {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      method: "POST",
    });
  }
  pinMessage(chatid, msgid) {
    return fetch(discordURL + "channels/" + chatid + "/pins/" + msgid, {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      method: "POST",
    });
  }
  deleteMessage(chatid, messageid) {
    return fetch(discordURL + "channels/" + chatid + "/messages/" + messageid, {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      method: "DELETE",
    });
  }
  editMessage(chatid, messageid, content) {
    return fetch(discordURL + "channels/" + chatid + "/messages/" + messageid, {
      headers: {
        Authorization: this.token,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: content }),
      method: "PATCH",
    });
  }
  getMessage(chatid) {
    return getMessages(chatid, 1);
  }
  getMessages(chatid, limit) {
    return fetch(
      discordURL + "channels/" + chatid + "/messages?limit=" + limit,
      {
        headers: {
          Authorization: this.token,
          "content-type": "application/json",
        },
        method: "GET",
      }
    );
  }
  addReaction(chatid, msgid, reactionid) {
    return fetch(
      discordURL +
        "channels/" +
        chatid +
        "/messages/" +
        msgid +
        "/reactions/" +
        encodeURI(reactionid) +
        "/@me",
      {
        headers: {
          Authorization: this.token,
          "content-type": "application/json",
        },
        method: "PUT",
      }
    );
  }
}
class Gateway {
  constructor(token) {
    this.gatewayURL = "wss://gateway.discord.gg";
    this.token = token;
  }
  connect() {
    this.websocket = new WebSocket(this.gatewayURL);
    this.websocket.onopen = this.onOpen;
    this.websocket.onmessage = this.onMessage;
    this.websocket.token = this.token;
    this.websocket.MESSAGE_CREATE = this.MESSAGE_CREATE;

    this.websocket.heartbeat = function (ws) {
      ws.send('{"op":1,"d":0}');
    };
  }
  onMessage = function (data) {
    try {
      data.data = JSON.parse(data.data);
    } catch (ignore) {}
    // console.log(data.data);
    switch (data.data.op) {
      case 0:
        switch (data.data.t) {
          case "MESSAGE_CREATE":
            this.MESSAGE_CREATE(data.data.d);
            break;
        }
        break;
      case 10:
        setInterval(this.heartbeat, data.data.d.heartbeat_interval, this);
        this.send(
          `
          {
            "op": 2,
            "d": {
              "token": "` +
            this.token +
            `",
              "properties": {
                "$os": "linux",
                "$browser": "my_library",
                "$device": "my_library"
              }
            }
        }
        `
        );
        break;
    }
  };
  async login(email, password) {}
}
module.exports = { Client: Client, Messages: Messages, Gateway: Gateway };
