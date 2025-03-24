import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { BlacklistService } from "./blacklist.service";

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

    async validate(payload: any) {
        const user = await this.authService.validateUser(payload.email);
        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const token = payload.token; 
        if (this.blacklistService.isBlacklisted(token)) {
            throw new UnauthorizedException('Token inválido');
        }

        return user;
    }
}
