import { DirectionVector, PositionVector } from '@/math/vectors';
import { generate as uuid } from 'short-uuid';
import { draw, rotate } from 'utils/utils';
import Game from '../Game';

const template: RawVector[] = [
	[3, 2],
	[-3, 2],
	[-3, -2],
	[3, -2]
];

export default class Shell implements IEntity {
	public type: EntityType = 'shell';
	public id: string;

	constructor(
		public pos: PositionVector,
		public dir: DirectionVector,
		private target: PositionVector,
		private velocity: number,
		private ctx: CanvasRenderingContext2D,
		private game: Game
	) {
		this.id = uuid();
	}

	public render(): void {
		draw(
			this.ctx,
			template
				.map((pt) => rotate(new PositionVector(...pt), new DirectionVector(this.dir.x, this.dir.y)))
				.map(([ox, oy]) => [
					ox + this.pos.x + this.ctx.canvas.width / 2 + this.game.viewPos[0],
					oy + this.pos.y + this.ctx.canvas.height / 2 + this.game.viewPos[1]
				]),
			'black'
		);
	}

	public update(): void {
		if (this.velocity > this.pos.distanceTo(this.target)) {
			this.pos = this.target.clone();
			this.game.removeShell(this);
		} else {
			this.pos = this.pos.add(this.dir.scale(this.velocity));
		}
	}

	public inFov([x, y]: RawVector, height: number, width: number): boolean {
		const maxX = x + width / 2 + 5;
		const minX = x - width / 2 - 5;
		const maxY = y + height / 2 + 5;
		const minY = y - height / 2 - 5;

		return minX <= this.pos.x && this.pos.x <= maxX && minY <= this.pos.y && this.pos.y <= maxY;
	}

	public cleanup(): void {}

	public snapshot(): BareEntity {
		return {
			type: 'shell',
			dir: this.dir.raw,
			pos: this.pos.raw,
			target: this.target.raw,
			velocity: this.velocity
		};
	}
}
