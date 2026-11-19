import request from "supertest";
import { app } from "../src/app";

describe("GET /health", () => {
  it("returns healthy when the database is reachable", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "healthy", database: "connected" }
    });
  });
});
