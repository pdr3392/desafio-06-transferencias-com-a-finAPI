import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Authenticate User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be able to authenticate a user", async () => {
    await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    const authenticateInfo = await authenticateUserUseCase.execute({
      email: "test@mail.com",
      password: "123456",
    });

    expect(authenticateInfo).toHaveProperty("user");
    expect(authenticateInfo.user).toHaveProperty("id");
    expect(authenticateInfo.user).toHaveProperty("name");
    expect(authenticateInfo.user).toHaveProperty("email");
    expect(authenticateInfo).toHaveProperty("token");
  });

  it("should not be able to authenticate (a non-existing user)/(with incorrect email)", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "test@mail.com",
        password: "123456",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("should not be able to authenticate a user with incorrect password", async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Test User",
        email: "test@mail.com",
        password: "123456",
      });

      await authenticateUserUseCase.execute({
        email: "test@mail.com",
        password: "111111",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
