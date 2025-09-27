// Script para testar a API de subscription-plans
// Execute com: node test-api.js

const testAPI = async () => {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('🔍 Testando GET /api/subscription-plans...');
    
    // Teste GET - buscar planos
    const getResponse = await fetch(`${baseURL}/api/subscription-plans`);
    const getResult = await getResponse.json();
    
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response:', JSON.stringify(getResult, null, 2));
    
    if (getResult.plans && getResult.plans.length > 0) {
      const firstPlan = getResult.plans[0];
      console.log(`\n🔄 Testando PUT para o plano: ${firstPlan.plan_type}`);
      
      // Teste PUT - atualizar preço
      const newPrice = (parseFloat(firstPlan.price) + 1).toFixed(2);
      
      const putResponse = await fetch(`${baseURL}/api/subscription-plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: firstPlan.plan_type,
          price: newPrice
        })
      });
      
      const putResult = await putResponse.json();
      
      console.log('PUT Response Status:', putResponse.status);
      console.log('PUT Response:', JSON.stringify(putResult, null, 2));
      
      // Verificar se a atualização funcionou
      console.log('\n✅ Verificando se a atualização funcionou...');
      const verifyResponse = await fetch(`${baseURL}/api/subscription-plans`);
      const verifyResult = await verifyResponse.json();
      
      const updatedPlan = verifyResult.plans.find(p => p.plan_type === firstPlan.plan_type);
      console.log('Plano após atualização:', updatedPlan);
      
      if (updatedPlan && parseFloat(updatedPlan.price) === parseFloat(newPrice)) {
        console.log('✅ Atualização bem-sucedida!');
      } else {
        console.log('❌ Atualização falhou - preço não foi alterado');
      }
    } else {
      console.log('❌ Nenhum plano encontrado. Execute o script populate-subscription-plans.sql primeiro.');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
};

testAPI();