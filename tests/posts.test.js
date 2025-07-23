const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/services/supabase');

describe('Posts API', () => {
    let newPost;

    afterAll(async () => {
        const { data: posts } = await supabase.from('posts').select('id').ilike('title', 'Test Post %');
        if (posts && posts.length) {
            const ids = posts.map(p => p.id);
            await supabase.from('posts').delete().in('id', ids);
        }
    });

    it('deve criar um novo post', async () => {
        const response = await request(app)
            .post('/posts')
            .send({
                title: 'Teste para criação de post',
                content: 'teste',
                author: 'Jest Tester'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe('Teste para criação de post');
        newPost = response.body;
    });

    it('deve resgatar todos os posts', async () => {
        const response = await request(app).get('/posts');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve resgatar um único post através de seu id', async () => {
        const response = await request(app).get(`/posts/${newPost.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(newPost.id);
    });

    it('deve atualizar um post', async () => {
        const response = await request(app)
            .put(`/posts/${newPost.id}`)
            .send({
                title: 'Teste de atualização do post',
                content: 'Conteúdo atualizado',
                author: 'Jest Tester'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe('Teste de atualização do post');
    });

    it('deve procurar por posts com base em palavras-chave', async () => {
        const response = await request(app).get('/posts/search?q=Conteúdo');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0].title).toContain('Updated');
    });

    it('deve deletar um post', async () => {
        const response = await request(app).delete(`/posts/${newPost.id}`);
        expect(response.statusCode).toBe(204);

        const getResponse = await request(app).get(`/posts/${newPost.id}`);
        expect(getResponse.statusCode).toBe(404);
    });
});