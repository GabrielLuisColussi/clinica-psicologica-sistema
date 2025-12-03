// src/components/notifications.js
// Componente de notificações para consultas pendentes

(function() {
  let notificationInterval = null;
  let isDropdownOpen = false;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';
      if (diffDays > 1) return `${diffDays} dias atrás`;
      
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  }

  async function loadNotifications() {
    const API = window.API || {};
    const Consultas = API.consultas || null;
    
    if (!Consultas || typeof Consultas.consultasPendentes !== 'function') {
      return { count: 0, items: [] };
    }

    try {
      const response = await Consultas.consultasPendentes();
      const norm = (resp) => {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp;
        if (Array.isArray(resp.rows)) return resp.rows;
        if (Array.isArray(resp.content)) return resp.content;
        return [];
      };
      
      const items = norm(response);
      return { count: items.length, items };
    } catch (error) {
      console.error('[notifications] Erro ao carregar notificações:', error);
      return { count: 0, items: [] };
    }
  }

  function updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  async function updateConsultaStatus(consultaId, novoStatus) {
    const API = window.API || {};
    const Consultas = API.consultas || null;
    
    if (!Consultas) {
      console.error('[notifications] API de consultas não disponível');
      return false;
    }

    try {
      // Primeiro, busca a consulta atual para manter os outros campos
      let consultaAtual = null;
      if (Consultas.getById) {
        try {
          consultaAtual = await Consultas.getById(consultaId);
        } catch (e) {
          console.warn('[notifications] Não foi possível buscar consulta, tentando atualizar apenas status');
        }
      }

      // Tenta usar updateStatus primeiro (mais simples)
      if (Consultas.updateStatus) {
        try {
          await Consultas.updateStatus(consultaId, novoStatus);
        } catch (error) {
          console.warn('[notifications] updateStatus falhou, tentando update completo:', error);
          // Se updateStatus falhar, tenta com update completo
          if (consultaAtual && Consultas.update) {
            const payload = {
              ...consultaAtual,
              status: novoStatus,
              statusConsulta: novoStatus,
              id: consultaId,
              idConsulta: consultaId
            };
            await Consultas.update(consultaId, payload);
          } else {
            throw error;
          }
        }
      } else if (Consultas.update) {
        // Se não tiver updateStatus, usa update completo
        if (consultaAtual) {
          const payload = {
            ...consultaAtual,
            status: novoStatus,
            statusConsulta: novoStatus,
            id: consultaId,
            idConsulta: consultaId
          };
          await Consultas.update(consultaId, payload);
        } else {
          // Se não conseguir buscar a consulta, tenta atualizar apenas o status
          await Consultas.update(consultaId, { 
            id: consultaId,
            status: novoStatus, 
            statusConsulta: novoStatus 
          });
        }
      } else {
        console.error('[notifications] Método de atualização não disponível');
        return false;
      }
      
      // Mostra mensagem de sucesso
      if (window.toast) {
        window.toast(`Status atualizado para ${novoStatus}`, 'ok');
      }
      
      return true;
    } catch (error) {
      console.error('[notifications] Erro ao atualizar status:', error);
      if (window.toast) {
        window.toast('Erro ao atualizar status da consulta', 'error');
      }
      return false;
    }
  }

  function renderNotificationContent(items) {
    const content = document.getElementById('notification-content');
    if (!content) return;

    if (items.length === 0) {
      content.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--muted);">
          <p style="margin: 0; font-size: 14px;">Nenhuma consulta pendente</p>
          <p style="margin: 8px 0 0; font-size: 12px;">Todas as consultas estão atualizadas</p>
        </div>
      `;
      return;
    }

    content.innerHTML = items.map((item, index) => {
      const data = formatDate(item.data);
      const status = item.status || 'AGENDADA';
      const pacienteNome = item.pacienteNome || item.paciente?.nome || 'Paciente';
      const medicoNome = item.medicoNome || item.medico?.nome || 'Médico';
      const hora = item.hora || '--:--';
      const consultaId = item.id || item.idConsulta || item.id_consulta;
      const itemId = `notification-item-${index}`;
      
      return `
        <div id="${itemId}" style="padding: 12px 16px; border-bottom: 1px solid var(--line); transition: background 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px;">
                ${pacienteNome}
              </div>
              <div style="font-size: 12px; color: var(--muted); margin-bottom: 2px;">
                ${medicoNome} • ${hora}
              </div>
              <div style="font-size: 11px; color: var(--muted);">
                ${data} • Status: ${status}
              </div>
            </div>
            <div style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;">
              Pendente
            </div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button 
              onclick="window.updateConsultaStatusNotification(${consultaId}, 'CANCELADO', '${itemId}')"
              style="padding: 6px 12px; background: #fee2e2; color: #991b1b; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='#fecaca'; this.style.transform='scale(1.02)'"
              onmouseout="this.style.background='#fee2e2'; this.style.transform='scale(1)'">
              Cancelar
            </button>
            <button 
              onclick="window.updateConsultaStatusNotification(${consultaId}, 'CONCLUIDO', '${itemId}')"
              style="padding: 6px 12px; background: #d1fae5; color: #065f46; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.background='#a7f3d0'; this.style.transform='scale(1.02)'"
              onmouseout="this.style.background='#d1fae5'; this.style.transform='scale(1)'">
              Concluir
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    // Adiciona função global para atualizar status
    window.updateConsultaStatusNotification = async function(consultaId, novoStatus, itemId) {
      const itemElement = document.getElementById(itemId);
      if (!itemElement) return;
      
      // Desabilita botões durante a atualização
      const buttons = itemElement.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      });
      
      // Mostra indicador de carregamento
      const originalHTML = itemElement.innerHTML;
      itemElement.innerHTML = `
        <div style="padding: 12px 16px; text-align: center; color: var(--muted);">
          <p style="margin: 0; font-size: 14px;">Atualizando...</p>
        </div>
      `;
      
      try {
        const sucesso = await updateConsultaStatus(consultaId, novoStatus);
        
        if (sucesso) {
          // Dispara evento imediatamente para atualizar a página de agendamentos
          window.dispatchEvent(new CustomEvent('consulta-status-updated', { 
            detail: { consultaId, novoStatus } 
          }));
          
          // Remove o item imediatamente da lista visualmente
          itemElement.style.opacity = '0';
          itemElement.style.transition = 'opacity 0.2s';
          itemElement.style.pointerEvents = 'none';
          
          // Remove o elemento do DOM após animação
          setTimeout(() => {
            if (itemElement.parentNode) {
              itemElement.remove();
            }
          }, 200);
          
          // Atualiza o badge imediatamente (decrementa 1)
          const currentBadge = document.getElementById('notification-badge');
          if (currentBadge && currentBadge.textContent) {
            const currentCount = parseInt(currentBadge.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            if (newCount > 0) {
              currentBadge.textContent = newCount > 99 ? '99+' : newCount;
              currentBadge.style.display = 'flex';
            } else {
              currentBadge.style.display = 'none';
            }
          }
          
          // Recarrega a lista completa de notificações após um delay para garantir sincronização
          setTimeout(async () => {
            try {
              const { count, items } = await loadNotifications();
              updateBadge(count);
              // Só re-renderiza se o dropdown ainda estiver aberto
              if (isDropdownOpen) {
                renderNotificationContent(items);
              }
            } catch (error) {
              console.error('[notifications] Erro ao recarregar notificações:', error);
            }
          }, 500);
        } else {
          // Restaura o item em caso de erro
          itemElement.innerHTML = originalHTML;
          buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          });
        }
      } catch (error) {
        console.error('[notifications] Erro ao atualizar status:', error);
        // Restaura o item em caso de erro
        itemElement.innerHTML = originalHTML;
        buttons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        });
      }
    };
  }

  async function refreshNotifications() {
    const { count, items } = await loadNotifications();
    updateBadge(count);
    
    // Se o dropdown estiver aberto, atualiza o conteúdo
    if (isDropdownOpen) {
      renderNotificationContent(items);
    }
  }

  function setupNotificationButton() {
    const btn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');
    
    if (!btn || !dropdown) return;

    // Toggle do dropdown
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (isDropdownOpen) {
        dropdown.style.display = 'none';
        isDropdownOpen = false;
      } else {
        dropdown.style.display = 'block';
        isDropdownOpen = true;
        
        // Carrega notificações quando abre
        const { items } = await loadNotifications();
        renderNotificationContent(items);
      }
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.style.display = 'none';
        isDropdownOpen = false;
      }
    });
  }

  function startNotificationPolling() {
    // Carrega imediatamente
    refreshNotifications();
    
    // Atualiza a cada 30 segundos
    if (notificationInterval) {
      clearInterval(notificationInterval);
    }
    
    notificationInterval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 segundos
  }

  function stopNotificationPolling() {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  }

  // Inicializa quando o DOM estiver pronto
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Aguarda um pouco para garantir que os elementos existam
    setTimeout(() => {
      setupNotificationButton();
      
      // Só inicia polling se estiver autenticado
      if (window.Auth && window.Auth.isAuthenticated()) {
        startNotificationPolling();
      }
    }, 500);
  }

  // Reinicia quando autenticação muda
  if (window.Auth) {
    const originalLogin = window.Auth.login;
    if (originalLogin) {
      window.Auth.login = async function(...args) {
        const result = await originalLogin.apply(this, args);
        setTimeout(() => {
          startNotificationPolling();
        }, 1000);
        return result;
      };
    }

    const originalLogout = window.Auth.logout;
    if (originalLogout) {
      window.Auth.logout = function(...args) {
        stopNotificationPolling();
        updateBadge(0);
        return originalLogout.apply(this, args);
      };
    }
  }

  // Observa mudanças de autenticação via eventos
  window.addEventListener('auth-changed', () => {
    if (window.Auth && window.Auth.isAuthenticated()) {
      startNotificationPolling();
    } else {
      stopNotificationPolling();
      updateBadge(0);
    }
  });

  init();
})();

