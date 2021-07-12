"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebsocket = void 0;
// import * as EventEmitter from 'eventemitter3'
const events_1 = require("events");
const const_1 = require("./const");
function createWebsocket({ remoteWindow }) {
    const state = {
        remoteWindow: remoteWindow,
        event: new events_1.EventEmitter(),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93ZWJzb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsZ0RBQWdEO0FBQ2hELG1DQUFtQztBQUNuQyxtQ0FBeUc7QUFTekcsU0FBZ0IsZUFBZSxDQUFDLEVBQUMsWUFBWSxFQUFzQjtJQUVqRSxNQUFNLEtBQUssR0FBbUI7UUFDNUIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsS0FBSyxFQUFFLElBQUkscUJBQVksRUFBRTtLQUMxQixDQUFBO0lBRUQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzNDLE1BQU0sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLEdBQUcsS0FBSyxDQUFBO1FBQzVCLElBQUksTUFBTSxLQUFLLFlBQVksRUFBRTtZQUMzQixPQUFNO1NBQ1A7UUFDRCxJQUFJLENBQUMsdUJBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQixPQUFNO1NBQ1A7UUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQWdCLENBQUMsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxTQUFTLEdBQUcsVUFBVSxFQUFrQjtRQUM1QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtDLEVBQUUsRUFBRTtZQUNyRCxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQTtRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLHFCQUFhLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDeEQsT0FBTyxHQUFHLEVBQUU7WUFDVixLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzNELENBQUMsQ0FBQTtJQUNILENBQUMsQ0FBQTtJQUNELE1BQU0sV0FBVyxHQUFHLFVBQVUsRUFBa0I7UUFDOUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQyxFQUFFLEVBQUU7WUFDckQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNqQixDQUFDLENBQUE7UUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxxQkFBYSxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzVELENBQUMsQ0FBQTtJQUNELE1BQU0sV0FBVyxHQUFHLFVBQVUsT0FBWTtRQUN4QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUE7U0FDMUQ7UUFDRCxNQUFNLEdBQUcsR0FBa0M7WUFDekMsQ0FBQyx3QkFBZ0IsQ0FBQyxFQUFFLHFCQUFhLENBQUMsaUJBQWlCO1lBQ25ELE9BQU87U0FDUixDQUFBO1FBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQTtJQUVELE9BQU87UUFDTCxTQUFTO1FBQ1QsV0FBVztRQUNYLFdBQVc7S0FDWixDQUFBO0FBQ0gsQ0FBQztBQWhERCwwQ0FnREMifQ==