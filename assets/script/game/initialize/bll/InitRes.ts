/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2022-08-05 18:25:56
 */
import { director } from "cc";
import { oops } from "db://oops-framework/core/Oops";
import { AsyncQueue, NextFunction } from "db://oops-framework/libs/collection/AsyncQueue";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { Initialize } from "../Initialize";
import { LoadingViewComp } from "../view/LoadingViewComp";
import { GlobalMask } from "../../common/GlobalMask";

/** 初始化游戏公共资源 */
@ecs.register('InitRes')
export class InitResComp extends ecs.Comp {
    reset() { }
}

/** 初始化资源逻辑注册到Initialize模块中 */
@ecs.register('Initialize')
export class InitResSystem extends ecs.ComblockSystem implements ecs.IEntityEnterSystem {
    filter(): ecs.IMatcher {
        return ecs.allOf(InitResComp);
    }

    entityEnter(e: Initialize): void {
        var queue: AsyncQueue = new AsyncQueue();

        // 最先展示 Loading UI，避免启动空帧导致黑屏
        queue.push(async (next: NextFunction) => {
            await e.addUi(LoadingViewComp);
            // Loading 界面显示后，立即隐藏 GlobalMask
            GlobalMask.instance.hide(0);

            // 隐藏场景中的静态 LoadingBg 节点
            try {
                const scene = director.getScene();
                const guiNode = scene?.getChildByPath('root/gui');
                const loadingBgNode = guiNode?.getChildByName('LoadingBg');
                if (loadingBgNode) {
                    loadingBgNode.active = false;
                    console.log('[InitRes] Static LoadingBg node hidden');
                }
            } catch (error) {
                console.warn('[InitRes] Failed to hide LoadingBg node:', error);
            }

            console.log('[InitRes] Loading UI shown, GlobalMask hidden');
            next();
        });

        // 加载多语言包
        this.loadLanguage(queue);
        // 加载公共资源
        this.loadCommon(queue);
        // 结束时移除初始化组件
        this.onComplete(queue, e);

        queue.play();
    }

    /** 加载化语言包（可选） */
    private loadLanguage(queue: AsyncQueue) {
        queue.push((next: NextFunction, params: any, args: any) => {
            // 设置默认语言
            let lan = oops.storage.get("language");
            if (lan == null || lan == "") {
                lan = "zh";
                oops.storage.set("language", lan);
            }

            // 加载语言包资源
            oops.language.setLanguage(lan, next);
        });
    }

    /** 加载公共资源（必备） */
    private loadCommon(queue: AsyncQueue) {
        queue.push((next: NextFunction, params: any, args: any) => {
            oops.res.loadDir("common", next);
        });

        // TODO: 在这里加载你的游戏 bundle
        // 示例:
        // queue.push(async (next: NextFunction) => {
        //     console.log('[InitRes] Loading game bundle...');
        //     const bundle = await oops.res.loadBundle('your-bundle-name');
        //     next();
        // });
    }

    /** 加载完成后移除初始化组件 */
    private onComplete(queue: AsyncQueue, e: Initialize) {
        queue.complete = async () => {
            e.remove(InitResComp);
        };
    }
}
