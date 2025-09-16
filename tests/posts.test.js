const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/services/supabase');

describe('Cria usuário e manipula posts', () => {
    let newPost;
    let authToken;

    afterAll(async () => {
        const { data: posts } = await supabase.from('posts').select('id').ilike('title', 'Test Post %');
        if (posts && posts.length) {
            const ids = posts.map(p => p.id);
            await supabase.from('posts').delete().in('id', ids);
        }
    });

    it('deve criar um usuário com credencial de professor', async () => {
        const response = await request(app)
            .post('/auth/signup')
            .send({
                name: 'Israel',
                email: 'israelnetonunes@gmail.com',
                password: '@123',
                isTeacher: true
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Usuário criado com sucesso!');
    });

    it('deve realizar login e armazenar token', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'israelnetonunes@gmail.com',
                password: '@123'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.session).toHaveProperty('access_token');

        authToken = response.body.session.access_token;
    });

    it('deve criar um novo post', async () => {
        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${authToken}`)
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
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Atualização do post',
                content: 'Conteúdo atualizado',
                author: 'Jest Tester'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.title).toBe('Atualização do post');
    });

    it('deve procurar por posts com base em palavras-chave', async () => {
        const response = await request(app).get('/posts/search?q=Atualização');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0].title).toContain('Atualização');
    });

    it('deve deletar um post', async () => {
        const response = await request(app)
            .delete(`/posts/${newPost.id}`)
            .set('Authorization', `Bearer ${authToken}`);
            
        expect(response.statusCode).toBe(204);

        const getResponse = await request(app).get(`/posts/${newPost.id}`);
        expect(getResponse.statusCode).toBe(404);
    });
});