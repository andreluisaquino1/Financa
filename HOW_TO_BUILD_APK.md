# 📱 Como Gerar o APK (Android)

Este guia explica como transformar seu projeto "Finança em Casal" em um aplicativo Android instalável (.apk).

## Pré-requisitos
1.  **Node.js**: Instalado (você já tem).
2.  **Android Studio**: Precisa estar instalado no seu computador para compilar o código nativo Android.
    *   [Download Android Studio](https://developer.android.com/studio)

---

## Passo a Passo

### 1. Preparar o Código Web
Primeiro, precisamos transformar seu código React (TypeScript) em arquivos estáticos (HTML/CSS/JS) otimizados.

Abra o terminal na pasta do projeto e rode:
```bash
npm run build
```
*Isso vai atualizar a pasta `dist`.*

### 2. Sincronizar com o Android
Agora, copiamos esses arquivos atualizados para dentro da pasta do projeto Android.

Rode:
```bash
npx cap sync
```
*Isso atualiza os plugins e copia o conteúdo de `dist` para `android/app/src/main/assets/public`.*

### 3. Abrir o Android Studio
Rode o comando abaixo para abrir o projeto nativo automaticamente no Android Studio:
```bash
npx cap open android
```

### 4. Gerar o APK
Dentro do Android Studio:
1.  Espere o projeto terminar de indexar (barra de progresso no fundo).
2.  No menu superior, vá em: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3.  Aguarde a compilação terminar.
4.  Uma notificação aparecerá no canto inferior direito: "APK(s) generated successfully".
5.  Clique em **locate** nessa notificação.
    *   O arquivo será algo como `app-debug.apk`.

### 5. Instalar no Celular
1.  Envie esse arquivo `.apk` para o seu celular (via USB, Google Drive, WhatsApp, etc).
2.  No celular, toque no arquivo para instalar.
    *   *Nota: Pode ser necessário permitir "Instalar de fontes desconhecidas" nas configurações do seu Android.*

---

## Método Rápido (Linha de Comando)
Se você já tem o ambiente Android configurado (SDKs), pode tentar gerar diretamente pelo terminal sem abrir o Android Studio:

**Windows (PowerShell):**
```powershell
cd android
./gradlew assembleDebug
cd ..
```
O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`
