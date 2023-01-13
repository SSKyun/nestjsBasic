import { SetMetadata } from '@nestjs/common';
import { RoleType } from './../rolo-type';

export const Roles = (...roles:RoleType[]): any=>SetMetadata('roles',roles);