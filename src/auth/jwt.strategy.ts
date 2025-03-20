// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config'; // Importe o ConfigService
import { BlacklistService } from './blacklist.service'; // Importe o BlacklistService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService,
        private configService: ConfigService, // Injete o ConfigService
        private blacklistService: BlacklistService, // Injete o BlacklistService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrai o token do cabeçalho Authorization
            secretOrKey: configService.get<string>('JWT_SECRET'), // Use o ConfigService para acessar a chave secreta
        });
    }

    async validate(payload: any) {
        // Valida o usuário
        const user = await this.authService.validateUser(payload.email);
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        // Verifica se o token está na blacklist
        const token = this.getTokenFromRequest();
        if (this.blacklistService.isBlacklisted(token)) {
            throw new UnauthorizedException('Token inválido');
        }

        return user;
    }

    private getTokenFromRequest(): string {
        // Extrai o token do cabeçalho Authorization
        const request = this.getRequest(); // Obtém o objeto request
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException('Token não fornecido');
        }
        return authHeader.split(' ')[1]; // Retorna o token (Bearer <token>)
    }

    private getRequest() {
        // Obtém o objeto request do contexto
        const context = this.getContext();
        if (!context) {
            throw new UnauthorizedException('Contexto não disponível');
        }
        return context.switchToHttp().getRequest();
    }

    private getContext() {
        return this.getRequest();
    }
}