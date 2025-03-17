import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { ComponentsModule } from './components/components.module';

@Module({
  imports: [MongooseModule.forRoot(AppConfig.mongoUrl), ComponentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
