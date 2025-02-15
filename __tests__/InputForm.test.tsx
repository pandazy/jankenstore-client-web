import { render, screen } from '@testing-library/react';

describe('InputForm test', () => {
	it('should render', async () => {
		render(<div>Editor</div>);
		const el = await screen.findByText('Editor');
		expect(el).toBeInTheDocument();
	});
});
