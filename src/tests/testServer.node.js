// @ts-check
import http from "http";
import { URL } from "url";
import getPort from "get-port";
import isReachable from "is-reachable";

/**
 * @typedef {Object} RouteHandler
 * @property {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} handler The route handler function
 */

/**
 * @typedef {Object} RequestBody
 * @property {any} [data] The parsed request body data
 */

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} HttpMethod
 */

/**
 * @typedef {Object.<HttpMethod, Object.<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>>>} RouteMap
 */

/**
 * @typedef {Object} ServerConfig
 * @property {boolean} [cors] Enable CORS headers
 * @property {string} [corsOrigin] CORS origin, defaults to '*'
 */

class TestServer {
  /** @type {http.Server|null} */
  #server = null;

  /** @type {RouteMap} */
  #routes = {
    GET: {
      "/": /** @type {(req: http.IncomingMessage, res: http.ServerResponse) => undefined} */ (
        _,
        res,
      ) => {
        this.sendJsonResponse(res, 200, { status: "ok" });
      },
    },
    POST: {},
    PUT: {},
    DELETE: {},
    PATCH: {},
  };

  /** @type {Required<ServerConfig>} */
  #config = { cors: true, corsOrigin: "*" };

  /**
   * Initialize the test server
   * @param {ServerConfig} [config] Server configuration
   */
  constructor(config = {}) {
    this.#config = { ...this.#config, ...config };
  }

  /**
   * Configure CORS headers
   * @param {http.ServerResponse} res
   */
  #setCorsHeaders(res) {
    if (this.#config.cors) {
      res.setHeader("Access-Control-Allow-Origin", this.#config.corsOrigin);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH",
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
  }

  /**
   * Parse JSON body from incoming request
   * @param {http.IncomingMessage} req
   * @returns {Promise<any>}
   */
  async getRequestBody(req) {
    /** @type {Buffer[]} */
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Send JSON response
   * @param {http.ServerResponse} res
   * @param {number} statusCode
   * @param {Object} data
   */
  sendJsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  /**
   * Add a route handler
   * @param {HttpMethod} method HTTP method
   * @param {string} path Route path
   * @param {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} handler Route handler
   */
  addRoute(method, path, handler) {
    const upperMethod = method.toUpperCase();
    if (!this.#routes[upperMethod]) {
      this.#routes[upperMethod] = {};
    }
    this.#routes[upperMethod][path] = handler;
  }

  /**
   * Start the server
   * @returns {Promise<number>} The port number the server is listening on
   */
  async start() {
    if (this.#server) {
      throw new Error("Server is already running");
    }

    const port = await getPort();
    return new Promise(
      /** @param {(value: number) => void} resolve @param {(reason: Error) => void} reject */ (
        resolve,
        reject,
      ) => {
        this.#server = http.createServer(async (req, res) => {
          this.#setCorsHeaders(res);
          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }

          try {
            const url = req.url || "/";
            const host = req.headers.host || "localhost";
            const parsedUrl = new URL(url, `http://${host}`);
            const pathname = parsedUrl.pathname;
            const method = req.method || "GET";

            if (this.#routes[method] && this.#routes[method][pathname]) {
              await this.#routes[method][pathname](req, res);
            } else {
              this.sendJsonResponse(res, 404, { error: "Not Found" });
            }
          } catch (error) {
            console.error("test server | ", "response error:", error);
            this.sendJsonResponse(res, 500, { error: "Internal Server Error" });
          }
        });

        const timeout = setTimeout(() => {
          reject(new Error("Server initializing timeout"));
        }, 2000);

        this.#server.on("error", (err) => {
          console.error("test server | ", "startup error :", err);
          clearTimeout(timeout);
          reject(err);
        });

        this.#server.on("listening", async () => {
          const isConnectable = await isReachable(`http://127.0.0.1:${port}`);
          if (!isConnectable) {
            console.log("test server | ", port, "is not connectable");
            this.#server?.close();

            clearTimeout(timeout);
            reject(
              new Error(`Server started but port ${port} is not connectable`),
            );
            return;
          }
          clearTimeout(timeout);
          resolve(port);
        });

        if (!this.#server) {
          clearTimeout(timeout);
          reject(new Error("Failed to create server"));
          return;
        }

        this.#server.listen(port);
      },
    );
  }

  /**
   * Stop the server
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise(
      /** @param {(value: void) => void} resolve @param {(reason: Error) => void} reject */ (
        resolve,
        reject,
      ) => {
        if (!this.#server) {
          resolve();
          return;
        }

        this.#server.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.#server = null;
            resolve();
          }
        });
      },
    );
  }
}

export default TestServer;
