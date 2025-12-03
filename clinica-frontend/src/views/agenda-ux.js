    // src/views/agenda-ux.js  (versão robusta)
    (() => {
    // ---------- Busca ----------
    function findSearchInput() {
        // tenta por id OU por placeholder
        return document.querySelector(
        '#agenda-search, input[placeholder^="Buscar"], input[placeholder*="Buscar paciente"]'
        );
    }

    function ensureSearchButton() {
        const input = findSearchInput();
        if (!input) return;

        const wrap = input.closest('.searchbox') || (function () {
        const div = document.createElement('div');
        div.className = 'searchbox';
        input.parentNode.insertBefore(div, input);
        div.appendChild(input);
        return div;
        })();

        if (wrap.querySelector('button[data-agenda-search]')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-agenda-search', '1');
        btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        `;
        wrap.appendChild(btn);

        const doSearch = () => {
        const value = (input.value || '').trim();
        if (typeof window.applyAgendaFilters === 'function') {
            window.applyAgendaFilters({ search: value });
        } else {
            document.dispatchEvent(new CustomEvent('agenda:filter', { detail: { search: value } }));
        }
        };

        btn.addEventListener('click', doSearch);
        input.addEventListener('keyup', (e) => { if (e.key === 'Enter') doSearch(); });
    }

    // ---------- Popover ----------
    function enablePillPopover(container) {
        if (!container || container.__agendaPillBound) return;
        container.__agendaPillBound = true;

        container.addEventListener('click', async (e) => {
        const pill = e.target.closest(
            '.appt-badge, .badge, .event, .pill, [data-appt-id], [data-appt]'
        );
        if (!pill) return;

        let appt;
        const raw = pill.getAttribute('data-appt');
        if (raw) { try { appt = JSON.parse(raw); } catch {} }
        if (!appt) {
            const id = pill.getAttribute('data-appt-id') || pill.getAttribute('data-id');
            if (id && API?.agendamentos?.get) appt = await API.agendamentos.get(id);
        }
        if (!appt) return;

        window.AgendaPopover?.show(pill, appt);
        });
    }

    function wireGrid() {
        const grid = document.querySelector('.agenda-grid, .calendar, [data-agenda-grid]');
        if (!grid) return;
        ensureSearchButton();
        enablePillPopover(grid);
    }

    function setup() { wireGrid(); }

    // Eventos emitidos pela view
    document.addEventListener('agenda:render', setup);
    document.addEventListener('agenda:refresh', setup);
    document.addEventListener('agenda:filter', setup);

    // Fallback: observa mudanças quando estiver na rota de agendamentos
    const ro = new MutationObserver(() => {
        if (location.hash.includes('agendamentos')) setup();
    });
    ro.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
    })();
