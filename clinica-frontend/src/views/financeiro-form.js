// src/views/financeiro-form.js
AppRouter.register(
  "/financeiro/form",
  { title: "Lançamento Financeiro" },
  async (root) => {
    const API = window.API;
    const Fin = API?.financeiro;
    const Cons = API?.consultas;

    if (!Fin) {
      root.innerHTML = "<p>API Financeiro não disponível.</p>";
      return;
    }

    function getParams() {
      try {
        const h = location.hash || "";
        const q = h.includes("?") ? h.split("?")[1] : "";
        return Object.fromEntries(new URLSearchParams(q));
      } catch {
        return {};
      }
    }

    // normaliza vários formatos de data em "yyyy-MM-dd"
    function toDateInputValue(value) {
      if (!value) return "";
      if (Array.isArray(value)) {
        const [y, m, d] = value;
        if (!y || !m || !d) return "";
        const mm = String(m).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
      }
      const s = String(value);
      if (s.includes("-")) {
        return s.slice(0, 10);
      }
      if (s.includes(",")) {
        const parts = s.split(",");
        if (parts.length >= 3) {
          const y = parts[0].trim();
          const m = parts[1].trim().padStart(2, "0");
          const d = parts[2].trim().padStart(2, "0");
          return `${y}-${m}-${d}`;
        }
      }
      return "";
    }

    const params = getParams();
    const id = params.id ? Number(params.id) : null;

    let atual = null;
    let consultas = [];

    async function carregarDados() {
      if (Cons && typeof Cons.list === "function") {
        try {
          const res = await Cons.list({ page: 1, size: 200 });
          consultas = res.rows || res.content || [];
        } catch (e) {
          console.warn("Falha ao carregar consultas para o financeiro:", e);
        }
      }

      if (id) {
        try {
          atual = await Fin.getById(id);
        } catch (e) {
          console.error(e);
        }
      }

      render();
    }

    function render() {
      const isEdit = !!atual;
      const selectedConsulta = atual?.idConsulta ?? "";
      const dataPagamentoValue = toDateInputValue(atual?.dataPagamento);

      root.innerHTML = `
      <div class="card">
        <div class="space-between" style="margin-bottom:12px;">
          <h3>${isEdit ? "Editar" : "Novo"} Lançamento</h3>
          <a class="btn btn--ghost" href="#/financeiro">Voltar</a>
        </div>

        <form id="fin-form" class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="fg" style="grid-column:span 2;">
            <label for="idConsulta">Consulta (ID)</label>
            <select id="idConsulta" name="idConsulta" required>
              <option value="">Selecione...</option>
              ${
                consultas.length
                  ? consultas
                      .map(
                        (c) => `
                      <option value="${c.id}" ${
                          String(c.id) === String(selectedConsulta)
                            ? "selected"
                            : ""
                        }>
                        ${c.id} — ${c.data || ""} ${c.hora || ""}
                      </option>
                    `
                      )
                      .join("")
                  : selectedConsulta
                  ? `<option value="${selectedConsulta}" selected>${selectedConsulta}</option>`
                  : ""
              }
            </select>
          </div>

          <div class="fg">
            <label for="formaPagamento">Forma de pagamento</label>
            <select id="formaPagamento" name="formaPagamento">
              <option value="">Selecione...</option>
              <option value="debito"   ${
                atual?.formaPagamento === "debito" ? "selected" : ""
              }>Débito</option>
              <option value="credito"  ${
                atual?.formaPagamento === "credito" ? "selected" : ""
              }>Crédito</option>
              <option value="dinheiro" ${
                atual?.formaPagamento === "dinheiro" ? "selected" : ""
              }>Dinheiro</option>
              <option value="pix"      ${
                atual?.formaPagamento === "pix" ? "selected" : ""
              }>PIX</option>
            </select>
          </div>

          <div class="fg">
            <label for="statusFinanceiro">Status</label>
            <select id="statusFinanceiro" name="statusFinanceiro">
              <option value="nao pago" ${
                atual?.statusFinanceiro === "nao pago" ? "selected" : ""
              }>Não pago</option>
              <option value="pago"     ${
                atual?.statusFinanceiro === "pago" ? "selected" : ""
              }>Pago</option>
            </select>
          </div>

          <div class="fg">
            <label for="dataPagamento">Data de pagamento</label>
            <input id="dataPagamento" name="dataPagamento" type="date"
                   value="${dataPagamentoValue}">
          </div>

          <div class="fg">
            <label for="valor">Valor da consulta (R$)</label>
            <input id="valor" name="valor" type="number" step="0.01"
                   value="${atual?.valor ?? ""}">
          </div>

          <div style="grid-column:span 2; display:flex; gap:12px; margin-top:16px;">
            <button class="btn btn--primary" type="submit">${
              isEdit ? "Salvar alterações" : "Salvar"
            }</button>
            <a class="btn btn--ghost" href="#/financeiro">Cancelar</a>
          </div>
        </form>
      </div>
    `;

      const form = root.querySelector("#fin-form");

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());

        const payload = {
          idConsulta: data.idConsulta ? Number(data.idConsulta) : null,
          formaPagamento: data.formaPagamento || null,
          statusFinanceiro: data.statusFinanceiro || null,
          dataPagamento: data.dataPagamento || null,
          valor: data.valor
            ? Number(String(data.valor).replace(",", "."))
            : null,
        };

        // Validações básicas
        if (!payload.idConsulta) {
          alert("Selecione uma consulta.");
          return;
        }

        if (payload.valor == null || Number.isNaN(payload.valor)) {
          alert("Informe um valor válido.");
          return;
        }

        if (payload.valor < 0) {
          alert("O valor não pode ser negativo.");
          return;
        }

        try {
          if (isEdit) {
            await Fin.update(atual.id, payload);
          } else {
            await Fin.create(payload);
          }
          // Redireciona de volta para a lista de financeiro (agendamentos financeiros)
          location.hash = "#/financeiro";
          if (window.AppRouter && window.AppRouter.navigate) {
            setTimeout(() => window.AppRouter.navigate(), 50);
          }
        } catch (err) {
          console.error(err);
          alert("Erro ao salvar lançamento financeiro.");
        }
      });
    }

    await carregarDados();
  }
);
