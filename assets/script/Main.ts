/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2022-08-05 18:25:56
 */
import { _decorator, Camera, Color, director, profiler, screen, view } from 'cc';
import { DEBUG } from 'cc/env';
import { oops } from '../../extensions/oops-plugin-framework/assets/core/Oops';
import { Root } from '../../extensions/oops-plugin-framework/assets/core/Root';
import { ecs } from '../../extensions/oops-plugin-framework/assets/libs/ecs/ECS';
import { Account } from './game/account/Account';
import { GlobalMask } from './game/common/GlobalMask';
import { smc } from './game/common/SingletonModuleComp';
import { UIConfigData } from './game/common/config/GameUIConfig';
import { Initialize } from './game/initialize/Initialize';

const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Root {
    onLoad() {
        // 调用父类 onLoad，初始化框架模块（创建 oops.gui）
        super.onLoad();

        // 设置 UICamera 初始为 SOLID_COLOR
        this.initUICamera();
    }

    /** 初始化 UICamera 设置 */
    private initUICamera() {
        try {
            const scene = director.getScene();
            const guiNode = scene?.getChildByPath('root/gui');
            const uiCamNode = guiNode?.getChildByName('UICamera');
            const uiCamera = uiCamNode?.getComponent(Camera);
            if (uiCamera) {
                // Loading 阶段使用 SOLID_COLOR 填充背景
                uiCamera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
                uiCamera.clearColor = new Color(0, 0, 0, 255); // 黑色背景
                console.log('[Main] UICamera set to SOLID_COLOR');
            }
        } catch (error) {
            console.error('[Main] Failed to init UICamera:', error);
        }
    }

    start() {
        // 显示性能统计（仅调试模式）
        // if (DEBUG) profiler.showStats();

        // 初始化全局遮罩系统
        if (!GlobalMask.instance.initialized) {
            GlobalMask.instance.init(true); // startVisible=true，游戏启动时显示黑屏
            console.log('[Main] GlobalMask initialized');
        }
    }

    protected run() {
        smc.initialize = ecs.getEntity<Initialize>(Initialize);
        smc.account = ecs.getEntity<Account>(Account);
        console.log('[Main] Main initialization completed');
    }

    protected initGui() {
        // 初始化 Cocos 原生 UI 配置
        oops.gui.init(UIConfigData);

        // 设置屏幕适配策略
        this.setResolutionPolicy();
    }

    /**
     * 设置屏幕适配策略
     */
    private setResolutionPolicy() {
        try {
            const designSize = view.getDesignResolutionSize();
            const winSize = screen.windowSize;

            // 使用 SHOW_ALL：保持设计分辨率比例，多余部分留黑边
            view.setDesignResolutionSize(designSize.width, designSize.height, 0); // ResolutionPolicy.SHOW_ALL = 0

            // 调试日志
            console.log(`[Main] Resolution policy set to SHOW_ALL`);
            console.log(`[Main] Design size: ${designSize.width}x${designSize.height}`);
            console.log(`[Main] Window size: ${winSize.width}x${winSize.height}`);
        } catch (error) {
            console.error('[Main] Failed to set resolution policy:', error);
        }
    }
}
