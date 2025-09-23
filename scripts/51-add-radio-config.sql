-- Inserir configurações da rádio web
INSERT INTO app_config (key, value, description) VALUES 
('radio_settings', '{"enabled": true, "radioUrl": "https://www.radios.com.br/aovivo/radio-web-voz-do-cristianismo-vivo/228506", "radioName": "Rádio Web Voz do Cristianismo Vivo", "autoPlay": false, "volume": 0.7, "showForGuests": true, "showForUsers": true, "position": "bottom-right"}', 'Configurações completas do player de rádio web')
ON CONFLICT (key) DO UPDATE SET
value = EXCLUDED.value,
updated_at = NOW();
