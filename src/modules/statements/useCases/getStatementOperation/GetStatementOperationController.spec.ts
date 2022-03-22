import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import "../../../../database/index";

let connection: Connection;

describe("Get Statement Operation Controller", () => {
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

  it("should be able retrieve an statement operation", async () => {
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

    const depositStatement = await request(app)
      .post("/api/v1/statements/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        description: "deposit test",
      });

    const withdrawStatement = await request(app)
      .post("/api/v1/statements/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 50,
        description: "withdraw test",
      });

    const depositResponse = await request(app)
      .get(`/api/v1/statements/${depositStatement.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    const withdrawResponse = await request(app)
      .get(`/api/v1/statements/${withdrawStatement.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(withdrawResponse.body).toHaveProperty("id");
    expect(withdrawResponse.body).toHaveProperty("user_id");
    expect(withdrawResponse.body).toHaveProperty("description");
    expect(withdrawResponse.body).toHaveProperty("amount");
    expect(withdrawResponse.body.amount).toBe("50.00");
    expect(withdrawResponse.body).toHaveProperty("type");
    expect(withdrawResponse.body).toHaveProperty("created_at");
    expect(withdrawResponse.body).toHaveProperty("updated_at");

    expect(depositResponse.body).toHaveProperty("id");
    expect(depositResponse.body).toHaveProperty("user_id");
    expect(depositResponse.body).toHaveProperty("description");
    expect(depositResponse.body).toHaveProperty("amount");
    expect(depositResponse.body.amount).toBe("100.00");
    expect(depositResponse.body).toHaveProperty("type");
    expect(depositResponse.body).toHaveProperty("created_at");
    expect(depositResponse.body).toHaveProperty("updated_at");
  });

  it("should be not be able to retrieve a non existent statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const { token } = responseToken.body;

    const response = await request(app)
      .get(`/api/v1/statements/${uuidv4()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});
