// src/estoque/estoque.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estoque } from './entities/estoque.entity';

@Injectable()
export class EstoqueService {
    constructor(
        @InjectRepository(Estoque)
        private estoqueRepository: Repository<Estoque>,
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
}