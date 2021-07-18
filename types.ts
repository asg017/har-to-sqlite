export interface HAR {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    browser: {
      name: string;
      version: string;
    };
    pages: {
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: {
        onContentLoad: number;
        onLoad: number;
      };
    }[];
    entries: {
      _initiator: {
        type: string;
      };
      _priority: string;
      _resourceType: string;
      // TODO cache metadata
      //cache: {};
      connection: string;
      pageref: string;
      request: {
        method: string;
        url: string;
        httpVersion: string;
        headers: {
          name: string;
          value: string;
        }[];
        queryString: {
          name: string;
          value: string;
        }[];
        cookies: {
          name: string;
          value: string;
          httpOnly: boolean;
          secure: boolean;
        }[];
        headersSize: number;
        bodySize: number;
        postData?: {
          mimeType: string;
          text?: string;
          params?: {
            name: string;
            value: string;
            contentType?: string;
            comment?: string;
          }[];
          comment: string;
        };
      };
      response: {
        status: number;
        statusText: string;
        httpVersion: string;
        headers: {
          name: string;
          value: string;
        }[];
        cookies: {
          name: string;
          value: string;
          path: string;
          domain: string;
          expires: string;
          httpOnly: boolean;
          secure: boolean;
        }[];
        content: {
          size: number;
          mimeType: string;
          text?: string;
          encoding?: string;
        };
        redirectURL: string;
        headersSize: number;
        bodySize: number;
        _transferSize: number;
      };
      serverIPAddress: string;
      startedDateTime: string;
      time: number;
      timings: {
        blocked: number;
        dns: number;
        ssl: number;
        connect: number;
        send: number;
        wait: number;
        receive: number;
        _blocked_queueing: number;
      };
    }[];
  };
}
