-- Insert admin user (you'll need to replace with actual admin user ID after signup)
-- This is just a placeholder - the actual admin user will be created through Supabase Auth

-- Insert app configuration
INSERT INTO public.app_config (key, value, description) VALUES
('app_identity', '{
    "appName": "Falando com o Profeta",
    "appDescription": "Converse com o Profeta William Branham através de IA baseada em suas mensagens",
    "logo": "/placeholder.svg?height=64&width=64&text=Logo",
    "favicon": "/placeholder.svg?height=16&width=16&text=F",
    "tagline": "Mensagens espirituais baseadas nos ensinamentos do Profeta",
    "metaKeywords": "profeta, william branham, mensagem, espiritual, bíblia"
}', 'Configurações de identidade do aplicativo'),

('prophet_profile', '{
    "prophetName": "Profeta William Branham",
    "prophetAvatar": "/placeholder.svg?height=80&width=80&text=WB",
    "birthDate": "1909-04-06",
    "deathDate": "1965-12-24",
    "birthPlace": "Burkesville, Kentucky, EUA",
    "ministry": "Evangelista e Pregador Pentecostal",
    "biography": "William Marrion Branham foi um evangelista e pregador pentecostal americano, conhecido por suas campanhas de cura divina e mensagens proféticas.",
    "keyTeachings": "Os Sete Selos, As Sete Eras da Igreja, A Serpente Semente, Batismo em Nome de Jesus, A Divindade",
    "famousQuotes": "Assim diz o Senhor, A Palavra do Senhor, Irmão/Irmã"
}', 'Perfil e informações do Profeta William Branham'),

('ai_settings', '{
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.9,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0,
    "enableMemory": true,
    "enableContextWindow": true,
    "contextWindowSize": 4000,
    "responseStyle": "biblical",
    "enableSafetyFilter": true,
    "maxConversationLength": 50
}', 'Configurações da IA'),

('system_prompt', '{
    "prompt": "Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal. INSTRUÇÕES IMPORTANTES: - Responda SEMPRE como se fosse o próprio Profeta William Branham - Use linguagem espiritual, bíblica e profética - Base suas respostas exclusivamente nas doutrinas e ensinamentos do Profeta Branham - Cite versículos bíblicos quando apropriado - Use expressões características como Assim diz o Senhor, Irmão/Irmã, A Palavra do Senhor - Mantenha tom respeitoso, amoroso e pastoral - Não invente doutrinas ou ensinamentos que não sejam do Profeta Branham - Se não souber algo específico, diga Irmão/Irmã, busque isso na Palavra de Deus TEMAS PRINCIPAIS que você deve abordar: - A Mensagem do Tempo do Fim - Os Sete Selos - As Sete Eras da Igreja - Batismo em Nome de Jesus - A Serpente Semente - A Divindade (não Trindade) - Cura Divina - Dons Espirituais - Segunda Vinda de Cristo Sempre termine suas respostas com uma bênção ou palavra de encorajamento espiritual."
}', 'Prompt do sistema para a IA');

-- Insert sample documents (Prophet's teachings)
INSERT INTO public.documents (title, type, content, status) VALUES
('A Serpente Semente - Mensagem 61-0318', 'text', 
'Irmãos, hoje quero falar sobre a serpente semente, um dos mistérios mais profundos da Palavra de Deus. Como está escrito em Gênesis 3:15, Deus disse: "E porei inimizade entre ti e a mulher, e entre a tua semente e a sua semente; esta te ferirá a cabeça, e tu lhe ferirás o calcanhar." A serpente tinha uma semente, irmãos. E essa semente não era uma maçã, como muitos pensam. A serpente era o mais astuto de todos os animais do campo, e ele seduziu Eva. Assim diz o Senhor, a serpente semente são aqueles que seguem o caminho de Caim, rejeitando a revelação de Deus. Que Deus os abençoe abundantemente.', 
'processed'),

('Os Sete Selos - Introdução', 'text',
'Irmãos e irmãs, chegou o tempo do fim, e os Sete Selos do Apocalipse estão sendo abertos. Como está escrito em Apocalipse 5:1: "E vi na destra do que estava assentado sobre o trono um livro escrito por dentro e por fora, selado com sete selos." Estes selos contêm os mistérios de Deus desde a fundação do mundo. O primeiro selo é o cavalo branco, que representa o anticristo religioso que começou na era apostólica. Assim diz o Senhor, cada selo revela uma parte do plano de Deus para a humanidade. Que a paz do Senhor esteja com vocês.',
'processed'),

('Cura Divina - O Poder de Deus', 'text',
'Amados irmãos, a cura divina não é algo do passado. Jesus Cristo é o mesmo ontem, hoje e eternamente, como está escrito em Hebreus 13:8. Quando oro pelos enfermos, não sou eu que curo, mas é o Senhor Jesus através do Seu Espírito. A fé é a chave, irmãos. Como disse Jesus em Marcos 11:24: "Por isso vos digo que todas as coisas que pedirdes, orando, crede receber, e tê-las-eis." Tenha fé em Deus, irmão, e verá a glória do Senhor se manifestar em sua vida. Que Deus os abençoe com saúde e prosperidade espiritual.',
'processed'),

('As Sete Eras da Igreja', 'text',
'Irmãos, o Senhor me revelou as sete eras da igreja, conforme descrito em Apocalipse capítulos 2 e 3. Começamos com Éfeso, a era apostólica, e agora estamos na era de Laodiceia, a última era antes da vinda do Senhor. Cada era teve seu mensageiro: Paulo para Éfeso, Irineu para Esmirna, Martinho para Pérgamo, Columba para Tiatira, Lutero para Sardes, Wesley para Filadélfia, e agora, na era de Laodiceia, Deus enviou uma mensagem de restauração. Assim diz o Senhor, prepare-se, pois o Senhor vem em breve. Que a graça de Deus esteja com todos vocês.',
'processed'),

('Batismo em Nome de Jesus', 'text',
'Irmãos, a Palavra de Deus é clara sobre o batismo. Em Atos 2:38, Pedro disse: "Arrependei-vos, e cada um de vós seja batizado em nome de Jesus Cristo, para perdão dos pecados." Não existe batismo em títulos como "Pai, Filho e Espírito Santo" - estes são títulos, não nomes. O nome é Jesus! Em Atos 4:12 está escrito: "E em nenhum outro há salvação, porque também debaixo do céu nenhum outro nome há, dado entre os homens, pelo qual devamos ser salvos." Assim diz o Senhor, seja batizado no Nome de Jesus Cristo. Que Deus os abençoe com o entendimento da Sua Palavra.',
'processed');

-- Insert sample analytics events
INSERT INTO public.analytics (event_type, metadata) VALUES
('app_start', '{"timestamp": "2024-01-20T10:00:00Z", "version": "1.0.0"}'),
('user_signup', '{"method": "email", "timestamp": "2024-01-20T10:30:00Z"}'),
('conversation_start', '{"timestamp": "2024-01-20T11:00:00Z"}'),
('message_sent', '{"type": "user", "length": 45, "timestamp": "2024-01-20T11:01:00Z"}'),
('message_received', '{"type": "assistant", "length": 234, "timestamp": "2024-01-20T11:01:30Z"}');

-- Insert system logs
INSERT INTO public.system_logs (level, message, metadata) VALUES
('info', 'Sistema iniciado com sucesso', '{"component": "app", "version": "1.0.0"}'),
('info', 'Banco de dados conectado', '{"database": "supabase", "status": "connected"}'),
('info', 'IA configurada', '{"provider": "openai", "model": "gpt-4o"}'),
('warning', 'Limite de tokens próximo', '{"usage": 8500, "limit": 10000}'),
('info', 'Backup realizado', '{"type": "automatic", "size": "2.3MB"}');
