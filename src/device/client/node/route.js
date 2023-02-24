/**
 * field?作用域
 * priority?优先级
 * install?安装方法
 * router?[
 *   path?{
 *      protocol?协议,
 *      handle?路由回调(res,req)=>void
 *   }
 * ]
 */

const emitter = require("../../emitter");
const {device_id} = require("../../../config");
const {tools:{id}} = require("../../../utils");
const {WebApiType} = require("../../../api");

module.exports = (io,socket)=>{
    return {
        install:()=>{
            socket.onAny((eventName, pack) => {
                // console.log('onAny',eventName);
            });
            socket.onAnyOutgoing((eventName, pack) => {
                // const {sid,origin} = pack;
                // map.set(sid,pack);
                // console.log('c send',eventName,origin,sid);
            });
            socket.prependAny((eventName, pack) => {
                // const {sid,rid,event,origin,field,targets} = pack;
                // if(!map.has(sid)){
                //     WebApi.systemBroadcast(eventName,pack);
                //     emitter.emit(eventName,pack);
                // }
                console.log('pA',eventName);
            });
            socket.prependAnyOutgoing((eventName, pack) => {
                console.log('pO',eventName);
                // console.log(`prependAnyOutgoing ${eventName}`);
            });
        },
        router:[
            {
                path:"connect",
                handle:(res,req)=>{
                    console.log('服务节点连接成功');
                    // WebApi.serviceSearch();
                }
            },
            {
                path:"reconnect",
                handle:(res,req)=>{
                    console.log('重新连接');
                    // WebApi.serviceSearch();
                }
            }
        ]
    }
}