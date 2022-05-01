import { OperationType } from "@modules/statements/entities/Statement";
import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createTransferUseCase: CreateTransferUseCase;
let getBalanceUseCase: GetBalanceUseCase;

describe("Create Transfer", () => {
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
    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
  });

  it("should be able to transfer funds to another user", async () => {
    const sender = await createUserUseCase.execute({
      name: "Test User",
      email: "test@mail.com",
      password: "123456",
    });

    const receiver = await createUserUseCase.execute({
      name: "Second Test User",
      email: "test2@mail.com",
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

    const transferToRegister: ICreateStatementDTO = {
      user_id: receiver.id,
      amount: 100,
      sender_id: sender.id,
      description: "Test Transfer",
      type: OperationType.TRANSFER,
    };

    const transferStatement = await createTransferUseCase.execute(
      transferToRegister
    );

    const senderBalance = await getBalanceUseCase.execute({
      user_id: sender.id,
    });

    const receiverBalance = await getBalanceUseCase.execute({
      user_id: receiver.id,
    });

    expect(transferStatement).toHaveProperty("id");
    expect(transferStatement).toHaveProperty("user_id");
    expect(transferStatement).toHaveProperty("sender_id");
    expect(transferStatement).toHaveProperty("type");
    expect(transferStatement).toHaveProperty("amount");
    expect(transferStatement).toHaveProperty("description");
    expect(senderBalance.balance).toBe(0);
    expect(receiverBalance.balance).toBe(100);
  });

  it("should not be able to send a transfer with insufficient funds", async () => {
    const sender = await createUserUseCase.execute({
      name: "Third Test User",
      email: "test3@mail.com",
      password: "123456",
    });

    const receiver = await createUserUseCase.execute({
      name: "Fourth Test User",
      email: "test4@mail.com",
      password: "123456",
    });

    expect(async () => {
      await createTransferUseCase.execute({
        user_id: receiver.id,
        amount: 100,
        sender_id: sender.id,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });
    }).rejects.toEqual(new CreateStatementError.InsufficientFunds());
  });

  it("should not be able to send a transfer to an inexistent user", async () => {
    const sender = await createUserUseCase.execute({
      name: "Fifth Test User",
      email: "test5@mail.com",
      password: "123456",
    });

    const authenticateInfo = await authenticateUserUseCase.execute({
      email: "test5@mail.com",
      password: "123456",
    });

    await createStatementUseCase.execute({
      user_id: authenticateInfo.user.id,
      amount: 100,
      type: OperationType.DEPOSIT,
      description: "statement test",
    });

    expect(async () => {
      await createTransferUseCase.execute({
        user_id: "",
        amount: 100,
        sender_id: sender.id,
        description: "Test Transfer",
        type: OperationType.TRANSFER,
      });
    }).rejects.toEqual(new CreateStatementError.UserNotFound());
  });
});
