import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkspaceMemberDocument = WorkspaceMember & Document;

/**
 * CHALLENGE Answers:
 *
 * 1. JwtAuthGuard answers: "WHO is making this request?" (Authentication).
 *    WorkspaceMember answers: "WHAT does this user belong to, and in what role?" (Authorization Data).
 *    This homework ONLY implements the DATA FOUNDATION to answer the second question, not the enforcement logic itself.
 *
 * 2. Why does role belong on WorkspaceMember, rather than directly on User?
 *    A user can be an 'owner' in Workspace A, but only a 'member' in Workspace B.
 *    If we attached `role: 'owner'` directly to the User entity, they would hold owner rights globally across all workspaces, which breaks multi-tenancy.
 *
 * 3. Why is membership stored as its own separate entity rather than an array inside Workspace?
 *    Bounded vs. Unbounded growth. A workspace can potentially have thousands of members (unbounded).
 *    Embedding members as an array inside the Workspace document would risk hitting MongoDB's 16MB document size limit and cause severe read/write performance degradation.
 *
 * 4. What is still missing before any unauthorized action is actually stopped?
 *    We have created the underlying facts/data, but we still lack a custom guard (e.g., WorkspaceRolesGuard) or decorator (e.g., @RequireRole('owner'))
 *    on the route handlers to intercept incoming requests, query this WorkspaceMember model, and return a 403 Forbidden when permissions are insufficient.
 */
@Schema({ timestamps: false })
export class WorkspaceMember {
  @Prop({ required: true })
  workspaceId: number;

  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true, enum: ['owner', 'admin', 'member'] })
  role: string;

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export const WorkspaceMemberSchema =
  SchemaFactory.createForClass(WorkspaceMember);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
