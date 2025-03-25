import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { utils, write } from 'xlsx';
import { Estoque } from './entities/estoque.entity';
import { Movimentacao } from './entities/movimentacao.entity';

@Injectable()
export class EstoqueService {
    constructor(
        @InjectRepository(Estoque)
        private estoqueRepository: Repository<Estoque>,
        @InjectRepository(Movimentacao)
        private movimentacaoRepository: Repository<Movimentacao>,
    ) { }

    async create(estoque: Estoque): Promise<Estoque> {
        return this.estoqueRepository.save(estoque);
    }

    async findAll(): Promise<Estoque[]> {
        return this.estoqueRepository.find();
    }

    async findOne(id: number): Promise<Estoque> {
        const estoque = await this.estoqueRepository.findOne({ where: { id } });
        if (!estoque) {
            throw new NotFoundException(`Estoque com ID ${id} não encontrado`);
        }
        return estoque;
    }

    async update(id: number, estoque: Partial<Estoque>): Promise<void> {
        const result = await this.estoqueRepository.update(id, estoque);
        if (result.affected === 0) {
            throw new NotFoundException(`Estoque com ID ${id} não encontrado`);
        }
    }

    async remove(id: number): Promise<void> {
        const result = await this.estoqueRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Estoque com ID ${id} não encontrado`);
        }
    }

    async softDelete(id: number): Promise<void> {
        const result = await this.estoqueRepository.update(id, { data_delete: new Date() });
        if (result.affected === 0) {
            throw new NotFoundException(`Estoque com ID ${id} não encontrado`);
        }
    }

    async registrarMovimentacao(body: any) {
        // Busca o produto
        const produto = await this.estoqueRepository.findOne({
            where: { id: body.produto_id }
        });

        if (!produto) {
            throw new NotFoundException(`Produto com ID ${body.produto_id} não encontrado`);
        }

        // Atualiza estoque - MODIFICADO AQUI
        if (body.tipo === 'entrada') {
            await this.estoqueRepository
                .createQueryBuilder()
                .update(Estoque)
                .set({ quantidade: () => `quantidade + ${body.quantidade}` })
                .where("id = :id", { id: body.produto_id })
                .execute();
        } else {
            // Verifica se tem estoque suficiente
            if (produto.quantidade < body.quantidade) {
                throw new Error('Quantidade em estoque insuficiente');
            }
            await this.estoqueRepository
                .createQueryBuilder()
                .update(Estoque)
                .set({ quantidade: () => `quantidade - ${body.quantidade}` })
                .where("id = :id", { id: body.produto_id })
                .execute();
        }

        // Registra movimentação
        const movimentacao = this.movimentacaoRepository.create({
            tipo: body.tipo,
            produto_id: body.produto_id,
            produto_nome: produto.nome,
            quantidade: body.quantidade,
            responsavel: body.responsavel,
            observacao: body.observacao
        });

        return this.movimentacaoRepository.save(movimentacao);
    }

    async buscarMovimentacoes() {
        return this.movimentacaoRepository.query(`
            SELECT m.*, e.nome as produto_nome 
            FROM movimentacao m
            LEFT JOIN estoque e ON m.produto_id = e.id
            ORDER BY m.data DESC
        `);
    }

    async gerarRelatorioCsv() {
        const movimentacoes = await this.buscarMovimentacoes();

        // Função para formatar valores CSV corretamente
        const formatarValorCsv = (valor: any) => {
            if (valor === null || valor === undefined) return '';
            // Converte datas para formato ISO
            if (valor instanceof Date) return valor.toISOString();
            // Escapa aspas e quebras de linha em strings
            const str = String(valor);
            if (str.includes('"') || str.includes('\n') || str.includes(';')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Cabeçalhos do CSV
        const cabecalhos = [
            'Data',
            'Tipo',
            'Produto ID',
            'Produto',
            'Quantidade',
            'Responsável',
            'Observação'
        ];

        // Linhas de dados formatadas
        const linhas = movimentacoes.map(mov => [
            formatarValorCsv(new Date(mov.data)),
            formatarValorCsv(mov.tipo),
            formatarValorCsv(mov.produto_id),
            formatarValorCsv(mov.produto_nome),
            formatarValorCsv(mov.quantidade),
            formatarValorCsv(mov.responsavel),
            formatarValorCsv(mov.observacao)
        ]);

        // Junta tudo em uma string CSV
        const csvContent = [
            cabecalhos.join(';'), // Cabeçalho
            ...linhas.map(linha => linha.join(';')) // Linhas de dados
        ].join('\n');

        // Retorna o buffer do CSV
        return Buffer.from(csvContent, 'utf-8');
    }
    
    async atualizarMovimentacao(id: number, body: any) {
        // Busca a movimentação existente
        const movimentacao = await this.movimentacaoRepository.findOne({
            where: { id }
        });

        if (!movimentacao) {
            throw new NotFoundException(`Movimentação com ID ${id} não encontrada`);
        }

        // Validações básicas
        if (body.quantidade && (isNaN(body.quantidade) || body.quantidade <= 0)) {
            throw new BadRequestException('Quantidade deve ser um número positivo');
        }

        if (body.tipo && !['entrada', 'saida'].includes(body.tipo)) {
            throw new BadRequestException('Tipo de movimentação inválido');
        }

        // Atualiza os campos permitidos
        const camposPermitidos = ['tipo', 'quantidade', 'responsavel', 'observacao'];
        for (const campo of camposPermitidos) {
            if (body[campo] !== undefined) {
                movimentacao[campo] = body[campo];
            }
        }

        // Se a quantidade ou tipo foi alterado, precisamos ajustar o estoque
        if (body.quantidade || body.tipo) {
            const produto = await this.estoqueRepository.findOne({
                where: { id: movimentacao.produto_id }
            });

            if (!produto) {
                throw new NotFoundException(`Produto relacionado não encontrado`);
            }

            // Reverte a movimentação original
            if (movimentacao.tipo === 'entrada') {
                await this.estoqueRepository.decrement(
                    { id: movimentacao.produto_id },
                    'quantidade',
                    movimentacao.quantidade
                );
            } else {
                await this.estoqueRepository.increment(
                    { id: movimentacao.produto_id },
                    'quantidade',
                    movimentacao.quantidade
                );
            }

            // Aplica a nova movimentação
            if (body.tipo === 'entrada' || (!body.tipo && movimentacao.tipo === 'entrada')) {
                await this.estoqueRepository.increment(
                    { id: movimentacao.produto_id },
                    'quantidade',
                    body.quantidade || movimentacao.quantidade
                );
            } else {
                // Verifica estoque suficiente para saída
                const novaQuantidade = body.quantidade || movimentacao.quantidade;
                if (produto.quantidade < novaQuantidade) {
                    throw new BadRequestException('Quantidade em estoque insuficiente');
                }

                await this.estoqueRepository.decrement(
                    { id: movimentacao.produto_id },
                    'quantidade',
                    novaQuantidade
                );
            }
        }

        return this.movimentacaoRepository.save(movimentacao);
    }

    async removerMovimentacao(id: number) {
        const movimentacao = await this.movimentacaoRepository.findOne({
            where: { id }
        });

        if (!movimentacao) {
            throw new NotFoundException(`Movimentação com ID ${id} não encontrada`);
        }

        // Ajusta o estoque ao remover a movimentação
        if (movimentacao.tipo === 'entrada') {
            await this.estoqueRepository.decrement(
                { id: movimentacao.produto_id },
                'quantidade',
                movimentacao.quantidade
            );
        } else {
            await this.estoqueRepository.increment(
                { id: movimentacao.produto_id },
                'quantidade',
                movimentacao.quantidade
            );
        }

        await this.movimentacaoRepository.delete(id);
        return { message: 'Movimentação removida com sucesso' };
    }
}