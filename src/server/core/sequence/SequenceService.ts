import { PrismaClient } from "@prisma/client";
import { db } from "../../../server/db";

export class SequenceService {
  /**
   * Atomically reserves and returns the next sequence number for a given type.
   * Format: PREFIX-00001
   */
  static async reserveSequence(
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    companyId: string,
    type: string,
    prefix: string,
    padding: number = 5
  ): Promise<string> {
    const sequence = await tx.sequence.upsert({
      where: {
        companyId_type: {
          companyId,
          type,
        },
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        companyId,
        type,
        lastValue: 1,
      },
    });

    const numberStr = sequence.lastValue.toString().padStart(padding, "0");
    return `${prefix}-${numberStr}`;
  }
}
