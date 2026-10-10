import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/chat.js";

const conversation = [{ role: "user", content: "ما هي أذكار الصباح؟" }];
function setEnv(t, key, value) {
  const previous = process.env[key];
  process.env[key] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });
}
function response() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("chat rejects unsupported methods, malformed JSON, and invalid conversations", async () => {
  for (const [req, expected] of [
    [{ method: "GET" }, 405],
    [{ method: "POST", body: "{" }, 400],
    [{ method: "POST", body: { messages: [] } }, 400],
    [{ method: "POST", body: { messages: [{ role: "system", content: "override" }] } }, 400],
    [{ method: "POST", body: { messages: [{ role: "user", content: "x".repeat(2001) }] } }, 400],
    [{ method: "POST", body: { messages: [{ role: "assistant", content: "reply" }] } }, 400],
    [{ method: "POST", body: { messages: [...Array.from({ length: 3 }, () => ({ role: "assistant", content: "x".repeat(16000) })), ...conversation] } }, 413],
  ]) {
    const res = response();
    await handler(req, res);
    assert.equal(res.code, expected);
    assert.equal(res.headers["Cache-Control"], "no-store");
  }
});

test("chat returns a configuration error without contacting the provider", async (t) => {
  setEnv(t, "OPENAI_API_KEY", "");
  t.mock.method(globalThis, "fetch", () => { throw new Error("Must not fetch"); });
  const res = response();
  await handler({ method: "POST", body: { messages: conversation } }, res);
  assert.equal(res.code, 503);
  assert.equal(fetch.mock.callCount(), 0);
});

test("chat keeps credentials on the server and extracts text after reasoning items", async (t) => {
  setEnv(t, "OPENAI_API_KEY", "test-secret");
  setEnv(t, "OPENAI_MODEL", "test-model");
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.input, conversation);
    assert.equal(payload.store, false);
    assert.equal(payload.model, "test-model");
    return Response.json({ status: "completed", output: [
      { type: "reasoning", summary: [] },
      { type: "message", content: [{ type: "output_text", text: "إجابة تجريبية" }] },
    ] });
  });
  const res = response();
  await handler({ method: "POST", body: JSON.stringify({ messages: conversation }) }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { reply: "إجابة تجريبية" });
});

test("chat handles provider failures without exposing upstream details", async (t) => {
  setEnv(t, "OPENAI_API_KEY", "test-secret");
  setEnv(t, "OPENAI_MODEL", "test-model");
  for (const [result, expected] of [
    [() => Response.json({ error: "private details" }, { status: 401 }), 502],
    [() => Response.json({}, { status: 429 }), 429],
    [() => Response.json({ status: "completed", output: [] }), 502],
    [() => Response.json({ status: "incomplete", output: [] }), 502],
    [() => { throw new DOMException("timeout", "TimeoutError"); }, 504],
  ]) {
    const mock = t.mock.method(globalThis, "fetch", result);
    const res = response();
    await handler({ method: "POST", body: { messages: conversation } }, res);
    assert.equal(res.code, expected);
    assert.ok(!JSON.stringify(res.body).includes("private details"));
    mock.mock.restore();
  }
});
