# 🤖 Guia do Android Studio

Se o comando abriu o Android Studio mas você está perdido, siga estes passos.

## 1. A Tela Inicial (Sync)
Ao abrir o projeto, você verá uma barra de progresso na parte inferior direita ("Gradle Sync").
*   **AGUARDE.** Isso pode levar de 5 a 20 minutos na primeira vez.
*   Enquanto estiver carregando, você não conseguirá rodar o app.

## 2. Erros Comuns de Instalação

### "SDK Location not found"
Se aparecer esse erro, você precisa definir onde o Android SDK está instalado.
1.  Vá em **File > Project Structure > SDK Location**.
2.  Geralmente fica em `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`.

### "Virtual Device" (Emulador)
Para testar no PC sem um celular físico:
1.  No topo direito, procure um ícone de celular com o boneco Android (Device Manager).
2.  Clique em **Create Device**.
3.  Escolha "Pixel 6" ou similar.
4.  Baixe uma imagem do sistema (recomendo uma versão recente, como API 33 ou 34 - "Tiramisu" ou "UpsideDownCake").
    *   *Nota: O download é grande (1.5GB+).*
5.  Termine a criação e clique no "Play" (triângulo verde) para abrir o celular virtual.

## 3. Rodando o App
Com o celular (virtual ou físico via USB) conectado:
1.  No topo da tela, verifique se o **módulo** selecionado é `app`.
2.  Ao lado, deve aparecer o nome do seu dispositivo (ex: `Pixel 6 API 34` ou `Samsung...`).
3.  Clique no botão **Play (Run 'app')** 🟢 na barra de ferramentas superior.

O Android Studio vai:
1.  Compilar tudo (Build).
2.  Instalar no dispositivo.
3.  Abrir o app "Finança em Casal" automaticamente.

## Dica Importante
Se você alterar qualquer código `React/TypeScript`:
1.  Rode no VS Code: `npm run build`
2.  Rode no VS Code: `npx cap sync`
3.  Só depois clique no Play 🟢 no Android Studio.
