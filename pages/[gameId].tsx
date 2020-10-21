import Canvas from '$/Canvas/Canvas';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import styles from '../sass/Game.module.scss';

const Room: NextPage = () => {
	const screenRef = useRef<HTMLDivElement | null>(null);
	const [height, setHeight] = useState<number>(0);
	const [width, setWidth] = useState<number>(0);
	const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
	const [gameStarted, setGameStarted] = useState<boolean>(false);
	const [entities, setEntities] = useState<BareEntity[]>([]);
	const [team, setTeam] = useState<Team | null>(null);
	const router = useRouter();
	const gameId = useMemo(() => router.query.gameId as string, [router]);

	useEffect(() => {
		const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!);

		socket.emit('JOIN_GAME', { id: gameId });
		setSocket(socket);

		socket.on('START_GAME', () => {
			setGameStarted(true);
		});

		socket.on('GAME_INFO', (info: GameInfo) => {
			setEntities(info.game.entities);
			setTeam(info.team);
		});

		return () => {
			socket.off('JOIN_GAME');
			socket.off('START_GAME');
			socket.close();
		};
	}, [gameId]);

	useEffect(() => {
		const listener = (evt: MouseEvent) => evt.preventDefault();
		const resizeListener = (evt: UIEvent) => {
			evt.preventDefault();
			if (screenRef.current) {
				const computedStyles = getComputedStyle(screenRef.current);

				setHeight(parseInt(computedStyles.height));
				setWidth(parseInt(computedStyles.width));
			} else {
				console.log('no screenref');
			}
		};

		window.addEventListener('contextmenu', listener);
		window.addEventListener('resize', resizeListener);

		return () => {
			window.removeEventListener('contextmenu', listener);
			window.removeEventListener('resize', resizeListener);
		};
	}, []);

	useEffect(() => {
		if (screenRef.current) {
			const computedStyles = getComputedStyle(screenRef.current);

			setHeight(parseInt(computedStyles.height));
			setWidth(parseInt(computedStyles.width));
		} else {
			console.log('no screenref');
		}
	}, []);

	return (
		<div className={styles.main} ref={screenRef}>
			{!gameStarted && <h1>Waiting on other player...</h1>}
			{gameStarted && <Canvas entities={entities} gameId={gameId} height={height} width={width} socket={socket!} myTeam={team!} multiplayer />}
			<Head>
				<style>{`
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
				`}</style>
			</Head>
		</div>
	);
};

export default Room;
