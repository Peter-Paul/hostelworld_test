import { MiddlewareConsumer, Module } from '@nestjs/common';
import { EncryptionService } from 'src/utils/encryption.util';
import { RecordModule } from '../Records/records.module';
import { AdminMiddleware } from './admin.middleware';
import { AdminController } from './admin.controller';

@Module({
  imports: [RecordModule],
  providers: [EncryptionService],
  controllers: [AdminController],
})
export class AdminModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminMiddleware).forRoutes('/admin/*');
  }
}
