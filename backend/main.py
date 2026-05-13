from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from collections import Counter
from typing import Optional

app = FastAPI(title="Supermarket Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, substitua pelo domínio do seu frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

COLS = ['NR_CPF', 'DT_MOVTO', 'TOTAL_CUPOM', 'CD_PROD', 'DS_PROD', 'TOTAL_ITEM', 'SETOR']


def load_df(file_bytes: bytes) -> pd.DataFrame:
    df = pd.read_csv(
        io.BytesIO(file_bytes),
        sep=';', encoding='latin1',
        low_memory=False, decimal=',', quotechar='"'
    )
    df.columns = COLS
    df['DT_MOVTO'] = pd.to_datetime(df['DT_MOVTO'], format='%d/%m/%y', errors='coerce')
    df['TOTAL_ITEM'] = pd.to_numeric(df['TOTAL_ITEM'], errors='coerce')
    df['TOTAL_CUPOM'] = pd.to_numeric(df['TOTAL_CUPOM'], errors='coerce')
    df['SETOR'] = df['SETOR'].fillna('').astype(str)
    df = df[df['NR_CPF'] > 0]
    return df


def analyze(df: pd.DataFrame, city: str) -> dict:
    visitas = df.groupby('NR_CPF')['DT_MOVTO'].nunique()
    cupons_unicos = df.groupby(['NR_CPF', 'DT_MOVTO']).ngroups
    receita = float(df['TOTAL_ITEM'].sum())
    ticket = df.groupby(['NR_CPF', 'DT_MOVTO'])['TOTAL_CUPOM'].first()
    total_cli = len(visitas)

    fiel = int((visitas >= 4).sum())
    regular = int(((visitas >= 2) & (visitas < 4)).sum())
    ocasional = int((visitas == 1).sum())

    cliente_valor = df.groupby('NR_CPF')['TOTAL_ITEM'].sum().sort_values(ascending=False)
    top20_pct = float(cliente_valor.head(int(len(cliente_valor) * 0.2)).sum() / receita * 100)

    # Setores
    setores = (
        df.groupby('SETOR')['TOTAL_ITEM'].sum()
        .sort_values(ascending=False)
        .head(12)
    )

    # Produtos
    produtos = (
        df.groupby('DS_PROD')['TOTAL_ITEM'].sum()
        .sort_values(ascending=False)
        .head(20)
    )

    # Semanal
    df['SEMANA'] = df['DT_MOVTO'].dt.to_period('W').astype(str)
    semanal = df.groupby('SEMANA')['TOTAL_ITEM'].sum().to_dict()

    # Dias da semana
    day_map = {
        'Monday': 'Seg', 'Tuesday': 'Ter', 'Wednesday': 'Qua',
        'Thursday': 'Qui', 'Friday': 'Sex', 'Saturday': 'Sáb', 'Sunday': 'Dom'
    }
    df['DIA'] = df['DT_MOVTO'].dt.day_name().map(day_map)
    dias = df.groupby('DIA')['NR_CPF'].count().to_dict()

    # Pares de setores
    cupom_setores = df.groupby(['NR_CPF', 'DT_MOVTO'])['SETOR'].apply(list)
    pares = Counter()
    for setores_list in cupom_setores:
        s = sorted(set([x for x in setores_list if x and x != 'nan']))
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                pares[(s[i], s[j])] += 1

    return {
        "city": city,
        "periodo": {
            "inicio": str(df['DT_MOVTO'].min().date()),
            "fim": str(df['DT_MOVTO'].max().date()),
        },
        "kpis": {
            "receita_total": receita,
            "cupons_unicos": cupons_unicos,
            "clientes_unicos": total_cli,
            "produtos_distintos": int(df['CD_PROD'].nunique()),
            "ticket_medio": float(ticket.mean()),
            "ticket_mediana": float(ticket.median()),
            "receita_por_cliente": receita / total_cli,
            "top20_pct_receita": top20_pct,
        },
        "recorrencia": {
            "fiel": fiel,
            "fiel_pct": round(fiel / total_cli * 100, 1),
            "regular": regular,
            "regular_pct": round(regular / total_cli * 100, 1),
            "ocasional": ocasional,
            "ocasional_pct": round(ocasional / total_cli * 100, 1),
        },
        "setores": [
            {"setor": k, "receita": float(v)}
            for k, v in setores.items()
        ],
        "produtos_top20": [
            {"produto": k, "receita": float(v)}
            for k, v in produtos.items()
        ],
        "semanal": [
            {"semana": k, "receita": float(v)}
            for k, v in sorted(semanal.items())
        ],
        "dias": dias,
        "pares_setores": [
            {"par": f"{p[0]} + {p[1]}", "cupons": cnt}
            for p, cnt in pares.most_common(12)
        ],
    }


# --- Endpoints ---

@app.get("/")
def root():
    return {"status": "ok", "message": "Supermarket Analytics API"}


@app.post("/analyze/single")
async def analyze_single(
    file: UploadFile = File(...),
    city: str = "Loja"
):
    """Analisa uma única loja."""
    content = await file.read()
    try:
        df = load_df(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {str(e)}")
    return analyze(df, city)


@app.post("/analyze/compare")
async def analyze_compare(
    file1: UploadFile = File(...),
    city1: str = "Loja 1",
    file2: UploadFile = File(...),
    city2: str = "Loja 2",
    file3: Optional[UploadFile] = File(None),
    city3: Optional[str] = "Loja 3",
):
    """Analisa e compara até 3 lojas, incluindo produtos em comum."""
    results = []
    files = [(file1, city1), (file2, city2)]
    if file3:
        files.append((file3, city3))

    dfs = []
    for f, city in files:
        content = await f.read()
        try:
            df = load_df(content)
            dfs.append((df, city))
            results.append(analyze(df, city))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro em {city}: {str(e)}")

    # Produtos em comum (top 20 de cada)
    tops = []
    for df, city in dfs:
        top = df.groupby('DS_PROD')['TOTAL_ITEM'].sum().sort_values(ascending=False).head(20)
        tops.append((city, set(top.index), top))

    # Sobreposição de base (CPFs)
    cpf_sets = {city: set(df['NR_CPF'].unique()) for df, city in dfs}
    overlap = {}
    cities = list(cpf_sets.keys())
    for i in range(len(cities)):
        for j in range(i + 1, len(cities)):
            key = f"{cities[i]} ∩ {cities[j]}"
            overlap[key] = len(cpf_sets[cities[i]] & cpf_sets[cities[j]])
    if len(cities) == 3:
        overlap["Todas"] = len(cpf_sets[cities[0]] & cpf_sets[cities[1]] & cpf_sets[cities[2]])

    # Produtos universais (em todas as lojas)
    universal_set = tops[0][1]
    for _, s, _ in tops[1:]:
        universal_set = universal_set & s

    universal = []
    for prod in universal_set:
        entry = {"produto": prod, "lojas": {}}
        for city, _, top in tops:
            rank = list(top.index).index(prod) + 1
            entry["lojas"][city] = {"rank": rank, "receita": float(top[prod])}
        universal.append(entry)
    universal.sort(key=lambda x: min(v["rank"] for v in x["lojas"].values()))

    # Exclusivos por loja
    exclusivos = {}
    for city, s, top in tops:
        others = set()
        for c2, s2, _ in tops:
            if c2 != city:
                others |= s2
        excl_set = s - others
        exclusivos[city] = [
            {"produto": p, "rank": list(top.index).index(p) + 1, "receita": float(top[p])}
            for p in excl_set
        ]
        exclusivos[city].sort(key=lambda x: x["rank"])

    return {
        "lojas": results,
        "comparativo": {
            "overlap_cpf": overlap,
            "produtos_universais": universal,
            "exclusivos_por_loja": exclusivos,
        }
    }
