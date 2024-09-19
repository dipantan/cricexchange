import { IsNumber, IsOptional, Min } from "class-validator";

export class CheckoutDto {
  [x: string]: any;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(1)
  player_id!: number;
}
