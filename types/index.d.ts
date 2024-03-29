declare module "reevsocket" {
  export interface Options {
    maxAttempts?: number;
    delay?: number;
    exponentialFactor?: number;
    maxDelay?: number;
    heartbeatInterval?: number;
    disableHeartbeat?: boolean;
    pongTimeoutInterval?: number;
    metadata?: { [key: string]: any };
    enableAcknowledge?: boolean;
    handleApiGatewayDefaults?: boolean;
    onConnect?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: Event | ErrorEvent) => void;
    onReconnecting?: (event: Event | ErrorEvent) => void;
    onOverflow?: (event: Event | ErrorEvent) => void;
    protocols?: string[];
  }

  export interface Controller {
    on: (event: string, listener: (...args: any[]) => void) => void;
    setMetadata: (data: { [key: string]: any }) => void;
    emit: (action: string, data?: any) => void;
    start: () => void;
    retry: (e: Event | CloseEvent | ErrorEvent) => void;
    json: (value: any) => void;
    send: (value: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
    close: (code?: number, reason?: string) => void;
    isConnected: () => boolean;
  }

  function connect(url: string, options?: Options): Controller;
  export = connect;
}
