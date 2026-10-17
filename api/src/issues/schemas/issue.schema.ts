import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IssueDocument = Issue & Document;


/*
 * Why are Issues referenced from Projects, while Comments can later be
 * embedded inside Issues?
 *
 * The one deciding factor is growth shape. A Project's issues grow WITHOUT
 * BOUND for the project's whole lifetime and are queried on their own, so
 * embedding them would eventually hit MongoDB's document-size ceiling.
 * An Issue's comments stay BOUNDED for a realistic issue and are almost
 * always read together with it, so embedding them is safe and cheap.
 */



@Schema()
export class Issue {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  projectId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'todo' })
  status: string;
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
IssueSchema.index({ projectId: 1, status: 1 });
