import Game from 'game/Game';
import { memo, useEffect, useRef } from 'react';

interface MultiplayerProps {
	entities: BareEntity[];
	height: number;
	width: number;
	gameId: string;
	socket: SocketIOClient.Socket;
	myTeam: Team;
	multiplayer: true;
}

interface SingleplayerProps {
	entities: BareEntity[];
	height: number;
	width: number;
	multiplayer: false;
}

type Props = MultiplayerProps | SingleplayerProps;

const Canvas: React.FC<Props> = ({ entities, height, width, multiplayer, ...rest }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		if (multiplayer) {
			const { gameId, socket, myTeam } = rest as MultiplayerProps;
			const game = new Game({ entities, multiplayer, ctx: canvasRef.current!.getContext('2d')!, gameId, socket, myTeam });
			game.start();

			return () => {
				game.stop();
			};
		} else {
			const game = new Game({ entities, multiplayer, ctx: canvasRef.current!.getContext('2d')! });
			game.start();

			return () => {
				game.stop();
			};
		}
	}, [entities, multiplayer, rest]);

	return <canvas style={{ display: 'block', height: '100vh', width: '100vw' }} height={height} width={width} id="canvas" ref={canvasRef} />;
};

export default memo(Canvas, (prev, cur) => (prev.multiplayer && cur.multiplayer ? prev.socket === cur.socket : false));
