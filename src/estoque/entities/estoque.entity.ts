import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Movimentacao } from './movimentacao.entity';
@Entity()
export class Estoque {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column()
    quantidade: number;

    @Column()
    localizacao: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dataAtualizacao: Date;

    @Column({ type: 'date', nullable: true })
    data_delete: Date;

    @Column({ type: 'varchar', length: 255, nullable: true }) 
    categoria: string;
}