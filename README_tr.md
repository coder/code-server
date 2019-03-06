# code-server

[!["Open Issues"](https://img.shields.io/github/issues-raw/codercom/code-server.svg)](https://github.com/codercom/code-server/issues)
[!["Latest Release"](https://img.shields.io/github/release/codercom/code-server.svg)](https://github.com/codercom/code-server/releases/latest)
[![MIT license](https://img.shields.io/badge/license-MIT-green.svg)](#)
[![Discord](https://discordapp.com/api/guilds/463752820026376202/widget.png)](https://discord.gg/zxSwN8Z)

`code-server`, uzak sunucuda çalışan ve bir tarayıcı aracılığıyla erişilebilen [VS Code](https://github.com/Microsoft/vscode) uygulamasıdır.

- Chromebook, tablet ve laptopunuzda kalıcı bir geliştirici ortamıyla çalışın.
	- Windows yada Mac sahibiyseniz, Linux için daha kolay geliştirmeler yapabilirsiniz.
- Testler, derleme, indirme ve diğer bir çok işte gelişmiş sunucuların hız avantajından faydalanın.
- Hareket halindeyken pilinizi daha tasarruflu kullanın.
	- Tüm o yoğun hesaplamalar sunucunuzda koşturulsun.
	- Çok sayıda Chrome açıp kullanmanıza artık gerek yok.

![Ekran Görüntüsü](/doc/assets/ide.png)

## Başlangıç

`code-server`'i coder.com'da [ücretsiz deneyin](https://coder.com/signup).

**YADA**

1.  [Çalıştırılabilir halini indirin](https://github.com/codercom/code-server/releases) (Linux ve OSX desteklenmektedir. Windows için ise çok yakında...)
2.  Çalışma dizinini ilk parametre olarak vererek çalıştırın.

    ```
    code-server <açılış dizini>
    ```
	> Komut satırında görüntülenen parolayı girmeniz istenecektir.
	`code-server` https://localhost:8443 adresinde çalışıyor olacaktır.

	> code-server, tarayıcınız tarafından görüntülenmeden önce size uyarıda bulunmasına neden olabilecek kendinden imzalı SSL sertifikası kullanır. Daha fazla detay için lütfen [burayı okuyun](doc/self-hosted/index.md).

Daha detaylı açıklamalar ve sorunlar için [self-hosted hızlı başlangıç rehberine](doc/self-hosted/index.md) bakın.

[Google Cloud](doc/admin/install/google_cloud.md), [AWS](doc/admin/install/aws.md), ve [Digital Ocean](doc/admin/install/digitalocean.md) için hızlı başlangıç rehberleri mevcuttur.

Kurulumunuzu [güvenli hale getirin](/doc/security/ssl.md).

## Geliştirme

### Bilinen Sorunlar

- Hata ayıklama eklentileri çalışmıyor.

### Gelecekte

- Windows desteği.
- local<->remote arasında köprü olarak Electron ve ChromeOS uygulamaları.
- Özelliklerin beklendiği gibi çalıştığından emin olmak için bizim buildlerimizde VS Code unit testlerini çalıştır.

## Katkıda Bulunma Rehberi

Geliştiriciler için katkıda bulunma rehberleri yakında eklenecek.

## Lisans

[MIT](LICENSE)

## Kurumsal

Kurumsal teklifler hakkında daha fazla bilgi için [kurumsal sayfamızı](https://coder.com/enterprise) ziyaret edin.

## Ticarileştirme

code-server'ı ticarileştirmek istiyorsanız, contact@coder.com ile iletişim kurunuz (İngilizce).
