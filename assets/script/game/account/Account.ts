/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { CCEntity } from "db://oops-framework/module/common/CCEntity";
import { AccountModelComp } from "./model/AccountModelComp";

/** 账号模块 */
@ecs.register('Account')
export class Account extends CCEntity {
    AccountModel!: AccountModelComp;

    protected init() {
        this.addComponents<ecs.Comp>(AccountModelComp);
    }
}