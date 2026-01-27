#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
📋 RESUMO DA CORREÇÃO: SUPORTE A MÚLTIPLOS DEPARTAMENTOS

Problema Identificado:
=======================
Quando o usuário selecionava MÚLTIPLOS departamentos para uma campanha,
o sistema só enviava emails para os usuários do PRIMEIRO departamento selecionado.

Exemplo do Problema:
- Selecionava: TI, Financeiro
- Enviava para: Apenas TI
- Esperado: TI + Financeiro

Raiz do Problema:
=======================
1. Frontend estava CORRETO:
   - Guardava todos os IDs selecionados em "target_audience"
   - Usava apenas o primeiro em "target_department_id"
   - Enviava: target_audience="1,2" e target_department_id=1

2. Backend estava INCORRETO (rota /campaigns/{id}/send):
   - Linha 161: .filter(User.department_id == campaign.target_department_id)
   - Só filtrava por UM departamento (o primeiro)
   - Ignorava completamente o campo target_audience

Solução Implementada:
=======================
No backend (app/routes/campaigns.py):

✅ ANTES (apenas um departamento):
   users = (
       db.query(User)
       .filter(User.department_id == campaign.target_department_id, User.is_active == True)
       .all()
   )

✅ DEPOIS (múltiplos departamentos):
   # Parse do target_audience para obter todos os department_ids
   department_ids = []
   if campaign.target_audience:
       department_ids = [int(d.strip()) for d in campaign.target_audience.split(",")]
   if not department_ids and campaign.target_department_id:
       department_ids = [campaign.target_department_id]
   
   # Query TODOS os usuários de TODOS os departamentos
   users = (
       db.query(User)
       .filter(User.department_id.in_(department_ids), User.is_active == True)
       .all()
   )

Mudanças Específicas:
=======================
1. Backend (campaigns.py):
   - Mudou .filter(User.department_id == ) para .filter(User.department_id.in_())
   - Adicionou parsing de target_audience para extrair múltiplos IDs
   - Adicionou fallback para target_department_id se target_audience vazio
   - Melhorou mensagens de erro para mostrar IDs dos departamentos

2. Frontend (campaigns/page.tsx):
   - Melhorou exibição de múltiplos departamentos na confirmação
   - Melhorou mensagem de sucesso para listar todos os departamentos
   - Usa target_audience para determinar nomes dos departamentos

Fluxo Corrigido:
=======================
1. Usuário seleciona: TI, Financeiro, RH
2. Frontend envia:
   - target_department_id: 1 (primeiro para fallback)
   - target_audience: "1,2,3" (todos)
3. Backend recebe e faz:
   - Parse: department_ids = [1, 2, 3]
   - Query: User.department_id.in_([1, 2, 3])
4. Resultado:
   - Busca usuários dos 3 departamentos
   - Envia emails para todos
   - Retorna: "Enviado para 45 usuários em 3 departamentos"

Testes Realizados:
=======================
✅ Campanha 2: target_audience="3,4" → 6 usuários totais
   - Dept 3 (TI): 4 usuários
   - Dept 4 (Financeiro): 2 usuários
   - Resultado: ENVIO PARA OS 6 ✅

Impacto:
=======================
- Sistema agora suporta seleção ilimitada de departamentos
- Um clique no botão "Enviar" dispara para TODOS os selecionados
- Mensagens claras mostram quantos em cada departamento
- Backend automático: recarregou mudanças com reload ativo
"""

print(__doc__)
