import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WorkspaceMember,
  WorkspaceMemberDocument,
} from './schemas/workspace-member.schema';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    @InjectModel(WorkspaceMember.name)
    private readonly model: Model<WorkspaceMemberDocument>,
  ) {}

  findByWorkspaceAndUser(
    workspaceId: number,
    userId: number,
  ): Promise<WorkspaceMemberDocument | null> {
    return this.model.findOne({ workspaceId, userId });
  }

  async create(data: {
    workspaceId: number;
    userId: number;
    role: string;
  }): Promise<WorkspaceMemberDocument> {
    const existing = await this.findByWorkspaceAndUser(
      data.workspaceId,
      data.userId,
    );

    if (existing) {
      throw new ConflictException(
        `User ${data.userId} is already a member of workspace ${data.workspaceId}.`,
      );
    }

    const last = await this.model.findOne().sort({ id: -1 }).exec();
    const id = (last?.id ?? 0) + 1;

    const member = new this.model({ id, ...data });

    return member.save();
  }
}
