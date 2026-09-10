-- Anonimização de documentos (item §49 nº 17) — a Matriz Jurídica de
-- Retenção já previa este campo mas nunca tinha sido implementado.
--
-- Ação manual (botão no documento, não automática): limpa cliente,
-- cliente_id, processo, área e tags, e apaga o arquivo original (e todo o
-- histórico de versões) do Storage — o vínculo com a pessoa identificada
-- desaparece tanto dos metadados quanto do conteúdo. O registro em si (id,
-- título, categoria, created_at) continua existindo, agora como dado
-- anonimizado de uso do próprio controlador (LGPD art. 16, IV) — é isso que
-- distingue anonimização de exclusão (que já existe como recurso separado).
--
-- A coluna busca (full-text) é recalculada automaticamente pela trigger
-- documento_busca_trigger a cada UPDATE, então perde o rastro do cliente
-- junto — sem isso, o documento continuaria "achável" pelo nome antigo.
--
-- Bloqueada nas mesmas condições que já bloqueiam exclusão (legal_hold ou
-- retention_until futuro) — anonimizar destrói o arquivo original, o que
-- contradiz o propósito da retenção/preservação especial enquanto ativa.

alter table documento add column anonymized boolean not null default false;

alter type audit_action add value 'document_anonymize';
