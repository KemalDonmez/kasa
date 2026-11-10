# Kasa – Şifre Yöneticisi · Kurulum Rehberi

Kasa, iPhone'unuzda normal bir uygulama gibi çalışan bir şifre kasasıdır. Ana ekranda kendi simgesi olur, tam ekran açılır ve internet olmadan da çalışır. Şifreleriniz **yalnızca telefonunuzda**, ana şifrenizle **AES-256** şifrelenmiş olarak saklanır ve hiçbir sunucuya gönderilmez.

> **Neden App Store'dan ya da USB ile kurulmuyor?**
> Apple, App Store dışındaki yerel uygulamaların yalnızca Mac'teki Xcode ile imzalanıp kurulmasına izin veriyor. Windows bilgisayardan bu yapılamıyor. Kasa bu yüzden Safari'nin **"Ana Ekrana Ekle"** özelliğiyle kurulan bir web uygulaması olarak hazırlandı. Kurulum için telefonu bilgisayara bağlamanıza gerek yok.

---

## 1. Adım – Uygulamayı ücretsiz bir adrese yükleyin (bir kez, yaklaşık 5 dakika)

iPhone'un uygulamayı kurabilmesi için dosyaların güvenli (https://) bir adreste olması gerekiyor. En kolay ve ücretsiz yol **GitHub Pages**:

1. Bilgisayarınızda **https://github.com** adresine gidin ve ücretsiz bir hesap açın (varsa giriş yapın).
2. Sağ üstteki **+** düğmesine tıklayın, ardından **New repository**'yi seçin.
   - Repository name: `kasa`
   - **Public** seçili kalsın (ücretsiz yayın için gerekli; dosyalarda hiçbir şifreniz yok, sadece uygulamanın kodu var).
   - **Create repository**'ye tıklayın.
3. Açılan sayfada **uploading an existing file** bağlantısına tıklayın.
4. Bu klasördeki **tüm dosyaları ve `icons` klasörünü** sürükleyip pencereye bırakın:
   `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `icons` klasörü (ve bu dosya).
   Ardından aşağıdaki **Commit changes** düğmesine tıklayın.
5. Üstteki **Settings** sekmesine, ardından soldaki **Pages** menüsüne girin.
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` ve `/ (root)` seçip **Save**'e tıklayın.
6. 1–2 dakika bekleyip sayfayı yenileyin. Sayfanın üstünde şu adres görünecek:
   **`https://KULLANICIADINIZ.github.io/kasa/`**

## 2. Adım – iPhone'a kurun

1. iPhone'da **Safari**'yi açın (Chrome değil, Safari olmalı) ve yukarıdaki adrese gidin.
2. Alttaki **Paylaş** düğmesine (yukarı ok bulunan kare simgesi) dokunun.
3. Listeyi aşağı kaydırıp **Ana Ekrana Ekle**'yi seçin, sonra **Ekle**'ye dokunun.
4. Ana ekranda **Kasa** simgesi oluşur. **Uygulamayı bu simgeden açın** ve ana şifrenizi oluşturun.

> ⚠️ Kasanızı Safari sekmesinde değil, ana ekrandaki simgeden açıp oluşturun. iPhone, Safari'yi ve ana ekran uygulamasını ayrı tutar; Safari'de oluşturulan kasa uygulamada görünmez.

## 3. Adım – Düzenli yedek alın (çok önemli)

**Ayarlar › Şifreli yedek al** › **Dosyalar'a Kaydet** › **iCloud Drive** yolunu izleyin.

- Yedek dosyası şifrelidir; yalnızca ana şifrenizle açılır.
- Telefonunuzu değiştirirseniz ya da uygulamayı silerseniz kasayı yeni cihazda **"Yedekten geri yükle"** ile geri alabilirsiniz.
- Ana ekrandaki Kasa simgesini silerseniz iPhone uygulamanın verilerini de siler. Bu yüzden yedek şart.

---

## Özellikler

| | |
|---|---|
| 🔐 **Güçlü şifreleme** | AES-256-GCM, ana şifreden PBKDF2-SHA256 ile 600.000 turda türetilen anahtar |
| 📴 **İnternetsiz çalışır** | Veriler cihazdan çıkmaz; güvenlik politikası dış bağlantıları engeller |
| 🔑 **Kayıtlar** | Başlık, kullanıcı adı, şifre, web sitesi, notlar, kategori, favori |
| 🔢 **2FA kodları** | Google Authenticator gibi 6 haneli doğrulama kodları üretir (TOTP) |
| 🪄 **Şifre üretici** | 8–64 karakter, harf/rakam/sembol seçimi, benzer karakterleri çıkarma |
| 🛡️ **Güvenlik raporu** | Zayıf, tekrar kullanılan ve eski şifreleri bulur, 100 üzerinden puan verir |
| 🕓 **Şifre geçmişi** | Değiştirilen şifrenin son 10 eski hâli saklanır |
| 🔍 **Arama ve filtre** | Anlık arama, kategori filtreleri, A–Z veya son değişene göre sıralama |
| 📋 **Akıllı kopyalama** | Tek dokunuşla kopyalar; pano belirlediğiniz süre sonunda temizlenir |
| ⏱️ **Otomatik kilit** | Hareketsizlikte kilitlenir; isterseniz uygulamadan çıkınca hemen kilitlenir |
| 🚫 **Deneme sınırı** | 5 hatalı denemeden sonra giderek artan bekleme süresi uygulanır |
| 💾 **Yedekleme** | Şifreli yedek alma ve geri yükleme (birleştirme destekli) |
| 📥 **İçe aktarma** | iCloud Anahtar Zinciri, Chrome, Bitwarden vb. CSV dosyaları |
| 🌗 **Tema** | Koyu, açık veya sistem teması |

## Mevcut şifrelerinizi aktarmak (isteğe bağlı)

- **iCloud Anahtar Zinciri:** Şifrelerinizi CSV olarak dışa aktarın (örneğin bir Mac'te *Şifreler* uygulaması › *Dosya* › *Tüm Şifreleri Dışa Aktar*), dosyayı iPhone'a aktarın ve Kasa'da **Ayarlar › CSV içe aktar**'ı seçin.
- **Chrome:** *Ayarlar › Şifre Yöneticisi › Ayarlar › Şifreleri dışa aktar*.
- İçe aktardıktan sonra **CSV dosyasını mutlaka silin**, çünkü şifreleriniz o dosyada açık metin olarak durur.

## Bilmeniz gerekenler

- **Ana şifre kurtarılamaz.** Hiçbir yerde saklanmaz. Unutursanız tek yol kasayı sıfırlayıp yedekten geri yüklemektir (yedeğin şifresini bilmeniz gerekir).
- Web uygulamaları iPhone'un otomatik doldurma (AutoFill) sistemine bağlanamaz. Şifreyi Kasa'dan kopyalayıp ilgili uygulamaya yapıştırırsınız.
- Web uygulamaları iOS'ta Face ID'ye erişemediği için kilit ana şifreyle açılır.
- GitHub'daki sayfayı silmeyin. Uygulama telefonda çevrimdışı çalışır, ancak güncellemeler ve olası yeniden kurulumlar bu adresten yapılır.

## Güncelleme yaparken

Dosyaları değiştirirseniz `sw.js` içindeki `kasa-v1.0.0` sürüm adını artırın (örneğin `kasa-v1.0.1`). Böylece telefon yeni sürümü indirir. Verileriniz etkilenmez.
