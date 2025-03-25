// src/estoque/entities/movimentacao.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Movimentacao {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 10 })
    tipo: 'entrada' | 'saida';

    @Column()
    produto_id: number;

    @Column()
    produto_nome: string;

    @Column()
    quantidade: number;

    @Column()
    responsavel: string;

    @Column({ nullable: true })
    observacao: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    data: Date;
}