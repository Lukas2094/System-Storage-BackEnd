// src/estoque/estoque.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { Estoque } from './entities/estoque.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('estoque')
export class EstoqueController {
    constructor(private readonly estoqueService: EstoqueService) { }

    @Post()
    create(@Body() estoque: Estoque): Promise<Estoque> {
        return this.estoqueService.create(estoque);
    }
    
    @UseGuards(JwtAuthGuard)  
    @Get()
    findAll(): Promise<Estoque[]> {
        return this.estoqueService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Estoque> {
        return this.estoqueService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() estoque: Partial<Estoque>): Promise<void> {
        return this.estoqueService.update(id, estoque);
    }

    @Delete(':id')
    remove(@Param('id') id: number): Promise<void> {
        return this.estoqueService.remove(id);
    }

    @Delete('soft-delete/:id')
    softDelete(@Param('id') id: number): Promise<void> {
        return this.estoqueService.softDelete(id);
    }
}