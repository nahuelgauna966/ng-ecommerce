import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ValidateIf((object: UpdateProfileDto) => Boolean(object.password))
  @IsString()
  @MinLength(1)
  currentPassword?: string;
}