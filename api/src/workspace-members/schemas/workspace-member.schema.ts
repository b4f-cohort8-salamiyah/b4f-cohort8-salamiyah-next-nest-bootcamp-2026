import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkspaceMemberDocument = WorkspaceMember & Document;

@Schema()
export class WorkspaceMember {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  workspaceId: number;

  @Prop({ required: true })
  userId: number;

  @Prop({ required: true, enum: ['owner', 'admin', 'member'] })
  role: string;

  @Prop({ default: () => new Date() })
  joinedAt: Date;
}

export const WorkspaceMemberSchema =
  SchemaFactory.createForClass(WorkspaceMember);
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
