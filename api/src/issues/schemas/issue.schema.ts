import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IssueDocument = Issue & Document;

@Schema()
export class Issue {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  projectId: number;

  @Prop({ required: true })
  reporterId: number;

  @Prop()
  assigneeId?: number;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'todo' })
  status: string;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
IssueSchema.index({ projectId: 1, status: 1 });
