import type { AbstractMesh } from "@babylonjs/core";

/**
 * Bidirectional map between store-side node ids and live Babylon meshes.
 */
export class NodeRegistry {
  private byId = new Map<string, AbstractMesh>();
  private byMesh = new WeakMap<AbstractMesh, string>();

  register(id: string, mesh: AbstractMesh): void {
    this.byId.set(id, mesh);
    this.byMesh.set(mesh, id);
    mesh.metadata = { ...(mesh.metadata ?? {}), nodeId: id };
  }

  unregister(id: string): AbstractMesh | undefined {
    const mesh = this.byId.get(id);
    if (mesh) {
      this.byId.delete(id);
      this.byMesh.delete(mesh);
    }
    return mesh;
  }

  getMesh(id: string): AbstractMesh | undefined {
    return this.byId.get(id);
  }

  getId(mesh: AbstractMesh): string | undefined {
    return this.byMesh.get(mesh);
  }

  allMeshes(): AbstractMesh[] {
    return Array.from(this.byId.values());
  }

  clear(): void {
    for (const mesh of this.byId.values()) mesh.dispose();
    this.byId.clear();
  }
}
