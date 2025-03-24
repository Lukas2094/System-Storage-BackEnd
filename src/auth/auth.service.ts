import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Users)
        private userRepository: Repository<Users>,
        private jwtService: JwtService,
    ) { }

    async register(name: string, email: string, password: string): Promise<Users> {
        const userExists = await this.userRepository.findOne({ where: { email } });

        if (userExists) {
            throw new ConflictException('Este e-mail já está cadastrado.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ name, email, password: hashedPassword });
        return this.userRepository.save(user);
    }

    async login(email: string, password: string): Promise<{ accessToken: string }> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const payload = { email: user.email, sub: user.id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    async updatePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Senha atual incorreta');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await this.userRepository.save(user);
    }

    async forgotPassword(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            return false;
        }

        const resetToken = this.jwtService.sign({ email }, { expiresIn: '1h' });

        console.log(`Token de redefinição de senha: ${resetToken}`);

        return true;
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const decoded = this.jwtService.verify(token);
            const user = await this.userRepository.findOne({ where: { email: decoded.email } });

            if (!user) {
                throw new NotFoundException('Usuário não encontrado');
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            await this.userRepository.save(user);
        } catch (error) {
            throw new UnauthorizedException('Token inválido ou expirado');
        }
    }

    async validateUser(email: string): Promise<Users | null> {
        return this.userRepository.findOne({ where: { email } });
    }
}