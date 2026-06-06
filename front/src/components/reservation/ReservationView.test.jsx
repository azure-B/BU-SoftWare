import { render, screen } from '@testing-library/react';
import ReservationView from './ReservationView';

test('renders reservation list without throwing', () => {
  render(<ReservationView />);
  expect(screen.getByText('시설예약')).toBeInTheDocument();
});
