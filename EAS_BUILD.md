# EAS Build - APK e AAB do Patuvê

## 1) Instalar EAS CLI

```bash
npm install -g eas-cli
```

## 2) Login no Expo

```bash
eas login
```

Se ainda nao tiver conta, crie em: https://expo.dev

## 3) Configurar projeto para EAS Build

```bash
eas build:configure
```

## 4) Gerar APK para testes no celular (profile `preview`)

```bash
eas build --platform android --profile preview
```

Esse comando gera um APK para instalacao direta e testes no dispositivo.

## 5) Instalar o APK no celular via cabo USB

1. Ative **Opcoes do desenvolvedor** no Android.
2. Ative **Depuracao USB**.
3. Conecte o celular ao computador via cabo USB.
4. No celular, autorize a depuracao quando aparecer o prompt.
5. Baixe o APK gerado pelo link do build no Expo.
6. Instale com ADB:

```bash
adb install -r caminho/do/patuve.apk
```

Se nao tiver ADB instalado, instale o Android Platform Tools e adicione ao `PATH`.

## 6) Gerar AAB para Play Store (profile `production`)

```bash
eas build --platform android --profile production
```

Esse comando gera o AAB para envio na Play Store. Rode apenas apos validar o APK em testes.
