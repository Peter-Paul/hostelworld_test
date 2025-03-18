import { Module } from '@nestjs/common';
import { RecordModule } from './Records/records.module';
import { OrderModule } from './Order/order.module';
import { AdminModule } from './Admin/admin.module';

@Module({
  imports: [RecordModule, OrderModule, AdminModule],
})
export class ComponentsModule {}
