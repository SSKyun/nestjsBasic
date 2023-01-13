import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { Payload } from './security/payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ){}

    async registerUser(newUser: UserDTO): Promise<UserDTO> {
        let userFind: UserDTO = await this.userService.findByFields({ 
            where: { username: newUser.username }
        });
        if(userFind) {
            throw new HttpException('Username aleady used!', HttpStatus.BAD_REQUEST);
        }
        return await this.userService.save(newUser);
    }

    async validateUser(userDTO: UserDTO): Promise<{accessToken: string} | undefined> {
        let userFind: User = await this.userService.findByFields({
            where: { username: userDTO.username }
        });
        const validatePassword = await bcrypt.compare(userDTO.password, userFind.password);
        if(!userFind || !validatePassword) {
            throw new UnauthorizedException();
        }
        this.convertInAuthorities(userFind);
        const payload: Payload = { 
            id: userFind.id, 
            username: userFind.username, 
            authorities: userFind.authorities };
        return {
            accessToken: this.jwtService.sign(payload)
        };
    }

    async tokenValidateUser(payload: Payload): Promise<User| undefined>{
        const userFind =  await this.userService.findByFields({
            where : {id:payload.id}
        });
        this.flatAuthorities(userFind);
        return userFind;
    }

    private flatAuthorities(user: any): User {
        if(user && user.authorities){
            const authorities: string[] = [];
            user.forEach(authoritiy=> authorities.push(authoritiy.authorityName));
            user.authorities = authorities;
        }
        return user;
    }

    private convertInAuthorities(user: any): User {
        if( user && user.authorites){
            const authorites:any[] = [];
            user.authorities.forEach(authority=>{
                authorites.push({name:authority.authorityName});
            });
            user.authorities = authorites;
        }
        return user;
    }
}
