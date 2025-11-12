# 📋 Documentação Técnica - FitTrack Pro

## Arquitetura do Sistema

### Visão Geral
O FitTrack Pro utiliza uma arquitetura de aplicação web full-stack com separação clara entre backend e frontend:

```
FitTrack Pro/
├── src/
│   ├── database/          # Configuração e models do banco de dados
│   ├── models/           # Models de dados e validação
│   ├── routes/           # Rotas da API RESTful
│   └── utils/            # Utilitários e helpers
├── public/               # Frontend (HTML, CSS, JavaScript)
│   ├── css/              # Estilos e temas
│   ├── js/               # Lógica da aplicação
│   └── assets/           # Imagens e recursos
├── test/                 # Testes automatizados
└── config.js             # Configurações da aplicação
```

## Backend - API RESTful

### Tecnologias
- **Node.js** (v14+): Runtime JavaScript
- **Express.js** (v4.18+): Framework web
- **SQLite3** (v5.1+): Banco de dados local
- **CORS**: Segurança cross-origin

### Estrutura da API

#### Endpoints Principais

**Usuários**
```
GET    /api/users          # Listar todos os usuários
GET    /api/users/:id      # Buscar usuário específico
POST   /api/users          # Criar novo usuário
PUT    /api/users/:id      # Atualizar usuário
DELETE /api/users/:id      # Deletar usuário
GET    /api/users/:id/stats # Estatísticas do usuário
```

**Atividades**
```
GET    /api/activities                    # Listar atividades (com filtros)
GET    /api/activities/:id                # Buscar atividade específica
POST   /api/activities                    # Criar nova atividade
PUT    /api/activities/:id                # Atualizar atividade
DELETE /api/activities/:id                # Deletar atividade
GET    /api/activities/stats/overview     # Estatísticas gerais
```

### Modelos de Dados

#### User Model
```javascript
{
  id: number,           // Primary key
  name: string,         // Nome do usuário
  email: string,        // Email único
  age: number,          // Idade opcional
  weight: number,       // Peso em kg
  height: number,       // Altura em cm
  createdAt: datetime   // Data de criação
}
```

#### Activity Model
```javascript
{
  id: number,           // Primary key
  userId: number,       // Foreign key para users
  type: string,         // Tipo de atividade
  duration: number,     // Duração em minutos
  distance: number,     // Distância em km
  caloriesBurned: number, // Calorias queimadas
  heartRate: number,    // Frequência cardíaca
  startTime: datetime,  // Início da atividade
  endTime: datetime,    // Fim da atividade
  notes: string,        // Observações
  createdAt: datetime   // Data de criação
}
```

### Validação de Dados

#### Validação de Usuário
- Nome: mínimo 2 caracteres
- Email: formato válido obrigatório
- Idade: entre 1 e 150 anos
- Peso: entre 1 e 500 kg
- Altura: entre 1 e 300 cm

#### Validação de Atividade
- Tipo: deve ser um dos valores permitidos
- Duração: valor positivo obrigatório
- Data de início: obrigatória

### Cálculos Automáticos

#### Cálculo de Calorias
```javascript
// Fórmula: fator × duração × fator_peso
// Fator baseado no tipo de atividade:
// running: 12, cycling: 8, swimming: 10, walking: 4, gym: 6, yoga: 3, other: 5
```

#### Cálculo de Distância
```javascript
// Fórmula: velocidade_média × duração / 60
// Velocidades médias (km/h):
// running: 10, cycling: 20, swimming: 2, walking: 5
```

#### Cálculo de IMC
```javascript
// Fórmula: peso / (altura_metros ^ 2)
// Categorias:
// < 18.5: Abaixo do peso
// 18.5-24.9: Peso normal
// 25-29.9: Sobrepeso
// >= 30: Obesidade
```

## Frontend - Interface Responsiva

### Tecnologias
- **HTML5**: Estrutura semântica
- **CSS3**: Flexbox, Grid, Custom Properties
- **JavaScript ES6+**: Classes, módulos, async/await
- **Chart.js**: Visualização de dados
- **Font Awesome**: Ícones

### Estrutura de Componentes

#### App Principal
```javascript
class FitnessApp {
  // Gerenciamento geral da aplicação
  // Navegação entre seções
  // Comunicação com API
  // Atualização de UI
}
```

#### Seções
- **Dashboard**: Visão geral e estatísticas rápidas
- **Atividades**: Registro e gerenciamento de atividades
- **Analytics**: Visualizações e análises
- **Perfil**: Informações do usuário e métricas de saúde

### Sistema de Navegação

```javascript
// Navegação entre seções
showSection(sectionName) {
  // Atualiza navegação ativa
  // Mostra conteúdo correspondente
  // Carrega dados específicos
}
```

### Gerenciamento de Estado

```javascript
// Estado global da aplicação
this.state = {
  currentUser: null,
  activities: [],
  charts: {},
  timer: {
    isRunning: false,
    elapsed: 0,
    startTime: null
  }
};
```

### Visualizações de Dados

#### Gráficos Implementados
1. **Gráfico Semanal**: Linha mostrando calorias por dia
2. **Gráfico de Calorias**: Barras por tipo de atividade
3. **Gráfico de Duração**: Pizza mostrando distribuição
4. **Gráfico de Progresso**: Linha mostrando tendência
5. **Gráfico de Distribuição**: Área polar por tipo

#### Configuração dos Gráficos
```javascript
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => value + ' kcal'
      }
    }
  }
}
```

### Timer Integrado

```javascript
// Gerenciamento do timer
timer = {
  startTime: null,
  elapsed: 0,
  interval: null,
  isRunning: false
};

// Métodos:
// startTimer(): Inicia contagem
// pauseTimer(): Pausa contagem
// stopTimer(): Finaliza e calcula duração
// resetTimer(): Reinicia valores
```

## Banco de Dados

### Schema SQLite

```sql
-- Tabela de usuários
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    weight REAL,
    height REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de atividades
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    distance REAL,
    calories_burned INTEGER,
    heart_rate INTEGER,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de metas (para funcionalidades futuras)
CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    target_value REAL NOT NULL,
    current_value REAL DEFAULT 0,
    deadline DATE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Índices e Performance

```sql
-- Índices para otimização de consultas
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_start_time ON activities(start_time);
CREATE INDEX idx_users_email ON users(email);
```

## Configurações

### config.js
```javascript
module.exports = {
    port: process.env.PORT || 3000,
    database: {
        path: path.join(__dirname, 'src', 'database', 'fitness_monitor.db')
    },
    activities: {
        types: ['running', 'cycling', 'swimming', 'walking', 'gym', 'yoga', 'other'],
        calorieFactors: {
            running: 12,
            cycling: 8,
            swimming: 10,
            walking: 4,
            gym: 6,
            yoga: 3,
            other: 5
        }
    },
    charts: {
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    }
};
```

## Segurança

### Implementações
- **CORS**: Configurado para aceitar requisições do mesmo domínio
- **Validação de entrada**: Todos os dados são validados antes de processamento
- **SQL Injection Prevention**: Uso de prepared statements
- **XSS Prevention**: Escape de dados no frontend

### Melhorias Recomendadas
- **Autenticação**: Implementar JWT ou OAuth
- **HTTPS**: Configurar SSL/TLS
- **Rate Limiting**: Limitar requisições por IP
- **Input Sanitization**: Limpeza adicional de dados

## Performance

### Otimizações Implementadas
- **Lazy Loading**: Carregamento sob demanda de gráficos
- **Debouncing**: Redução de chamadas de API desnecessárias
- **Cache Local**: Armazenamento de dados no navegador
- **Queries Otimizadas**: Uso de índices no banco de dados

### Métricas de Performance
- **Tempo de carregamento inicial**: < 3 segundos
- **Tamanho do bundle**: < 500KB
- **Performance Score**: > 90 (Lighthouse)

## Testes

### Estrutura de Testes
```javascript
// Testes unitários para cálculos
describe('FitTrack Pro - Testes', () => {
    test('Cálculo de calorias', () => {
        expect(calculateCalories('running', 30, 70)).toBe(360);
    });
    
    test('Cálculo de distância', () => {
        expect(calculateDistance('running', 30)).toBe(5);
    });
    
    test('Cálculo de IMC', () => {
        expect(calculateBMI(70, 175)).toBeCloseTo(22.857, 3);
    });
});
```

### Executando Testes
```bash
# Testes simples
npm test

# Testes com cobertura
npm run test:coverage
```

## Deployment

### Opções de Deploy
1. **Servidor tradicional**: Node.js + PM2
2. **Container Docker**: Imagem containerizada
3. **Serviços de cloud**: Heroku, Vercel, AWS
4. **Static hosting**: Para frontend apenas

### Dockerfile Exemplo
```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Manutenção

### Tarefas Regulares
- **Backup do banco de dados**: SQLite é um arquivo único
- **Monitoramento de logs**: Verificar erros e performance
- **Atualizações de segurança**: Manter dependências atualizadas
- **Otimização de queries**: Analisar performance do banco

### Debugging
```javascript
// Logs de debug
console.log('[DEBUG] User ID:', userId);
console.log('[DEBUG] Activity data:', activityData);

// Error handling
try {
    // Código que pode falhar
} catch (error) {
    console.error('[ERROR]', error.message);
    // Tratamento do erro
}
```

## Escalabilidade

### Melhorias para Produção
- **Banco de dados**: Migrar para PostgreSQL ou MySQL
- **Cache**: Implementar Redis para dados frequentes
- **Load balancing**: Distribuir carga entre servidores
- **CDN**: Servir assets estáticos
- **Microservices**: Separar funcionalidades

### Monitoramento
- **APM**: Application Performance Monitoring
- **Logs centralizados**: ELK stack ou similar
- **Métricas**: Prometheus + Grafana
- **Alertas**: Sistema de notificação de erros

---

**Documentação técnica completa do FitTrack Pro** - Arquitetura, implementação e manutenção.