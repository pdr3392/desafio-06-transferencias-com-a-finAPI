import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;

describe("Get Balance", () => {
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
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
  });

  it("should be able to retrieve an user's balance", async () => {
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

    await createStatementUseCase.execute(statement);

    const userStatements = await getBalanceUseCase.execute({
      user_id: authenticateInfo.user.id,
    });

    expect(userStatements).toHaveProperty("statement");
    expect(userStatements).toHaveProperty("balance");
    expect(userStatements.balance).toBe(100);
    expect(userStatements.statement[0]).toHaveProperty("id");
    expect(userStatements.statement[0]).toHaveProperty("user_id");
    expect(userStatements.statement[0]).toHaveProperty("type");
    expect(userStatements.statement[0]).toHaveProperty("amount");
    expect(userStatements.statement[0]).toHaveProperty("description");
    expect(userStatements.statement[0].amount).toBe(100);
  });

  it("should not be able to retrieve an inexistent user's balance", async () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "fake-user-id",
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
