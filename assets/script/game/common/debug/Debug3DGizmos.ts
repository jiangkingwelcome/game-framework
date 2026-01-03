/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { _decorator, Component, Node, Camera, Graphics, Color, Vec3 } from 'cc';

const { ccclass } = _decorator;

/**
 * 3D调试可视化工具
 * 在场景中绘制辅助线、坐标轴等
 */
@ccclass('Debug3DGizmos')
export class Debug3DGizmos extends Component {
    private graphics: Graphics | null = null;

    start() {
        this.createGraphics();
    }

    private createGraphics(): void {
        const graphicsNode = new Node('DebugGraphics');
        graphicsNode.setParent(this.node);
        this.graphics = graphicsNode.addComponent(Graphics);
    }

    /**
     * 绘制摄像机视锥体
     */
    drawCameraFrustum(camera: Camera, color: Color = Color.YELLOW): void {
        if (!this.graphics || !camera) return;

        const fov = camera.fov;
        const aspect = camera.node.parent ? 1 : 1;
        const near = camera.near;
        const far = camera.far;

        // 计算视锥体顶点
        const halfHeight = Math.tan((fov * Math.PI) / 360) * far;
        const halfWidth = halfHeight * aspect;

        this.graphics.strokeColor = color;
        this.graphics.lineWidth = 2;

        // 绘制视锥体框架
        // TODO: 实现3D线框绘制
        console.log('[Debug] Camera FOV:', fov, 'Near:', near, 'Far:', far);
    }

    /**
     * 绘制节点坐标轴
     */
    drawNodeAxis(node: Node): void {
        if (!this.graphics) return;

        const pos = node.worldPosition;
        const scale = 5;

        // X轴 - 红色
        this.drawLine(pos, new Vec3(pos.x + scale, pos.y, pos.z), Color.RED);

        // Y轴 - 绿色
        this.drawLine(pos, new Vec3(pos.x, pos.y + scale, pos.z), Color.GREEN);

        // Z轴 - 蓝色
        this.drawLine(pos, new Vec3(pos.x, pos.y, pos.z + scale), Color.BLUE);
    }

    /**
     * 绘制3D线段
     */
    private drawLine(from: Vec3, to: Vec3, color: Color): void {
        if (!this.graphics) return;

        this.graphics.strokeColor = color;
        this.graphics.moveTo(from.x, from.y);
        this.graphics.lineTo(to.x, to.y);
        this.graphics.stroke();
    }

    /**
     * 绘制包围盒
     */
    drawBoundingBox(node: Node, color: Color = Color.GREEN): void {
        // TODO: 实现3D包围盒绘制
        console.log('[Debug] Node:', node.name, 'Position:', node.worldPosition);
    }

    /**
     * 清除所有绘制
     */
    clear(): void {
        if (this.graphics) {
            this.graphics.clear();
        }
    }
}
