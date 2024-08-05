// Import necessary modules
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Roles, RolesSchema } from "./roles.model";
import { RolesService } from "./roles.services";
import { RolesController } from "./roles.controllers";
import { User, UserSchema } from "src/user/user.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Roles.name, schema: RolesSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
