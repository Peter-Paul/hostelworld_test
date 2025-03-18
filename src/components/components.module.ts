import { Module } from '@nestjs/common';
import { RecordModule } from './Records/records.module';
import { OrderModule } from './Order/order.module';

@Module({
  imports: [RecordModule, OrderModule],
})
export class ComponentsModule {}
