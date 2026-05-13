# Supermarket Analytics

Dashboard de análise de comportamento de compra para redes de supermercados.

## Arquitetura

```
supermarket-analytics/
├── backend/          # FastAPI (Python)
│   ├── main.py       # API com toda a lógica de análise
│   └── requirements.txt
└── frontend/         # React + Recharts
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── components/
    │   │   ├── ui.jsx      # KpiCard, Card, SectionTitle
    │   │   └── charts.jsx  # Gráficos Recharts
    │   └── pages/
    │       ├── UploadPage.jsx       # Tela de upload
    │       ├── DashboardSingle.jsx  # Análise de uma loja
    │       └── DashboardCompare.jsx # Comparativo de lojas
    └── package.json
```

## Funcionalidades

- Upload de arquivos `.dsv` (separador `;`, decimal `,`)
- Análise individual de uma loja ou comparativo de até 3 lojas
- KPIs: faturamento, ticket médio, receita por cliente
- Segmentação de clientes: Fiéis / Regulares / Ocasionais
- Top setores e produtos por receita
- Análise de cesta (pares de setores no mesmo cupom)
- Evolução semanal e padrão por dia da semana
- Produtos universais vs. exclusivos por cidade (modo comparativo)
- Sobreposição de base de clientes entre lojas

---

## Rodando localmente

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

A API estará em `http://localhost:8000`  
Documentação automática: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O app estará em `http://localhost:3000`

---

## Deploy no Render.com (gratuito)

### 1. Suba o código para o GitHub
Crie um repositório e faça push de toda a pasta `supermarket-analytics/`.

### 2. Deploy do Backend

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em **New → Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `supermarket-analytics-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Clique em **Create Web Service**
6. Aguarde o deploy e copie a URL gerada (ex: `https://supermarket-analytics-api.onrender.com`)

### 3. Deploy do Frontend

1. Clique em **New → Static Site**
2. Conecte o mesmo repositório
3. Configure:
   - **Name:** `supermarket-analytics`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = URL do backend copiada no passo anterior
5. Clique em **Create Static Site**

Pronto! Em alguns minutos o app estará acessível publicamente.

---

## Formato de arquivo esperado

Arquivo `.dsv` com:
- Separador de colunas: `;`
- Separador decimal: `,`
- Colunas (nessa ordem): `NR_CPF`, `DT_MOVTO`, `TOTAL_CUPOM`, `CD_PROD`, `DS_PROD`, `TOTAL_ITEM`, `SETOR`
- Datas no formato `DD/MM/YY`

---

## Próximos passos sugeridos

- [ ] Autenticação por loja (cada gerente vê apenas sua unidade)
- [ ] Exportação de relatório em PDF
- [ ] Análise de market basket com regras de associação (Apriori)
- [ ] Segmentação RFM completa
- [ ] Alertas de ruptura / queda de receita por setor
- [ ] Comparativo com período anterior
