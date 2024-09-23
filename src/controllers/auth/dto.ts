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
  @Is8DigitAlphaNumericWithSpecialChar({
    message:
      "Value must be at least 8-character string containing letters, numbers, and at least one special character",
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
  @Is8DigitAlphaNumericWithSpecialChar({
    message:
      "Value must be at least 8-character string containing letters, numbers, and at least one special character",
  })
  password!: string;
}

/**
 * Validator for checking if a string is an 8-character alphanumeric string containing at
 * least one special character.
 *
 * @param validationOptions Optional validation options.
 * @returns A decorator function that can be used to validate a class property.
 */
function Is8DigitAlphaNumericWithSpecialChar(
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "is8DigitAlphaNumericWithSpecialChar",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is a string and matches the pattern
          return (
            typeof value === "string" &&
            /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(
              value
            )
          );
        },
        defaultMessage(args: ValidationArguments) {
          return "Value must be at least 8-character string containing letters, numbers, and at least one special character.";
        },
      },
    });
  };
}
