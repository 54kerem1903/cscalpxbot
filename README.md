# Scalp Analiz Botu — 7/24 Telegram Botu

Bir sunucuda sürekli çalışır. Herhangi biri bota **BTC**, **ETH**, **SOL** gibi bir coin yazınca
tüm zaman dilimlerinde (5dk–1gün) analiz gönderir. Harici paket gerektirmez, Node 18+ yeterli.

---

## 1) Önce bilgisayarında dene (opsiyonel)

Node 18+ kurulu olmalı (https://nodejs.org).

```bash
# Windows PowerShell:
$env:BOT_TOKEN="BURAYA_TOKEN"; node bot.js

# Mac/Linux:
BOT_TOKEN="BURAYA_TOKEN" node bot.js
```

Terminalde "✅ Bot çalışıyor" görürsen Telegram'da bota BTC yaz, cevap gelmeli.
(Bu şekilde sadece bilgisayarın açıkken çalışır — 7/24 için aşağıdaki hosting'e geç.)

---

## 2) 7/24 çalıştırma seçenekleri

### A) Railway (en kolay — önerilen başlangıç)
1. Kodu bir **GitHub** deposuna (repo) yükle (bot.js + package.json).
2. https://railway.app → GitHub ile giriş → **New Project → Deploy from GitHub repo** → repo'nu seç.
3. **Variables** sekmesine `BOT_TOKEN` = senin token'ın ekle.
4. Railway otomatik `npm start` ile çalıştırır. Logs'ta "Bot çalışıyor" görünür.
- Not: Ücretsiz kredi aylık ~$5; küçük bot için genelde yeterli, bitince aylık birkaç dolar.

### B) Fly.io (ücretsiz katman geniş)
1. `flyctl` kur → `fly launch` (Dockerfile'sız Node algılar) → `fly secrets set BOT_TOKEN=xxxx` → `fly deploy`.
2. 3 küçük VM'e kadar ücretsiz. CLI biraz teknik ama üretim için sağlam.

### C) Oracle Cloud "Always Free" VPS (kalıcı ücretsiz — biraz teknik)
1. Oracle Cloud'da ücretsiz bir VM (Ubuntu) aç.
2. SSH ile bağlan, Node kur:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. Dosyaları kopyala, sonra süreç yöneticisiyle 7/24 çalıştır:
   ```bash
   sudo npm i -g pm2
   BOT_TOKEN=xxxx pm2 start bot.js --name scalpbot
   pm2 save && pm2 startup   # yeniden başlatmada otomatik açılır
   ```

### D) Render (kolay ama ücretsiz katman uykuya dalabilir)
- GitHub'dan bağla, **Background Worker** olarak deploy et, `BOT_TOKEN` ekle.
- Ücretsiz katman atıl kalınca uyur; sürekli uptime için ücretli ($7/ay) daha güvenli.

> Özet: **Deneme/öğrenme** → Railway veya Fly.io ücretsiz.
> **Gerçek 7/24 kararlılık** → küçük bir VPS (Oracle ücretsiz, ya da $4–6/ay DigitalOcean/Hetzner) + pm2.

---

## 3) Ayarlar (ortam değişkenleri)

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `BOT_TOKEN` | Evet | @BotFather'dan aldığın bot token'ı |
| `ALLOWED_CHATS` | Hayır | Virgülle chat id listesi. Verilirse **sadece** onlar kullanır. Boşsa **herkes** kullanabilir. |

Herkese açık istiyorsan `ALLOWED_CHATS` verme. Sadece kendine/arkadaşlarına açmak istersen
kendi chat id'ni (ve isteyenlerinkini) ekle: `ALLOWED_CHATS=123456789,987654321`

---

## Notlar
- Bot **long-polling** kullanır: domain/webhook/SSL gerekmez, sadece çalışan bir Node süreci yeter.
- Aynı token'la **aynı anda tek** getUpdates süreci çalışmalı (iki yerde çalıştırma → çakışır).
- Bybit ve Telegram'a giden istekler dışarı çıkış gerektirir; hosting'de dış ağ açık olmalı (çoğunda varsayılan açık).
- Bu bot **analiz** verir. Panelin otomatik işlem/sinyal/öğrenme motoru ayrı bir iştir (tarayıcı panelinde kalır);
  istenirse sonraki adımda o da sunucuya taşınıp abonelere sinyal yayınlayacak şekilde genişletilebilir.
