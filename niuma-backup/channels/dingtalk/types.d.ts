/**
 * dingtalk-sdk 类型声明
 */

declare module "dingtalk-sdk" {
  export interface ClientConfig {
    appKey: string;
    appSecret: string;
  }

  export interface AccessTokenResponse {
    access_token?: string;
    errcode?: number;
    errmsg?: string;
  }

  export interface MessageSendParams {
    access_token: string;
    msg: {
      msgtype: string;
      text?: {
        content: string;
      };
    };
    agent_id: string;
    userid_list: string;
  }

  export interface MessageSendResponse {
    errcode: number;
    errmsg: string;
  }

  export class Client {
    constructor(config: ClientConfig);

    getAccessToken(): Promise<AccessTokenResponse>;

    message: {
      send(params: MessageSendParams): Promise<MessageSendResponse>;
    };
  }
}