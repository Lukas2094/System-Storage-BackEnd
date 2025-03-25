// src/estoque/estoque.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Res, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { EstoqueService } from './estoque.service';
import { Estoque } from './entities/estoque.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Movimentacao } from './entities/movimentacao.entity';

@Controller('estoque')
export class EstoqueController {
    constructor(private readonly estoqueService: EstoqueService) { }

    @Post('movimentacao')
    async registrarMovimentacao(@Body() body: any) {
        return this.estoqueService.registrarMovimentacao(body);
    }

    @Get('movimentacoes')
    async listarMovimentacoes() {
        return this.estoqueService.buscarMovimentacoes();
    }

    @Get('relatorio/movimentacoes/csv')
    async gerarRelatorioCsv(@Res() res: Response) {
        try {
            const csvBuffer = await this.estoqueService.gerarRelatorioCsv();

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=movimentacoes_estoque.csv');
            res.send(csvBuffer);
        } catch (error) {
            throw new InternalServerErrorException('Erro ao gerar relatório CSV');
        }
    }

    @Put('movimentacao/:id')
    async atualizarMovimentacao(
        @Param('id') id: string,
        @Body() body: Partial<Movimentacao>
    ) {
        try {
            return await this.estoqueService.atualizarMovimentacao(parseInt(id), body);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    @Delete('movimentacao/:id')
    async removerMovimentacao(@Param('id') id: string) {
        try {
            return await this.estoqueService.removerMovimentacao(parseInt(id));
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }

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