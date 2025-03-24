import { Controller, Post, Body, Put, UseGuards, Param, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { BlacklistService } from './blacklist.service';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private blacklistService: BlacklistService) { }

    @Post('register')
    async register(@Body() body: any) {
        const { name, email, password } = body;
        return this.authService.register(name, email, password);
    }

    @Post('login')
    async login(@Body() body: any) {
        const { email, password } = body;
        const { accessToken } = await this.authService.login(email, password);
        return { accessToken };
    }

    @Post('logout')
    @UseGuards(AuthGuard('jwt')) 
    async logout(@Req() request: any) {
        const token = request.headers.authorization.split(' ')[1];
        this.blacklistService.addToBlacklist(token);
        return { message: 'Logout realizado com sucesso' };
    }

    @Put('update-password/:userId')
    @UseGuards(JwtAuthGuard)
    async updatePassword(
        @Param('userId') userId: number,
        @Body() body: { currentPassword: string; newPassword: string },
    ): Promise<void> {
        const { currentPassword, newPassword } = body;
        return this.authService.updatePassword(userId, currentPassword, newPassword);
    }
}