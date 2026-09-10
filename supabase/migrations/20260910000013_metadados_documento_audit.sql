-- Tela de edição de metadados + log de auditoria (item §49 nº 18).
--
-- Decisão já registrada (Política de Retenção, 8.1): o conteúdo do arquivo
-- de um documento retido/legal-hold fica travado, mas os metadados
-- (título, categoria, cliente, processo, área, tags) continuam editáveis —
-- só que toda alteração precisa gerar log obrigatório (usuário, campo,
-- antes/depois, quando). Por isso este evento novo não entra nas guardas
-- de enforce_documento_retention (que só bloqueia UPDATE quando
-- retention_until/retention_policy/legal_hold mudam) — updateDocumentoMetadata
-- nunca toca essas colunas.

alter type audit_action add value 'document_metadata_update';
