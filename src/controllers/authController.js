const { AuthWeakPasswordError } = require('@supabase/supabase-js');
const supabase = require('../services/supabase');

exports.signUp = async (req, res) => {
    const { name, email, password, isProfessor } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são exigidos' })
    };

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (signUpError) {
        console.log(signUpError);
        return res.status(400).json({ error: signUpError.message });
    }

    const user = signUpData.user;
    if (!user) {
        return res.status(500).json({ error: "Falha na criação do usuário" })
    };

    const { error: profileError } = await supabase.from('profiles').insert([
        { id: user.id, name: name, is_teacher: !!isProfessor }
    ]);

    if (profileError) {
        return res.status(500).json({ error: 'Criação do usuário em "profile" falhou', details: profileError.message });
    }

    res.status(201).json({ user, message: 'Usuário criado com sucesso!' });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" })
    };

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) return res.status(401).json({ error: error.message });

    res.status(200).json(data);
};

exports.getMe = async (req, res) => {
    try {
        const user = req.user;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, name, is_teacher")
            .eq("id", user.id)
            .single();

        if (error) {
            return res.status(400).json({ error: "Erro ao buscar perfil" });
        }

        res.status(200).json(profile);
    } catch (err) {
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};