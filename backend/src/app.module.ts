import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { mongodbConfig } from './config/mongodbConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: mongodbConfig,
      inject: [ConfigService]
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
