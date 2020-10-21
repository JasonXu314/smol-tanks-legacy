import { PositionVector } from '@/math/vectors';
import { circle } from '@/utils';
import Game from '../Game';

export default class Crater implements IEntity {
	public type: EntityType = 'crater';
	private timeCreated: number = Date.now();

	constructor(private pos: PositionVector, private ctx: CanvasRenderingContext2D, private game: Game) {}

	public render(): void {
		const nowTime = Date.now();

		const gradient = this.ctx.createRadialGradient(
			this.ctx.canvas.width / 2 + (this.pos.x - this.game.viewPos[0]) / this.game.zoom,
			this.ctx.canvas.height / 2 - (this.pos.y - this.game.viewPos[1]) / this.game.zoom,
			0,
			this.ctx.canvas.width / 2 + (this.pos.x - this.game.viewPos[0]) / this.game.zoom,
			this.ctx.canvas.height / 2 - (this.pos.y - this.game.viewPos[1]) / this.game.zoom,
			16 / this.game.zoom
		);
		const fadeFactor = 1 - (nowTime - this.timeCreated) ** 4 / 10000 ** 4;
		gradient.addColorStop(0, `rgba(36, 18, 2, ${fadeFactor})`);
		gradient.addColorStop(0.25, `rgba(73, 38, 13, ${fadeFactor})`);
		gradient.addColorStop(1, `rgba(210, 86, 78, ${fadeFactor})`);

		circle(
			this.ctx,
			(this.pos.x - this.game.viewPos[0]) / this.game.zoom + this.ctx.canvas.width / 2,
			(this.pos.y - this.game.viewPos[1]) / this.game.zoom + this.ctx.canvas.height / 2,
			8 / this.game.zoom,
			gradient
		);

		if (nowTime - this.timeCreated >= 10000) {
			this.game.removeStatic(this);
		}
	}

	public inFov([x, y]: RawVector, height: number, width: number): boolean {
		const maxX = x + width / 2 + 5;
		const minX = x - width / 2 - 5;
		const maxY = y + height / 2 + 5;
		const minY = y - height / 2 - 5;

		return minX <= this.pos.x && this.pos.x <= maxX && minY <= this.pos.y && this.pos.y <= maxY;
	}

	public update(): void {}

	public cleanup(): void {}

	public snapshot(): BareEntity {
		return {
			type: 'crater',
			pos: this.pos.raw,
			createdAt: this.timeCreated
		};
	}
}
