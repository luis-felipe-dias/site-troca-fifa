import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI não definido");
  process.exit(1);
}

const FigurinhaSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, index: true },
    pagina: { type: Number, required: true, index: true },
    nomeSelecao: { type: String, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Figurinha = mongoose.models.Figurinha || mongoose.model("Figurinha", FigurinhaSchema, "figurinhas");

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const SEED = [
  { prefix: "FWC", paginas: [0, 3], count: 8, nome: "FWC" },
  { prefix: "MEX", paginas: [8, 9], count: 20, nome: "Mexico" },
  { prefix: "RSA", paginas: [10, 11], count: 20, nome: "South Africa" },
  { prefix: "KOR", paginas: [12, 13], count: 20, nome: "Korea Republic" },
  { prefix: "CZE", paginas: [14, 15], count: 20, nome: "Czechia" },
  { prefix: "CAN", paginas: [16, 17], count: 20, nome: "Canada" },
  { prefix: "BIH", paginas: [18, 19], count: 20, nome: "Bosnia-Herzegovina" },
  { prefix: "QAT", paginas: [20, 21], count: 20, nome: "Qatar" },
  { prefix: "SUI", paginas: [22, 23], count: 20, nome: "Switzerland" },
  { prefix: "BRA", paginas: [24, 25], count: 20, nome: "Brazil" },
  { prefix: "MAR", paginas: [26, 27], count: 20, nome: "Morocco" },
  { prefix: "HAI", paginas: [28, 29], count: 20, nome: "Haiti" },
  { prefix: "SCO", paginas: [30, 31], count: 20, nome: "Scotland" },
  { prefix: "USA", paginas: [32, 33], count: 20, nome: "USA" },
  { prefix: "PAR", paginas: [34, 35], count: 20, nome: "Paraguay" },
  { prefix: "AUS", paginas: [36, 37], count: 20, nome: "Australia" },
  { prefix: "TUR", paginas: [38, 39], count: 20, nome: "Türkiye" },
  { prefix: "GER", paginas: [40, 41], count: 20, nome: "Germany" },
  { prefix: "CUW", paginas: [42, 43], count: 20, nome: "Curaçao" },
  { prefix: "CIV", paginas: [44, 45], count: 20, nome: "Côte d'Ivoire" },
  { prefix: "ECU", paginas: [46, 47], count: 20, nome: "Ecuador" },
  { prefix: "NED", paginas: [48, 49], count: 20, nome: "Netherlands" },
  { prefix: "JPN", paginas: [50, 51], count: 20, nome: "Japan" },
  { prefix: "SWE", paginas: [52, 53], count: 20, nome: "Sweden" },
  { prefix: "BEL", paginas: [58, 59], count: 20, nome: "Belgium" },
  { prefix: "EGY", paginas: [60, 61], count: 20, nome: "Egypt" },
  { prefix: "IRN", paginas: [62, 63], count: 20, nome: "IR Iran" },
  { prefix: "NZL", paginas: [64, 65], count: 20, nome: "New Zealand" },
  { prefix: "ESP", paginas: [66, 67], count: 20, nome: "Spain" },
  { prefix: "CPV", paginas: [68, 69], count: 20, nome: "Cabo Verde" },
  { prefix: "KSA", paginas: [70, 71], count: 20, nome: "Saudi Arabia" },
  { prefix: "URU", paginas: [72, 73], count: 20, nome: "Uruguay" },
  { prefix: "FRA", paginas: [74, 75], count: 20, nome: "France" },
  { prefix: "SEN", paginas: [76, 77], count: 20, nome: "Senegal" },
  { prefix: "IRQ", paginas: [78, 79], count: 20, nome: "Iraq" },
  { prefix: "NOR", paginas: [80, 81], count: 20, nome: "Norway" },
  { prefix: "ARG", paginas: [82, 83], count: 20, nome: "Argentina" },
  { prefix: "ALG", paginas: [84, 85], count: 20, nome: "Algeria" },
  { prefix: "AUT", paginas: [86, 87], count: 20, nome: "Austria" },
  { prefix: "JOR", paginas: [88, 89], count: 20, nome: "Jordan" },
  { prefix: "POR", paginas: [90, 91], count: 20, nome: "Portugal" },
  { prefix: "COD", paginas: [92, 93], count: 20, nome: "Congo DR" },
  { prefix: "UZB", paginas: [94, 95], count: 20, nome: "Uzbekistan" },
  { prefix: "COL", paginas: [96, 97], count: 20, nome: "Colombia" },
  { prefix: "ENG", paginas: [98, 99], count: 20, nome: "England" },
  { prefix: "CRO", paginas: [100, 101], count: 20, nome: "Croatia" },
  { prefix: "GHA", paginas: [102, 103], count: 20, nome: "Ghana" },
  { prefix: "PAN", paginas: [104, 105], count: 20, nome: "Panama" }
];

const EXTRA_FWC = [
  { paginas: [106, 107], start: 9, end: 13 },
  { paginas: [108, 109], start: 14, end: 19 }
];

const ops = [];
for (const item of SEED) {
  const [p1, p2] = item.paginas;
  const firstPageCount = Math.ceil(item.count / 2);
  const secondPageCount = item.count - firstPageCount;
  range(1, firstPageCount).forEach((n) => ops.push({ codigo: `${item.prefix}${n}`, pagina: p1, nomeSelecao: item.nome }));
  range(firstPageCount + 1, firstPageCount + secondPageCount).forEach((n) =>
    ops.push({ codigo: `${item.prefix}${n}`, pagina: p2, nomeSelecao: item.nome })
  );
}
for (const e of EXTRA_FWC) {
  const [p1, p2] = e.paginas;
  const nums = range(e.start, e.end);
  const firstPageCount = Math.ceil(nums.length / 2);
  nums.slice(0, firstPageCount).forEach((n) => ops.push({ codigo: `FWC${n}`, pagina: p1, nomeSelecao: "FWC" }));
  nums.slice(firstPageCount).forEach((n) => ops.push({ codigo: `FWC${n}`, pagina: p2, nomeSelecao: "FWC" }));
}
range(1, 14).forEach((n) => ops.push({ codigo: `CC${n}`, pagina: 999, nomeSelecao: "Coca-Cola" }));

await mongoose.connect(MONGODB_URI, { dbName: "troca_figuras" });
const result = await Figurinha.bulkWrite(
  ops.map((doc) => ({
    updateOne: { filter: { codigo: doc.codigo }, update: { $setOnInsert: doc }, upsert: true }
  }))
);

console.log({ inserted: result.upsertedCount, matched: result.matchedCount });
await mongoose.disconnect();

