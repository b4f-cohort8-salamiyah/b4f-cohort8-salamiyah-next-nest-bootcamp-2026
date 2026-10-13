import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalToolGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  // this tool guard work like a gate that checks all the incoming requests 
  // and checks if the user has the access key that only allowed devolopers has it 
  // and if not returns a 409 response with message telling him he is not allowed to enter this endpoint 
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-internal-tool-key'];
    const expectedKey = this.config.get<string>('INTERNAL_TOOL_KEY');

    if (!providedKey || providedKey !== expectedKey) {
      throw new ForbiddenException(
        "This operation is restricted to B4F Board's own internal tooling.",
      );
    }

    return true;
  }
}
