import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import "../../../../database/index";

let connection: Connection;

describe("Authenticate User Controller", () => {
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

  it("should be able to authenticate an user", async () => {
    await request(app).post("/api/v1/users").send({
      name: "Pedro",
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "phrcorreia3392@gmail.com",
      password: "123456",
    });

    expect(responseToken.body).toHaveProperty("token");
  });

  it("should not be able to authenticate an inexistent user", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "fake-test@gmail.com",
      password: "123456",
    });

    expect(responseToken.statusCode).toBe(401);
  });
});
