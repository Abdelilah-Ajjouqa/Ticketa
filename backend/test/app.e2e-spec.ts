import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters/http-exception.filter';
import mongoose from 'mongoose';

/**
 * Full E2E test for the Ticketa booking flow.
 *
 * Prerequisites: a running MongoDB instance at localhost:27017.
 * The test uses a dedicated database (ticketa_e2e_test) that is
 * dropped after the suite completes.
 */
describe('Ticketa E2E – Full Booking Flow', () => {
  let app: INestApplication;

  // Tokens & IDs captured across steps
  let adminToken: string;
  let userToken: string;
  let eventId: string;
  let reservationId: string;

  const TEST_DB = 'ticketa_e2e_test';

  beforeAll(async () => {
    // Override the MongoDB URI to use a dedicated test database
    process.env.MONGODB_URI = `mongodb://localhost:27017/${TEST_DB}`;
    process.env.JWT_SECRET = 'e2e-test-secret';

    // Drop the test database first to ensure a clean slate
    const conn = await mongoose.connect(`mongodb://localhost:27017/${TEST_DB}`);
    await conn.connection.db.dropDatabase();
    await mongoose.disconnect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    // Drop the test database so E2E runs are idempotent
    const conn = mongoose.connection;
    if (conn.readyState === 1) {
      await conn.db.dropDatabase();
    }
    await app.close();
  });

  // ──────────────────────────────────────────────
  // 1. Register Admin
  // ──────────────────────────────────────────────
  it('POST /auth/register – register an admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'e2eadmin',
        email: 'e2eadmin@test.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'admin',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toHaveProperty('email', 'e2eadmin@test.com');
    expect(res.body.user).not.toHaveProperty('password');
    adminToken = res.body.accessToken;
  });

  // ──────────────────────────────────────────────
  // 2. Register Participant
  // ──────────────────────────────────────────────
  it('POST /auth/register – register a participant', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'e2euser',
        email: 'e2euser@test.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'participant',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    userToken = res.body.accessToken;
  });

  // ──────────────────────────────────────────────
  // 3. Login Admin
  // ──────────────────────────────────────────────
  it('POST /auth/login – login admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2eadmin@test.com', password: 'Password123' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    adminToken = res.body.accessToken; // refresh
  });

  // ──────────────────────────────────────────────
  // 4. Login Participant
  // ──────────────────────────────────────────────
  it('POST /auth/login – login participant', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2euser@test.com', password: 'Password123' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    userToken = res.body.accessToken; // refresh
  });

  // ──────────────────────────────────────────────
  // 5. Create Event (Admin)
  // ──────────────────────────────────────────────
  it('POST /events – create event (admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Concert',
        description: 'An end-to-end test event',
        date: '2027-06-15T18:00:00.000Z',
        location: 'E2E Arena',
        totalTickets: 5,
        price: 30,
      })
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.status).toBe('draft');
    expect(res.body.availableTickets).toBe(5);
    eventId = res.body._id;
  });

  // ──────────────────────────────────────────────
  // 6. Participant cannot create event
  // ──────────────────────────────────────────────
  it('POST /events – participant is forbidden', async () => {
    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Hack',
        description: 'x',
        date: '2027-01-01',
        location: 'x',
        totalTickets: 1,
        price: 0,
      })
      .expect(403);
  });

  // ──────────────────────────────────────────────
  // 7. Public listing – draft event not visible
  // ──────────────────────────────────────────────
  it('GET /events – draft events hidden from public', async () => {
    const res = await request(app.getHttpServer())
      .get('/events')
      .expect(200);

    const ids = res.body.map((e: any) => e._id);
    expect(ids).not.toContain(eventId);
  });

  // ──────────────────────────────────────────────
  // 8. Publish Event
  // ──────────────────────────────────────────────
  it('PATCH /events/:id/publish – publish the event', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/events/${eventId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe('published');
  });

  // ──────────────────────────────────────────────
  // 9. Public listing – published event visible
  // ──────────────────────────────────────────────
  it('GET /events – published event now visible', async () => {
    const res = await request(app.getHttpServer())
      .get('/events')
      .expect(200);

    const ids = res.body.map((e: any) => e._id);
    expect(ids).toContain(eventId);
  });

  // ──────────────────────────────────────────────
  // 10. Reserve a ticket (Participant) – status = pending
  // ──────────────────────────────────────────────
  it('POST /reservations – reserve ticket (pending)', async () => {
    const res = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId })
      .expect(201);

    expect(res.body.status).toBe('pending');
    expect(res.body).toHaveProperty('ticketCode');
    reservationId = res.body._id;
  });

  // ──────────────────────────────────────────────
  // 11. Duplicate reservation blocked
  // ──────────────────────────────────────────────
  it('POST /reservations – duplicate blocked', async () => {
    const res = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId })
      .expect(400);

    expect(res.body.message).toMatch(/already have an active reservation/i);
  });

  // ──────────────────────────────────────────────
  // 12. Available tickets decremented
  // ──────────────────────────────────────────────
  it('GET /events/:id – tickets decremented after reservation', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .expect(200);

    expect(res.body.availableTickets).toBe(4);
  });

  // ──────────────────────────────────────────────
  // 13. PDF blocked while PENDING
  // ──────────────────────────────────────────────
  it('GET /reservations/:id/pdf – blocked while pending', async () => {
    await request(app.getHttpServer())
      .get(`/reservations/${reservationId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);
  });

  // ──────────────────────────────────────────────
  // 14. Confirm Reservation (Admin)
  // ──────────────────────────────────────────────
  it('PATCH /reservations/:id/confirm – admin confirms', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/reservations/${reservationId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe('confirmed');
  });

  // ──────────────────────────────────────────────
  // 15. Download PDF (now allowed)
  // ──────────────────────────────────────────────
  it('GET /reservations/:id/pdf – download after confirmation', async () => {
    const res = await request(app.getHttpServer())
      .get(`/reservations/${reservationId}/pdf`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('ticket-');
    expect(res.body).toBeInstanceOf(Buffer);
  });

  // ──────────────────────────────────────────────
  // 16. Cancel Reservation (Owner)
  // ──────────────────────────────────────────────
  it('DELETE /reservations/:id – owner cancels', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.status).toBe('cancelled');
  });

  // ──────────────────────────────────────────────
  // 17. Ticket released after cancel
  // ──────────────────────────────────────────────
  it('GET /events/:id – tickets restored after cancel', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .expect(200);

    expect(res.body.availableTickets).toBe(5);
  });

  // ──────────────────────────────────────────────
  // 18. Re-reserve + Refuse flow
  // ──────────────────────────────────────────────
  it('POST + PATCH refuse – refuse flow releases ticket', async () => {
    // Re-reserve (old one was cancelled, so no duplicate)
    const createRes = await request(app.getHttpServer())
      .post('/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId })
      .expect(201);

    const newId = createRes.body._id;

    // Refuse
    const refuseRes = await request(app.getHttpServer())
      .patch(`/reservations/${newId}/refuse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(refuseRes.body.status).toBe('refused');

    // Ticket restored
    const eventRes = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .expect(200);

    expect(eventRes.body.availableTickets).toBe(5);
  });

  // ──────────────────────────────────────────────
  // 19. Filtering reservations
  // ──────────────────────────────────────────────
  it('GET /reservations?status=refused – admin filters by status', async () => {
    const res = await request(app.getHttpServer())
      .get('/reservations?status=refused')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const r of res.body) {
      expect(r.status).toBe('refused');
    }
  });

  // ──────────────────────────────────────────────
  // 20. Stats endpoint
  // ──────────────────────────────────────────────
  it('GET /events/stats – admin gets stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/events/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('events');
    expect(res.body).toHaveProperty('reservations');
    expect(res.body.events).toHaveProperty('total');
    expect(res.body.events).toHaveProperty('fillRate');
    expect(res.body.events).toHaveProperty('upcoming');
    expect(res.body.reservations).toHaveProperty('total');
    expect(res.body.reservations).toHaveProperty('byStatus');
  });

  // ──────────────────────────────────────────────
  // 21. Stats forbidden for participant
  // ──────────────────────────────────────────────
  it('GET /events/stats – forbidden for participant', async () => {
    await request(app.getHttpServer())
      .get('/events/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  // ──────────────────────────────────────────────
  // 22. Invalid ObjectId returns 400 (exception filter)
  // ──────────────────────────────────────────────
  it('GET /events/invalid-id – returns 400 not 500', async () => {
    const res = await request(app.getHttpServer())
      .get('/events/invalid-id')
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // ──────────────────────────────────────────────
  // 23. Protected routes without token → 401
  // ──────────────────────────────────────────────
  it('POST /reservations – no token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/reservations')
      .send({ eventId })
      .expect(401);
  });
});
