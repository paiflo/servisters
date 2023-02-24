const emitter = require("../device/emitter");
const {tools:{id,wait}} = require("../utils");
const {device_id,port} = require("../config");
const { validate } = require('uuid');
const {createTask} = require("../device/task/schedule");
const map = require("../device/db/mapDB");

const WebApiType = {
    SYNC:"sync",
    ACK:"ack",
    P2P:"p2p",
    ONCALL:"oncall",
    BROADCAST:"broadcast",
}

const STATE = {
    RESET:"reset",
    SYNC:"sync",
    UPDATE:"update",
}

const FIELD = {
    SELF:"self",
    ALL:"all"
};

const nodes = {};

function init(){
    nodes[device_id] = {
        core:device_id,
        startstamp:Date.now(),
        service:{}
    };
}
init();


function packMaker(pack = {},event=null){
    const defPack = {
        sid:id(),
        rid:null,
        origin:device_id,
        timestamp:Date.now(),
        event,
        field:FIELD.ALL
    }
    return Object.assign(defPack,pack);
}

async function systemSync(pack={}){
    const req = packMaker(pack,WebApiType.SYNC);
    // emitter.emit(WebApiType.SYNC,req);
    systemBroadcast(WebApiType.SYNC,req);
    return req.sid;
}

async function systemP2P(pack={targets:[]}){
    const req = packMaker(pack,WebApiType.P2P);
    await systemBroadcast(WebApiType.P2P,req);
    return req.sid;
}

async function systemOnCall(pack={targets:[]}){
    const req = packMaker(pack,WebApiType.ONCALL);
    await systemBroadcast(WebApiType.ONCALL,req);
    const res = await waitFirstAckRecive(req.sid);
    // console.log(res);
    return req.sid;
}

async function systemAck(pack){
    const {sid} = pack;
    const req = packMaker({
        node:nodes[device_id],
        rid:sid,
        origin:device_id,
        timestamp:Date.now(),
    },WebApiType.ACK);
    systemBroadcast(WebApiType.ACK,req);
    return req.sid;
}

async function systemBroadcast(eventName,pack){
    const {sid,origin} = pack;
    map.set(sid,pack);
    emitter.emit(WebApiType.BROADCAST,eventName,pack);
}

async function unionAck(pack){
    const {sid} = pack;
    // console.log(sid);
    let req = {...pack};
    delete req.sid;
    req.rid = sid;
    const pk = packMaker(req,WebApiType.ACK);
    systemBroadcast(WebApiType.ACK,pk);
    return pk.sid;
}

let lock = false;
async function serviceSearch(field=FIELD.SELF){
    if(lock)return;
    lock = true;
    console.clear();
    console.log("服务搜索");
    console.log(port,new Date(),device_id);
    // buffer[STATE.RESET];
    const sid = await systemSync({field});
    const pack = await waitAckRecive(sid);
    // await wait();
    // buffer[STATE.UPDATE];
    console.log(Object.keys(pack));
    Object.keys(nodes).forEach(did=>{
        if(!pack[did])delete nodes[did];
    });
    Object.keys(pack).forEach(did=>{
        nodes[did]=pack[did];
    })
    lock = false;
    // console.log(sid);
}

async function confirmServiceSearch(field){
    lock = true;
    return serviceSearch(field);
}

// createTask(()=>serviceSearch(FIELD.SELF),"30");

// port=="10000"&&createTask(()=>{
//     const targets = Object.keys(nodes);
//     console.log('\x1b[31m',device_id,'发送消息',"\x1b[0m");
//     systemOnCall({targets:[targets[targets.length-1]]});
// },"5");

// port=="10001"&&createTask(()=>{
//     const targets = Object.keys(nodes);
//     console.log('\x1b[31m',device_id,'发送消息',"\x1b[0m");
//     systemOnCall({targets:[targets[targets.length-1]]});
// },"10");

// port=="10002"&&createTask(()=>{
//     const targets = Object.keys(nodes);
//     console.log('\x1b[31m',device_id,'发送消息',"\x1b[0m");
//     systemOnCall({targets:[targets[targets.length-1]]});
// },"15");

// port=="10003"&&createTask(()=>{
    // const targets = Object.keys(nodes);
    // console.log('\x1b[31m',device_id,'发送消息',"\x1b[0m");
    // systemOnCall({targets:[targets[targets.length-1]]});
// },"45");

// port=="10006"&&setInterval(()=>{
//     const targets = Object.keys(nodes);
//     console.log('\x1b[31m',device_id,'发送消息',"\x1b[0m");
//     systemOnCall({targets:[targets[targets.length-1]]});
// },2000);

async function waitAckRecive(sid){
    return await new Promise(async resolve=>{
        const list = {};
        const handle = pack=>{
            const {rid,origin,node} = pack;
            // console.log(rid,origin);
            list[origin] = node;
        }
        emitter.on(sid,handle);
        await wait(100);
        emitter.removeListener(sid,handle);
        list[device_id] = nodes[device_id];
        resolve(list);
    });
}

async function waitFirstAckRecive(sid,timeout=3000){
    // console.log(sid);
    return await new Promise(async (resolve,reject)=>{
        let flag = true;
        const handle = pack=>{
            flag = false;
            resolve(pack);
        }
        emitter.once(sid,handle);
        setTimeout(() => {
            if(flag){
                emitter.removeListener(sid,handle);
                console.log("嘤嘤嘤");
                reject({msg:"timeout",code:404});
            }
        }, timeout);
    });
}

module.exports = {
    WebApi:{
        systemBroadcast,
        systemSync,
        systemAck,
        systemP2P,
        systemOnCall,
        serviceSearch,
        confirmServiceSearch,
        unionAck,
    },
    WebApiType,
    FIELD,
}
