/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { Node, director, JsonAsset } from "cc";

/**
 * 场景调试工具
 */
export class SceneDebugger {
    /**
     * 导出当前场景节点树为JSON
     */
    static exportSceneTree(): string {
        const scene = director.getScene();
        if (!scene) return '{}';

        const tree = this.serializeNode(scene);
        const json = JSON.stringify(tree, null, 2);
        console.log('场景节点树：\n', json);

        // 复制到剪贴板
        this.copyToClipboard(json);
        return json;
    }

    /**
     * 序列化节点
     */
    private static serializeNode(node: Node): any {
        const data: any = {
            name: node.name,
            position: {
                x: node.position.x,
                y: node.position.y,
                z: node.position.z
            },
            rotation: {
                x: node.eulerAngles.x,
                y: node.eulerAngles.y,
                z: node.eulerAngles.z
            },
            scale: {
                x: node.scale.x,
                y: node.scale.y,
                z: node.scale.z
            },
            active: node.active,
            layer: node.layer,
            components: node.components.map(c => c.constructor.name),
            children: []
        };

        for (const child of node.children) {
            data.children.push(this.serializeNode(child));
        }

        return data;
    }

    /**
     * 复制到剪贴板
     */
    private static copyToClipboard(text: string): void {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('✅ 场景树已复制到剪贴板');
            });
        }
    }

    /**
     * 打印节点路径
     */
    static printNodePath(nodeName: string): void {
        const scene = director.getScene();
        if (!scene) return;

        const node = this.findNodeByName(scene, nodeName);
        if (node) {
            const path = this.getNodePath(node);
            console.log(`节点路径: ${path}`);
            console.log('位置:', node.position);
            console.log('旋转:', node.eulerAngles);
            console.log('缩放:', node.scale);
        } else {
            console.log(`未找到节点: ${nodeName}`);
        }
    }

    /**
     * 查找节点
     */
    private static findNodeByName(node: Node, name: string): Node | null {
        if (node.name === name) return node;

        for (const child of node.children) {
            const found = this.findNodeByName(child, name);
            if (found) return found;
        }

        return null;
    }

    /**
     * 获取节点路径
     */
    private static getNodePath(node: Node): string {
        const parts: string[] = [];
        let current: Node | null = node;

        while (current) {
            parts.unshift(current.name);
            current = current.parent;
        }

        return parts.join('/');
    }
}

// 全局注册（方便控制台调用）
if (typeof window !== 'undefined') {
    (window as any).SceneDebugger = SceneDebugger;
}
