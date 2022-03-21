import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe("Get Statement Operation", () => {
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
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("should be able to retrieve a statement operation", async () => {
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

    const response = await getStatementOperationUseCase.execute({
      user_id: authenticateInfo.user.id,
      statement_id: newStatement.id,
    });

    expect(response).toHaveProperty("id");
    expect(response).toHaveProperty("user_id");
    expect(response).toHaveProperty("type");
    expect(response).toHaveProperty("amount");
    expect(response.amount).toBe(100);
    expect(response).toHaveProperty("description");
  });

  it("should not be able to retrieve a non existent statement operation", async () => {
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

      const statement: ICreateStatementDTO = {
        user_id: authenticateInfo.user.id,
        amount: 100,
        type: OperationType.DEPOSIT,
        description: "statement test",
      };

      const newStatement = await createStatementUseCase.execute(statement);

      const response = await getStatementOperationUseCase.execute({
        user_id: authenticateInfo.user.id,
        statement_id: "fake-statement-id",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });

  it("should not be able to retrieve a statement operation from a non existent user", async () => {
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

      const statement: ICreateStatementDTO = {
        user_id: authenticateInfo.user.id,
        amount: 100,
        type: OperationType.DEPOSIT,
        description: "statement test",
      };

      const newStatement = await createStatementUseCase.execute(statement);

      await getStatementOperationUseCase.execute({
        user_id: "fake-user-id",
        statement_id: newStatement.id,
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });
});
