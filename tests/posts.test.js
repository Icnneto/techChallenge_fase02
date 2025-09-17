require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../src/services/supabase');

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

describe('Cria usuário e manipula posts', () => {
    let newPost;
    let authToken;

    afterAll(async () => {
        const { data: posts } = await supabase
            .from('posts')
            .select('id')
            .ilike('title', 'Test Post %');
        if (posts && posts.length) {
            const ids = posts.map(p => p.id);
            await supabase.from('posts').delete().in('id', ids);
        };

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('name', 'Israel'); // ou pelo email, se preferir

        if (profiles && profiles.length) {
            const ids = profiles.map(p => p.id);
            await supabase.from('profiles').delete().in('id', ids);

            // agora apaga o user na tabela auth.users
            // ⚠️ só funciona com service_role key, não com anon
            const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(ids[0]);
            if (deleteUserError) {
                console.error("Erro ao deletar usuário de teste:", deleteUserError.message);
            }
        }
    });

    it('deve criar um usuário com credencial de professor', async () => {
        const response = await request(app)
            .post('/auth/signup')
            .send({
                name: 'Israel',
                email: 'israelteste@gmail.com',
                password: '@123Teste',
                isProfessor: true
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Usuário criado com sucesso!');
    });

    it('deve realizar login e armazenar token', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'israelteste@gmail.com',
                password: '@123Teste'
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
                author: 'Jest Tester',
                user_id: '7d80625a-0f28-4d88-8ea4-a23a69a20f77'
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