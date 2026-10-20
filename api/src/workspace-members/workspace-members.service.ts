import { Injectable } from '@nestjs/common';
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
    private readonly memberModel: Model<WorkspaceMemberDocument>,
  ) {}

  async createMembership(
    workspaceId: number,
    userId: number,
    role: string,
  ): Promise<WorkspaceMemberDocument> {
    return this.memberModel.create({
      workspaceId,
      userId,
      role,
      joinedAt: new Date(),
    });
  }

  async getMembership(
    workspaceId: number,
    userId: number,
  ): Promise<WorkspaceMemberDocument | null> {
    return this.memberModel.findOne({ workspaceId, userId });
  }

  async getUserMemberships(userId: number): Promise<WorkspaceMemberDocument[]> {
    return this.memberModel.find({ userId });
  }
}
