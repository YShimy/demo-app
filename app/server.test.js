const request = require("supertest");
const app = require("./server");

test("GET / returns 200 and shows a version", async () => {
  const res = await request(app).get("/");
  expect(res.statusCode).toBe(200);
  expect(res.text).toContain("v");
});

test("GET /healthz is alive", async () => {
  const res = await request(app).get("/healthz");
  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe("alive");
});

test("GET /api/version returns a version field", async () => {
  const res = await request(app).get("/api/version");
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("version");
});
