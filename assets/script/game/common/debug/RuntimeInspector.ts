/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { _decorator, Component, Node, Camera, UITransform, Label, Color, Graphics, Vec3, director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 运行时节点检查器
 * 使用方法：
 * 1. 在任意场景添加一个空节点
 * 2. 挂载此组件
 * 3. 运行游戏，按 F1 显示/隐藏检查器
 */
@ccclass('RuntimeInspector')
export class RuntimeInspector extends Component {
    @property(Node)
    uiRoot: Node = null!;

    private isVisible: boolean = false;
    private selectedNode: Node | null = null;
    private infoLabel: Label | null = null;

    start() {
        this.createInspectorUI();
        this.bindKeyboard();
    }

    /**
     * 创建检查器UI
     */
    private createInspectorUI(): void {
        // 创建UI根节点
        this.uiRoot = new Node('RuntimeInspector_UI');
        this.uiRoot.setParent(director.getScene()!);
        this.uiRoot.layer = 1 << 25; // UI_2D layer

        const transform = this.uiRoot.addComponent(UITransform);
        transform.setContentSize(400, 600);
        transform.setAnchorPoint(0, 1);
        this.uiRoot.setPosition(-200, 300, 0);

        // 创建背景
        const bg = this.uiRoot.addComponent(Graphics);
        bg.fillColor = new Color(0, 0, 0, 180);
        bg.rect(0, 0, 400, 600);
        bg.fill();

        // 创建信息文本
        const labelNode = new Node('InfoLabel');
        labelNode.setParent(this.uiRoot);
        labelNode.layer = 1 << 25;

        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(380, 580);
        labelTransform.setAnchorPoint(0, 1);
        labelNode.setPosition(10, -10, 0);

        this.infoLabel = labelNode.addComponent(Label);
        this.infoLabel.string = '按 F1 刷新\n按 F2 切换节点';
        this.infoLabel.fontSize = 12;
        this.infoLabel.lineHeight = 14;
        this.infoLabel.color = new Color(255, 255, 255);
        this.infoLabel.overflow = Label.Overflow.SHRINK;

        this.uiRoot.active = false;
    }

    /**
     * 绑定键盘快捷键
     */
    private bindKeyboard(): void {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F1') {
                event.preventDefault();
                this.toggle();
            } else if (event.key === 'F2') {
                event.preventDefault();
                this.selectNextNode();
            }
        });
    }

    /**
     * 显示/隐藏检查器
     */
    toggle(): void {
        this.isVisible = !this.isVisible;
        this.uiRoot.active = this.isVisible;
        if (this.isVisible) {
            this.refresh();
        }
    }

    /**
     * 刷新节点信息
     */
    refresh(): void {
        if (!this.infoLabel) return;

        const scene = director.getScene();
        if (!scene) return;

        let info = '=== 运行时节点检查器 ===\n\n';
        info += this.getNodeTreeInfo(scene, 0);

        if (this.selectedNode) {
            info += '\n\n=== 选中节点详情 ===\n';
            info += this.getNodeDetailInfo(this.selectedNode);
        }

        this.infoLabel.string = info;
    }

    /**
     * 获取节点树信息
     */
    private getNodeTreeInfo(node: Node, depth: number): string {
        const indent = '  '.repeat(depth);
        let info = `${indent}${node.name}`;

        // 添加位置信息
        const pos = node.position;
        info += ` (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;

        // 添加组件信息
        const components = node.components;
        if (components.length > 0) {
            const compNames = components
                .map(c => c.constructor.name)
                .filter(name => name !== 'Transform')
                .join(', ');
            if (compNames) {
                info += ` [${compNames}]`;
            }
        }

        info += '\n';

        // 递归子节点
        for (const child of node.children) {
            info += this.getNodeTreeInfo(child, depth + 1);
        }

        return info;
    }

    /**
     * 获取节点详细信息
     */
    private getNodeDetailInfo(node: Node): string {
        let info = `名称: ${node.name}\n`;
        info += `UUID: ${node.uuid}\n`;
        info += `激活: ${node.active}\n`;
        info += `位置: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})\n`;
        info += `旋转: (${node.eulerAngles.x.toFixed(2)}, ${node.eulerAngles.y.toFixed(2)}, ${node.eulerAngles.z.toFixed(2)})\n`;
        info += `缩放: (${node.scale.x.toFixed(2)}, ${node.scale.y.toFixed(2)}, ${node.scale.z.toFixed(2)})\n`;
        info += `层级: ${node.layer}\n`;
        info += `子节点数: ${node.children.length}\n`;

        // 组件信息
        info += '\n组件:\n';
        for (const comp of node.components) {
            info += `  - ${comp.constructor.name}\n`;

            // Camera 组件详细信息
            if (comp instanceof Camera) {
                const cam = comp as Camera;
                info += `    FOV: ${cam.fov}\n`;
                info += `    Priority: ${cam.priority}\n`;
                info += `    ClearFlags: ${cam.clearFlags}\n`;
                info += `    Projection: ${cam.projection}\n`;
            }
        }

        return info;
    }

    /**
     * 切换选中节点
     */
    private selectNextNode(): void {
        const scene = director.getScene();
        if (!scene) return;

        const allNodes = this.getAllNodes(scene);
        if (allNodes.length === 0) return;

        const currentIndex = this.selectedNode
            ? allNodes.indexOf(this.selectedNode)
            : -1;

        const nextIndex = (currentIndex + 1) % allNodes.length;
        this.selectedNode = allNodes[nextIndex];

        console.log('选中节点:', this.selectedNode.name, this.selectedNode.position);
        this.refresh();
    }

    /**
     * 获取所有节点（深度优先）
     */
    private getAllNodes(node: Node): Node[] {
        const nodes: Node[] = [node];
        for (const child of node.children) {
            nodes.push(...this.getAllNodes(child));
        }
        return nodes;
    }

    update(dt: number) {
        // 每0.5秒自动刷新
        if (this.isVisible && this.node.isValid) {
            this.refresh();
        }
    }
}
