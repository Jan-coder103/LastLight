import {
  AdditiveBlending,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three';

/** A placement-wide warning, independent of the selected barrel LOD. */
export class ExplosiveBarrelVisual {
  private readonly materials: Array<{ material: MeshStandardMaterial; color: Color }> = [];
  private readonly glow: Mesh;

  constructor(private readonly object: Object3D) {
    object.traverse((part) => {
      if (!(part instanceof Mesh) || !part.userData.explosiveBarrelBlink) return;
      const materials = Array.isArray(part.material) ? part.material : [part.material];
      for (const material of materials) {
        if (material instanceof MeshStandardMaterial)
          this.materials.push({ material, color: material.color.clone() });
      }
    });
    this.glow = new Mesh(
      new SphereGeometry(0.62, 12, 8),
      new MeshBasicMaterial({
        color: '#ef2018',
        transparent: true,
        opacity: 0.2,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.position.y = 0.5;
    this.glow.scale.y = 1.15;
    this.glow.visible = false;
    this.glow.raycast = () => {};
    object.add(this.glow);
  }

  setBlinking(blinking: boolean): void {
    for (const { material, color } of this.materials) {
      if (blinking) material.color.set('#390706');
      else material.color.copy(color);
      material.emissiveIntensity = 0;
    }
    this.glow.visible = blinking;
  }

  detonate(): void {
    this.object.visible = false;
    this.object.removeFromParent();
    this.glow.geometry.dispose();
    (this.glow.material as MeshBasicMaterial).dispose();
  }
}
