import { LinearProgress } from '@mui/material';

export default function AnimatedLoadingBar({
	isLoading,
}: {
	isLoading: boolean;
}) {
	const loadingBarSx = {
		transitionDuration: '0.8s',
		opacity: isLoading ? 1 : 0,
		transform: `scaleY(${isLoading ? 1 : 0})`,
		transformOrigin: 'top',
	};
	return <LinearProgress sx={loadingBarSx} />;
}
