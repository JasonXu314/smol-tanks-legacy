import { circle } from '../../../utils/utils';

export default class Tree implements IEntity {
	public type: EntityType = 'tree';

	constructor(private cx: number, private cy: number, private ctx: CanvasRenderingContext2D | null, private r: number, private color: string) {}

	public cleanup(): void {}

	public render(): void {
		if (this.ctx) {
			circle(this.ctx, this.cx, this.cy, this.r, this.color);
		}
	}

	public inFov([x, y]: RawVector, height: number, width: number): boolean {
		const maxX = x + width / 2 + this.r / 2;
		const minX = x - width / 2 - this.r / 2;
		const maxY = y + height / 2 + this.r / 2;
		const minY = y - height / 2 - this.r / 2;

		return minX <= this.cx && this.cx <= maxX && minY <= this.cy && this.cy <= maxY;
	}

	public update(): void {}

	public snapshot(): BareEntity {
		return {
			type: 'tree',
			pos: [this.cx, this.cy]
		};
	}
}
