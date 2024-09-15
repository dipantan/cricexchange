import { IsNumber, IsOptional } from "class-validator";

export class CheckoutDto {
  [x: string]: any;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  player_id!: number;
}
