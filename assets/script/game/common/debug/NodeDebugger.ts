/*
 * @Author: jiangking
 * @Email: jiangkingwelcome@vip.qq.com
 * @Date: 2025-12-10
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10
 */
import { _decorator, Component, Node, Vec3, Quat } from "cc";

const { ccclass, property } = _decorator;

/**
 * 运行时节点调试器
 * 挂载到任意节点，可在运行时实时调节参数
 */
@ccclass('NodeDebugger')
export class NodeDebugger extends Component {
    @property(Node)
    targetNode: Node = null!;

    @property({ tooltip: '位置 X' })
    posX: number = 0;

    @property({ tooltip: '位置 Y' })
    posY: number = 0;

    @property({ tooltip: '位置 Z' })
    posZ: number = 0;

    @property({ tooltip: '旋转 X (欧拉角)' })
    rotX: number = 0;

    @property({ tooltip: '旋转 Y (欧拉角)' })
    rotY: number = 0;

    @property({ tooltip: '旋转 Z (欧拉角)' })
    rotZ: number = 0;

    @property({ tooltip: '缩放 X' })
    scaleX: number = 1;

    @property({ tooltip: '缩放 Y' })
    scaleY: number = 1;

    @property({ tooltip: '缩放 Z' })
    scaleZ: number = 1;

    @property({ tooltip: '实时应用' })
    liveUpdate: boolean = true;

    update(dt: number) {
        if (!this.targetNode || !this.liveUpdate) return;

        // 实时应用参数
        this.targetNode.setPosition(this.posX, this.posY, this.posZ);
        this.targetNode.setRotationFromEuler(this.rotX, this.rotY, this.rotZ);
        this.targetNode.setScale(this.scaleX, this.scaleY, this.scaleZ);
    }

    /**
     * 从目标节点读取当前值
     */
    readFromTarget(): void {
        if (!this.targetNode) return;

        const pos = this.targetNode.position;
        this.posX = pos.x;
        this.posY = pos.y;
        this.posZ = pos.z;

        const euler = this.targetNode.eulerAngles;
        this.rotX = euler.x;
        this.rotY = euler.y;
        this.rotZ = euler.z;

        const scale = this.targetNode.scale;
        this.scaleX = scale.x;
        this.scaleY = scale.y;
        this.scaleZ = scale.z;

        console.log('[NodeDebugger] 已从节点读取参数:', this.targetNode.name);
    }

    /**
     * 打印当前参数
     */
    printParams(): void {
        console.log('[NodeDebugger] 当前参数:');
        console.log('Position:', this.posX, this.posY, this.posZ);
        console.log('Rotation:', this.rotX, this.rotY, this.rotZ);
        console.log('Scale:', this.scaleX, this.scaleY, this.scaleZ);
    }
}
