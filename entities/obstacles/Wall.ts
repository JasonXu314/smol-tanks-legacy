import { Segment } from '@/math/lines';
import { PositionVector } from '@/math/vectors';
import { line } from '../../utils/utils';

export default class Wall implements IEntity {
	public type: EntityType = 'wall';

	constructor(
		private start: PositionVector,
		private end: PositionVector,
		private ctx: CanvasRenderingContext2D | null,
		private thiccness: number,
		private color: string
	) {}

	public cleanup(): void {}

	public render(): void {
		if (this.ctx) {
			line(this.ctx, [this.start.raw, this.end.raw], this.color, [], this.thiccness);
		}
	}

	public snapshot(): BareEntity {
		return {
			type: 'wall',
			start: this.start.raw,
			end: this.end.raw
		};
	}

	public inFov([x, y]: RawVector, height: number, width: number): boolean {
		const maxX = x + width / 2;
		const minX = x - width / 2;
		const maxY = y + height / 2;
		const minY = y - height / 2;

		return (
			(minX <= this.start.x && this.start.x <= maxX && minY <= this.start.y && this.start.y <= maxY) ||
			(minX <= this.end.x && this.end.x <= maxX && minY <= this.end.y && this.end.y <= maxY)
		);
	}

	public update(): void {}

	public getAsSegment(): Segment {
		return new Segment(this.start, this.end);
	}
}
