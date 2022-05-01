import { OperationType } from "../../entities/Statement";
import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateStatementError } from "../createStatement/CreateStatementError";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

export class CreateTransferController {
  async execute(request: Request, response: Response) {
    const { id: sender_id } = request.user;
    const { receiver_id } = request.params;
    const { amount, description } = request.body;

    if (!receiver_id) {
      throw new CreateStatementError.InvalidReceiver();
    }

    const createTransfer = container.resolve(CreateTransferUseCase);

    const statement = await createTransfer.execute({
      sender_id,
      amount,
      user_id: receiver_id,
      type: OperationType.TRANSFER,
      description,
    });

    return response.status(201).json({
      id: statement.id,
      sender_id: statement.sender_id,
      amount: statement.amount,
      description: statement.description,
      type: statement.description,
      created_at: statement.created_at,
      updated_at: statement.updated_at,
    });
  }
}
