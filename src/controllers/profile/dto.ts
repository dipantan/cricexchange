import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  image!: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  dob!: string;

  @IsOptional()
  @IsEnum(["male", "female", "other"], {
    message(validationArguments) {
      return `gender must be one of the following: ${validationArguments.constraints[0]}`;
    },
  })
  gender!: "male" | "female" | "other";

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address!: string;
}

export class UpdateWallet {
  @IsNumber({})
  amount: number;
}

export class PostWithdraw {
  @IsNumber()
  @Min(100)
  amount: number;
}

export class PostBank {
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  ifsc: string;

  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pancard: string;
}
