import { AppError } from "@shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";

let inMemoryUsersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("should be able to create a new user", async () => {
    const user = await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("password");
    expect(user.name).toBe("Test User");
    expect(user.email).toBe("test@mail.com");
  });

  it("should not be able to create a duplicate user", async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Test User",
        email: "test@mail.com",
        password: "123456",
      });

      await createUserUseCase.execute({
        name: "Test User",
        email: "test@mail.com",
        password: "123456",
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
