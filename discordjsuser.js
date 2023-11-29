const fetch = require("node-fetch");
const WebSocket = require("ws");
const fs = require("fs");
const FormData = require("form-data")
class Client {
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
    constructor(token, debug) {
        this.debug = debug
        this.gatewayURL = "wss://gateway.discord.gg";
        this.token = token;
        this.seq=null
    }
    connect() {
        if (this.debug) {
            console.log("Connecting...")
        }
        this.websocket = new WebSocket(this.gatewayURL);
        this.websocket.onopen = this.onOpen;
        this.websocket.onerror = this.onError;
        this.websocket.onmessage = (data)=> {this.wsMessage(data)}      
    };
    wsMessage(data){
        try {
            data.data = JSON.parse(data.data);
        } catch (ignore) {}
        if (data.data.op > 0 && this.debug) {
            console.log(data.data.op)
        }

        this.seq=data.data.s||this.seq
        if (this.debug) {
            console.log(data.data.op)
        }
        switch (data.data.op) {
            case 0: //Dispatch event

                if (this[data.data.t]) {
                    if (this.debug) {
                        console.log(data.data.t)
                    }
                    this[data.data.t](data.data.d)
                }else if(this.debug){
                    console.log(data.data.t)
                }
                if(data.data.t=="READY"&&data.data.d.session_id){
                    if(this.debug){
                        console.log("Got session id: "+data.data.d.session_id)
                    }
                    this.sessionID=data.data.d.session_id
                    this.reconnectTimeout = setTimeout(()=>{this.reconnect()}, this.hbi + 5000)
                }
                break;
            case 9: //Invalid Session	
                this.seq=null
                this.sessionID=null
                this.reconnect("Invalid Session")
                break
            case 7: //Reconnect 
                this.reconnect("Server Requested Reconnect")
                break;
            case 10: //Hello 
                this.hbi = data.data.d.heartbeat_interval
                clearInterval(this.heartbeatInt)
                this.heartbeatInt=setInterval(this.heartbeat, this.hbi-1000,this);
                if(this.seq&&this.token&&this.sessionID){
                    this.websocket.send(JSON.stringify({
                        "op": 6,
                        "d": {
                            "token": this.token,
                            "session_id": this.sessionID,  
                            "seq": this.seq 
                        }
                    }))
                    this.reconnectTimeout = setInterval(()=>{this.reconnect("Timeout")}, this.hbi*2 + 1000)
                }else{
                    this.websocket.send(
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
                }
                break;

            case 11: //Heartbeat ACK	
                clearTimeout(this.reconnectTimeout)
                this.reconnectTimeout = setTimeout(()=>{this.reconnect("Timeout")}, this.hbi*2 + 1000)
                break
        }
    }
    reconnect(reason){

        
        try {
            this.websocket.close()
        } catch (ignore) {
        }
        try {
            clearInterval(this.heartbeatInt)

            clearTimeout(this.reconnectTimeout)

            if(this.onReconnect){
                this.onReconnect(reason)
            }

            if(this.seq&&this.token&&this.sessionID){
                this.connect()
            }else if(this.onDisconnect){
                this.onDisconnect()
            }
        } catch (ignore) {
        }
    }
    heartbeat = function(that) {
        that.websocket.send(JSON.stringify({"op":1,"d":that.seq}));
    };
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