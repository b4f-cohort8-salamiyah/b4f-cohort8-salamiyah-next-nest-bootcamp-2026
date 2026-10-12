import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema()
export class Workspace {
  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
