import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-request";
import { Usuario } from "@/models/Usuario";
import { UsuarioFigurinha } from "@/models/UsuarioFigurinha";
import { Figurinha } from "@/models/Figurinha";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectMongo();
    
    // Pegar parâmetros da URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;
    
    // Buscar total de figurinhas do álbum
    const totalAlbum = await Figurinha.countDocuments();
    
    // Construir filtro de busca
    const filter: any = {};
    if (search) {
      filter.$or = [
        { nomeCompleto: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { yupId: { $regex: search, $options: "i" } }
      ];
    }
    
    // Buscar total de usuários (para paginação)
    const totalUsuarios = await Usuario.countDocuments(filter);
    
    // Buscar usuários com paginação
    const usuarios = await Usuario.find(filter)
      .select("yupId nomeCompleto email dataNascimento cidade role createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Para cada usuário, buscar quantidade de figurinhas
    const usuariosComStats = await Promise.all(
      usuarios.map(async (user) => {
        const userId = user._id;
        const possui = await UsuarioFigurinha.countDocuments({ userId: userId, possui: true });
        
        const hoje = new Date();
        const nascimento = new Date(user.dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
          idade--;
        }
        
        return {
          _id: user._id,
          yupId: user.yupId,
          nomeCompleto: user.nomeCompleto,
          email: user.email,
          dataNascimento: user.dataNascimento.toISOString().split("T")[0],
          cidade: user.cidade,
          role: user.role,
          createdAt: user.createdAt,
          totalAlbum: totalAlbum,
          possui: possui || 0,
          idade: idade || 0
        };
      })
    );
    
    return NextResponse.json({
      usuarios: usuariosComStats,
      pagination: {
        page,
        limit,
        total: totalUsuarios,
        totalPages: Math.ceil(totalUsuarios / limit)
      }
    });
  } catch (err: any) {
    console.error("Erro ao buscar usuários:", err);
    if (String(err?.message || "") === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    if (String(err?.message || "") === "FORBIDDEN") {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erro ao buscar usuarios" }, { status: 500 });
  }
}