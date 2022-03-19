import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { UsersRepository } from "@modules/users/repositories/UsersRepository";
import { AuthenticateUserUseCase } from "../authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Show User Profile", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be able to display an user information", async () => {
    await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    const { user, token } = await authenticateUserUseCase.execute({
      email: "test@mail.com",
      password: "123456",
    });

    const userInfo = await showUserProfileUseCase.execute(user.id);

    expect(userInfo).toHaveProperty("id");
    expect(userInfo).toHaveProperty("email");
    expect(userInfo).toHaveProperty("name");
    expect(userInfo).toHaveProperty("password");
  });

  it("should not be able to display an information of an non-existing user", async () => {
    expect(async () => {
      await showUserProfileUseCase.execute("non-existent-id");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
