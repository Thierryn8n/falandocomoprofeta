// Registrar Service Worker apenas em produção (não em localhost/dev)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.')) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar por atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                if (confirm('Nova versão disponível! Deseja atualizar?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(function(error) {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });
}