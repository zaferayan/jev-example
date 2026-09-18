import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

process.loadEnvFile(); // .env içindeki API_KEY'i yükler

const client = new TypeSafeClient({ apiKey: process.env.API_KEY });

// Değerlendirilecek veri: bir müşteri destek mesajı
const ticket = "Kartımdan iki kez ödeme çekildi! Bugün çözülmezse hesabımı kapatacağım.";

const start = performance.now();
const { answers, usage } = await client.systemOne({
  state: { ticket },
  questions: {
    // choice → seçeneklerden biri
    team: choice("Bu talebi hangi ekip ele almalı?", {
      billing: "Ödeme ve faturalar",
      technical: "Yazılım hataları",
      other: "Hiçbiri",
    }),
    // noul → evet/hayır olasılığı (0–1)
    urgent: noul("Gönderen bugün yardım istiyor mu?"),
    // score → sıralı ölçekte konum
    anger: score("Gönderen ne kadar sinirli?", [
      "Sakin istek",
      "Sinirli ama kibar",
      "Açık öfke veya tehdit",
    ]),
  },
});
const ms = performance.now() - start;

// Tipler sorulardan çıkarılır:
// answers.team.choice  → "billing" | "technical" | "other"
// answers.urgent.noul  → number
// answers.anger.score  → number
console.log("Ekip:  ", answers.team.choice, answers.team.probabilities);
console.log("Acil:  ", answers.urgent.noul.toFixed(2));
console.log("Öfke:  ", answers.anger.score.toFixed(2), "/ 2");
console.log("Token: ", usage.input_tokens);
console.log("Süre:  ", ms.toFixed(0), "ms");

// Tip güvenliği sayesinde kod doğrudan cevaba göre dallanabilir
if (answers.team.choice === "billing" && answers.urgent.noul > 0.7) {
  console.log("→ Ödeme ekibine ÖNCELİKLİ olarak yönlendir");
}

// answers.team.choice === "sales"  // ❌ derleme hatası: böyle bir seçenek yok
