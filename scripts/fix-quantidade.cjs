// scripts/fix-quantidade.cjs
// Executar: node scripts/fix-quantidade.cjs

const { MongoClient } = require('mongodb');

// URI correta do seu .env
const uri = "mongodb://dias_now_db:Dias231203Lf@ac-bburgxk-shard-00-00.yiji7h2.mongodb.net:27017,ac-bburgxk-shard-00-01.yiji7h2.mongodb.net:27017,ac-bburgxk-shard-00-02.yiji7h2.mongodb.net:27017/troca_figuras?ssl=true&replicaSet=atlas-kdjrow-shard-0&authSource=admin&retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  try {
    console.log("🔄 Conectando ao MongoDB...");
    await client.connect();
    console.log("✅ Conectado!");
    
    const database = client.db("troca_figuras");
    const collection = database.collection("usuarioFigurinhas");
    
    // Verificar quantas têm problema
    const comProblema = await collection.find({ repetida: true, quantidade: 0 }).toArray();
    console.log(`🔍 Figurinhas com quantidade 0: ${comProblema.length}`);
    
    if (comProblema.length > 0) {
      console.log("📋 Lista das que precisam correção:");
      comProblema.forEach(f => {
        console.log(`   - ${f.codigo} (usuário: ${f.userId})`);
      });
    }
    
    // Corrigir
    const result = await collection.updateMany(
      { repetida: true, quantidade: 0 },
      { $set: { quantidade: 1 } }
    );
    
    console.log(`\n✅ Corrigidas: ${result.modifiedCount} figurinhas`);
    
    // Verificar restantes
    const restantes = await collection.countDocuments({ repetida: true, quantidade: 0 });
    console.log(`📊 Ainda com problema: ${restantes}`);
    
    // Resumo das quantidades
    const stats = await collection.aggregate([
      { $match: { repetida: true } },
      { $group: { _id: "$quantidade", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log("\n=== RESUMO DAS QUANTIDADES ===");
    stats.forEach(s => {
      console.log(`Quantidade ${s._id}: ${s.count} figurinhas`);
    });
    
    await client.close();
    console.log("\n🔌 Desconectado");
    
  } catch (err) {
    console.error("❌ Erro:", err);
  }
}

run();