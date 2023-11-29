
const Discord = require("../discordjsuser");
require('dotenv').config()

var gateway = new Discord.Gateway(process.env.TOKEN, true);
gateway.READY = async function (data) {
    console.log("Gatway Logged in as user: "+data.user.global_name)
}
gateway.ANY=(eventName,eventData)=>{
    console.log(eventName)
}
gateway.connect()