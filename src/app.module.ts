import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstoqueModule } from './estoque/estoque.module';
import { Estoque } from './estoque/entities/estoque.entity';
import { Users } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Carrega as variáveis de ambiente do arquivo .env
    TypeOrmModule.forRoot({
      type: 'mysql', // Tipo do banco de dados
      host: process.env.DB_HOST, // Usa a variável de ambiente DB_HOST
      port: parseInt(process.env.DB_PORT || '3306', 10), // Usa a variável de ambiente DB_PORT
      username: process.env.DB_USERNAME, // Usa a variável de ambiente DB_USERNAME
      password: process.env.DB_PASSWORD, // Usa a variável de ambiente DB_PASSWORD
      database: process.env.DB_DATABASE, // Usa a variável de ambiente DB_DATABASE
      entities: [Estoque, Users], // Entidades (tabelas) que serão criadas no banco de dados 
      synchronize: true,
    }),
    EstoqueModule,
    AuthModule,
  ],
})
export class AppModule { }