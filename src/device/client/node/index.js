const namespace = "node";
const client = require("../index");
const route = require("./route");
const {tools:{install,id}} = require("../../../utils");


console.log(2342);
module.exports = client(namespace,(io,socket)=>{
    install([route],client,socket);
    // setTimeout(() => {
    //     socket.emit("client",{sid:id()});
    // }, 2000);
});