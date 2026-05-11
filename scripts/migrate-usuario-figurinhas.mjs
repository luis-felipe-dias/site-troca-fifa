// scripts/migrate-usuario-figurinhas.mjs
// Executar: npm run migrate:figurinhas

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI não definido");
  process.exit(1);
}

// Modelo temporário para migração
const UsuarioFigurinhaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    codigo: { type: String, required: true },
    possui: { type: Boolean, default: false },
    repetida: { type: Boolean, default: false },
    quantidadeRepetida: { type: Number, default: 0 },
    quantidade: { type: Number, default: 1 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const UsuarioFigurinha = mongoose.models.UsuarioFigurinha || 
  mongoose.model("UsuarioFigurinha", UsuarioFigurinhaSchema, "usuarioFigurinhas");

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "troca_figuras" });
    console.log("✅ Conectado ao MongoDB");

    // ============================================
    // PASSO 1: Remover registros fantasmas (possui = false)
    // ============================================
    const fantasmas = await UsuarioFigurinha.deleteMany({ possui: false });
    console.log(`🗑️ Removidos ${fantasmas.deletedCount} registros fantasmas (possui: false)`);

    // ============================================
    // PASSO 2: Converter quantidadeRepetida para quantidade
    // ============================================
    const comQuantidadeRepetida = await UsuarioFigurinha.find({
      quantidadeRepetida: { $exists: true, $gt: 0 }
    });

    let convertidos = 0;
    for (const doc of comQuantidadeRepetida) {
      const quantidade = doc.quantidadeRepetida;
      const repetida = quantidade >= 2;
      
      await UsuarioFigurinha.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            quantidade: quantidade,
            repetida: repetida
          },
          $unset: { quantidadeRepetida: "" }
        }
      );
      convertidos++;
    }
    console.log(`🔄 Convertidos ${convertidos} registros (quantidadeRepetida → quantidade)`);

    // ============================================
    // PASSO 3: Garantir que repetida esteja correta
    // ============================================
    const comRepetidaIncorreta = await UsuarioFigurinha.find({
      $or: [
        { quantidade: { $exists: false } },
        { quantidade: 1, repetida: true },
        { quantidade: { $gte: 2 }, repetida: false }
      ]
    });

    let corrigidos = 0;
    for (const doc of comRepetidaIncorreta) {
      const quantidade = doc.quantidade || 1;
      const repetidaCorreta = quantidade >= 2;
      
      await UsuarioFigurinha.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            quantidade: quantidade,
            repetida: repetidaCorreta,
            possui: true
          }
        }
      );
      corrigidos++;
    }
    console.log(`🔧 Corrigidos ${corrigidos} registros com repetida/quantidade incorretos`);

    // ============================================
    // PASSO 4: Remover duplicatas (userId + codigo)
    // ============================================
    const duplicatas = await UsuarioFigurinha.aggregate([
      {
        $group: {
          _id: { userId: "$userId", codigo: "$codigo" },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    let removidas = 0;
    for (const dup of duplicatas) {
      // Manter o primeiro registro (mais recente ou com maior quantidade)
      const registros = await UsuarioFigurinha.find({ 
        _id: { $in: dup.ids } 
      }).sort({ quantidade: -1, updatedAt: -1 });
      
      const manter = registros[0];
      const remover = registros.slice(1);
      
      for (const r of remover) {
        await UsuarioFigurinha.deleteOne({ _id: r._id });
        removidas++;
      }
      
      // Garantir que o mantido tem os campos corretos
      await UsuarioFigurinha.updateOne(
        { _id: manter._id },
        { 
          $set: { 
            possui: true,
            repetida: manter.quantidade >= 2
          },
          $unset: { quantidadeRepetida: "" }
        }
      );
    }
    console.log(`🧹 Removidas ${removidas} duplicatas (userId + codigo)`);

    // ============================================
    // PASSO 5: Criar índice único (se não existir)
    // ============================================
    await UsuarioFigurinha.collection.createIndex(
      { userId: 1, codigo: 1 }, 
      { unique: true, background: true }
    );
    console.log("📇 Índice único criado (userId + codigo)");

    // ============================================
    // RELATÓRIO FINAL
    // ============================================
    const total = await UsuarioFigurinha.countDocuments();
    const comQuantidade = await UsuarioFigurinha.countDocuments({ quantidade: { $exists: true } });
    const repetidas = await UsuarioFigurinha.countDocuments({ repetida: true });
    const possess = await UsuarioFigurinha.countDocuments({ possui: true });

    console.log("\n📊 RELATÓRIO FINAL:");
    console.log(`   Total de registros: ${total}`);
    console.log(`   Com quantidade: ${comQuantidade}`);
    console.log(`   Figurinhas repetidas: ${repetidas}`);
    console.log(`   Figurinhas possuídas: ${possess}`);
    console.log("\n✅ Migração concluída com sucesso!");

  } catch (error) {
    console.error("❌ Erro na migração:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado do MongoDB");
  }
}

migrate();