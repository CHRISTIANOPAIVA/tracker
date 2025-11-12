# 📦 Instalação Rápida - FitTrack Pro

## 🚀 Começando em 3 Passos

### Passo 1: Preparar o Ambiente
```bash
# Verificar se Node.js está instalado
node --version

# Se não estiver instalado, baixe em: https://nodejs.org/
```

### Passo 2: Instalar Dependências
```bash
# Instalar todas as dependências
npm install
```

### Passo 3: Iniciar a Aplicação
```bash
# Método 1: Script automático
./start.sh

# Método 2: Manual
npm start

# Método 3: Desenvolvimento (hot-reload)
npm run dev
```

## 🌐 Acessar a Aplicação

Após iniciar, abra seu navegador e acesse:
```
http://localhost:3000
```

## 📋 Comandos Úteis

```bash
# Testar a aplicação
npm test

# Popular banco de dados com dados de exemplo
npm run seed

# Iniciar em modo produção
npm start

# Iniciar em modo desenvolvimento
npm run dev
```

## 🎯 Primeiros Passos

1. **Acesse o Dashboard**: Veja as estatísticas e atividades de exemplo
2. **Explore as Seções**: Navegue pelas abas Dashboard, Atividades, Analytics e Perfil
3. **Registre uma Atividade**: Use o botão "Nova Atividade" ou os botões rápidos
4. **Teste o Timer**: Inicie uma atividade e use o cronômetro integrado
5. **Explore os Gráficos**: Veja as visualizações na seção Analytics

## 🔧 Solução de Problemas

### Problema: Porta 3000 já em uso
```bash
# Verificar processos usando a porta
lsof -i :3000

# Ou mude a porta no arquivo config.js
```

### Problema: Erro de permissão no start.sh
```bash
# Tornar o script executável
chmod +x start.sh
```

### Problema: Dependências não instaladas
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules
npm install
```

## 📚 Documentação Adicional

- **[README.md](README.md)**: Documentação completa do projeto
- **[DEMO.md](DEMO.md)**: Demonstração passo a passo
- **[TECHNICAL.md](TECHNICAL.md)**: Documentação técnica detalhada
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Resumo completo do projeto

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a documentação completa no README.md
2. Execute os testes: `npm test`
3. Verifique os logs do servidor
4. Consulte a documentação técnica para debugging

---

**FitTrack Pro** - Pronto para uso! 💪🔥

**Aproveite sua jornada fitness!** 🚀