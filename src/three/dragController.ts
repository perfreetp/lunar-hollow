import * as THREE from 'three';

export type DragCallback = (kind: string, id: string, worldPoint: THREE.Vector3) => void;

interface DragState {
  kind: string;
  id: string;
  plane: THREE.Plane;
  offset: THREE.Vector3;
}

/**
 * 拾取与拖拽控制器。
 * - 射线与不可见代理球求交进行拾取
 * - 支架/轮组：过被拖点的竖直平面（法向 = 相机水平右向量），可同时改 x 与 y
 * - 车厢：过被拖点的水平面，只能沿线移动（y 由悬链线求解给出）
 * 拖拽过程中每个 pointermove 事件同步回调一次 → store 同步物理求解，
 * 常驻 rAF 在下一绘制帧呈现，保证求解与渲染落在同一视觉帧内。
 */
export class DragController {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private drag: DragState | null = null;
  private disposers: (() => void)[] = [];

  constructor(
    private dom: HTMLElement,
    private camera: THREE.Camera,
    private proxyRoot: THREE.Object3D,
    private onDrag: DragCallback,
  ) {
    dom.addEventListener('pointerdown', this.handleDown);
    dom.addEventListener('pointermove', this.handleMove);
    dom.addEventListener('pointerup', this.handleUp);
    dom.addEventListener('pointercancel', this.handleUp);
    this.disposers.push(() => {
      dom.removeEventListener('pointerdown', this.handleDown);
      dom.removeEventListener('pointermove', this.handleMove);
      dom.removeEventListener('pointerup', this.handleUp);
      dom.removeEventListener('pointercancel', this.handleUp);
    });
  }

  private setPointer(e: PointerEvent): void {
    const rect = this.dom.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handleDown = (e: PointerEvent): void => {
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.proxyRoot.children, false);
    if (hits.length === 0) return;
    const obj = hits[0].object;
    const { kind, id } = obj.userData as { kind: string; id: string };
    if (!kind) return;

    e.preventDefault();
    this.dom.setPointerCapture(e.pointerId);
    this.dom.style.cursor = 'grabbing';

    const hitPoint = hits[0].point.clone();
    const plane = new THREE.Plane();
    if (kind === 'cabin') {
      // 水平面：车厢只能沿线路水平移动
      plane.set(new THREE.Vector3(0, 1, 0), -hitPoint.y);
    } else {
      // 竖直平面：法向取相机右向量（投影到水平面），拖动可改 x/y，z 由平面锁定
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      right.y = 0;
      right.normalize();
      plane.setFromNormalAndCoplanarPoint(right, hitPoint);
    }
    this.drag = {
      kind,
      id,
      plane,
      offset: new THREE.Vector3(),
    };
  };

  private handleMove = (e: PointerEvent): void => {
    if (!this.drag) {
      // 悬停光标提示
      this.setPointer(e);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.proxyRoot.children, false);
      this.dom.style.cursor = hits.length > 0 ? 'grab' : '';
      return;
    }
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const point = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.drag.plane, point)) return;
    this.onDrag(this.drag.kind, this.drag.id, point);
  };

  private handleUp = (e: PointerEvent): void => {
    if (!this.drag) return;
    this.drag = null;
    this.dom.style.cursor = '';
    try {
      this.dom.releasePointerCapture(e.pointerId);
    } catch {
      /* 指针已释放时忽略 */
    }
  };

  dispose(): void {
    this.disposers.forEach((d) => d());
  }
}
