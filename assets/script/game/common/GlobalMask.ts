/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
/*
 * 全局遮罩系统 (Global Mask System)
 * 用于游戏启动和场景切换时的视觉无缝体验
 *
 * 特点：
 * - 放在 UI 相机最顶层，能遮住所有内容（包括 3D 相机）
 * - 启动时显示 Loading 底图，与 Loading 界面无缝衔接
 * - 支持淡入/淡出动画
 * - 场景切换时自动处理过渡效果
 */

import { Color, director, ImageAsset, Layers, Node, resources, Sprite, SpriteFrame, Texture2D, tween, Tween, UIOpacity, UITransform, view, Widget } from "cc";

export class GlobalMask {
    private static _instance: GlobalMask | null = null;

    /** 遮罩根节点 */
    private _maskNode: Node | null = null;
    /** 遮罩透明度组件 */
    private _uiOpacity: UIOpacity | null = null;
    /** Sprite 组件 */
    private _sprite: Sprite | null = null;
    /** 当前正在执行的 tween */
    private _currentTween: Tween<UIOpacity> | null = null;
    /** 是否已初始化 */
    private _initialized: boolean = false;

    /** Loading 背景图路径 (在 resources 目录下) */
    public static readonly LOADING_BG_PATH: string = "logo";
    /** 默认遮罩颜色（青绿色，与启动画面和 Loading 背景一致） */
    public static readonly DEFAULT_COLOR: Color = new Color(80, 175, 165, 255);
    /** 默认淡入淡出时长 (秒) */
    public static readonly DEFAULT_DURATION: number = 0.3;

    private constructor() { }

    /** 获取单例实例 */
    public static get instance(): GlobalMask {
        if (!this._instance) {
            this._instance = new GlobalMask();
        }
        return this._instance;
    }

    /** 是否已初始化 */
    public get initialized(): boolean {
        return this._initialized;
    }

    /** 遮罩节点 */
    public get maskNode(): Node | null {
        return this._maskNode;
    }

    /**
     * 初始化全局遮罩系统
     * 应在 Main.ts 的 start 中尽早调用
     * @param startVisible 初始是否可见（默认 true，游戏启动时显示）
     */
    public init(startVisible: boolean = true): void {
        if (this._initialized) {
            console.warn('[GlobalMask] Already initialized');
            return;
        }

        const scene = director.getScene();
        if (!scene) {
            console.error('[GlobalMask] Scene not found');
            return;
        }

        // 查找 gui 节点
        const rootNode = scene.getChildByName('root');
        const guiNode = rootNode?.getChildByName('gui');
        if (!guiNode) {
            console.error('[GlobalMask] gui node not found');
            return;
        }

        // 创建遮罩节点
        this._maskNode = this.createMaskNode();

        // 添加到 gui 节点，放在 LayerUI 之前（index 2）
        // 这样 Loading 界面（在 LayerUI）可以显示在 GlobalMask 上面
        // gui 节点子节点顺序: UICamera(0), LayerGame(1), LayerUI(2), ...
        guiNode.insertChild(this._maskNode, 2);

        // 设置初始可见状态
        if (this._uiOpacity) {
            this._uiOpacity.opacity = startVisible ? 255 : 0;
        }

        this._initialized = true;
        console.log(`[GlobalMask] Initialized, startVisible: ${startVisible}`);

        // 不加载背景图，保持纯黑色过渡更平滑
        // if (startVisible) {
        //     this.loadBackgroundImage();
        // }
    }

    /**
     * 创建遮罩节点
     */
    private createMaskNode(): Node {
        const node = new Node('GlobalMask');

        // 设置为 UI_2D 层，确保被 UICamera 渲染
        node.layer = Layers.Enum.UI_2D;

        // 添加 UITransform 组件
        const uiTransform = node.addComponent(UITransform);
        const designSize = view.getDesignResolutionSize();
        // 设置足够大的尺寸，确保覆盖整个屏幕
        uiTransform.setContentSize(designSize.width * 2, designSize.height * 2);
        uiTransform.setAnchorPoint(0.5, 0.5);

        // 添加 Widget 组件实现全屏自适应
        const widget = node.addComponent(Widget);
        widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        widget.left = widget.right = widget.top = widget.bottom = 0;
        widget.alignMode = 2; // ALWAYS
        widget.enabled = true;

        // 添加 Sprite 组件显示背景图
        this._sprite = node.addComponent(Sprite);
        this._sprite.sizeMode = Sprite.SizeMode.CUSTOM; // 自定义尺寸
        this._sprite.type = Sprite.Type.SIMPLE;
        // 初始设置为纯色（图片加载前）
        this._sprite.color = GlobalMask.DEFAULT_COLOR;

        // 添加 UIOpacity 组件用于淡入淡出
        this._uiOpacity = node.addComponent(UIOpacity);
        this._uiOpacity.opacity = 255;

        return node;
    }

    /**
     * 加载背景图片
     */
    private loadBackgroundImage(): void {
        resources.load(GlobalMask.LOADING_BG_PATH, ImageAsset, (err, imageAsset) => {
            if (err) {
                console.warn('[GlobalMask] Failed to load background image:', err);
                return;
            }

            if (!this._sprite || !this._maskNode) {
                return;
            }

            // 创建 SpriteFrame
            const texture = new Texture2D();
            texture.image = imageAsset;
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            // 设置 Sprite
            this._sprite.spriteFrame = spriteFrame;
            this._sprite.color = Color.WHITE; // 恢复白色显示原图

            // 更新尺寸以覆盖全屏
            const uiTransform = this._maskNode.getComponent(UITransform);
            if (uiTransform) {
                const designSize = view.getDesignResolutionSize();
                // 计算缩放以覆盖整个屏幕（保持比例，可能裁剪）
                const imgRatio = imageAsset.width / imageAsset.height;
                const screenRatio = designSize.width / designSize.height;

                let width, height;
                if (imgRatio > screenRatio) {
                    // 图片更宽，以高度为准
                    height = designSize.height;
                    width = height * imgRatio;
                } else {
                    // 图片更高，以宽度为准
                    width = designSize.width;
                    height = width / imgRatio;
                }

                // 加一些额外尺寸确保覆盖
                uiTransform.setContentSize(width * 1.2, height * 1.2);
            }

            console.log('[GlobalMask] Background image loaded');
        });
    }

    /**
     * 显示遮罩（淡入）
     * @param duration 动画时长（秒），0 表示立即显示
     * @param onComplete 完成回调
     */
    public show(duration: number = GlobalMask.DEFAULT_DURATION, onComplete?: () => void): void {
        if (!this._initialized || !this._uiOpacity || !this._maskNode) {
            console.warn('[GlobalMask] Not initialized');
            onComplete?.();
            return;
        }

        this.stopCurrentTween();

        // ✅ 修复：显示前先启用节点
        this._maskNode.active = true;

        if (duration <= 0) {
            this._uiOpacity.opacity = 255;
            onComplete?.();
            return;
        }

        this._currentTween = tween(this._uiOpacity)
            .to(duration, { opacity: 255 })
            .call(() => {
                this._currentTween = null;
                onComplete?.();
            })
            .start();
    }

    /**
     * 隐藏遮罩（淡出）
     * @param duration 动画时长（秒），0 表示立即隐藏
     * @param onComplete 完成回调
     */
    public hide(duration: number = GlobalMask.DEFAULT_DURATION, onComplete?: () => void): void {
        if (!this._initialized || !this._uiOpacity || !this._maskNode) {
            console.warn('[GlobalMask] Not initialized');
            onComplete?.();
            return;
        }

        this.stopCurrentTween();

        if (duration <= 0) {
            this._uiOpacity.opacity = 0;
            // ✅ 修复：隐藏时禁用节点，避免阻挡触摸事件
            this._maskNode.active = false;
            onComplete?.();
            return;
        }

        this._currentTween = tween(this._uiOpacity)
            .to(duration, { opacity: 0 })
            .call(() => {
                this._currentTween = null;
                // ✅ 修复：动画完成后禁用节点
                if (this._maskNode) {
                    this._maskNode.active = false;
                }
                onComplete?.();
            })
            .start();
    }

    /**
     * 执行场景切换过渡效果
     * 先淡入遮罩 -> 执行切换逻辑 -> 淡出遮罩
     * @param switchCallback 切换逻辑回调（在遮罩完全显示后执行）
     * @param fadeInDuration 淡入时长
     * @param fadeOutDuration 淡出时长
     */
    public transition(
        switchCallback: () => void | Promise<void>,
        fadeInDuration: number = GlobalMask.DEFAULT_DURATION,
        fadeOutDuration: number = GlobalMask.DEFAULT_DURATION
    ): void {
        this.show(fadeInDuration, async () => {
            try {
                await switchCallback();
            } catch (error) {
                console.error('[GlobalMask] Transition callback error:', error);
            }
            this.hide(fadeOutDuration);
        });
    }

    /**
     * 立即设置透明度
     * @param opacity 透明度 (0-255)
     */
    public setOpacity(opacity: number): void {
        if (this._uiOpacity) {
            this.stopCurrentTween();
            this._uiOpacity.opacity = Math.max(0, Math.min(255, opacity));
        }
    }

    /**
     * 获取当前透明度
     */
    public getOpacity(): number {
        return this._uiOpacity?.opacity ?? 0;
    }

    /**
     * 遮罩是否可见（透明度 > 0）
     */
    public isVisible(): boolean {
        return (this._uiOpacity?.opacity ?? 0) > 0;
    }

    /**
     * 停止当前动画
     */
    private stopCurrentTween(): void {
        if (this._currentTween) {
            this._currentTween.stop();
            this._currentTween = null;
        }
    }

    /**
     * 销毁遮罩系统
     */
    public destroy(): void {
        this.stopCurrentTween();

        if (this._maskNode) {
            this._maskNode.destroy();
            this._maskNode = null;
        }

        this._uiOpacity = null;
        this._sprite = null;
        this._initialized = false;
        GlobalMask._instance = null;

        console.log('[GlobalMask] Destroyed');
    }
}
