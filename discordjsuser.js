const fetch = require("node-fetch");
const WebSocket = require("ws");
const fs = require("fs");
const FormData = require("form-data")
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
                body: '{"email":"' +
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
    async getUserProfile(userId) {
        var jsonn;
        await fetch(discordURL + "users/" + userId + "/profile", {
                headers: {
                    Authorization: this.token,
                    "content-type": "application/json",
                },
                method: "GET"
            }).then((res) => res.json()) // expecting a json response
            .then((json) => (jsonn = json));
        return jsonn;
    }
    sendMessage(chatid, content, embed, nonce) {
        return fetch(discordURL + "channels/" + chatid + "/messages#", {
            headers: {
                Authorization: this.token,
                "content-type": "application/json",
            },
            body: JSON.stringify({ content: content, nonce: nonce, tts: false, embed: embed }),
            method: "POST",
        });
    }
    sendMessageWithAttachment(chatid, attachment, content, embed, nonce) {

        var formData = new FormData();
        formData.append('file', fs.createReadStream(attachment));
        if (content) {
            formData.append('content', content);
        }
        return fetch(discordURL + "channels/" + chatid + "/messages#", {
            headers: {
                Authorization: this.token,
            },
            body: formData,
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
    editMessage(chatid, messageid, content, embed) {
        return fetch(discordURL + "channels/" + chatid + "/messages/" + messageid, {
            headers: {
                Authorization: this.token,
                "content-type": "application/json",
            },
            body: JSON.stringify({ content: content, embed: embed }),
            method: "PATCH",
        });
    }
    getMessage(chatid) {
        return this.getMessages(chatid, 1);
    }
    getMessageById(chatid, msgid) {
        return fetch(discordURL + "channels/" + chatid + "/messages/" + msgid, {
            headers: {
                Authorization: this.token,
                "content-type": "application/json",
            },
            method: "GET",
        });
    }
    async getMessagesJSON(chatid, limit, before, enableCache) {
        var channelCache;
        if (limit == -1) {
            limit = Number.MAX_SAFE_INTEGER;
            if (enableCache == true) {
                try {
                    channelCache = JSON.parse(await fs.readFileSync("channelCache/" + chatid + ".json"));
                } catch (ignore) {}
            }
        }
        if (typeof enableCache == "object") {
            channelCache = enableCache;
        }
        var messageArray;
        if (limit > 100) {
            messageArray = await this.getMessagesJSON(
                chatid,
                100,
                before,
                channelCache
            );
            if (channelCache) {
                for (var x in channelCache) {
                    if (channelCache[x].id == messageArray[messageArray.length - 1].id) {
                        console.log("found in cache")
                        messageArray = messageArray.concat(channelCache.slice(parseInt(x) + 1));
                        fs.writeFileSync("channelCache/" + chatid + ".json", JSON.stringify(messageArray, null, 2));
                        return messageArray;
                    }
                }
            }
            console.log(messageArray.length + "  -  " + before + "  -  " + (Number.MAX_SAFE_INTEGER - limit))
            if (limit - 100 > 0 && messageArray.length == 100) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 0);
                });
                var tempMessageArray = await this.getMessagesJSON(
                    chatid,
                    limit - 50,
                    messageArray[99].id,
                    channelCache
                );
                messageArray = messageArray.concat(tempMessageArray);
                if (enableCache == true) {
                    fs.writeFileSync("channelCache/" + chatid + ".json", JSON.stringify(messageArray, null, 2));
                }
            }
            return messageArray;
        } else {
            var messages;
            if (before) {
                messages = await this.getMessagesBefore(chatid, limit, before);
            } else {
                messages = await this.getMessages(chatid, limit);
            }
            messages = await messages.json();
            // if(enableCache==true){
            //   fs.writeFileSync(chatid+".json",JSON.stringify(messages))
            // }
            return messages;
        }
    }

    getMessages(chatid, limit) {
        return fetch(
            discordURL + "channels/" + chatid + "/messages?limit=" + limit, {
                headers: {
                    Authorization: this.token,
                    "content-type": "application/json",
                },
                method: "GET",
            }
        );
    }
    getMessagesBefore(chatid, limit, before) {
        return fetch(
            discordURL +
            "channels/" +
            chatid +
            "/messages?limit=" +
            limit +
            "&before=" +
            before, {
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
            "/@me", {
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

        // this.gatewayURL = "ws://127.0.0.1:8083";

        this.token = token;
    }
    connect() {
        console.log("connect")
        this.websocket = new WebSocket(this.gatewayURL);
        this.websocket.onopen = this.onOpen;
        this.websocket.onerror = this.onError;
        this.websocket.onmessage = this.onMessage;
        this.websocket.token = this.token;
        this.websocket.that = this

        // this.websocket.MESSAGE_CREATE = this.MESSAGE_CREATE;
        // this.websocket.MESSAGE_DELETE = this.MESSAGE_DELETE;
        // this.websocket.GUILD_MEMBERS_CHUNK = this.GUILD_MEMBERS_CHUNK;
        // this.websocket.GUILD_MEMBER_LIST_UPDATE = this.GUILD_MEMBER_LIST_UPDATE;
        // this.websocket.PRESENCE_UPDATE = this.PRESENCE_UPDATE;
        // this.websocket.READY = this.READY;
        // this.websocket.MESSAGE_REACTION_REMOVE = this.MESSAGE_REACTION_REMOVE
        // this.websocket.MESSAGE_REACTION_ADD = this.MESSAGE_REACTION_ADD

        this.websocket.heartbeat = function(ws) {
            ws.send('{"op":1,"d":0}');
        };
    }
    onMessage(data) {
        try {
            data.data = JSON.parse(data.data);
        } catch (ignore) {}
        if (data.data.op > 0) {
            console.log(data.data.op)
        }
        switch (data.data.op) {
            case 0: //Dispatch event
                console.log(data.data.t)
                if (this.that[data.data.t]) {
                    this.that[data.data.t](data.data.d)
                }
                break;
            case 9: //Invalid Session	
                clearInterval(this.reconnectTimeout)
                try {
                    this.close()
                } catch (ignore) {}
                console.log(data.data)
                this.that.onDisconnect()
                break
            case 7: //Reconnect 
                clearInterval(this.reconnectTimeout)
                try {
                    this.close()
                } catch (ignore) {}
                this.that.onDisconnect()
                break;
            case 10: //Hello 
                this.hbi = data.data.d.heartbeat_interval
                setInterval(this.heartbeat, this.hbi, this);
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

            case 11: //Heartbeat ACK	

                clearInterval(this.reconnectTimeout)
                this.reconnectTimeout = setInterval(() => {
                    try {
                        this.close()
                    } catch (ignore) {}
                    this.that.onDisconnect()
                }, this.hbi * 2 + 1000)
                break
        }
    }
    startCall(d) {
        this.send(JSON.stringify({
            op: 4,
            d
        }))
    }
    async login(email, password) {}
}

class VoiceGateway {
    constructor() {}
    connect(URL, token) {
        this.websocket = new WebSocket("wss://" + URL);
        this.websocket.onmessage = this.onMessage
        this.websocket.token = token
    }
    onMessage(data) {
        console.log(data.data)
    }
}
module.exports = { Client: Client, Messages: Messages, Gateway: Gateway, VoiceGateway };
