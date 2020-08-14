import { CursorType } from 'utils/constants';
import { draw, line } from 'utils/utils';

const templates: Record<CursorType, RawVector[]> = {
	move: [
		[0, 7],
		[-7, 0],
		[0, -7],
		[7, 0]
	],
	default: [
		[0, 0],
		[9, 0],
		[5, -3],
		[9, -7],
		[7, -9],
		[3, -5],
		[0, -9]
	],
	attack: [
		[0, 7],
		[-7, 0],
		[0, -7],
		[7, 0]
	]
};

export default class Cursor implements IEntity {
	public type: EntityType = 'cursor';

	constructor(public x: number, public y: number, private ctx: CanvasRenderingContext2D | null, public cursorType: CursorType, private readonly id: number) {}

	public render(): void {
		if (this.ctx) {
			switch (this.cursorType) {
				case CursorType.MOVE:
					line(
						this.ctx,
						templates.move.map(([x, y]) => [x + this.x, y + this.y]),
						'green',
						[],
						3,
						true
					);
					break;
				case CursorType.DEFAULT:
					draw(
						this.ctx,
						templates.default.map(([x, y]) => [x + this.x, y + this.y]),
						'black'
					);
					break;
				case CursorType.ATTACK:
					line(
						this.ctx,
						templates.attack.map(([x, y]) => [x + this.x, y + this.y]),
						'red',
						[],
						3,
						true
					);
					line(
						this.ctx,
						[
							[-6, 0],
							[6, 0]
						].map(([x, y]) => [x + this.x, y + this.y]),
						'red',
						[],
						2,
						true
					);
					line(
						this.ctx,
						[
							[0, 6],
							[0, -6]
						].map(([x, y]) => [x + this.x, y + this.y]),
						'red',
						[],
						2,
						true
					);
					break;
			}
		}
	}

	public inFov(): boolean {
		return true;
	}

	public update(): void {}

	public cleanup(): void {}

	public snapshot(): BareEntity {
		return {
			type: 'cursor',
			pos: [this.x, this.y]
		};
	}
}
