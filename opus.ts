import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Aynı görevi (index.ts) Claude Opus 5 ile yapıp süresini ölçer.
// Kimlik bilgisi: ANTHROPIC_API_KEY veya `ant auth login` profili.
process.loadEnvFile(); // .env içindeki ANTHROPIC_API_KEY'i yükler
const client = new Anthropic();

const ticket = "Kartımdan iki kez ödeme çekildi! Bugün çözülmezse hesabımı kapatacağım.";

const Answer = z.object({
  team: z.enum(["billing", "technical", "other"]),
  urgent: z.boolean(),
  anger: z.number().int().min(0).max(2),
});

const prompt = `Destek talebi:
${ticket}

- team: Bu talebi hangi ekip ele almalı? billing = Ödeme ve faturalar, technical = Yazılım hataları, other = Hiçbiri
- urgent: Gönderen bugün yardım istiyor mu?
- anger: Gönderen ne kadar sinirli? 0 = Sakin istek, 1 = Sinirli ama kibar, 2 = Açık öfke veya tehdit`;

async function run(effort: "low" | "high") {
  const start = performance.now();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: { effort, format: zodOutputFormat(Answer) },
    messages: [{ role: "user", content: prompt }],
  });
  const ms = performance.now() - start;
  if (response.stop_reason === "refusal") throw new Error("Model isteği reddetti");
  return { ms, answer: response.parsed_output, usage: response.usage };
}

for (const effort of ["low", "high"] as const) {
  for (let i = 1; i <= 3; i++) {
    const { ms, answer, usage } = await run(effort);
    console.log(
      `effort=${effort} #${i}: ${ms.toFixed(0)} ms`,
      JSON.stringify(answer),
      `in=${usage.input_tokens} out=${usage.output_tokens}`,
    );
  }
}
