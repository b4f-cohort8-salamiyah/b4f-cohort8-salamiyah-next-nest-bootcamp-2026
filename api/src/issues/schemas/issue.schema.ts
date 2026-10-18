import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IssueDocument = Issue & Document;

// Reference vs. embed -- the one deciding factor is bounded vs. unbounded
// growth (and whether the child is read on its own or always with its parent).
// A Project's Issues grow without limit and are listed, filtered and paged on
// their own (GET /issues?projectId=&status=), so embedding them would push a
// Project document toward the 16MB cap and force loading the whole project
// to read one issue -> Issues live in their own collection, keyed by projectId.
// An Issue's Comments stay a small, bounded set that is only ever read
// together with that Issue, so they can sit inside it and come back in the
// same single read.
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
