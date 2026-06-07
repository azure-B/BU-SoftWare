import { render, screen, waitFor } from '@testing-library/react';
import ReservationView from './ReservationView';

jest.mock('./reservationApi', () => ({
  fetchReservationFacilities: jest.fn().mockResolvedValue({
    categories: [
      { id: 'startup', label: '창업지원단', sectionTitle: '창업지원단 공간', facilities: [] },
    ],
  }),
  fetchMyReservations: jest.fn().mockResolvedValue([]),
  createReservation: jest.fn(),
}));

test('renders reservation list without throwing', async () => {
  render(<ReservationView token="test-token" departmentId={6} departmentName="컴퓨터공학부" />);
  await waitFor(() => {
    expect(screen.getByText('시설예약')).toBeInTheDocument();
  });
});
