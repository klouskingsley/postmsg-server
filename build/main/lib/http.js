"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = exports.createHttpServer = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
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
            res.error = err.message;
        }
        // 返回处理结果
        const msg = Object.assign(Object.assign({}, res), { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_response, requestId });
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
        if (data[const_1.serverMsgTypeKey] === const_1.ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_pong };
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
    const originOnbeforeunload = window.onbeforeunload;
    window.onbeforeunload = function (event) {
        emitCloseMsg();
        if (typeof originOnbeforeunload === 'function') {
            originOnbeforeunload.call(window, event);
        }
    };
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
        event: new eventemitter3_1.default()
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (serverWindow !== source) {
            return;
        }
        if (!const_1.isServerMessage(data)) {
            return;
        }
        state.event.emit(data[const_1.serverMsgTypeKey], data);
    });
    const ping = function () {
        return new Promise((resolve) => {
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_ping };
            state.serverWindow.postMessage(msg, '*');
            state.event.on(const_1.ServerMsgType.http_pong, resolve);
        });
    };
    const pingUntilPong = async function () {
        let receivedPong = false;
        for (;;) {
            ping().then(() => {
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
        const timeout = typeof option.timeout === 'number' ? option.timeout : 3000;
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
            pingUntilPong().then(() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrRUFBd0M7QUFDeEMsbUNBQXVKO0FBQ3ZKLGlDQUFzQztBQXFCdEMsU0FBZ0IsZ0JBQWdCLENBQTJFLEVBQUMsSUFBSSxFQUFpQjtJQUMvSCxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUE7S0FDcEY7SUFDRCxNQUFNLEtBQUssR0FBZ0I7UUFDekIsVUFBVSxFQUFFLEVBQUU7UUFDZCxJQUFJO1FBQ0osYUFBYSxFQUFFLElBQUksR0FBRyxFQUFxQjtLQUM1QyxDQUFBO0lBRUQsTUFBTSxlQUFlLEdBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUE7SUFDNUYsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1FBQ3hCLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLE1BQU0sR0FBRyxHQUFrQixFQUFDLENBQUMsd0JBQWdCLENBQUMsRUFBRSxxQkFBYSxDQUFDLGlCQUFpQixFQUFDLENBQUE7WUFDaEYsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUE7SUFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO1FBQ3BDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3hDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQzlCO0lB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