"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebsocket = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const const_1 = require("./const");
function createWebsocket({ remoteWindow }) {
    const state = {
        remoteWindow: remoteWindow,
        event: new eventemitter3_1.default(),
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (source !== remoteWindow) {
            return;
        }
        if (!const_1.isServerMessage(data)) {
            return;
        }
        state.event.emit(data[const_1.serverMsgTypeKey]);
    });
    const onMessage = function (fn) {
        const handler = (msg) => {
            fn(msg.message);
        };
        state.event.on(const_1.ServerMsgType.websocket_message, handler);
        return () => {
            state.event.off(const_1.ServerMsgType.websocket_message, handler);
        };
    };
    const onceMessage = function (fn) {
        const handler = (msg) => {
            fn(msg.message);
        };
        state.event.once(const_1.ServerMsgType.websocket_message, handler);
    };
    const sendMessage = function (message) {
        if (typeof message === 'undefined') {
            throw new Error('sendMessage(message): message required');
        }
        const msg = {
            [const_1.serverMsgTypeKey]: const_1.ServerMsgType.websocket_message,
            message,
        };
        state.remoteWindow.postMessage(msg, '*');
    };
    return {
        onMessage,
        sendMessage,
        onceMessage,
    };
}
exports.createWebsocket = createWebsocket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93ZWJzb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esa0VBQXdDO0FBQ3hDLG1DQUF5RztBQVN6RyxTQUFnQixlQUFlLENBQUMsRUFBQyxZQUFZLEVBQXNCO0lBRWpFLE1BQU0sS0FBSyxHQUFtQjtRQUM1QixZQUFZLEVBQUUsWUFBWTtRQUMxQixLQUFLLEVBQUUsSUFBSSx1QkFBWSxFQUFFO0tBQzFCLENBQUE7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDM0MsTUFBTSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsR0FBRyxLQUFLLENBQUE7UUFDNUIsSUFBSSxNQUFNLEtBQUssWUFBWSxFQUFFO1lBQzNCLE9BQU07U0FDUDtRQUNELElBQUksQ0FBQyx1QkFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzFCLE9BQU07U0FDUDtRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBZ0IsQ0FBQyxDQUFDLENBQUE7SUFDMUMsQ0FBQyxDQUFDLENBQUE7SUFDRixNQUFNLFNBQVMsR0FBRyxVQUFVLEVBQWtCO1FBQzVDLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0MsRUFBRSxFQUFFO1lBQ3JELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDakIsQ0FBQyxDQUFBO1FBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMscUJBQWEsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN4RCxPQUFPLEdBQUcsRUFBRTtZQUNWLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLHFCQUFhLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDM0QsQ0FBQyxDQUFBO0lBQ0gsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxXQUFXLEdBQUcsVUFBVSxFQUFrQjtRQUM5QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtDLEVBQUUsRUFBRTtZQUNyRCxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQTtRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLHFCQUFhLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDNUQsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxXQUFXLEdBQUcsVUFBVSxPQUFZO1FBQ3hDLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQTtTQUMxRDtRQUNELE1BQU0sR0FBRyxHQUFrQztZQUN6QyxDQUFDLHdCQUFnQixDQUFDLEVBQUUscUJBQWEsQ0FBQyxpQkFBaUI7WUFDbkQsT0FBTztTQUNSLENBQUE7UUFDRCxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDMUMsQ0FBQyxDQUFBO0lBRUQsT0FBTztRQUNMLFNBQVM7UUFDVCxXQUFXO1FBQ1gsV0FBVztLQUNaLENBQUE7QUFDSCxDQUFDO0FBaERELDBDQWdEQyJ9