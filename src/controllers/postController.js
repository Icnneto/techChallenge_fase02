const supabase = require('../services/supabase');

// GET /posts
exports.getAllPosts = async (req, res) => {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};

// GET /posts/:id
exports.getPostById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Post not found' });
    res.status(200).json(data);
};

// POST /posts
exports.createPost = async (req, res) => {
    const { title, content, author, user_id } = req.body;
    if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
    }
    const { data, error } = await supabase.from('posts').insert([{ title, content, author, user_id }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
};

// PUT /posts/:id
exports.updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, content, author } = req.body;
    const { data, error } = await supabase.from('posts').update({ title, content, author }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Post not found' });
    res.status(200).json(data);
};

// DELETE /posts/:id
exports.deletePost = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('posts').delete().eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Post not found' });
    res.status(204).send(); // No Content
};

// GET /posts/search
exports.searchPosts = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const { data, error } = await supabase.from('posts').select().or(`title.ilike.%${q}%,content.ilike.%${q}%`);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
};