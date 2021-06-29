declare type HandleFnParam<T, Rt> = (param: T, origin: string, source: Window) => Rt;
export declare function createHttpServer<ServerHandler extends Record<keyof ServerHandler, (...args: any) => any>>({ name }: {
    name: string;
}): {
    on: <Method extends keyof ServerHandler>(method: Method, callback: HandleFnParam<Parameters<ServerHandler[Method]>[0], ReturnType<ServerHandler[Method]>>) => void;
};
export declare function createHttpClient<ServerHandler extends Record<keyof ServerHandler, (...args: any) => any>>({ name, serverWindow }: {
    name: string;
    serverWindow: any;
}): {
    request: <Method extends keyof ServerHandler>(option: {
        timeout?: number | undefined;
        method: Method;
        param?: Parameters<ServerHandler[Method]>[0] | undefined;
    }) => ReturnType<ServerHandler[Method]>;
};
export {};
