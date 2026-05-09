import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { GeoService, GeoNode } from '../../../core/services/geo.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '@eduviet/shared-types';

export interface GeoNodeSelected {
  type: 'nation' | 'province' | 'district';
  id: string;
  name: string;
}

export interface TreeNode {
  id: string;
  name: string;
  code: string;
  type: 'nation' | 'province' | 'district';
  children: TreeNode[];
  loadingChildren: boolean;
  expanded: boolean;
  hasChildren: boolean;
}

@Component({
  selector: 'app-geo-tree',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geo-tree.component.html',
  styleUrl: './geo-tree.component.scss',
})
export class GeoTreeComponent implements OnInit {
  private geoService = inject(GeoService);
  private authService = inject(AuthService);

  /** Deepest level to show: 'nation' | 'province' | 'district' */
  maxDepth = input<'nation' | 'province' | 'district'>('district');

  nodeSelected = output<GeoNodeSelected>();

  nodes = signal<TreeNode[]>([]);
  loading = signal(false);
  selectedNodeId = signal<string | null>(null);

  private get role(): UserRole | null {
    return this.authService.currentRole();
  }

  ngOnInit(): void {
    this.loadRootNodes();
  }

  private loadRootNodes(): void {
    const role = this.role;

    // SCHOOL_ADMIN: no tree needed — skip
    if (role === 'SCHOOL_ADMIN') {
      return;
    }

    this.loading.set(true);
    this.geoService.getNations().subscribe({
      next: (nations) => {
        const nodes = nations.map((n) => this.toTreeNode(n, 'nation', true));

        // PROVINCE_ADMIN: auto-expand their nation & load provinces
        // DISTRICT_ADMIN: auto-expand their province
        // For now just show all nations collapsed (scoping via backend RBAC)
        this.nodes.set(nodes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private toTreeNode(
    geo: GeoNode,
    type: 'nation' | 'province' | 'district',
    hasChildren: boolean,
  ): TreeNode {
    return {
      id: geo.id,
      name: geo.name,
      code: geo.code,
      type,
      children: [],
      loadingChildren: false,
      expanded: false,
      hasChildren: hasChildren && this.canGoDeeper(type),
    };
  }

  private canGoDeeper(type: 'nation' | 'province' | 'district'): boolean {
    const max = this.maxDepth();
    if (max === 'nation') return false;
    if (max === 'province') return type === 'nation';
    return type === 'nation' || type === 'province';
  }

  toggleNode(node: TreeNode): void {
    if (!node.hasChildren) {
      this.selectNode(node);
      return;
    }

    if (node.expanded) {
      node.expanded = false;
      this.nodes.update((n) => [...n]); // trigger CD
      return;
    }

    if (node.children.length > 0) {
      node.expanded = true;
      this.nodes.update((n) => [...n]);
      return;
    }

    // Lazy-load children
    node.loadingChildren = true;
    this.nodes.update((n) => [...n]);

    if (node.type === 'nation') {
      this.geoService.getProvinces(node.id).subscribe({
        next: (provinces) => {
          node.children = provinces.map((p) =>
            this.toTreeNode(p, 'province', true),
          );
          node.loadingChildren = false;
          node.expanded = true;
          this.nodes.update((n) => [...n]);
        },
        error: () => {
          node.loadingChildren = false;
          this.nodes.update((n) => [...n]);
        },
      });
    } else if (node.type === 'province') {
      this.geoService.getDistricts(node.id).subscribe({
        next: (districts) => {
          node.children = districts.map((d) =>
            this.toTreeNode(d, 'district', false),
          );
          node.loadingChildren = false;
          node.expanded = true;
          this.nodes.update((n) => [...n]);
        },
        error: () => {
          node.loadingChildren = false;
          this.nodes.update((n) => [...n]);
        },
      });
    }
  }

  selectNode(node: TreeNode): void {
    this.selectedNodeId.set(node.id);
    this.nodeSelected.emit({ type: node.type, id: node.id, name: node.name });
  }

  trackById(_index: number, node: TreeNode): string {
    return node.id;
  }
}
