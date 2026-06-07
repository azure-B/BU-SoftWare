const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/reservationModel');
jest.mock('../src/models/facilityModel');

const ReservationModel = require('../src/models/reservationModel');
const FacilityModel = require('../src/models/facilityModel');
const app = require('../src/app');

describe('Reservations API', () => {
  const token = jwt.sign({ userId: 1, studentId: '20240001' }, 'test-secret');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('GET /api/reservations/facilities', () => {
    it('학과별 시설 카탈로그를 반환한다', async () => {
      FacilityModel.findFacilitiesForDepartment.mockResolvedValue({
        departmentId: 6,
        departmentName: '컴퓨터공학부',
        categories: [{ id: 'startup', label: '창업지원단', facilities: [] }],
      });

      const res = await request(app).get('/api/reservations/facilities?departmentId=6');

      expect(res.status).toBe(200);
      expect(res.body.departmentName).toBe('컴퓨터공학부');
      expect(FacilityModel.findFacilitiesForDepartment).toHaveBeenCalledWith(6);
    });
  });

  describe('GET /api/reservations/mine', () => {
    it('로그인 사용자의 예약 목록을 반환한다', async () => {
      ReservationModel.findMyReservations.mockResolvedValue([
        {
          id: '10',
          facilityId: 'coworking',
          facilityTitle: '코워킹 스페이스',
          date: '2026-06-20',
          timeSlots: ['09:00', '10:00'],
          status: 'approved',
        },
      ]);

      const res = await request(app)
        .get('/api/reservations/mine')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].facilityId).toBe('coworking');
      expect(ReservationModel.findMyReservations).toHaveBeenCalledWith(1);
    });

    it('토큰 없이 요청하면 401을 반환한다', async () => {
      const res = await request(app).get('/api/reservations/mine');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reservations/booked-slots', () => {
    it('예약된 시간 슬롯을 반환한다', async () => {
      ReservationModel.findBookedSlots.mockResolvedValue(['09:00', '10:00']);

      const res = await request(app).get(
        '/api/reservations/booked-slots?facilitySlug=coworking&date=2026-06-20',
      );

      expect(res.status).toBe(200);
      expect(res.body.timeSlots).toEqual(['09:00', '10:00']);
    });

    it('쿼리 누락 시 400을 반환한다', async () => {
      const res = await request(app).get('/api/reservations/booked-slots?facilitySlug=coworking');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/reservations', () => {
    it('예약을 생성한다', async () => {
      ReservationModel.createReservation.mockResolvedValue({
        id: '11',
        facilityId: 'coworking',
        facilityTitle: '코워킹 스페이스',
        date: '2026-06-20',
        timeSlots: ['13:00', '14:00'],
        status: 'approved',
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          facilitySlug: 'coworking',
          date: '2026-06-20',
          timeSlots: ['13:00', '14:00'],
        });

      expect(res.status).toBe(201);
      expect(res.body.facilityId).toBe('coworking');
      expect(ReservationModel.createReservation).toHaveBeenCalledWith({
        userId: 1,
        facilitySlug: 'coworking',
        date: '2026-06-20',
        timeSlots: ['13:00', '14:00'],
      });
    });

    it('timeSlots 누락 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          facilitySlug: 'coworking',
          date: '2026-06-20',
        });

      expect(res.status).toBe(400);
      expect(res.body.fields).toContain('timeSlots');
    });
  });
});
