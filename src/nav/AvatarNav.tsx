'use client';

import { Avatar, AvatarOwnProps, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { createRef, ReactNode, RefObject, useEffect, useRef } from 'react';

export interface RouteAvatarSettings {
	path?: string;
	avatar: ReactNode;
	label: string;
}

const DEFAULT_AVATAR_SIZE = 64;

const DEFAULT_AVATAR_SX: AvatarOwnProps['sx'] = {
	width: DEFAULT_AVATAR_SIZE,
	height: DEFAULT_AVATAR_SIZE,
	backgroundColor: 'var(--mui-palette-common-white)',
	borderWidth: 2,
	borderStyle: 'solid',
	color: 'var(--mui-palette-primary-dark)',
};

const DEFAULT_ACTIVE_SX: AvatarOwnProps['sx'] = {
	borderColor: 'var(--mui-palette-grey-400)',
	backgroundColor: 'var(--mui-palette-action-selected)',
	cursor: 'default',
};

const DEFAULT_INACTIVE_SX: AvatarOwnProps['sx'] = {
	borderColor: 'var(--mui-palette-grey-200)',
	color: 'var(--mui-palette-primary-dark)',
	boxShadow: 'var(--mui-shadows-3)',
};

const DEFAULT_HOVER_SX: AvatarOwnProps['sx'] = {
	borderColor: 'var(--mui-palette-primary-dark)',
	backgroundColor: 'var(--mui-palette-grey-100)',
};

const DEFAULT_FOCUS_SX: AvatarOwnProps['sx'] = {
	borderRadius: '50%',
	outline: '2px dotted',
	outlineColor: 'var(--mui-palette-primary-dark)',
};

export interface AvatarNavProps<T extends string = string> {
	current?: T;
	avatarSettings: Record<T, RouteAvatarSettings>;
	avatarSx?: AvatarOwnProps['sx'];
	activeSx?: AvatarOwnProps['sx'];
	inactiveSx?: AvatarOwnProps['sx'];
	hoverSx?: AvatarOwnProps['sx'];
	focusSx?: AvatarOwnProps['sx'];
}

export default function AvatarNav<T extends string = string>({
	current,
	avatarSettings,
	avatarSx,
	activeSx,
	inactiveSx,
	hoverSx,
	focusSx,
}: AvatarNavProps<T>): React.ReactElement {
	const linkRefMapRef = useRef<Map<string, RefObject<HTMLAnchorElement>>>(
		new Map(
			Object.keys(avatarSettings).map((route) => [
				route,
				createRef() as RefObject<HTMLAnchorElement>,
			]),
		),
	);
	const finalAvatarSx = avatarSx || DEFAULT_AVATAR_SX;
	const activeStateSx = activeSx || DEFAULT_ACTIVE_SX;
	const inactiveStateSx = inactiveSx || DEFAULT_INACTIVE_SX;
	const finalHoverSx = hoverSx || DEFAULT_HOVER_SX;
	const finalFocusSx = focusSx || DEFAULT_FOCUS_SX;
	useEffect(() => {
		if (current) {
			linkRefMapRef.current.get(current)?.current?.focus();
		}
	}, [current, linkRefMapRef]);
	return (
		<Stack direction="row" spacing={2}>
			{Object.entries(avatarSettings || {}).map(([route, conf]) => {
				const { path, avatar, label } = conf as RouteAvatarSettings;
				const isCurrent = current === route;
				return (
					<Link
						sx={{
							'&:focus': finalFocusSx as {},
						}}
						component={RouterLink}
						to={path || '/'}
						key={route}
						title={label}
						ref={linkRefMapRef.current.get(route)}
					>
						<Avatar
							sx={{
								...(finalAvatarSx as {}),
								'&:hover': isCurrent
									? {}
									: (finalHoverSx as {}),
								...((isCurrent
									? activeStateSx
									: inactiveStateSx) as {}),
							}}
						>
							{avatar}
						</Avatar>
					</Link>
				);
			})}
		</Stack>
	);
}
