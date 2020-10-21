type EntityType = 'tank' | 'cursor' | 'wall' | 'tree' | 'shell' | 'crater';
type OrderType = 'MOVE' | 'ATTACK';
type ConstructType = 'line' | 'ray' | 'segment' | 'vector';
type Team = 'red' | 'blue';
type TreadState = 'for' | 'back' | 'none';
type Vector = import('@/math/vectors').Vector;
type PositionVector = import('@/math/vectors').PositionVector;
type DirectionVector = import('@/math/vectors').DirectionVector;
type Ray = import('@/math/lines').Ray;

type RawVector = [number, number];

interface BareTree {
	type: 'tree';
	pos: RawVector;
}

interface BareCrater {
	type: 'crater';
	pos: RawVector;
	createdAt: number;
}

interface BareCursor {
	type: 'cursor';
	pos: RawVector;
}

interface BareTank {
	type: 'tank';
	pos: RawVector;
	dir: RawVector;
	team: Team;
	id: string;
}

interface BareWall {
	type: 'wall';
	start: RawVector;
	end: RawVector;
}

interface BareShell {
	type: 'shell';
	pos: RawVector;
	dir: RawVector;
	target: RawVector;
	velocity: number;
}

type BareEntity = BareTank | BareWall | BareCursor | BareCrater | BareTree | BareShell;

interface Construct2D {
	type: ConstructType;
}

interface IEntity {
	type: EntityType;
	render(): void;
	update(): void;
	cleanup(): void;
	snapshot(): BareEntity;
	inFov(center: RawVector, height: number, width: number): boolean;
}

interface ISolidEntity extends IEntity {
	hitBy(ray: Ray): boolean;
}

interface IUnit extends ISolidEntity {
	id: string;
	moveTarget: PositionVector | null;
	fireTarget: PositionVector | null;
	selected: boolean;
	team: Team;
	pos: PositionVector;
	selectedBy(point: Vector | [RawVector, RawVector]): boolean;
	pointInside(point: Vector): boolean;
	registerHit(impact: PositionVector, trajectory: DirectionVector): void;
}

interface Game {
	id: string;
	entities: BareEntity[];
}

interface Order {
	gameId: string;
	ids: string[];
	type: OrderType;
	target: RawVector;
}

interface ServerOrder {
	ids: string[];
	type: OrderType;
	target: RawVector;
}

interface Game {
	id: string;
	entities: BareEntity[];
}

interface GameInfo {
	game: Game;
	team: Team;
}
