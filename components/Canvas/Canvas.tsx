import Game from 'entities/Game';
import { memo, useEffect, useRef } from 'react';

interface Props {
	entities: BareEntity[];
	height: number;
	width: number;
	gameId: string;
	socket: SocketIOClient.Socket;
	myTeam: Team;
}

const Canvas: React.FC<Props> = ({ entities, height, width, gameId, socket, myTeam }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const game = new Game(entities, canvasRef.current!.getContext('2d')!, gameId, socket, myTeam);
		game.start();

		return () => {
			game.stop();
		};
	}, [entities, gameId, socket, myTeam]);

	return <canvas style={{ display: 'block', height: '100vh', width: '100vw' }} height={height} width={width} id="canvas" ref={canvasRef} />;
};

export default memo(Canvas, (prev, cur) => prev.socket === cur.socket);
