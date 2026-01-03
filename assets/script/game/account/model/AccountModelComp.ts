/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { ecs } from "db://oops-framework/libs/ecs/ECS";

/** 
 * 游戏账号数据 
 */
@ecs.register('AccountModel')
export class AccountModelComp extends ecs.Comp {
    /** 账号名 */
    AccountName: string = null!;

    reset() {
        this.AccountName = null!;
    }
}