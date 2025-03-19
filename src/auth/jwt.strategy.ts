import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { BlacklistService } from './blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
        private blacklistService: BlacklistService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any, context: ExecutionContext) {
        const token = this.getTokenFromRequest(context);
        if (this.blacklistService.isBlacklisted(token)) {
            throw new UnauthorizedException('Token inválido');
        }

        const user = await this.authService.validateUser(payload.email);
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }
        return user;
    }

    private getTokenFromRequest(context: ExecutionContext): string {

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException('Token não fornecido');
        }
        return authHeader.split(' ')[1];
    }
}