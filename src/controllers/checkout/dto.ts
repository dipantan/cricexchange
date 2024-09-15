import { IsNumber, IsOptional } from "class-validator";

export class CheckoutDto {
  @IsNumber()
  quantity!: number;

  @IsNumber()
  player_id!: number;
}
