// src/estoque/estoque.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estoque } from './entities/estoque.entity';
import { EstoqueService } from './estoque.service';
import { EstoqueController } from './estoque.controller';
import { Movimentacao } from './entities/movimentacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Estoque , Movimentacao])],
  controllers: [EstoqueController],
  providers: [EstoqueService],
})
export class EstoqueModule { }