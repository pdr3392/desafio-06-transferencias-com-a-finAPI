import { User } from "@modules/users/entities/User";
import { JWTInvalidTokenError } from "@shared/errors/JWTInvalidTokenError";
import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { app } from "../../../../app";
import "../../../../database/index";

const sender = {
  email: "je@ise.tt",
  name: "Edna Mendez",
  password: "",
  id: uuidv4(),
};

const receiver = {
  email: "bolrettu@sobwen.tv",
  name: "Hunter Thompson",
  password: "",
  id: uuidv4(),
};

let connection: Connection;

describe("Create Transfer Controller", () => {
  beforeAll(async () => {
    const senderHashPassword = await hash("1234", 8);
    const receiverHashPassword = await hash("1234", 8);

    sender.password = senderHashPassword;
    receiver.password = receiverHashPassword;

    connection = await createConnection();
    await connection.runMigrations();

    await connection.query(`
      INSERT INTO users(id, name, email, password, created_at, updated_at)
      VALUES ('${sender.id}', '${sender.name}', '${sender.email}', '${sender.password}', NOW(), NOW())
    `);

    await connection.query(`
      INSERT INTO users(id, name, email, password, created_at, updated_at)
      VALUES ('${receiver.id}', '${receiver.name}', '${receiver.email}', '${receiver.password}', NOW(), NOW())
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to transfer funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: sender.email,
      password: "1234",
    });

    const { token } = responseToken.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        description: "deposit test",
      });

    const transfer = await request(app)
      .post(`/api/v1/statements/transfer/${receiver.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        description: "transfer test",
      });

    expect(transfer.body).toHaveProperty("id");
    expect(transfer.body).toHaveProperty("sender_id");
    expect(transfer.body).toHaveProperty("description");
    expect(transfer.body).toHaveProperty("amount");
    expect(transfer.body.amount).toBe(100);
    expect(transfer.body.type).toBe("transfer test");
    expect(transfer.body).toHaveProperty("created_at");
    expect(transfer.body).toHaveProperty("updated_at");
  });

  it("should not be able to transfer with an invalid token", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: sender.email,
      password: "1234",
    });

    const { token } = responseToken.body;

    await request(app)
      .post("/api/v1/statements/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 100,
        description: "deposit test",
      });

    const transferStatement = await request(app)
      .post(`/api/v1/statements/transfer/${receiver.id}`)
      .set("Authorization", `Bearer invalid-token`)
      .send({
        amount: 100,
        description: "transfer test",
      });

    expect(transferStatement.statusCode).toBe(401);
  });
});
