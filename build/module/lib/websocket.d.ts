declare type MessageHandler = (message: any) => any | void;
export declare function createWebsocket({ remoteWindow }: {
    remoteWindow: any;
}): {
    onMessage: (fn: MessageHandler) => () => void;
    sendMessage: (message: any) => void;
    onceMessage: (fn: MessageHandler) => void;
};
export {};
