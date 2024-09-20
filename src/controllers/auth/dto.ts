import {
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export class LoginDto {
  @IsMobilePhone("en-IN", {
    strictMode: true,
  })
  mobile!: string;

  @IsString()
  @IsNotEmpty()
  @Is8DigitAlphaNumeric({
    message: "Password must be an 8-digit alphanumeric string",
  })
  password!: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMobilePhone("en-IN", {
    strictMode: true,
  })
  mobile!: number;

  @IsNotEmpty()
  @Is8DigitAlphaNumeric({
    message: "Password must be an 8-digit alphanumeric string",
  })
  password!: string;
}

function Is8DigitAlphaNumeric(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "is8DigitAlphaNumeric",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is a string and matches the pattern
          return (
            typeof value === "string" &&
            /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{8}$/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return "Value must be an 8-digit alphanumeric string";
        },
      },
    });
  };
}
