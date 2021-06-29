import EventEmitter from 'eventemitter3';
import { serverMsgTypeKey, ServerMsgType, ErrorType, isServerMessage } from './const';
import { uniqueId, sleep } from './util';
export function createHttpServer({ name }) {
    if (!name || typeof name !== 'string') {
        throw new Error(`createHttpServer(option): option.name require a non-empty string`);
    }
    const state = {
        clientList: [],
        name,
        methodHandler: new Map()
    };
    const noMethodHandler = () => Promise.reject(new Error(ErrorType.no_such_method));
    const emitCloseMsg = () => {
        state.clientList.forEach(win => {
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_server_close };
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
        const msg = {
            ...res,
            [serverMsgTypeKey]: ServerMsgType.http_response,
            requestId
        };
        source.postMessage(msg, origin);
    };
    const messageRequestHandler = (data, origin, source) => {
        if (data[serverMsgTypeKey] !== ServerMsgType.http_request) {
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
        if (data[serverMsgTypeKey] === ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_pong };
            source.postMessage(msg, origin);
        }
    };
    window.addEventListener('message', (event) => {
        const { data, origin, source } = event;
        if (!isServerMessage(data)) {
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
export function createHttpClient({ name, serverWindow }) {
    if (!name || typeof name !== 'string') {
        throw new Error('createHttpClient(option): option.name require a non-empty string');
    }
    if (!serverWindow) {
        throw new Error('createHttpClient(option): option.serverWindow required');
    }
    const state = {
        name,
        serverWindow,
        event: new EventEmitter()
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (serverWindow !== source) {
            return;
        }
        if (!isServerMessage(data)) {
            return;
        }
        state.event.emit(data[serverMsgTypeKey], data);
    });
    const ping = function () {
        return new Promise((resolve) => {
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_ping };
            state.serverWindow.postMessage(msg, '*');
            state.event.on(ServerMsgType.http_pong, resolve);
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
            await sleep(50);
        }
    };
    const request = function (option) {
        const method = { option };
        if (!method || typeof method !== 'string') {
            throw new Error('httpClient.request(method, param): method is required');
        }
        const timeout = typeof option.timeout === 'number' ? option.timeout : 3000;
        const requestId = uniqueId();
        const msg = {
            [serverMsgTypeKey]: ServerMsgType.http_request,
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
                    reject(new Error(ErrorType.timeout));
                }, timeout);
            }
            // 先进行 ping, todo 可能需要不断的ping(pingUntilPong), ping 通后再进行 request
            pingUntilPong().then(() => {
                if (isFail) {
                    return;
                }
                state.serverWindow.postMessage(msg, '*');
                state.event.on(ServerMsgType.http_response, (responseMsg) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFlBQVksTUFBTSxlQUFlLENBQUE7QUFDeEMsT0FBTyxFQUFDLGdCQUFnQixFQUE0QixhQUFhLEVBQUUsU0FBUyxFQUE0QyxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUE7QUFDdkosT0FBTyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxRQUFRLENBQUE7QUFxQnRDLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBMkUsRUFBQyxJQUFJLEVBQWlCO0lBQy9ILElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQTtLQUNwRjtJQUNELE1BQU0sS0FBSyxHQUFnQjtRQUN6QixVQUFVLEVBQUUsRUFBRTtRQUNkLElBQUk7UUFDSixhQUFhLEVBQUUsSUFBSSxHQUFHLEVBQXFCO0tBQzVDLENBQUE7SUFFRCxNQUFNLGVBQWUsR0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzVGLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtRQUN4QixLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QixNQUFNLEdBQUcsR0FBa0IsRUFBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixFQUFDLENBQUE7WUFDaEYsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUE7SUFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQWMsRUFBRSxFQUFFO1FBQ3BDLElBQUks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