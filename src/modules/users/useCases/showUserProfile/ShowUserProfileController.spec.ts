import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import "../../../../database/index";

let connection: Connection;

describe("Show User Profile Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
    /*
    const id = uuidv4();
    const password = await hash("admin", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
        values('${id}', 'testUser', 'test@test.com.br', '${password}', 'now()', 'now()')
        `
    ); */
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to show an user profile", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Pedro",
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    const response = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("email");
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to retrieve an user profile with invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set("Authorization", `Bearer fake-token`);

    expect(response.statusCode).toBe(401);
  });
});
