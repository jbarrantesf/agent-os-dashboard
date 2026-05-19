const request = require('supertest');
const app = require('../index');

describe('Cards API', () => {
  it('should create a new card', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: 'Test Card' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual('Card created successfully');
  });

  it('should fetch all cards', async () => {
    const res = await request(app).get('/cards');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should update a card', async () => {
    const res = await request(app)
      .patch('/cards/1')
      .send({ title: 'Updated Test Card' });
    expect(res.statusCode).toEqual(200);
  });

  it('should delete a card', async () => {
    const res = await request(app).delete('/cards/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Card deleted successfully');
  });
});
