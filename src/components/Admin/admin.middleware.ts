import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EncryptionService } from 'src/utils/encryption.util';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  apiKey: string = 'KrgUEH+sPGB1Wswga3htquur3Xq3yfcaDhliE4Gcyx65hx1al01psg==';
  constructor(private readonly encryptionService: EncryptionService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = this.extractApiKeyFromHeader(req);
      if (!apiKey) {
        throw new UnauthorizedException();
      }

      const isAuthenticated: boolean = await this.encryptionService.compare(
        apiKey,
        this.apiKey,
      );

      if (!isAuthenticated) {
        throw new UnauthorizedException();
      } else {
        next();
      }
    } catch (e) {
      res.status(401).send('Error authenticating request');
    }
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    if (
      !request.headers['x-api-key'] ||
      typeof request.headers['x-api-key'] !== 'string'
    ) {
      return undefined;
    }
    return request.headers['x-api-key'] ?? undefined;
  }
}
