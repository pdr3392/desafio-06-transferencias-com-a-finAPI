import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import "../../../../database/index";

let connection: Connection;

describe("Get Balance Controller", () => {
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

  it("should be able retrieve an user's balance", async () => {
    const user = await request(app).post("/api/v1/users").send({
      name: "Pedro",
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        description: "deposit test",
      });

    await request(app)
      .post("/api/v1/statements/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 50,
        description: "withdraw test",
      });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set("Authorization", `Bearer ${token}`)
      .send(user.body.id);

    expect(response.body).toHaveProperty("statement");
    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(50);
  });

  it("should not be able retrieve balance with invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set("Authorization", `Bearer invalid-token`)
      .send("fake-used-id");

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("JWT invalid token!");
  });
});
