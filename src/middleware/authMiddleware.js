const supabase = require('../services/supabase');

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

        const token = authHeader.split(' ')[1]; // "Bearer <token>"

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) return res.status(401).json({ error: 'Token inválido ou faltando' });

        
        req.user = data.user;

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) return res.status(500).json({ error: profileError.message });

        req.profile = profile;

        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal auth error' });
    }
}

module.exports = authMiddleware;
