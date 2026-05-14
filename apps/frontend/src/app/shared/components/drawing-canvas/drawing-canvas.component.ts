import {
  Component,
  ElementRef,
  viewChild,
  input,
  output,
  signal,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  NgZone,
  inject,
} from '@angular/core';

// ── Tool types ─────────────────────────────────────────────────────────────────

export type DrawTool = 'pencil' | 'line' | 'rect' | 'ellipse' | 'eraser';

interface HistoryEntry {
  type: 'add' | 'remove';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any; // Konva.Shape — lazy-loaded, typed as any
}

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-drawing-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawing-canvas.component.html',
  styleUrl: './drawing-canvas.component.scss',
})
export class DrawingCanvasComponent implements AfterViewInit, OnDestroy, OnChanges {
  private zone = inject(NgZone);

  containerRef = viewChild.required<ElementRef<HTMLDivElement>>('canvasContainer');

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  backgroundImageUrl = input<string | null>(null);
  /** Phát ra base64 PNG khi học sinh bấm "Lưu hình" */
  imageExported = output<string>();

  // ── UI state (signals) ────────────────────────────────────────────────────
  activeTool = signal<DrawTool>('pencil');
  strokeColor = signal('#1a1a2e');
  strokeWidth = signal(2);
  canUndo = signal(false);
  canRedo = signal(false);

  // ── Konva internals ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private KonvaLib: any = null;  // Konva namespace (lazy)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stage: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private bgLayer: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawLayer: any = null;

  private isDrawing = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentShape: any = null;
  private startPos = { x: 0, y: 0 };

  private history: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async ngAfterViewInit(): Promise<void> {
    // Lazy-load Konva để không tăng initial bundle size
    const mod = await import('konva');
    this.KonvaLib = mod.default ?? mod;
    this.zone.runOutsideAngular(() => this.initStage());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['backgroundImageUrl'] && this.stage && this.bgLayer) {
      this.bgLayer.destroyChildren();
      const url = this.backgroundImageUrl();
      if (url) this.loadBackground(url);
    }
  }

  ngOnDestroy(): void {
    this.stage?.destroy();
  }

  // ── Stage initialisation ──────────────────────────────────────────────────

  private initStage(): void {
    const el = this.containerRef().nativeElement;
    const width = el.offsetWidth || 680;
    const height = Math.round(width * 0.6); // 5:3 aspect ratio
    el.style.height = `${height}px`;

    const K = this.KonvaLib;

    this.stage = new K.Stage({ container: el, width, height });

    this.bgLayer = new K.Layer({ listening: false });
    this.drawLayer = new K.Layer();
    this.stage.add(this.bgLayer);
    this.stage.add(this.drawLayer);

    const url = this.backgroundImageUrl();
    if (url) this.loadBackground(url);

    this.bindPointerEvents();
  }

  private loadBackground(url: string): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const K = this.KonvaLib;
      const konvaImg = new K.Image({
        image: img,
        x: 0,
        y: 0,
        width: this.stage.width(),
        height: this.stage.height(),
        opacity: 0.9,
      });
      this.bgLayer.add(konvaImg);
      this.bgLayer.draw();
    };
    img.src = url;
  }

  // ── Event binding ─────────────────────────────────────────────────────────

  private bindPointerEvents(): void {
    this.stage.on('mousedown touchstart', (e: { target: unknown }) => {
      const tool = this.activeTool();

      if (tool === 'eraser') {
        const target = e.target;
        // Không xóa stage hay background layer
        if (target !== this.stage && (target as { getLayer: () => unknown }).getLayer() === this.drawLayer) {
          this.pushHistory({ type: 'remove', node: target });
          (target as { destroy: () => void }).destroy();
          this.drawLayer.batchDraw();
        }
        return;
      }

      this.isDrawing = true;
      const pos = this.stage.getPointerPosition() as { x: number; y: number };
      this.startPos = { ...pos };
      this.currentShape = this.createShape(pos);
      if (this.currentShape) {
        this.drawLayer.add(this.currentShape);
      }
    });

    this.stage.on('mousemove touchmove', () => {
      if (!this.isDrawing || !this.currentShape) return;
      const pos = this.stage.getPointerPosition() as { x: number; y: number };
      this.updateShape(pos);
      this.drawLayer.batchDraw();
    });

    this.stage.on('mouseup touchend', () => {
      if (!this.isDrawing || !this.currentShape) return;
      this.isDrawing = false;
      // Chỉ lưu vào history nếu shape có kích thước thực sự (tránh click mà không kéo)
      const pts = this.currentShape.points?.();
      const w = this.currentShape.width?.();
      const hasContent = pts ? pts.length > 4 : w ? Math.abs(w) > 2 : true;
      if (hasContent) {
        this.pushHistory({ type: 'add', node: this.currentShape });
      } else {
        this.currentShape.destroy();
        this.drawLayer.batchDraw();
      }
      this.currentShape = null;
    });
  }

  // ── Shape factory ─────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createShape(pos: { x: number; y: number }): any {
    const K = this.KonvaLib;
    const color = this.strokeColor();
    const sw = this.strokeWidth();

    switch (this.activeTool()) {
      case 'pencil':
        return new K.Line({
          stroke: color,
          strokeWidth: sw,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.4,
          points: [pos.x, pos.y],
          globalCompositeOperation: 'source-over',
        });

      case 'line':
        return new K.Line({
          stroke: color,
          strokeWidth: sw,
          lineCap: 'round',
          points: [pos.x, pos.y, pos.x, pos.y],
        });

      case 'rect':
        return new K.Rect({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: color,
          strokeWidth: sw,
          fill: 'transparent',
        });

      case 'ellipse':
        return new K.Ellipse({
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          stroke: color,
          strokeWidth: sw,
          fill: 'transparent',
        });

      default:
        return null;
    }
  }

  private updateShape(pos: { x: number; y: number }): void {
    const shape = this.currentShape;
    const { x: sx, y: sy } = this.startPos;

    switch (this.activeTool()) {
      case 'pencil': {
        const pts: number[] = shape.points();
        shape.points([...pts, pos.x, pos.y]);
        break;
      }
      case 'line': {
        const [x0, y0] = shape.points() as number[];
        shape.points([x0, y0, pos.x, pos.y]);
        break;
      }
      case 'rect': {
        const w = pos.x - sx;
        const h = pos.y - sy;
        shape.x(w < 0 ? pos.x : sx);
        shape.y(h < 0 ? pos.y : sy);
        shape.width(Math.abs(w));
        shape.height(Math.abs(h));
        break;
      }
      case 'ellipse': {
        const rx = Math.abs(pos.x - sx) / 2;
        const ry = Math.abs(pos.y - sy) / 2;
        shape.x(sx + (pos.x - sx) / 2);
        shape.y(sy + (pos.y - sy) / 2);
        shape.radiusX(rx);
        shape.radiusY(ry);
        break;
      }
    }
  }

  // ── Public toolbar actions ────────────────────────────────────────────────

  setTool(tool: DrawTool): void {
    this.activeTool.set(tool);
    // Bật/tắt hit detection trên các nét vẽ cho eraser
    const listen = tool === 'eraser';
    this.drawLayer?.getChildren().forEach((node: { listening: (v: boolean) => void }) => {
      node.listening(listen);
    });
  }

  setColor(color: string): void {
    this.strokeColor.set(color);
  }

  setWidth(width: number): void {
    this.strokeWidth.set(width);
  }

  undo(): void {
    const entry = this.history.pop();
    if (!entry) return;
    if (entry.type === 'add') {
      entry.node.remove();
    } else {
      this.drawLayer.add(entry.node);
    }
    this.redoStack.push(entry);
    this.drawLayer.batchDraw();
    this.syncHistorySignals();
  }

  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    if (entry.type === 'add') {
      this.drawLayer.add(entry.node);
    } else {
      entry.node.remove();
    }
    this.history.push(entry);
    this.drawLayer.batchDraw();
    this.syncHistorySignals();
  }

  clearCanvas(): void {
    this.drawLayer?.destroyChildren();
    this.drawLayer?.draw();
    this.history = [];
    this.redoStack = [];
    this.syncHistorySignals();
  }

  /** Xuất toàn bộ canvas (nền + nét vẽ) thành base64 PNG */
  exportAsImage(): void {
    if (!this.stage) return;
    const dataUrl: string = this.stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
    this.zone.run(() => this.imageExported.emit(dataUrl));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private pushHistory(entry: HistoryEntry): void {
    this.history.push(entry);
    this.redoStack = []; // reset redo khi có hành động mới
    this.zone.run(() => this.syncHistorySignals());
  }

  private syncHistorySignals(): void {
    this.canUndo.set(this.history.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  /** Typed helper thay thế $any($event.target).value trong template */
  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
