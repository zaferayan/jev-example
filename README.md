# jev-example

[TypeSafe AI](https://typesafe.ai)'ın karar modeli **Jev** ile basit, tip güvenli bir örnek. Aynı görevi Claude Opus 5 ile yapan bir karşılaştırma scripti de içerir.

Jev'e bir veri (`state`) ve tipli sorular verirsiniz. Düz yazı yerine olasılık ve skor döner, böylece kodunuz cevaba göre doğrudan dallanabilir.

| Soru tipi | Ne sorar | Ne döner |
|---|---|---|
| `choice` | Hangi seçenek uyuyor? | Seçilen anahtar ve her seçeneğin olasılığı |
| `noul` | Bu ifade doğru mu? | 0 ile 1 arası olasılık |
| `score` | Sıralı ölçekte nerede? | Konum (ondalıklı olabilir) |

## Örnek

[index.ts](index.ts) bir müşteri destek mesajını üç soruyla tek istekte sınıflandırır:

```ts
const { answers } = await client.systemOne({
  state: { ticket: "Kartımdan iki kez ödeme çekildi! Bugün çözülmezse hesabımı kapatacağım." },
  questions: {
    team: choice("Bu talebi hangi ekip ele almalı?", { billing: "...", technical: "...", other: "..." }),
    urgent: noul("Gönderen bugün yardım istiyor mu?"),
    anger: score("Gönderen ne kadar sinirli?", ["Sakin istek", "Sinirli ama kibar", "Açık öfke veya tehdit"]),
  },
});

if (answers.team.choice === "billing" && answers.urgent.noul > 0.7) {
  // Ödeme ekibine öncelikli yönlendir
}
```

Cevap tipleri sorulardan çıkarılır. `answers.team.choice` tipi `"billing" | "technical" | "other"` olur; olmayan bir seçeneği yazarsanız kod derlenmez.

Çıktı:

```
Ekip:   billing { billing: 1, technical: 0, other: 0 }
Acil:   0.95
Öfke:   2.00 / 2
Token:  445
Süre:   664 ms
→ Ödeme ekibine ÖNCELİKLİ olarak yönlendir
```

## Kurulum

Node.js 20.12 veya üstü gerekir.

```sh
npm install
cp .env.example .env   # anahtarları doldurun
```

| Değişken | Nereden alınır | Kullanan |
|---|---|---|
| `API_KEY` | [console.typesafe.ai](https://console.typesafe.ai) | `npm start` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | `npm run opus` |

```sh
npm start      # Jev örneği
npm run opus   # Aynı görev Claude Opus 5 ile (3× effort=low, 3× effort=high)
```

## Jev ve Opus 5 karşılaştırması

Aynı mesaj ve aynı üç soru; Opus tarafında cevap, structured output ile tipli JSON olarak alınır ([opus.ts](opus.ts)). Süreler uçtan uca, tek bir makineden ölçüldü.

| | Jev | Opus 5 |
|---|---|---|
| Tipik süre | ~0.7 sn | ~2.4 sn |
| İlk istek | 1.7 sn | 2.4–4.1 sn |
| Cevap | billing / acil 0.95 / öfke 2 | billing / acil / öfke 2 |

İki model de aynı sonuca vardı. Fark, cevabın şeklinde: Jev her cevap için olasılık döndürür, Opus tek bir değer verir. Opus'ta `effort` ayarı bu görevde süreyi değiştirmedi; iki ayarda da model düşünmeden 22 token'lık cevap üretti.

Bu küçük bir ölçüm, benchmark değil. Ağ gecikmesi dahildir; sonuçlar konuma ve zamana göre değişir.

## Bağlantılar

- [TypeSafe dokümantasyonu](https://docs.typesafe.ai/)
- [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [typesafe-snake](https://github.com/sorrycc/typesafe-snake): Jev ile gerçek zamanlı Snake oynayan örnek
