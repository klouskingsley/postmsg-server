"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = exports.createHttpServer = void 0;
// import EventEmitter, {EventEmitter, EventEmitterStatic} from 'eventemitter3'
const events_1 = require("events");
const const_1 = require("./const");
const util_1 = require("./util");
function createHttpServer({ name }) {
    if (!name || typeof name !== 'string') {
        throw new Error(`createHttpServer(option): option.name require a non-empty string`);
    }
    const state = {
        clientList: [],
        name,
        methodHandler: new Map()
    };
    const noMethodHandler = () => Promise.reject(new Error(const_1.ErrorType.no_such_method));
    const emitCloseMsg = () => {
        state.clientList.forEach(win => {
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_server_close };
            win.postMessage(msg, '*');
        });
    };
    const saveClient = (source) => {
        if (state.clientList.indexOf(source) < 0) {
            state.clientList.push(source);
        }
    };
    const handleRequest = async (requestId, method, param, origin, source) => {
        // 保存 source, 供 window.close 时通知
        saveClient(source);
        // 获取 处理 函数
        let fn = noMethodHandler;
        if (state.methodHandler.has(method)) {
            fn = state.methodHandler.get(method);
        }
        // 得到处理结果
        let res = { response: '', error: '' };
        try {
            res.response = await fn(param, origin, source);
        }
        catch (err) {
            console.error(err);
            res.error = err.message;
        }
        // 返回处理结果
        const msg = Object.assign(Object.assign({}, res), { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_response, requestId, serverName: state.name });
        source.postMessage(msg, origin);
    };
    const messageRequestHandler = (data, origin, source) => {
        if (data[const_1.serverMsgTypeKey] !== const_1.ServerMsgType.http_request) {
            return;
        }
        const { serverName, method, param, requestId } = data;
        if (serverName !== state.name) {
            return;
        }
        if (!method) {
            return;
        }
        if (source) {
            handleRequest(requestId, method, param, origin, source);
        }
    };
    const messagePingHandler = (data, origin, source) => {
        if (data[const_1.serverMsgTypeKey] !== const_1.ServerMsgType.http_ping) {
            return;
        }
        const { serverName, requestId } = data;
        if (serverName !== state.name) {
            return;
        }
        if (data[const_1.serverMsgTypeKey] === const_1.ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_ping, requestId, serverName };
            source.postMessage(msg, origin);
        }
    };
    window.addEventListener('message', (event) => {
        const { data, origin, source } = event;
        if (!const_1.isServerMessage(data)) {
            return;
        }
        messageRequestHandler(data, origin, source);
        messagePingHandler(data, origin, source);
    });
    window.addEventListener('beforeunload', function () {
        emitCloseMsg();
    });
    const on = function (method, callback) {
        const has = state.methodHandler.has(method);
        if (has) {
            console.warn(`server.on: ${method}'s previous handler will be override`);
        }
        // (param?: any) => Promise<any>
        state.methodHandler.set(method, callback);
    };
    return {
        on,
    };
}
exports.createHttpServer = createHttpServer;
function createHttpClient({ name, serverWindow }) {
    if (!name || typeof name !== 'string') {
        throw new Error('createHttpClient(option): option.name require a non-empty string');
    }
    if (!serverWindow) {
        throw new Error('createHttpClient(option): option.serverWindow required');
    }
    const state = {
        name,
        serverWindow,
        event: new events_1.EventEmitter()
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (serverWindow !== source) {
            return;
        }
        if (!const_1.isServerMessage(data)) {
            return;
        }
        const eventKey = const_1.getHttpRequestEventKey(data);
        state.event.emit(data[const_1.serverMsgTypeKey], data);
        state.event.emit(eventKey, data);
    });
    const ping = function (msg) {
        return new Promise((resolve) => {
            state.serverWindow.postMessage(msg, '*');
            const eventKey = const_1.getHttpRequestEventKey(msg);
            state.event.removeAllListeners(eventKey);
            state.event.on(eventKey, resolve);
        });
    };
    const pingUntilPong = async function (msg) {
        let receivedPong = false;
        for (;;) {
            ping(msg).then(() => {
                receivedPong = true;
            });
            if (receivedPong) {
                break;
            }
            await util_1.sleep(50);
        }
    };
    const request = function (option) {
        const { method } = option;
        if (!method || typeof method !== 'string') {
            throw new Error('httpClient.request(method, param): method is required');
        }
        const timeout = typeof option.timeout === 'number' ? option.timeout : 0;
        const requestId = util_1.uniqueId();
        const msg = {
            [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_request,
            method,
            param: option.param,
            requestId: requestId,
            serverName: state.name,
        };
        // 先进行ping
        return new Promise((resolve, reject) => {
            // 设置超时
            let isFail = false;
            if (timeout > 0) {
                setTimeout(() => {
                    isFail = true;
                    reject(new Error(const_1.ErrorType.timeout));
                }, timeout);
            }
            // 先进行 ping, todo 可能需要不断的ping(pingUntilPong), ping 通后再进行 request
            const pingMsg = {
                [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_ping,
                requestId: requestId,
                serverName: state.name,
            };
            pingUntilPong(pingMsg).then(() => {
                if (isFail) {
                    return;
                }
                state.serverWindow.postMessage(msg, '*');
                state.event.on(const_1.ServerMsgType.http_response, (responseMsg) => {
                    if (responseMsg.requestId === msg.requestId) {
                        if (responseMsg.error) {
                            reject(new Error(responseMsg.error));
                        }
                        else {
                            resolve(responseMsg.response);
                        }
                    }
                });
            });
        });
    };
    return {
        request
    };
}
exports.createHttpClient = createHttpClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrRUFBK0U7QUFDL0UsbUNBQXFDO0FBQ3JDLG1DQUFrTTtBQUNsTSxpQ0FBc0M7QUFxQnRDLFNBQWdCLGdCQUFnQixDQUEyRSxFQUFDLElBQUksRUFBaUI7SUFDL0gsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFBO0tBQ3BGO0lBQ0QsTUFBTSxLQUFLLEdBQWdCO1FBQ3pCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsSUFBSTtRQUNKLGFBQWEsRUFBRSxJQUFJLEdBQUcsRUFBcUI7S0FDNUMsQ0FBQTtJQUVELE1BQU0sZUFBZSxHQUFjLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzVGLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtRQUN4QixLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QixNQUFNLEdBQUcsR0FBa0IsRUFBQyxDQUFDLHdCQUFnQixDQUFDLEVBQUUscUJBQWEsQ0FBQyxpQkFBaUIsRUFBQyxDQUFBO1lBQ2hGLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQzNCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFBO0lBQ0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUNwQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN4QyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FB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