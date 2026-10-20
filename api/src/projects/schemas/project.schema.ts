import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  workspaceId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  key: string;

  @Prop({ default: '' })
  description: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
