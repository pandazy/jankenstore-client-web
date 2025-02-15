import {
	useQuery,
	UseQueryOptions,
	UseQueryResult,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

export interface QueryRenderOptions<R> {
	q: UseQueryOptions<R>;
	render: (data?: R) => ReactNode;
}

/**
 * A type that can be either a ReactNode or an object containing query options.
 * if the object contains query options, it will be used to fetch content data.
 */
export type ContentOrQuery<R> = ReactNode | QueryRenderOptions<R>;

export function isQuery<R>(content: ContentOrQuery<R>): boolean {
	return 'q' in (content as object);
}

export function getQueryOptions<R>(
	content: ContentOrQuery<R>,
): UseQueryOptions<R> | undefined {
	return isQuery(content) ? (content as QueryRenderOptions<R>).q : undefined;
}

export function getRenderedContent<R>(
	contentOrQuery: ContentOrQuery<R>,
	data?: R,
): ReactNode {
	return 'render' in (contentOrQuery as object)
		? (contentOrQuery as QueryRenderOptions<R>).render(data)
		: (contentOrQuery as ReactNode);
}

const DEFAULT_QUERY_KEY = ['default-use-query-render'];

export function useQueryRender<R>(
	contentOrQuery: ContentOrQuery<R>,
	extraQueryOptions?: Omit<UseQueryOptions<R>, 'queryKey'>,
): UseQueryResult<R> {
	const options = getQueryOptions(contentOrQuery);
	// Since queryKey is a required field in queryOptions
	// this is only used as placeholder if `contentOrQuery` is NOT a query,
	// in this case, query will not be made because enabled is false
	const queryKey = options?.queryKey ?? DEFAULT_QUERY_KEY;
	const disabledByOptions = 'enabled' in (options ?? {}) && !options?.enabled;
	const disabledByExtra =
		'enabled' in (extraQueryOptions ?? {}) && !extraQueryOptions?.enabled;
	return useQuery<R>({
		queryKey,
		...(options ?? {}),
		enabled: !disabledByExtra && !disabledByOptions,
	});
}
