/**
 * JSON-RPC protocol type definitions and validators.
 */

import { type } from "arktype";

export const JsonRpcRequest = type({
  jsonrpc: "string",
  method: "string",
  "params?": "unknown",
  "id?": "number",
});
export type JsonRpcRequest = typeof JsonRpcRequest.infer;

const JsonRpcError = type({
  code: "number",
  message: "string",
});

export const JsonRpcResponse = type({
  jsonrpc: "string",
  "id?": "number",
  "result?": "unknown",
  "error?": JsonRpcError,
});
export type JsonRpcResponse = typeof JsonRpcResponse.infer;
