import { Module } from '@nestjs/common';
import { RecordModule } from './Records/records.module';

@Module({
  imports: [RecordModule],
})
export class ComponentsModule {}
