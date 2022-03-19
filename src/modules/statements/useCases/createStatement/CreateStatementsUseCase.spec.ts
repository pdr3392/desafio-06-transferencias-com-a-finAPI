import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create Statement", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("should be able to create a deposit to an user", async () => {
    await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    const authenticateInfo = await authenticateUserUseCase.execute({
      email: "test@mail.com",
      password: "123456",
    });

    const statement: ICreateStatementDTO = {
      user_id: authenticateInfo.user.id,
      amount: 100,
      type: OperationType.DEPOSIT,
      description: "statement test",
    };

    const newStatement = await createStatementUseCase.execute(statement);

    expect(newStatement).toHaveProperty("id");
    expect(newStatement).toHaveProperty("user_id");
    expect(newStatement).toHaveProperty("type");
    expect(newStatement).toHaveProperty("amount");
    expect(newStatement.amount).toBe(100);
    expect(newStatement).toHaveProperty("description");
  });

  it("should be able to create a withdraw to an user", async () => {
    await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    const authenticateInfo = await authenticateUserUseCase.execute({
      email: "test@mail.com",
      password: "123456",
    });

    await createStatementUseCase.execute({
      user_id: authenticateInfo.user.id,
      amount: 100,
      type: OperationType.DEPOSIT,
      description: "statement test",
    });

    const statement: ICreateStatementDTO = {
      user_id: authenticateInfo.user.id,
      amount: 50,
      type: OperationType.WITHDRAW,
      description: "statement test",
    };

    const newStatement = await createStatementUseCase.execute(statement);

    expect(newStatement).toHaveProperty("id");
    expect(newStatement).toHaveProperty("user_id");
    expect(newStatement).toHaveProperty("type");
    expect(newStatement).toHaveProperty("amount");
    expect(newStatement.amount).toBe(50);
    expect(newStatement).toHaveProperty("description");
  });

  it("should not be able to create a new statement for an inexistent user", async () => {
    expect(async () => {
      const statement: ICreateStatementDTO = {
        user_id: "fake-user-id",
        amount: 120,
        type: OperationType.WITHDRAW,
        description: "statement test",
      };

      await createStatementUseCase.execute(statement);
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("should not be able to withdraw with insufficient funds", async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "Test User",
        email: "test@mail.com",
        password: "123456",
      });

      const authenticateInfo = await authenticateUserUseCase.execute({
        email: "test@mail.com",
        password: "123456",
      });

      await createStatementUseCase.execute({
        user_id: authenticateInfo.user.id,
        amount: 100,
        type: OperationType.DEPOSIT,
        description: "statement test",
      });

      const statement: ICreateStatementDTO = {
        user_id: authenticateInfo.user.id,
        amount: 120,
        type: OperationType.WITHDRAW,
        description: "statement test",
      };

      await createStatementUseCase.execute(statement);
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });
});
